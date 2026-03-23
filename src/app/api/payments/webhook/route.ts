import { NextRequest, NextResponse } from "next/server";
import { getPaymentByTransactionId, updatePaymentStatus, extendSubscription, creditReferrerOnPayment } from "@/lib/store";
import { PaymentStatus } from "@/lib/platega";

// Period in months → days
const PERIOD_DAYS: Record<number, number> = {
  1: 30,
  3: 90,
  6: 180,
  12: 365,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const transactionId = body.transactionId || body.id;
    const status = body.status;

    if (!transactionId || !status) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    console.log(`[WEBHOOK] Payment ${transactionId}: ${status}`);

    const payment = await getPaymentByTransactionId(transactionId);
    if (!payment) {
      console.error(`[WEBHOOK] Payment not found for transaction: ${transactionId}`);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Already processed
    if (payment.status === "confirmed") {
      return NextResponse.json({ ok: true });
    }

    if (status === PaymentStatus.CONFIRMED) {
      // Mark payment as confirmed
      await updatePaymentStatus(payment.id, "confirmed", new Date());

      // Extend subscription
      const days = PERIOD_DAYS[payment.period] || 30;
      await extendSubscription(payment.userId, days);

      // Credit referrer if this is the user's first payment
      await creditReferrerOnPayment(payment.userId);

      console.log(`[WEBHOOK] Subscription extended for user ${payment.userId}: +${days} days (${payment.plan} ${payment.period}m)`);
    } else if (status === PaymentStatus.CANCELED || status === PaymentStatus.CHARGEBACKED) {
      await updatePaymentStatus(payment.id, "canceled");
      console.log(`[WEBHOOK] Payment canceled: ${transactionId}`);
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
