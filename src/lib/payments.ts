/**
 * Payment confirmation — ONE function for every path that can learn a
 * payment succeeded: the YooKassa webhook, /api/payments/status polling,
 * the dashboard's force-resync and the admin reconcile.
 *
 * Idempotency: the payment row is claimed with a conditional UPDATE
 * (status pending|expired → confirmed) inside the same transaction that
 * writes the ledger event (kind `payment`, source = payment id) and the
 * referral cashback. Two concurrent callers → exactly one extension.
 */

import { applySubscriptionEvent, DAY, withTransaction } from "./subscription-ledger";
import {
  createAuditLog,
  createNotificationForUser,
  creditReferrerOnPayment,
  getPaymentById,
  getPaymentByTransactionId,
  getUserById,
  PaymentRecord,
  ReferralCredit,
  rowToPayment,
  transitionPaymentStatus,
} from "./store";
import { isPlanId, periodDays } from "./plans";
import { syncUserToPanel } from "./subscription-sync";
import { pool, waitForDb } from "./db";
import { getPaymentStatus, PaymentStatus, YooKassaRefund } from "./yookassa";
import { sendPaymentSucceededEmail, sendRefundAdminAlertEmail } from "./email";

export type ConfirmSource = "webhook" | "status" | "force_resync" | "admin_reconcile";

export interface ConfirmResult {
  outcome: "applied" | "already_applied" | "not_confirmable" | "not_found";
  payment: PaymentRecord | null;
  newEnd?: string;
  referral?: ReferralCredit | null;
  panelSynced?: boolean;
}

/**
 * Atomically confirm and apply a payment. Side effects (panel sync,
 * notification, email, audit) run only for the caller that applied it.
 */
export async function confirmPayment(paymentId: string, source: ConfirmSource): Promise<ConfirmResult> {
  await waitForDb();
  const result = await withTransaction(async (c): Promise<ConfirmResult> => {
    const claimed = await c.query(
      `UPDATE payments
         SET status = 'confirmed', paid_at = COALESCE(paid_at, NOW()), applied_at = NOW()
       WHERE id = $1 AND status IN ('pending', 'expired')
       RETURNING *`,
      [paymentId]
    );
    if (claimed.rows.length === 0) {
      const cur = await c.query("SELECT * FROM payments WHERE id = $1", [paymentId]);
      if (cur.rows.length === 0) return { outcome: "not_found", payment: null };
      const p = rowToPayment(cur.rows[0]);
      return { outcome: p.status === "confirmed" ? "already_applied" : "not_confirmable", payment: p };
    }

    const payment = rowToPayment(claimed.rows[0]);
    const days = periodDays(payment.period);
    if (!days) throw new Error(`payment ${payment.id}: unknown period ${payment.period}`);

    const led = await applySubscriptionEvent(c, {
      userId: payment.userId,
      kind: "payment",
      sourceId: payment.id,
      extendMs: days * DAY,
      plan: isPlanId(payment.plan) ? payment.plan : null,
      actor: source,
      meta: { transactionId: payment.transactionId, amount: payment.amount, period: payment.period },
    });

    // Cashback must never block a payment: isolate it in a savepoint.
    let referral: ReferralCredit | null = null;
    await c.query("SAVEPOINT referral");
    try {
      referral = await creditReferrerOnPayment(payment.userId, payment.amount, payment.id, c);
      await c.query("RELEASE SAVEPOINT referral");
    } catch (err) {
      await c.query("ROLLBACK TO SAVEPOINT referral");
      console.error(`[PAYMENT] referral credit failed for ${payment.id}:`, err instanceof Error ? err.message : err);
    }

    return { outcome: "applied", payment, newEnd: led.newEnd.toISOString(), referral };
  });

  if (result.outcome === "applied" && result.payment) {
    result.panelSynced = await afterPaymentApplied(result.payment, source);
  }
  return result;
}

async function afterPaymentApplied(payment: PaymentRecord, source: ConfirmSource): Promise<boolean> {
  let synced = false;
  try {
    const sync = await syncUserToPanel(payment.userId);
    synced = sync.ok;
    if (sync.ok) {
      await pool.query("UPDATE payments SET applied_to_remnawave_at = NOW() WHERE id = $1", [payment.id]);
    } else {
      console.warn(`[PAYMENT] ${payment.id}: panel sync deferred (${sync.reason} ${sync.panelError ?? ""}) — worker will retry`);
    }
  } catch (err) {
    console.error(`[PAYMENT] ${payment.id}: panel sync threw`, err);
  }

  const planLabel = payment.plan === "plus" ? "Plus" : "Basic";
  await createNotificationForUser(payment.userId, "Оплата подтверждена", `Подписка ${planLabel} на ${payment.period} мес. активирована.`);
  await createAuditLog("payment.success", `${payment.plan} ${payment.period}мес, ${payment.amount}₽ (${source})`, payment.userId);

  const user = await getUserById(payment.userId);
  if (user) {
    const baseUrl = (process.env.SITE_BASE_URL || "https://qodev.dev").replace(/\/+$/, "");
    sendPaymentSucceededEmail(user.email, `${planLabel} · ${payment.period} мес.`, new Date(user.subscriptionEnd), `${baseUrl}/dashboard`).catch(
      (err) => console.warn(`[PAYMENT] ${payment.id}: receipt email failed:`, err instanceof Error ? err.message : err)
    );
  }
  return synced;
}

