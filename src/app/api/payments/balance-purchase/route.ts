import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getUserById, decreaseBalance, extendSubscription, creditReferrerOnPayment, updateUser, createPaymentRecord, createNotificationForUser, createAuditLog } from "@/lib/store";
import { xrayAddUser, generateXrayUuid, generateSubToken, generateSubId, buildSubscriptionUrl } from "@/lib/xray";

// Plan pricing configuration (RUB) — same as payments/create
const PLANS: Record<string, Record<number, number>> = {
  basic: { 1: 149, 3: 399, 6: 749, 12: 1399 },
  plus: { 1: 299, 3: 699, 6: 1199, 12: 2299 },
};

const PERIOD_DAYS: Record<number, number> = {
  1: 30,
  3: 90,
  6: 180,
  12: 365,
};

/**
 * POST /api/payments/balance-purchase
 *
 * Purchase subscription using account balance.
 * Body: { plan: "basic"|"plus", period: 1|3|6|12 }
 */
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

    if (!plan || !period || !PLANS[plan] || !PLANS[plan][period]) {
      return NextResponse.json(
        { success: false, error: "Неверный тариф или срок" },
        { status: 400 }
      );
    }

    const amountRubles = PLANS[plan][period];
    const amountKopecks = Math.round(amountRubles * 100);
    const paymentId = uuidv4();

    // Check & deduct balance (atomic)
    const balanceResult = await decreaseBalance(
      user.id,
      amountKopecks,
      "subscription_payment",
      "balance",
      `Подписка ${plan === "plus" ? "Plus" : "Basic"} на ${period} мес.`
    );

    if (!balanceResult.success) {
      return NextResponse.json(
        { success: false, error: "Недостаточно средств на балансе" },
        { status: 400 }
      );
    }

    // Extend subscription
    const days = PERIOD_DAYS[period] || 30;
    await extendSubscription(user.id, days);
    await updateUser(user.id, { subscriptionPlan: plan });

    // If user had no VPN key (expired), regenerate
    if (!user.xrayUuid) {
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
    }

    // Save payment record for history
    await createPaymentRecord(
      paymentId,
      user.id,
      plan,
      period,
      amountRubles,
      `balance_${paymentId}`,
      null,
      new Date()
    );
    // Mark as confirmed immediately
    const { updatePaymentStatus } = await import("@/lib/store");
    await updatePaymentStatus(paymentId, "confirmed", new Date());

    // Credit referrer with cashback
    const cashbackResult = await creditReferrerOnPayment(user.id, amountRubles, paymentId);

    // Notify user
    const planLabel = plan === "plus" ? "Plus" : "Basic";
    await createNotificationForUser(
      user.id,
      "Оплата с баланса",
      `Подписка ${planLabel} на ${period} мес. активирована. Списано ${amountRubles}₽ с баланса.`
    ).catch(() => {});

    await createAuditLog(
      "payment.balance",
      `${plan} ${period}мес, ${amountRubles}₽ с баланса`,
      user.id,
      user.email
    );

    console.log(`[BALANCE] Purchase: ${user.email} — ${planLabel} ${period}m, ${amountRubles}₽`);

    // Get updated user data
    const updatedUser = await getUserById(user.id);

    return NextResponse.json({
      success: true,
      data: {
        paymentId,
        plan,
        period,
        amount: amountRubles,
        newBalance: balanceResult.newBalance / 100,
        daysAdded: days,
        subscriptionEnd: updatedUser?.subscriptionEnd,
        referralReward: cashbackResult ? {
          percent: cashbackResult.percent,
          rewardAmount: cashbackResult.rewardRubles,
        } : null,
      },
    });
  } catch (err) {
    console.error("[BALANCE] Purchase error:", err);
    return NextResponse.json(
      { success: false, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
