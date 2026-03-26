import { NextRequest, NextResponse } from "next/server";
import { getUserById, getPaymentById, updatePaymentStatus, extendSubscription, creditReferrerOnPayment, updateUser } from "@/lib/store";
import { getPaymentStatus, PaymentStatus } from "@/lib/yookassa";
import { xrayAddUser } from "@/lib/xray";

const PERIOD_DAYS: Record<number, number> = {
  1: 30,
  3: 90,
  6: 180,
  12: 365,
};

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
          await updatePaymentStatus(payment.id, "confirmed", new Date());
          const days = PERIOD_DAYS[payment.period] || 30;
          await extendSubscription(payment.userId, days);
          await updateUser(payment.userId, { subscriptionPlan: payment.plan });

          // Regenerate key if needed
          if (!user.xrayUuid) {
            const { generateXrayUuid, generateSubToken, generateSubId, buildSubscriptionUrl } = await import("@/lib/xray");
            const newUuid = generateXrayUuid();
            const newSubToken = generateSubToken();
            const subId = user.subId || generateSubId(user.email);
            const newKey = buildSubscriptionUrl(newSubToken, subId);
            await updateUser(user.id, { xrayUuid: newUuid, vpnKey: newKey, subToken: newSubToken, subId });
            await xrayAddUser(newUuid);
          }

          await creditReferrerOnPayment(payment.userId);

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
