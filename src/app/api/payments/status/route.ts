import { NextRequest, NextResponse } from "next/server";
import {
  getUserById,
  getPaymentById,
  updatePaymentStatus,
  extendSubscription,
  creditReferrerOnPayment,
  updateUser,
} from "@/lib/store";
import { getPaymentStatus, PaymentStatus } from "@/lib/yookassa";
import { syncUserToRemnawave } from "@/lib/subscription-sync";
import { pool } from "@/lib/db";

const PERIOD_DAYS: Record<number, number> = { 1: 30, 3: 90, 6: 180, 12: 365 };

/**
 * Called from the /subscribe page after the YooKassa return-redirect.
 * Reconciles the payment if the webhook hasn't landed yet, then
 * pushes the result to Remnawave via the shared sync helper.
 */
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

    if (payment.status === "pending" && payment.transactionId) {
      if (new Date() > new Date(payment.expiresAt)) {
        await updatePaymentStatus(payment.id, "expired");
        return NextResponse.json({ success: true, data: { status: "expired", payment } });
      }

      try {
        const ykPayment = await getPaymentStatus(payment.transactionId);

        if (ykPayment.status === PaymentStatus.SUCCEEDED) {
          const days = PERIOD_DAYS[payment.period] || 30;
          await extendSubscription(payment.userId, days);
          await updateUser(payment.userId, { subscriptionPlan: payment.plan });

          const sync = await syncUserToRemnawave(payment.userId);
          if (sync.ok) {
            await pool.query("UPDATE payments SET applied_to_remnawave_at = NOW() WHERE id = $1", [payment.id]);
          }

          await updatePaymentStatus(payment.id, "confirmed", new Date());
          creditReferrerOnPayment(payment.userId, payment.amount, payment.id).catch(() => null);

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

    return NextResponse.json({ success: true, data: { status: payment.status, payment } });
  } catch {
    return NextResponse.json(
      { success: false, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
