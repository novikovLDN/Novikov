import { NextRequest, NextResponse } from "next/server";
import { getUserById, getPaymentById, updatePaymentStatus } from "@/lib/store";
import { getPaymentStatus, PaymentStatus } from "@/lib/yookassa";
import { processConfirmedPayment } from "../webhook/route";

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("session")?.value;
    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Не авторизован" }, { status: 401 });
    }

    const user = await getUserById(sessionId);
    if (!user) {
      return NextResponse.json({ success: false, error: "Пользователь не найден" }, { status: 404 });
    }

    const paymentId = request.nextUrl.searchParams.get("id");
    if (!paymentId) {
      return NextResponse.json({ success: false, error: "ID платежа не указан" }, { status: 400 });
    }

    const payment = await getPaymentById(paymentId);
    if (!payment || payment.userId !== user.id) {
      return NextResponse.json({ success: false, error: "Платёж не найден" }, { status: 404 });
    }

    // If still pending and has a transaction ID, check with YooKassa
    if (payment.status === "pending" && payment.transactionId) {
      // Check if expired locally
      if (new Date() > new Date(payment.expiresAt)) {
        await updatePaymentStatus(payment.id, "expired");
        return NextResponse.json({
          success: true,
          data: { status: "expired", payment },
        });
      }

      try {
        const ykPayment = await getPaymentStatus(payment.transactionId);

        if (ykPayment.status === PaymentStatus.SUCCEEDED) {
          await processConfirmedPayment(payment.id, payment.transactionId);

          return NextResponse.json({
            success: true,
            data: { status: "confirmed", payment: { ...payment, status: "confirmed" } },
          });
        }

        if (ykPayment.status === PaymentStatus.CANCELED) {
          await updatePaymentStatus(payment.id, "canceled");
          return NextResponse.json({
            success: true,
            data: { status: "canceled", payment: { ...payment, status: "canceled" } },
          });
        }
      } catch {
        // YooKassa API error — return current local status
      }
    }

    return NextResponse.json({
      success: true,
      data: { status: payment.status, payment },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
