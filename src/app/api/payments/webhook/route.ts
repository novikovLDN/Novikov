import { NextRequest, NextResponse } from "next/server";
import { getPaymentByTransactionId, updatePaymentStatus, extendSubscription, creditReferrerOnPayment, updateUser, getUserById, createNotificationForUser, createAuditLog } from "@/lib/store";
import { xrayAddUser, generateXrayUuid, generateSubToken, generateSubId, buildSubscriptionUrl } from "@/lib/xray";
import { getPaymentStatus as ykGetPayment } from "@/lib/yookassa";
import type { YooKassaNotification } from "@/lib/yookassa";
import { pool } from "@/lib/db";

// Period in months → days
const PERIOD_DAYS: Record<number, number> = {
  1: 30,
  3: 90,
  6: 180,
  12: 365,
};

// YooKassa notification IPs (official ranges)
// https://yookassa.ru/developers/using-api/webhooks
const YOOKASSA_IPS = [
  "185.71.76.", "185.71.77.", "185.71.78.", "185.71.79.",  // 185.71.76.0/22
  "77.75.152.", "77.75.153.", "77.75.154.", "77.75.155.",  // 77.75.152.0/22
];

function isYooKassaIp(ip: string): boolean {
  if (!ip) return false;
  if (process.env.NODE_ENV !== "production") return true;
  return YOOKASSA_IPS.some((prefix) => ip.startsWith(prefix));
}

/**
 * Process a confirmed payment: extend subscription, regenerate key if needed, credit referrer.
 * Shared between webhook and status polling.
 * Uses atomic status update to prevent double processing.
 */
export async function processConfirmedPayment(paymentId: string, transactionId: string): Promise<boolean> {
  // Atomic idempotency: only update if still pending
  const updated = await pool.query(
    `UPDATE payments SET status = 'confirmed', paid_at = NOW()
     WHERE id = $1 AND status = 'pending'
     RETURNING *`,
    [paymentId]
  );

  if (updated.rows.length === 0) {
    // Already processed or not pending — skip silently
    return false;
  }

  const record = updated.rows[0];
  const userId = record.user_id;
  const plan = record.plan;
  const period = record.period;
  const amount = parseFloat(record.amount);

  // Extend subscription
  const days = PERIOD_DAYS[period] || 30;
  await extendSubscription(userId, days);
  await updateUser(userId, { subscriptionPlan: plan });

  // Regenerate VPN key if user had no key (expired)
  try {
    const user = await getUserById(userId);
    if (user && !user.xrayUuid) {
      const newUuid = generateXrayUuid();
      const newSubToken = generateSubToken();
      const subId = user.subId || generateSubId(user.email);
      const newKey = buildSubscriptionUrl(newSubToken, subId);
      await updateUser(user.id, {
        xrayUuid: newUuid,
        vpnKey: newKey,
        subToken: newSubToken,
        subId: subId,
      });
      await xrayAddUser(newUuid);
      console.log(`[PAYMENT] Regenerated VPN key for ${user.email}`);
    }
  } catch (err) {
    console.error(`[PAYMENT] Failed to regenerate key for ${userId}:`, err);
  }

  // Credit referrer with cashback
  try {
    await creditReferrerOnPayment(userId, amount, paymentId);
  } catch (err) {
    console.error(`[PAYMENT] Failed to credit referrer for ${userId}:`, err);
  }

  // Notify user
  try {
    const planLabel = plan === "plus" ? "Plus" : "Basic";
    await createNotificationForUser(
      userId,
      "Оплата подтверждена",
      `Подписка ${planLabel} на ${period} мес. активирована. Приятного пользования!`
    );
  } catch { /* silent */ }

  console.log(`[PAYMENT] Subscription extended: ${userId} +${days}d (${plan} ${period}m, ${amount}₽)`);
  await createAuditLog("payment.success", `${plan} ${period}мес, ${amount}₽`, userId).catch(() => {});

  return true;
}

/**
 * YooKassa Webhook Handler
 */
export async function POST(request: NextRequest) {
  try {
    // Verify source IP
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "";

    if (!isYooKassaIp(clientIp)) {
      console.warn(`[WEBHOOK] Rejected request from untrusted IP: ${clientIp}`);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    const notification = body as YooKassaNotification;
    const event = notification.event;
    const payment = notification.object;

    if (!payment?.id || !event) {
      return NextResponse.json({ error: "Invalid notification format" }, { status: 400 });
    }

    console.log(`[WEBHOOK] YooKassa ${event}: ${payment.id} (${payment.status}) from IP: ${clientIp}`);

    // Double-check via YooKassa API
    let verifiedStatus: string;
    try {
      const verified = await ykGetPayment(payment.id);
      verifiedStatus = verified.status;
      if (verifiedStatus !== payment.status) {
        console.warn(`[WEBHOOK] Status mismatch: webhook=${payment.status}, API=${verifiedStatus}`);
      }
    } catch {
      verifiedStatus = payment.status;
    }

    // Find our payment record
    const paymentRecord = await getPaymentByTransactionId(payment.id);
    if (!paymentRecord) {
      console.error(`[WEBHOOK] Payment not found for YooKassa ID: ${payment.id}`);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Already processed
    if (paymentRecord.status === "confirmed") {
      return NextResponse.json({ ok: true });
    }

    if (verifiedStatus === "succeeded") {
      await processConfirmedPayment(paymentRecord.id, payment.id);
    } else if (verifiedStatus === "canceled") {
      await updatePaymentStatus(paymentRecord.id, "canceled");
      console.log(`[WEBHOOK] Payment canceled: ${payment.id}`);
      await createAuditLog("payment.canceled", `YooKassa ID: ${payment.id}`, paymentRecord.userId).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[WEBHOOK] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
