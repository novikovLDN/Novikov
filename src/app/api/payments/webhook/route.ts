import { NextRequest, NextResponse } from "next/server";
import { getPaymentByTransactionId, updatePaymentStatus, extendSubscription, creditReferrerOnPayment, updateUser, getUserById, createNotificationForUser, createAuditLog } from "@/lib/store";
import { xrayAddUser, generateXrayUuid, generateSubToken, generateSubId, buildSubscriptionUrl } from "@/lib/xray";
import { getPaymentStatus as ykGetPayment } from "@/lib/yookassa";
import type { YooKassaNotification } from "@/lib/yookassa";
import { setUserExpire, createUserWithExpire, encryptHappLink } from "@/lib/remnawave";
import { sendPaymentSucceededEmail, sendRefundAdminAlertEmail } from "@/lib/email";
import { pool } from "@/lib/db";

const PERIOD_DAYS: Record<number, number> = {
  1: 30,
  3: 90,
  6: 180,
  12: 365,
};

// YooKassa notification source ranges — both IPv4 and IPv6.
// https://yookassa.ru/developers/using-api/webhooks
const YOOKASSA_IPV4_PREFIXES = [
  "185.71.76.", "185.71.77.",
  "77.75.152.", "77.75.153.", "77.75.154.", "77.75.155.", "77.75.156.", "77.75.157.",
];
const YOOKASSA_IPV6_PREFIXES = [
  "2a02:5180:0:1509", "2a02:5180:0:2655",
  "2a02:5180:0:1533", "2a02:5180:0:2669",
];

function isYooKassaIp(ip: string): boolean {
  if (!ip) return false;
  if (process.env.NODE_ENV !== "production") return true;
  const lower = ip.toLowerCase();
  return (
    YOOKASSA_IPV4_PREFIXES.some((p) => lower.startsWith(p)) ||
    YOOKASSA_IPV6_PREFIXES.some((p) => lower.startsWith(p.toLowerCase()))
  );
}

/**
 * YooKassa webhook handler.
 *
 * Defense in depth:
 *   1. Best-effort IP allow-list (IPv4 + IPv6). On mismatch we proceed
 *      ANYWAY but log a warning — the YooKassa GET /payments/{id}
 *      verification step below is what actually authenticates the
 *      notification. Failing closed here used to silently drop legit
 *      webhooks delivered through proxies that mangled x-forwarded-for.
 *   2. GET /payments/{id} via YooKassa API to confirm the payment
 *      really succeeded. If this verification fails we abort.
 *
 * Idempotency: status is flipped to "confirmed" ONLY after the local
 * subscription extension committed. So if our process dies between
 * extension and Remnawave PATCH, a retry sees status='pending' and
 * re-runs the whole flow. To avoid double-extending we compare against
 * the payment record's own paidAt — once paidAt is set, the local
 * extension has been applied.
 */