export type ReconcileOutcome = "applied" | "already_applied" | "canceled" | "still_pending" | "expired" | "lookup_failed" | "skipped";

/**
 * Ask YooKassa about a pending/expired payment and apply the answer.
 * "expired" is only a local label after 15 minutes — YooKassa may still
 * complete the payment, so expired payments are asked too.
 */
export async function reconcilePaymentWithYooKassa(payment: PaymentRecord, source: ConfirmSource): Promise<{ outcome: ReconcileOutcome; error?: string }> {
  if (!["pending", "expired"].includes(payment.status)) {
    return { outcome: payment.status === "confirmed" ? "already_applied" : "skipped" };
  }
  if (!payment.transactionId) {
    if (payment.status === "pending" && new Date(payment.expiresAt) <= new Date()) {
      await transitionPaymentStatus(payment.id, ["pending"], "expired");
      return { outcome: "expired" };
    }
    return { outcome: "still_pending" };
  }
  let yk;
  try {
    yk = await getPaymentStatus(payment.transactionId);
  } catch (err) {
    return { outcome: "lookup_failed", error: err instanceof Error ? err.message : String(err) };
  }
  if (yk.status === PaymentStatus.SUCCEEDED) {
    const r = await confirmPayment(payment.id, source);
    return { outcome: r.outcome === "applied" ? "applied" : r.outcome === "already_applied" ? "already_applied" : "skipped" };
  }
  if (yk.status === PaymentStatus.CANCELED) {
    await transitionPaymentStatus(payment.id, ["pending", "expired"], "canceled");
    return { outcome: "canceled" };
  }
  if (payment.status === "pending" && new Date(payment.expiresAt) <= new Date()) {
    await transitionPaymentStatus(payment.id, ["pending"], "expired");
    return { outcome: "expired" };
  }
  return { outcome: "still_pending" };
}

/** Find our payment record for a verified YooKassa payment (by id, then metadata.paymentId). */
export async function findLocalPayment(ykPaymentId: string, metadataPaymentId: string | undefined): Promise<PaymentRecord | null> {
  const byTx = await getPaymentByTransactionId(ykPaymentId);
  if (byTx) return byTx;
  if (!metadataPaymentId) return null;
  const byMeta = await getPaymentById(metadataPaymentId);
  if (!byMeta) return null;
  if (byMeta.transactionId && byMeta.transactionId !== ykPaymentId) return null;
  if (!byMeta.transactionId) {
    // The create route crashed between YooKassa and our UPDATE — heal the link.
    await pool.query("UPDATE payments SET transaction_id = $2 WHERE id = $1 AND transaction_id IS NULL", [byMeta.id, ykPaymentId]);
  }
  return { ...byMeta, transactionId: ykPaymentId };
}

/**
 * refund.succeeded: mark the payment refunded and record a ledger event
 * with 0 days. Owner decision (12.09.2026): days are NOT removed
 * automatically — support handles refunds manually. Admin gets an alert.
 */
export async function handleRefund(refund: YooKassaRefund): Promise<"recorded" | "duplicate" | "payment_not_found" | "not_succeeded"> {
  if (refund.status !== "succeeded") return "not_succeeded";
  await waitForDb();
  const payment = await getPaymentByTransactionId(refund.payment_id);
  if (!payment) {
    console.error(`[REFUND] refund ${refund.id}: payment ${refund.payment_id} not found locally`);
    return "payment_not_found";
  }

  const applied = await withTransaction(async (c) => {
    const led = await applySubscriptionEvent(c, {
      userId: payment.userId,
      kind: "refund",
      sourceId: refund.id,
      actor: "yookassa",
      meta: { paymentId: payment.id, yookassaPaymentId: refund.payment_id, amount: refund.amount?.value, currency: refund.amount?.currency },
    });
    if (!led.applied) return false;
    await c.query(
      `UPDATE payments SET status = 'refunded', refunded_at = COALESCE(refunded_at, NOW()), refund_id = $2,
              refund_logged_at = COALESCE(refund_logged_at, NOW())
       WHERE id = $1`,
      [payment.id, refund.id]
    );
    return true;
  });
  if (!applied) return "duplicate";

  const user = await getUserById(payment.userId);
  await createAuditLog("payment.refunded", `refund ${refund.id}, payment ${payment.id}, ${refund.amount?.value ?? "?"} ${refund.amount?.currency ?? ""}`, payment.userId, user?.email);
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.error(`[REFUND] refund ${refund.id} recorded but no ADMIN_NOTIFY_EMAIL/ADMIN_EMAIL to alert`);
  } else if (user) {
    const sent = await sendRefundAdminAlertEmail({
      adminEmail,
      orderId: payment.id,
      userEmail: user.email,
      remnawaveUuid: user.remnawaveUserUuid,
      amountRub: parseFloat(refund.amount?.value ?? String(payment.amount)),
      plan: `${payment.plan} ${payment.period}m`,
      yookassaPaymentId: refund.payment_id,
      appliedAt: payment.appliedAt ? new Date(payment.appliedAt) : payment.paidAt ? new Date(payment.paidAt) : null,
    }).catch((err) => {
      console.error(`[REFUND] alert email failed for ${refund.id}:`, err);
      return false;
    });
    if (!sent) console.error(`[REFUND] alert email not sent for ${refund.id}`);
  }
  return "recorded";
}
