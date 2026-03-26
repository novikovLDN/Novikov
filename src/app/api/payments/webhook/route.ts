import { NextRequest, NextResponse } from "next/server";
import { getPaymentByTransactionId, updatePaymentStatus, extendSubscription, creditReferrerOnPayment, updateUser } from "@/lib/store";
import { xrayAddUser } from "@/lib/xray";
import { getUserById } from "@/lib/store";
import type { YooKassaNotification } from "@/lib/yookassa";

// Period in months → days
const PERIOD_DAYS: Record<number, number> = {
  1: 30,
  3: 90,
  6: 180,
  12: 365,
};

/**
 * YooKassa Webhook Handler
 *
 * YooKassa sends POST notifications with body:
 * {
 *   type: "notification",
 *   event: "payment.succeeded" | "payment.canceled" | ...,
 *   object: { id, status, amount, metadata, ... }
 * }
 *
 * Set webhook URL in YooKassa dashboard:
 * https://yourdomain.com/api/payments/webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // YooKassa notification format
    const notification = body as YooKassaNotification;
    const event = notification.event;
    const payment = notification.object;

    if (!payment?.id || !event) {
      // Fallback: try legacy Platega format
      const transactionId = body.transactionId || body.id;
      const status = body.status;
      if (transactionId && status) {
        return handleLegacy(transactionId, status);
      }
      return NextResponse.json({ error: "Invalid notification format" }, { status: 400 });
    }

    console.log(`[WEBHOOK] YooKassa ${event}: ${payment.id} (${payment.status})`);

    // Find our payment record by YooKassa payment ID
    const paymentRecord = await getPaymentByTransactionId(payment.id);
    if (!paymentRecord) {
      console.error(`[WEBHOOK] Payment not found for YooKassa ID: ${payment.id}`);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Already processed
    if (paymentRecord.status === "confirmed") {
      return NextResponse.json({ ok: true });
    }

    if (event === "payment.succeeded") {
      // Mark as confirmed
      await updatePaymentStatus(paymentRecord.id, "confirmed", new Date());

      // Extend subscription
      const days = PERIOD_DAYS[paymentRecord.period] || 30;
      await extendSubscription(paymentRecord.userId, days);
      await updateUser(paymentRecord.userId, { subscriptionPlan: paymentRecord.plan });

      // If user had no VPN key (expired), regenerate and add to Xray
      const user = await getUserById(paymentRecord.userId);
      if (user && !user.xrayUuid) {
        const { generateXrayUuid, generateSubToken, generateSubId, buildSubscriptionUrl } = await import("@/lib/xray");
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

      // Send notification
      const { createNotificationForUser } = await import("@/lib/store");
      const planLabel = paymentRecord.plan === "plus" ? "Plus" : "Basic";
      await createNotificationForUser(
        paymentRecord.userId,
        "Оплата подтверждена",
        `Подписка ${planLabel} на ${paymentRecord.period} мес. активирована. Приятного пользования!`
      ).catch(() => {});

      console.log(`[WEBHOOK] Subscription extended: ${paymentRecord.userId} +${days}d (${paymentRecord.plan} ${paymentRecord.period}m)`);

    } else if (event === "payment.canceled") {
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

/** Handle legacy Platega-format webhook (backward compatibility) */
async function handleLegacy(transactionId: string, status: string) {
  console.log(`[WEBHOOK] Legacy format: ${transactionId} → ${status}`);

  const payment = await getPaymentByTransactionId(transactionId);
  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  if (payment.status === "confirmed") {
    return NextResponse.json({ ok: true });
  }

  if (status === "CONFIRMED") {
    await updatePaymentStatus(payment.id, "confirmed", new Date());
    const days = PERIOD_DAYS[payment.period] || 30;
    await extendSubscription(payment.userId, days);
    await updateUser(payment.userId, { subscriptionPlan: payment.plan });
    await creditReferrerOnPayment(payment.userId);
  } else if (status === "CANCELED" || status === "CHARGEBACKED") {
    await updatePaymentStatus(payment.id, "canceled");
  }

  return NextResponse.json({ ok: true });
}
