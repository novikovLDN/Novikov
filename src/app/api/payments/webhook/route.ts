import { NextRequest, NextResponse } from "next/server";
import {
  getPaymentByTransactionId,
  updatePaymentStatus,
  extendSubscription,
  creditReferrerOnPayment,
  updateUser,
  getUserById,
  createNotificationForUser,
  createAuditLog,
} from "@/lib/store";
import { getPaymentStatus as ykGetPayment } from "@/lib/yookassa";
import type { YooKassaNotification } from "@/lib/yookassa";
import { sendPaymentSucceededEmail, sendRefundAdminAlertEmail } from "@/lib/email";
import { syncUserToRemnawave } from "@/lib/subscription-sync";
import { startFlow, endFlow, info, warn, error as logError } from "@/lib/panel-log";
import { pool } from "@/lib/db";

const PERIOD_DAYS: Record<number, number> = { 1: 30, 3: 90, 6: 180, 12: 365 };

const YOOKASSA_IPV4_PREFIXES = [
  "185.71.76.", "185.71.77.",
  "77.75.152.", "77.75.153.", "77.75.154.", "77.75.155.", "77.75.156.", "77.75.157.",
];
const YOOKASSA_IPV6_PREFIXES = [
  "2a02:5180:0:1509", "2a02:5180:0:2655", "2a02:5180:0:1533", "2a02:5180:0:2669",
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
 * YooKassa webhook. Simple flow:
 *
 *   1. Verify payment via YooKassa API (the real auth — IP check is
 *      best-effort).
 *   2. Look up our local payment record.
 *   3. On succeeded: extendSubscription locally, then
 *      syncUserToRemnawave — that one function handles everything
 *      Remnawave-side (create-or-patch).
 *   4. On canceled / refunded: log only.
 *
 * Idempotent: status='confirmed' + paid_at means the extension was
 * already applied. Retry webhooks see this and exit cleanly.
 */
export async function POST(request: NextRequest) {
  try {
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "";
    const ipTrusted = isYooKassaIp(clientIp);
    if (!ipTrusted) console.warn(`[WEBHOOK] Untrusted IP ${clientIp || "(empty)"} — proceeding with API verification`);

    const body = (await request.json()) as YooKassaNotification;
    const event = body.event;
    const payment = body.object;
    if (!payment?.id || !event) {
      return NextResponse.json({ error: "Invalid notification format" }, { status: 400 });
    }

    console.log(`[WEBHOOK] ${event}: ${payment.id} (${payment.status}) ip=${clientIp}`);

    // Verify via YooKassa API
    let verifiedStatus: string;
    try {
      const verified = await ykGetPayment(payment.id);
      verifiedStatus = verified.status;
    } catch (err) {
      if (!ipTrusted) {
        console.error("[WEBHOOK] API verification failed for untrusted IP — rejecting:", err);
        return NextResponse.json({ error: "Verification failed" }, { status: 403 });
      }
      verifiedStatus = payment.status;
    }

    const paymentRecord = await getPaymentByTransactionId(payment.id);
    if (!paymentRecord) {
      console.error(`[WEBHOOK] Payment not found: ${payment.id}`);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // ── SUCCEEDED ──
    if (verifiedStatus === "succeeded") {
      const ctx = startFlow("purchase", { userId: paymentRecord.userId });
      info(ctx, "purchase.webhook", {
        yookassaId: payment.id,
        paymentId: paymentRecord.id,
        plan: paymentRecord.plan,
        period: paymentRecord.period,
        amount: paymentRecord.amount,
      });
      const alreadyApplied = paymentRecord.status === "confirmed" && !!paymentRecord.paidAt;
      if (alreadyApplied) {
        info(ctx, "purchase.already_applied");
        endFlow(ctx, "skipped", { reason: "already_applied" });
        return NextResponse.json({ ok: true });
      }

      const days = PERIOD_DAYS[paymentRecord.period] || 30;
      info(ctx, "purchase.extend.start", { days });

      // Step 1: extend local subscription
      try {
        await extendSubscription(paymentRecord.userId, days);
        await updateUser(paymentRecord.userId, { subscriptionPlan: paymentRecord.plan });
        info(ctx, "purchase.extend.ok");
      } catch (err) {
        logError(ctx, "purchase.extend.failed", { message: err instanceof Error ? err.message : String(err) });
        endFlow(ctx, "failed", { reason: "extend_failed" });
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
      }

      // Step 2: mirror to Remnawave (ONE function handles everything)
      info(ctx, "purchase.panel_sync.start");
      const syncResult = await syncUserToRemnawave(paymentRecord.userId);
      if (syncResult.ok) {
        await pool.query("UPDATE payments SET applied_to_remnawave_at = NOW() WHERE id = $1", [paymentRecord.id]);
        info(ctx, "purchase.panel_sync.ok", {
          action: syncResult.action,
          panelUuid: syncResult.uuid,
          panelUsername: syncResult.panelUsername,
          subscriptionUrl: syncResult.subscriptionUrl,
        });
      } else {
        warn(ctx, "purchase.panel_sync.failed", {
          reason: syncResult.reason,
          panelError: syncResult.panelError,
        });
      }

      // Step 3: mark payment confirmed
      try {
        await updatePaymentStatus(paymentRecord.id, "confirmed", new Date());
      } catch (err) {
        console.error("[WEBHOOK] updatePaymentStatus failed:", err);
      }

      // Side effects (non-fatal)
      creditReferrerOnPayment(paymentRecord.userId, paymentRecord.amount, paymentRecord.id).catch(() => null);
      const planLabel = paymentRecord.plan === "plus" ? "Plus" : "Basic";
      createNotificationForUser(
        paymentRecord.userId,
        "Оплата подтверждена",
        `Подписка ${planLabel} на ${paymentRecord.period} мес. активирована.`
      ).catch(() => null);

      const user = await getUserById(paymentRecord.userId);
      if (user) {
        const baseUrl = (process.env.SITE_BASE_URL || "https://qodev.dev").replace(/\/+$/, "");
        sendPaymentSucceededEmail(
          user.email,
          `${planLabel} · ${paymentRecord.period} мес.`,
          new Date(user.subscriptionEnd),
          `${baseUrl}/dashboard`
        ).catch((err) => console.warn("[EMAIL] send failed:", err));
      }

      createAuditLog("payment.success", `${paymentRecord.plan} ${paymentRecord.period}мес, ${paymentRecord.amount}₽`, paymentRecord.userId).catch(() => null);
      endFlow(ctx, "ok", { days, plan: paymentRecord.plan });

    // ── CANCELED ──
    } else if (verifiedStatus === "canceled") {
      await updatePaymentStatus(paymentRecord.id, "canceled");
      createAuditLog("payment.canceled", `YooKassa ID: ${payment.id}`, paymentRecord.userId).catch(() => null);
      console.log(`[WEBHOOK] Payment canceled: ${payment.id}`);

    // ── REFUNDED ──
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
        }).catch((err) => console.warn("[EMAIL] refund alert failed:", err));
      }
      createAuditLog("payment.refunded", `YooKassa ID: ${payment.id}, amount=${paymentRecord.amount}₽`, paymentRecord.userId).catch(() => null);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[WEBHOOK] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
