import { NextRequest, NextResponse } from "next/server";
import { getPaymentById } from "@/lib/store";
import { reconcilePaymentWithYooKassa } from "@/lib/payments";
import { getSessionUser } from "@/lib/session";

/**
 * Called from the /subscribe page after the YooKassa return-redirect
 * (polled every few seconds). For pending AND locally-expired payments
 * it asks YooKassa; a success goes through the same atomic
 * confirmPayment as the webhook, so polling and the webhook can never
 * extend twice. Only the owner of the payment gets an answer.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getSessionUser(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: "Не авторизован" }, { status: 401 });
    }
    const user = auth.user;

    const paymentId = request.nextUrl.searchParams.get("id");
    if (!paymentId) {
      return NextResponse.json({ success: false, error: "ID платежа не указан" }, { status: 400 });
    }

    const payment = await getPaymentById(paymentId);
    if (!payment || payment.userId !== user.id) {
      return NextResponse.json({ success: false, error: "Платёж не найден" }, { status: 404 });
    }

    if (payment.status === "pending" || payment.status === "expired") {
      const r = await reconcilePaymentWithYooKassa(payment, "status");
      if (r.outcome === "lookup_failed") console.warn(`[PAYMENTS/STATUS] ${payment.id}: YooKassa lookup failed: ${r.error}`);
    }

    const fresh = (await getPaymentById(paymentId)) ?? payment;
    return NextResponse.json({ success: true, data: { status: fresh.status, payment: fresh } });
  } catch (err) {
    console.error("[PAYMENTS/STATUS] error:", err);
    return NextResponse.json(
      { success: false, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
