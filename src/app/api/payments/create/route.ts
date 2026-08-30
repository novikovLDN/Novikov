import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getUserById, createPaymentRecord } from "@/lib/store";
import { createPayment } from "@/lib/yookassa";
import { PLANS, isPeriod, isPlanId } from "@/lib/plans";

const PAYMENT_LIFETIME_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("session")?.value;
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Не авторизован" },
        { status: 401 }
      );
    }

    const user = await getUserById(sessionId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    const { plan, period } = await request.json();

    // Обе величины приходят от клиента и до этой проверки не имеют
    // типа: без сужения ошибочное имя тарифа дало бы undefined, а
    // сумма платежа — NaN.
    if (!isPlanId(plan) || !isPeriod(period)) {
      return NextResponse.json(
        { success: false, error: "Неверный тариф или срок" },
        { status: 400 }
      );
    }

    const amount = PLANS[plan][period];
    const paymentId = uuidv4();
    const expiresAt = new Date(Date.now() + PAYMENT_LIFETIME_MS);

    // Build return URL — user comes back here after payment
    const origin = request.headers.get("origin") || request.headers.get("referer")?.replace(/\/[^/]*$/, "") || "";
    const returnUrl = `${origin}/subscribe?payment=${paymentId}`;

    const planLabel = plan === "plus" ? "Plus" : "Basic";
    const description = `Atlas Secure ${planLabel} — ${period} мес.`;

    let transactionId: string | null = null;
    let redirectUrl: string | null = null;

    try {
      const result = await createPayment({
        amount,
        description,
        returnUrl,
        metadata: {
          paymentId,
          userId: user.id,
          plan,
          period: String(period),
        },
      });
      transactionId = result.transactionId;
      redirectUrl = result.redirect;
    } catch (err) {
      console.error("[PAYMENTS] YooKassa create error:", err);
      return NextResponse.json(
        { success: false, error: "Не удалось создать платёж. Попробуйте позже." },
        { status: 502 }
      );
    }

    // Save payment record
    await createPaymentRecord(
      paymentId,
      user.id,
      plan,
      period,
      amount,
      transactionId,
      redirectUrl,
      expiresAt
    );

    return NextResponse.json({
      success: true,
      data: {
        paymentId,
        redirectUrl,
        amount,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
