import { NextRequest, NextResponse } from "next/server";
import {
  getUserById,
  extendSubscription,
  updateUser,
  updatePaymentStatus,
  creditReferrerOnPayment,
} from "@/lib/store";
import { syncSubscriptionToPanel } from "@/lib/subscription-sync";
import { getPaymentStatus, PaymentStatus } from "@/lib/yookassa";
import { pool } from "@/lib/db";

/**
 * POST /api/user/force-resync
 *
 * User-triggered escape hatch. Fires the same repair + panel-sync
 * pipeline the hourly worker runs, but on demand from the dashboard,
 * and adds one extra step first: reconcile the user's own pending
 * payments against YooKassa.
 *
 * The three-step recipe:
 *   1. For every pending payment on THIS user in the last 7 days,
 *      re-poll YooKassa. If it says SUCCEEDED, apply it (same flow
 *      as the webhook). This catches "paid but webhook never landed"
 *      cases without waiting for an admin.
 *   2. Run syncSubscriptionToPanel — repairs any ghost subscription_end
 *      AND pushes the honest date to the panel.
 *   3. Return a diff of before / after so the dashboard can tell the
 *      user something concrete: "оплата подхвачена", "срок пересчитан",
 *      or "данные актуальны".
 */

const PERIOD_DAYS: Record<number, number> = { 1: 30, 3: 90, 6: 180, 12: 365 };

interface PendingRow {
  id: string;
  transaction_id: string;
  plan: string;
  period: number;
  amount: string;
}

interface ReconciledPayment {
  paymentId: string;
  plan: string;
  period: number;
  outcome: "applied" | "canceled" | "still_pending" | "lookup_failed";
  errorMessage?: string;
}

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("session")?.value;
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Не авторизован" },
        { status: 401 }
      );
    }

    const before = await getUserById(sessionId);
    if (!before) {
      return NextResponse.json(
        { success: false, error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    const beforeEnd = before.subscriptionEnd;

    // ─── Step 1: reconcile pending payments belonging to THIS user ───
    // Recovery path for "paid but webhook never landed". Scoped to the
    // current session's user so it can't touch anyone else's data.
    const reconciled: ReconciledPayment[] = [];
    const pending = (
      await pool.query<PendingRow>(
        `SELECT id, transaction_id, plan, period, amount
         FROM payments
         WHERE user_id = $1
           AND status = 'pending'
           AND transaction_id IS NOT NULL
           AND created_at > NOW() - INTERVAL '7 days'
         ORDER BY created_at DESC`,
        [before.id]
      )
    ).rows;

    let appliedCount = 0;
    for (const p of pending) {
      try {
        const yk = await getPaymentStatus(p.transaction_id);

        if (yk.status === PaymentStatus.SUCCEEDED) {
          const days = PERIOD_DAYS[p.period] || 30;
          try {
            await extendSubscription(before.id, days);
            if (p.plan && ["basic", "plus"].includes(p.plan)) {
              await updateUser(before.id, { subscriptionPlan: p.plan });
            }
            await updatePaymentStatus(p.id, "confirmed", new Date());
            await pool.query(
              "UPDATE payments SET applied_to_remnawave_at = COALESCE(applied_to_remnawave_at, NOW()) WHERE id = $1",
              [p.id]
            );
            creditReferrerOnPayment(before.id, parseFloat(p.amount), p.id).catch(() => null);
            appliedCount += 1;
            reconciled.push({
              paymentId: p.id,
              plan: p.plan,
              period: p.period,
              outcome: "applied",
            });
          } catch (err) {
            reconciled.push({
              paymentId: p.id,
              plan: p.plan,
              period: p.period,
              outcome: "lookup_failed",
              errorMessage: err instanceof Error ? err.message : String(err),
            });
          }
        } else if (yk.status === PaymentStatus.CANCELED) {
          await updatePaymentStatus(p.id, "canceled").catch(() => null);
          reconciled.push({
            paymentId: p.id,
            plan: p.plan,
            period: p.period,
            outcome: "canceled",
          });
        } else {
          reconciled.push({
            paymentId: p.id,
            plan: p.plan,
            period: p.period,
            outcome: "still_pending",
          });
        }
      } catch (err) {
        reconciled.push({
          paymentId: p.id,
          plan: p.plan,
          period: p.period,
          outcome: "lookup_failed",
          errorMessage: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // ─── Step 2: repair local ghost + push honest date to panel ───
    const syncResult = await syncSubscriptionToPanel(before.id);

    // ─── Step 3: diff for the client ───
    const after = await getUserById(before.id);
    const afterEnd = after?.subscriptionEnd ?? beforeEnd;
    const dateChanged =
      new Date(beforeEnd).getTime() !== new Date(afterEnd).getTime();

    return NextResponse.json({
      success: true,
      data: {
        beforeSubscriptionEnd: beforeEnd,
        afterSubscriptionEnd: afterEnd,
        changed: dateChanged || appliedCount > 0,
        paymentsScanned: pending.length,
        paymentsApplied: appliedCount,
        reconciled,
        panelAction: syncResult.action,
        panelUuid: syncResult.uuid,
        subscriptionUrl: syncResult.subscriptionUrl,
        reason: syncResult.reason,
        panelError: syncResult.panelError,
      },
    });
  } catch (err) {
    console.error("[USER/FORCE-RESYNC] error:", err);
    return NextResponse.json(
      { success: false, error: "Не удалось обновить подписку" },
      { status: 500 }
    );
  }
}
