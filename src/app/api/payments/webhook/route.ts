import { NextRequest, NextResponse } from "next/server";
import { getPaymentByTransactionId, updatePaymentStatus, extendSubscription, creditReferrerOnPayment, updateUser, getUserById, createNotificationForUser, createAuditLog } from "@/lib/store";
import { xrayAddUser, generateXrayUuid, generateSubToken, generateSubId, buildSubscriptionUrl } from "@/lib/xray";
import { getPaymentStatus as ykGetPayment } from "@/lib/yookassa";
import type { YooKassaNotification } from "@/lib/yookassa";
import { extendUserExpire } from "@/lib/remnawave";
import { sendPaymentSucceededEmail, sendRefundAdminAlertEmail } from "@/lib/email";
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

      // Extend subscription locally
      const days = PERIOD_DAYS[paymentRecord.period] || 30;
      await extendSubscription(paymentRecord.userId, days);
      await updateUser(paymentRecord.userId, { subscriptionPlan: paymentRecord.plan });

      // Extend in Remnawave (max(current, now) + days)
      const user = await getUserById(paymentRecord.userId);
      if (user?.remnawaveUserUuid) {
        const updated = await extendUserExpire(user.remnawaveUserUuid, days);
        if (updated) {
          await pool.query(
            "UPDATE payments SET applied_to_remnawave_at = NOW() WHERE id = $1",
            [paymentRecord.id]
          );
          console.log(`[WEBHOOK] Remnawave expireAt extended for ${user.email} to ${updated.expireAt}`);
        } else {
          console.warn(`[WEBHOOK] Remnawave extend failed for ${user.email} (uuid=${user.remnawaveUserUuid.slice(0, 8)}…) — local DB is correct, will reconcile later`);
        }
      } else if (user && !user.xrayUuid) {
        // Legacy fallback: no Remnawave UUID yet — regenerate Xray key
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

      // Credit referrer with cashback
      await creditReferrerOnPayment(paymentRecord.userId, paymentRecord.amount, paymentRecord.id);

      // Notify user (in-app + email)
      const planLabel = paymentRecord.plan === "plus" ? "Plus" : "Basic";
      await createNotificationForUser(
        paymentRecord.userId,
        "Оплата подтверждена",
        `Подписка ${planLabel} на ${paymentRecord.period} мес. активирована. Приятного пользования!`
      ).catch(() => {});

      if (user) {
        const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        const baseUrl = (process.env.SITE_BASE_URL || "https://qodev.dev").replace(/\/+$/, "");
        sendPaymentSucceededEmail(user.email, `${planLabel} · ${paymentRecord.period} мес.`, expiresAt, `${baseUrl}/dashboard`)
          .catch((err) => console.warn("[EMAIL] payment_succeeded send failed:", err));
      }

      console.log(`[WEBHOOK] Subscription extended: ${paymentRecord.userId} +${days}d (${paymentRecord.plan} ${paymentRecord.period}m)`);
      await createAuditLog("payment.success", `${paymentRecord.plan} ${paymentRecord.period}мес, ${paymentRecord.amount}₽`, paymentRecord.userId);

    } else if (verifiedStatus === "canceled") {
      await updatePaymentStatus(paymentRecord.id, "canceled");
      console.log(`[WEBHOOK] Payment canceled: ${payment.id}`);
      await createAuditLog("payment.canceled", `YooKassa ID: ${payment.id}`, paymentRecord.userId);

    } else if (verifiedStatus === "refunded") {
      // Log refund — do NOT auto-revoke. Admin decides via panel.
      await pool.query(
        "UPDATE payments SET status = 'refunded', refund_logged_at = NOW() WHERE id = $1",
        [paymentRecord.id]
      );
      const user = await getUserById(paymentRecord.userId);
      const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL;
      if (adminEmail && user) {
        sendRefundAdminAlertEmail({
          adminEmail,
          orderId: paymentRecord.id,
          userEmail: user.email,
          remnawaveUuid: user.remnawaveUserUuid,
          amountRub: paymentRecord.amount,
          plan: `${paymentRecord.plan} ${paymentRecord.period}m`,
          yookassaPaymentId: payment.id,
          appliedAt: paymentRecord.paidAt ? new Date(paymentRecord.paidAt) : null,
        }).catch((err) => console.warn("[EMAIL] refund admin alert failed:", err));
      } else if (!adminEmail) {
        console.warn("[WEBHOOK] Refund received but ADMIN_NOTIFY_EMAIL is not set");
      }
      await createAuditLog("payment.refunded", `YooKassa ID: ${payment.id}, amount=${paymentRecord.amount}₽`, paymentRecord.userId);
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
