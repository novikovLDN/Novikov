import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { verifyAdmin } from "../../middleware";
import { setUserExpire } from "@/lib/remnawave";
import { createAuditLog } from "@/lib/store";

/**
 * One-shot cleanup of ghost-date users.
 *
 * A "ghost date" is subscription_end > NOW + 400 days — almost
 * certainly the legacy 10-year bug (bot pushed 2036 / days=3650 with
 * no cap). For each such user we look up their confirmed payments in
 * our `payments` table and honestly recompute what they're entitled
 * to:
 *
 *   latest confirmed payment + that payment's period (in days)
 *   → that becomes the new local subscription_end
 *
 * Never paid → expired (subscription_end = NOW - 1d).
 * Latest paid + period already past → also expired.
 * Otherwise → correct future date.
 *
 * Panel side: we cannot push past dates to Remnawave ("Expiration date
 * cannot be in the past"). For users we expire, we set panel expireAt
 * to NOW + 1 day so the panel auto-disables within 24h.
 *
 * Always reports per-user before/after. Defaults to dryRun=true.
 */

const PERIOD_DAYS: Record<number, number> = { 1: 30, 3: 90, 6: 180, 12: 365 };
const GHOST_THRESHOLD_MS = 400 * 24 * 60 * 60 * 1000;
const PANEL_EXPIRE_GRACE_MS = 1 * 24 * 60 * 60 * 1000;

interface UserRow {
  id: string;
  email: string;
  public_id: string | null;
  telegram_id: string | null;
  subscription_end: Date;
  remnawave_user_uuid: string | null;
}

interface PaymentRow {
  id: string;
  user_id: string;
  plan: string;
  period: number;
  amount: string;
  status: string;
  paid_at: Date | null;
  created_at: Date;
}

interface PerUserReport {
  userId: string;
  email: string;
  publicId: string | null;
  telegramId: string | null;
  oldSubscriptionEnd: string;
  newSubscriptionEnd: string;
  panelTarget: string;
  action: "expired_no_payment" | "expired_payment_too_old" | "corrected_from_payment";
  confirmedPayments: number;
  latestPaidAt: string | null;
  latestPlan: string | null;
  latestPeriodMonths: number | null;
  panelPushOk: boolean | null;
  panelPushError?: string;
  dbWritten: boolean;
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const dryRun = body?.dryRun !== false;

  const now = new Date();
  const cutoff = new Date(now.getTime() + GHOST_THRESHOLD_MS);

  const ghosts = (
    await pool.query<UserRow>(
      `SELECT id, email, public_id, telegram_id, subscription_end, remnawave_user_uuid
       FROM users
       WHERE subscription_end > $1
       ORDER BY subscription_end DESC`,
      [cutoff]
    )
  ).rows;

  const report: PerUserReport[] = [];
  let expiredNoPayment = 0;
  let expiredPaymentTooOld = 0;
  let correctedFromPayment = 0;
  let panelPushed = 0;
  let panelFailed = 0;
  let dbWritten = 0;

  for (const u of ghosts) {
    const paymentsRes = await pool.query<PaymentRow>(
      `SELECT id, user_id, plan, period, amount, status, paid_at, created_at
       FROM payments
       WHERE user_id = $1 AND status = 'confirmed' AND paid_at IS NOT NULL
       ORDER BY paid_at DESC`,
      [u.id]
    );
    const payments = paymentsRes.rows;
    const latest = payments[0] || null;

    let newEnd: Date;
    let action: PerUserReport["action"];

    if (!latest) {
      newEnd = new Date(now.getTime() - 1000);
      action = "expired_no_payment";
      expiredNoPayment += 1;
    } else {
      const days = PERIOD_DAYS[latest.period] ?? 30;
      const candidate = new Date(new Date(latest.paid_at as Date).getTime() + days * 24 * 60 * 60 * 1000);
      if (candidate.getTime() <= now.getTime()) {
        newEnd = new Date(now.getTime() - 1000);
        action = "expired_payment_too_old";
        expiredPaymentTooOld += 1;
      } else {
        newEnd = candidate;
        action = "corrected_from_payment";
        correctedFromPayment += 1;
      }
    }

    const panelTarget =
      newEnd.getTime() <= now.getTime()
        ? new Date(now.getTime() + PANEL_EXPIRE_GRACE_MS)
        : newEnd;

    const entry: PerUserReport = {
      userId: u.id,
      email: u.email,
      publicId: u.public_id,
      telegramId: u.telegram_id,
      oldSubscriptionEnd: new Date(u.subscription_end).toISOString(),
      newSubscriptionEnd: newEnd.toISOString(),
      panelTarget: panelTarget.toISOString(),
      action,
      confirmedPayments: payments.length,
      latestPaidAt: latest ? new Date(latest.paid_at as Date).toISOString() : null,
      latestPlan: latest?.plan ?? null,
      latestPeriodMonths: latest?.period ?? null,
      panelPushOk: null,
      dbWritten: false,
    };

    if (!dryRun) {
      try {
        await pool.query(
          "UPDATE users SET subscription_end = $1 WHERE id = $2",
          [newEnd, u.id]
        );
        entry.dbWritten = true;
        dbWritten += 1;
      } catch (err) {
        entry.panelPushError = `db_write_failed: ${err instanceof Error ? err.message : String(err)}`;
      }

      if (u.remnawave_user_uuid) {
        const pushed = await setUserExpire(u.remnawave_user_uuid, panelTarget.toISOString());
        if (pushed) {
          entry.panelPushOk = true;
          panelPushed += 1;
        } else {
          entry.panelPushOk = false;
          panelFailed += 1;
          entry.panelPushError = "panel patch failed";
        }
      }

      await createAuditLog(
        "admin.cleanup_ghost_date",
        `${u.email}: ${entry.oldSubscriptionEnd} → ${entry.newSubscriptionEnd} (${action})`,
        u.id,
        u.email
      );
    }

    report.push(entry);
  }

  return NextResponse.json({
    success: true,
    data: {
      dryRun,
      scanned: ghosts.length,
      expired_no_payment: expiredNoPayment,
      expired_payment_too_old: expiredPaymentTooOld,
      corrected_from_payment: correctedFromPayment,
      panel_pushed: panelPushed,
      panel_failed: panelFailed,
      db_written: dbWritten,
      users: report,
    },
  });
}
