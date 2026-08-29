import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { verifyAdmin } from "../../middleware";
import { setUserExpire } from "@/lib/remnawave";
import { createAuditLog } from "@/lib/store";
import {
  computeGhostRepair,
  applyGhostRepair,
  GHOST_THRESHOLD_MS,
  RepairAction,
} from "@/lib/ghost-date-repair";

/**
 * Bulk cleanup of ghost-date users — admin-only preview + apply.
 *
 * A "ghost date" is subscription_end > NOW + 400 days — almost always
 * a residue of the legacy 10-year bug. `computeGhostRepair` is now
 * the single source of truth for what the repaired value should be
 * (see src/lib/ghost-date-repair.ts); this endpoint just walks every
 * ghost user, previews or applies the plan, and reports.
 *
 * Note: users are now auto-repaired on dashboard load and by the
 * hourly sync worker via `syncSubscriptionToPanel`. This endpoint
 * stays useful as a one-shot audit / bulk apply for the ops team.
 */

interface UserRow {
  id: string;
  email: string;
  public_id: string | null;
  telegram_id: string | null;
  subscription_end: Date;
  remnawave_user_uuid: string | null;
}

interface PerUserReport {
  userId: string;
  email: string;
  publicId: string | null;
  telegramId: string | null;
  oldSubscriptionEnd: string;
  newSubscriptionEnd: string;
  panelTarget: string;
  action: RepairAction;
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
    const plan = await computeGhostRepair(u.id);

    if (plan.action === "expired_no_payment") expiredNoPayment += 1;
    else if (plan.action === "expired_payment_too_old") expiredPaymentTooOld += 1;
    else correctedFromPayment += 1;

    const entry: PerUserReport = {
      userId: u.id,
      email: u.email,
      publicId: u.public_id,
      telegramId: u.telegram_id,
      oldSubscriptionEnd: new Date(u.subscription_end).toISOString(),
      newSubscriptionEnd: plan.newEnd.toISOString(),
      panelTarget: plan.panelTarget.toISOString(),
      action: plan.action,
      confirmedPayments: plan.confirmedPayments,
      latestPaidAt: plan.latestPaidAt,
      latestPlan: plan.latestPlan,
      latestPeriodMonths: plan.latestPeriodMonths,
      panelPushOk: null,
      dbWritten: false,
    };

    if (!dryRun) {
      try {
        await applyGhostRepair(u.id, plan);
        entry.dbWritten = true;
        dbWritten += 1;
      } catch (err) {
        entry.panelPushError = `db_write_failed: ${err instanceof Error ? err.message : String(err)}`;
      }

      if (u.remnawave_user_uuid) {
        const pushed = await setUserExpire(u.remnawave_user_uuid, plan.panelTarget.toISOString());
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
        `${u.email}: ${entry.oldSubscriptionEnd} → ${entry.newSubscriptionEnd} (${plan.action})`,
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
