import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { createPaymentRecord, setPaymentTransaction, transitionPaymentStatus } from "@/lib/store";
import { createPayment } from "@/lib/yookassa";
import { PLANS, isPeriod, isPlanId } from "@/lib/plans";
import { getSessionUser } from "@/lib/session";
import { checkRateLimit } from "@/lib/rate-limit";

const PAYMENT_LIFETIME_MS = 15 * 60 * 1000; // 15 minutes

let warnedNoBaseUrl = false;

/** Where YooKassa sends the buyer back. Env first; the request origin is a logged fallback. */
function siteBaseUrl(request: NextRequest): string {
  const env = (process.env.SITE_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/+$/, "");
  if (env) return env;
  if (!warnedNoBaseUrl) {
    warnedNoBaseUrl = true;
    console.warn("[PAYMENTS] SITE_BASE_URL is not set — building returnUrl from the request origin");
  }
  return (request.headers.get("origin") || request.nextUrl.origin).replace(/\/+$/, "");
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getSessionUser(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Не авторизован" },
        { status: 401 }
      );
    }
    const user = auth.user;

    // Each call opens a real YooKassa payment: cap it per account.
    const limit = checkRateLimit(`payment-create:${user.id}`, 10, 10 * 60_000);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: `Слишком много попыток оплаты. Повторите через ${limit.retryAfterSeconds} сек.` },
        { status: 429 }
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
    const returnUrl = `${siteBaseUrl(request)}/subscribe?payment=${paymentId}`;

    const planLabel = plan === "plus" ? "Plus" : "Basic";
    const description = `Atlas Secure ${planLabel} — ${period} мес.`;

    // Our record FIRST: if anything below crashes after YooKassa took the
    // money, the webhook still finds the payment (by metadata.paymentId).
    await createPaymentRecord(paymentId, user.id, plan, period, amount, null, null, expiresAt);

    let transactionId: string;
    let redirectUrl: string;
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
      await transitionPaymentStatus(paymentId, ["pending"], "failed").catch((dbErr) =>
        console.error("[PAYMENTS] could not mark payment failed:", paymentId, dbErr)
      );
      return NextResponse.json(
        { success: false, error: "Не удалось создать платёж. Попробуйте позже." },
        { status: 502 }
      );
    }

    await setPaymentTransaction(paymentId, transactionId, redirectUrl);

    return NextResponse.json({
      success: true,
      data: {
        paymentId,
        redirectUrl,
        amount,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("[PAYMENTS] create failed:", err);
    return NextResponse.json(
      { success: false, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