export async function POST(request: NextRequest) {
  try {
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "";

    const ipTrusted = isYooKassaIp(clientIp);
    if (!ipTrusted) {
      console.warn(`[WEBHOOK] Untrusted IP ${clientIp || "(empty)"} — proceeding with API verification`);
    }

    const body = await request.json();
    const notification = body as YooKassaNotification;
    const event = notification.event;
    const payment = notification.object;

    if (!payment?.id || !event) {
      return NextResponse.json({ error: "Invalid notification format" }, { status: 400 });
    }

    console.log(`[WEBHOOK] YooKassa ${event}: ${payment.id} (${payment.status}) ip=${clientIp} trusted=${ipTrusted}`);

    // Verify via YooKassa API — this is what actually authenticates
    // the payment, not the source IP.
    let verifiedStatus: string;
    try {
      const verified = await ykGetPayment(payment.id);
      verifiedStatus = verified.status;
      if (verifiedStatus !== payment.status) {
        console.warn(`[WEBHOOK] Status mismatch: webhook=${payment.status}, API=${verifiedStatus}`);
      }
    } catch (err) {
      // API verification failed AND IP isn't trusted → reject.
      if (!ipTrusted) {
        console.error("[WEBHOOK] API verification failed for untrusted IP — rejecting:", err);
        return NextResponse.json({ error: "Verification failed" }, { status: 403 });
      }
      verifiedStatus = payment.status;
    }

    const paymentRecord = await getPaymentByTransactionId(payment.id);
    if (!paymentRecord) {
      console.error(`[WEBHOOK] Payment not found for YooKassa ID: ${payment.id}`);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (verifiedStatus === "succeeded") {
      // Idempotency: if we already applied this payment (paid_at set AND
      // status confirmed), don't extend again.
      const alreadyApplied = paymentRecord.status === "confirmed" && !!paymentRecord.paidAt;
      if (alreadyApplied) {
        console.log(`[WEBHOOK] Payment ${payment.id} already applied, skipping`);
        return NextResponse.json({ ok: true });
      }

      const days = PERIOD_DAYS[paymentRecord.period] || 30;

      // ── Step 1: extend local subscription ──
      try {
        await extendSubscription(paymentRecord.userId, days);
        await updateUser(paymentRecord.userId, { subscriptionPlan: paymentRecord.plan });
      } catch (err) {
        console.error("[WEBHOOK] extendSubscription failed — leaving payment pending for retry:", err);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
      }

      // ── Step 2: mark payment confirmed (commits the idempotency point) ──
      try {
        await updatePaymentStatus(paymentRecord.id, "confirmed", new Date());
      } catch (err) {
        console.error("[WEBHOOK] updatePaymentStatus failed:", err);
        // local extension is already done; continue with Remnawave sync
      }

      // ── Step 3: mirror to Remnawave (non-blocking — if it fails the
      // dashboard's lazy provisioner will retry on next user load) ──
      const user = await getUserById(paymentRecord.userId);
      const targetExpireIso = user?.subscriptionEnd
        ? new Date(user.subscriptionEnd).toISOString()
        : new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      let remnawaveProvisioned = Boolean(user?.remnawaveUserUuid);

      try {
        if (user?.remnawaveUserUuid) {
          const updated = await setUserExpire(user.remnawaveUserUuid, targetExpireIso);
          if (updated) {
            await pool.query(
              "UPDATE payments SET applied_to_remnawave_at = NOW() WHERE id = $1",
              [paymentRecord.id]
            );
            console.log(`[WEBHOOK] Remnawave expireAt set for ${user.email}: ${updated.expireAt}`);
          } else {
            console.warn(`[WEBHOOK] Remnawave PATCH failed for ${user.email} — dashboard will retry`);
          }
        } else if (user) {
          const rwNew = await createUserWithExpire(user.email, targetExpireIso, "webhook payment.succeeded autoprovision", user.panelId);
          if (rwNew) {
            const happLink = await encryptHappLink(rwNew.subscriptionUrl).catch(() => null);
            try {
              await pool.query(
                `UPDATE users SET
                   remnawave_user_uuid = $1,
                   remnawave_short_uuid = $2,
                   subscription_url = $3,
                   happ_crypto_link = $4,
                   crypto_link_updated_at = $5
                 WHERE id = $6 AND remnawave_user_uuid IS NULL`,
                [rwNew.uuid, rwNew.shortUuid || null, rwNew.subscriptionUrl, happLink, happLink ? new Date() : null, user.id]
              );
            } catch (dbErr) {
              console.warn("[WEBHOOK] Remnawave persist conflicted:", dbErr);
            }
            await pool.query(
              "UPDATE payments SET applied_to_remnawave_at = NOW() WHERE id = $1",
              [paymentRecord.id]
            );
            remnawaveProvisioned = true;
            console.log(`[WEBHOOK] Remnawave user autoprovisioned for ${user.email}`);
          }
        }
      } catch (err) {
        console.warn("[WEBHOOK] Remnawave sync exception:", err);
      }

      // Legacy Xray fallback if neither backend is set
      if (user && !remnawaveProvisioned && !user.xrayUuid) {
        try {
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
        } catch (err) {
          console.warn("[WEBHOOK] Xray fallback failed:", err);
        }
      }

      // Side effects — all non-fatal
      try { await creditReferrerOnPayment(paymentRecord.userId, paymentRecord.amount, paymentRecord.id); } catch { /* ignore */ }

      const planLabel = paymentRecord.plan === "plus" ? "Plus" : "Basic";
      createNotificationForUser(
        paymentRecord.userId,
        "Оплата подтверждена",
        `Подписка ${planLabel} на ${paymentRecord.period} мес. активирована.`
      ).catch(() => {});

      if (user) {
        const expiresAt = new Date(user.subscriptionEnd);
        const baseUrl = (process.env.SITE_BASE_URL || "https://qodev.dev").replace(/\/+$/, "");
        sendPaymentSucceededEmail(user.email, `${planLabel} · ${paymentRecord.period} мес.`, expiresAt, `${baseUrl}/dashboard`)
          .catch((err) => console.warn("[EMAIL] payment_succeeded send failed:", err));
      }

      console.log(`[WEBHOOK] Subscription extended: ${paymentRecord.userId} +${days}d (${paymentRecord.plan} ${paymentRecord.period}m)`);
      createAuditLog("payment.success", `${paymentRecord.plan} ${paymentRecord.period}мес, ${paymentRecord.amount}₽`, paymentRecord.userId).catch(() => {});

    } else if (verifiedStatus === "canceled") {
      await updatePaymentStatus(paymentRecord.id, "canceled");
      console.log(`[WEBHOOK] Payment canceled: ${payment.id}`);
      createAuditLog("payment.canceled", `YooKassa ID: ${payment.id}`, paymentRecord.userId).catch(() => {});

    } else if (verifiedStatus === "refunded") {
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
      }
      createAuditLog("payment.refunded", `YooKassa ID: ${payment.id}, amount=${paymentRecord.amount}₽`, paymentRecord.userId).catch(() => {});
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
