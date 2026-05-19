import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import {
  getPaymentStatus as ykGetPayment,
  PaymentStatus,
} from "@/lib/yookassa";
import {
  getUserById,
  extendSubscription,
  updateUser,
  updatePaymentStatus,
  creditReferrerOnPayment,
} from "@/lib/store";
import {
  setUserExpire,
  createUserWithExpire,
  encryptHappLink,
} from "@/lib/remnawave";
import { verifyAdmin } from "../../middleware";

const PERIOD_DAYS: Record<number, number> = { 1: 30, 3: 90, 6: 180, 12: 365 };

/**
 * Reconcile pending payments by polling YooKassa.
 *
 * Use cases:
 *   - User reports "paid but no subscription" — admin clicks this and
 *     it picks up any payments stuck in pending and applies them
 *     against YooKassa's current status.
 *   - Webhook never arrived (IP filter / proxy / outage) — this is the
 *     recovery path.
 *
 * Looks at every payment with status='pending' AND transaction_id IS
 * NOT NULL that was created in the last 7 days. For each:
 *   - GET YooKassa /payments/{id}
 *   - if SUCCEEDED → run the same extension flow the webhook would
 *   - if CANCELED → mark canceled
 *   - else → leave alone
 *
 * Idempotent and safe to re-run.
 */
export async function POST() {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
  }

  const rows = (
    await pool.query<{
      id: string;
      user_id: string;
      transaction_id: string;
      plan: string;
      period: number;
      amount: string;
      status: string;
      created_at: Date;
      paid_at: Date | null;
    }>(
      `SELECT id, user_id, transaction_id, plan, period, amount, status, created_at, paid_at
       FROM payments
       WHERE status = 'pending'
         AND transaction_id IS NOT NULL
         AND created_at > NOW() - INTERVAL '7 days'
       ORDER BY created_at DESC`
    )
  ).rows;

  const result = {
    scanned: rows.length,
    applied: 0,
    canceled: 0,
    still_pending: 0,
    failed: 0,
    details: [] as Array<{ payment_id: string; user_id: string; outcome: string }>,
  };

  for (const p of rows) {
    let yk;
    try {
      yk = await ykGetPayment(p.transaction_id);
    } catch (err) {
      result.failed += 1;
      result.details.push({ payment_id: p.id, user_id: p.user_id, outcome: `yookassa lookup failed: ${(err as Error).message?.slice(0, 80)}` });
      continue;
    }

    if (yk.status === PaymentStatus.SUCCEEDED) {
      const days = PERIOD_DAYS[p.period] || 30;
      try {
        await extendSubscription(p.user_id, days);
        await updateUser(p.user_id, { subscriptionPlan: p.plan });
        await updatePaymentStatus(p.id, "confirmed", new Date());

        const user = await getUserById(p.user_id);
        const targetExpireIso = user?.subscriptionEnd
          ? new Date(user.subscriptionEnd).toISOString()
          : new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

        if (user?.remnawaveUserUuid) {
          await setUserExpire(user.remnawaveUserUuid, targetExpireIso).catch(() => null);
        } else if (user) {
          const rwNew = await createUserWithExpire(user.email, targetExpireIso, "reconcile-pending", user.panelId);
          if (rwNew) {
            const happLink = await encryptHappLink(rwNew.subscriptionUrl).catch(() => null);
            await pool.query(
              `UPDATE users SET
                 remnawave_user_uuid = $1,
                 remnawave_short_uuid = $2,
                 subscription_url = $3,
                 happ_crypto_link = $4,
                 crypto_link_updated_at = $5
               WHERE id = $6 AND remnawave_user_uuid IS NULL`,
              [rwNew.uuid, rwNew.shortUuid || null, rwNew.subscriptionUrl, happLink, happLink ? new Date() : null, user.id]
            ).catch(() => null);
          }
        }
        await pool.query(
          "UPDATE payments SET applied_to_remnawave_at = COALESCE(applied_to_remnawave_at, NOW()) WHERE id = $1",
          [p.id]
        );

        creditReferrerOnPayment(p.user_id, parseFloat(p.amount), p.id).catch(() => null);

        result.applied += 1;
        result.details.push({ payment_id: p.id, user_id: p.user_id, outcome: `applied +${days}d` });
      } catch (err) {
        result.failed += 1;
        result.details.push({ payment_id: p.id, user_id: p.user_id, outcome: `apply failed: ${(err as Error).message?.slice(0, 80)}` });
      }
    } else if (yk.status === PaymentStatus.CANCELED) {
      await updatePaymentStatus(p.id, "canceled").catch(() => null);
      result.canceled += 1;
      result.details.push({ payment_id: p.id, user_id: p.user_id, outcome: "canceled" });
    } else {
      result.still_pending += 1;
      result.details.push({ payment_id: p.id, user_id: p.user_id, outcome: `still ${yk.status}` });
    }
  }

  return NextResponse.json({ success: true, data: result });
}
