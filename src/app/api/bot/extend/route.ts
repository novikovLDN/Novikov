import { NextRequest, NextResponse } from "next/server";
import { botExtendSubscription, getUserByTelegramId, creditReferrerOnPayment, updateUser, createNotificationForUser } from "@/lib/store";
import { xrayAddUser } from "@/lib/xray";
import { verifyBotApiKey, unauthorizedResponse } from "../auth";
import { botSyncDisabledResponse } from "../sync-guard";

// Hard cap: anything beyond ~13 months is almost certainly a bug on the
// caller side (10-year "lifetime" tariffs were silently nuking trial
// users' subscriptions). Reject loudly so we see who's sending bad data.
const MAX_DAYS = 400;

// POST /api/bot/extend — bot extends subscription after payment
export async function POST(request: NextRequest) {
  if (!verifyBotApiKey(request)) return unauthorizedResponse();
  const disabled = await botSyncDisabledResponse();
  if (disabled) return disabled;

  try {
    const { telegramId, days, plan, amount, paymentId } = await request.json();

    if (!telegramId || !days) {
      return NextResponse.json(
        { success: false, error: "telegramId and days required" },
        { status: 400 }
      );
    }

    if (typeof days !== "number" || days <= 0 || days > MAX_DAYS) {
      console.warn(`[BOT] REJECTED extend: telegramId=${telegramId} days=${days} (must be 1..${MAX_DAYS})`);
      return NextResponse.json(
        { success: false, error: `days must be a positive number ≤ ${MAX_DAYS}`, code: "days_out_of_range" },
        { status: 400 }
      );
    }

    const beforeUser = await getUserByTelegramId(String(telegramId));
    const hadKey = !!beforeUser?.xrayUuid;

    const user = await botExtendSubscription(String(telegramId), days, plan);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found. Link Telegram first." },
        { status: 404 }
      );
    }

    // If key was regenerated (user had no key before), add to Xray
    if (!hadKey && user.xrayUuid) {
      xrayAddUser(user.xrayUuid).catch(() => {
        console.error(`[BOT] Failed to add user to Xray: ${user.email}`);
      });
    }

    // Sync subscription plan
    if (plan && ["basic", "plus"].includes(plan)) {
      await updateUser(user.id, { subscriptionPlan: plan });
    }

    // Credit referrer with cashback
    const cashbackResult = await creditReferrerOnPayment(
      user.id,
      typeof amount === "number" ? amount : undefined,
      paymentId ? String(paymentId) : undefined
    );

    // Notify user on site about subscription change
    const planLabel = plan === "plus" ? "Plus" : plan === "basic" ? "Basic" : "";
    await createNotificationForUser(
      user.id,
      "Подписка обновлена",
      `Подписка${planLabel ? ` ${planLabel}` : ""} продлена на ${days} дн. через Telegram.`
    ).catch(() => {});

    const now = new Date();
    const end = new Date(user.subscriptionEnd);
    const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    console.log(`[BOT] Extended subscription for ${user.email}: +${days} days (plan: ${plan || "n/a"})`);

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        daysLeft,
        subscriptionEnd: user.subscriptionEnd,
        vpnKey: user.vpnKey,
        subscriptionPlan: plan || user.subscriptionPlan,
        referralReward: cashbackResult ? {
          referrerId: cashbackResult.referrerId,
          percent: cashbackResult.percent,
          rewardAmount: cashbackResult.rewardRubles,
        } : null,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
