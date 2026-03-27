import { NextRequest, NextResponse } from "next/server";
import { getPaymentByTransactionId, updatePaymentStatus, extendSubscription, creditReferrerOnPayment, updateUser, getUserById, createNotificationForUser } from "@/lib/store";
import { xrayAddUser, generateXrayUuid, generateSubToken, generateSubId, buildSubscriptionUrl } from "@/lib/xray";
import { getPaymentStatus as ykGetPayment } from "@/lib/yookassa";
import type { YooKassaNotification } from "@/lib/yookassa";

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
  "185.71.76.", "185.71.77.",  // 185.71.76.0/22
  "77.75.153.", "77.75.154.", "77.75.156.", "77.75.157.", // 77.75.153.0/22
  "77.75.152.", "77.75.155.",
];

function isYooKassaIp(ip: string): boolean {
  if (!ip) return false;
  // In development, allow localhost
  if (process.env.NODE_ENV !== "production") return true;
  return YOOKASSA_IPS.some((prefix) => ip.startsWith(prefix));
}

/**
 * YooKassa Webhook Handler
 *
 * Security: verifies source IP + validates payment via API callback
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

    // YooKassa notification format
    const notification = body as YooKassaNotification;
    const event = notification.event;
    const payment = notification.object;

    if (!payment?.id || !event) {
      return NextResponse.json({ error: "Invalid notification format" }, { status: 400 });
    }

    console.log(`[WEBHOOK] YooKassa ${event}: ${payment.id} (${payment.status}) from IP: ${clientIp}`);

    // Double-check: verify payment status via YooKassa API (prevents forgery)
    let verifiedStatus: string;
    try {
      const verified = await ykGetPayment(payment.id);
      verifiedStatus = verified.status;
      if (verifiedStatus !== payment.status) {
        console.warn(`[WEBHOOK] Status mismatch: webhook=${payment.status}, API=${verifiedStatus}`);
      }
    } catch {
      // If API check fails, trust the webhook (already IP-verified)
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
      // Mark as confirmed
      await updatePaymentStatus(paymentRecord.id, "confirmed", new Date());

      // Extend subscription
      const days = PERIOD_DAYS[paymentRecord.period] || 30;
      await extendSubscription(paymentRecord.userId, days);
      await updateUser(paymentRecord.userId, { subscriptionPlan: paymentRecord.plan });

      // If user had no VPN key (expired), regenerate and add to Xray
      const user = await getUserById(paymentRecord.userId);
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
        console.log(`[WEBHOOK] Regenerated VPN key for ${user.email}`);
      }

      // Credit referrer
      await creditReferrerOnPayment(paymentRecord.userId);

      // Notify user
      const planLabel = paymentRecord.plan === "plus" ? "Plus" : "Basic";
      await createNotificationForUser(
        paymentRecord.userId,
        "Оплата подтверждена",
        `Подписка ${planLabel} на ${paymentRecord.period} мес. активирована. Приятного пользования!`
      ).catch(() => {});

      console.log(`[WEBHOOK] Subscription extended: ${paymentRecord.userId} +${days}d (${paymentRecord.plan} ${paymentRecord.period}m)`);

    } else if (verifiedStatus === "canceled") {
      await updatePaymentStatus(paymentRecord.id, "canceled");
      console.log(`[WEBHOOK] Payment canceled: ${payment.id}`);
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
