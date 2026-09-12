import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { verifyAdmin } from "../../middleware";
import { computeGhostRepair, GHOST_THRESHOLD_MS, RepairAction } from "@/lib/ghost-date-repair";

/**
 * Ghost-date PREVIEW (subscription_end > NOW + 400 days).
 *
 * Automatic repair is disabled (12.09.2026): it recomputed the end from
 * the LAST payment only and silently dropped stacked paid periods, and
 * since paid renewals may now legitimately go past 400 days the
 * threshold no longer proves a bug. The preview stays for manual review;
 * corrections are made per user via grant/revoke in the admin card.
 */

interface UserRow {
  id: string;
  email: string;
  public_id: string | null;
  telegram_id: string | null;
  subscription_end: Date;
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  if (body?.dryRun === false) {
    return NextResponse.json(
      {
        success: false,
        error: "Автоматическое исправление отключено: даты правятся вручную (выдача / отзыв в карточке пользователя). Доступен только предпросмотр.",
      },
      { status: 409 }
    );
  }

  try {
    const cutoff = new Date(Date.now() + GHOST_THRESHOLD_MS);
    const ghosts = (
      await pool.query<UserRow>(
        `SELECT id, email, public_id, telegram_id, subscription_end
         FROM users WHERE subscription_end > $1 ORDER BY subscription_end DESC`,
        [cutoff]
      )
    ).rows;

    let expiredNoPayment = 0;
    let expiredPaymentTooOld = 0;
    let correctedFromPayment = 0;
    const users: Array<Record<string, unknown> & { action: RepairAction }> = [];

    for (const u of ghosts) {
      const plan = await computeGhostRepair(u.id);
      if (plan.action === "expired_no_payment") expiredNoPayment += 1;
      else if (plan.action === "expired_payment_too_old") expiredPaymentTooOld += 1;
      else correctedFromPayment += 1;
      users.push({
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
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        dryRun: true,
        scanned: ghosts.length,
        expired_no_payment: expiredNoPayment,
        expired_payment_too_old: expiredPaymentTooOld,
        corrected_from_payment: correctedFromPayment,
        panel_pushed: 0,
        panel_failed: 0,
        db_written: 0,
        users,
      },
    });
  } catch (err) {
    console.error("[ADMIN/GHOST-PREVIEW] error:", err);
    return NextResponse.json({ success: false, error: "Внутренняя ошибка" }, { status: 500 });
  }
}
