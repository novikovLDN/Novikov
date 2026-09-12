import { NextRequest, NextResponse } from "next/server";
import { getUserByTelegramId, getLoyaltyInfo } from "@/lib/store";
import { verifyBotApiKey, unauthorizedResponse } from "../auth";

/**
 * GET /api/bot/status?telegram_id=XXX
 *
 * Full synced status for a Telegram user. `vpnKey` is kept for the bot
 * and carries the Remnawave subscription link (same as `subscriptionUrl`).
 */
export async function GET(request: NextRequest) {
  if (!verifyBotApiKey(request)) return unauthorizedResponse();

  try {
    const telegramId = request.nextUrl.searchParams.get("telegram_id") || request.nextUrl.searchParams.get("telegramId");
    if (!telegramId) {
      return NextResponse.json({ success: false, error: "telegram_id required" }, { status: 400 });
    }

    const user = await getUserByTelegramId(telegramId);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const msLeft = Math.max(0, new Date(user.subscriptionEnd).getTime() - Date.now());
    const totalMinutes = Math.floor(msLeft / (1000 * 60));
    const totalHours = Math.floor(totalMinutes / 60);
    const isExpired = msLeft === 0;
    const link = isExpired ? null : user.subscriptionUrl;

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        telegramId: user.telegramId,
        telegramLinked: user.telegramLinked,
        daysLeft: Math.floor(totalHours / 24),
        hoursLeft: totalHours % 24,
        minutesLeft: totalMinutes % 60,
        isExpired,
        hasActiveSubscription: !isExpired && !!user.subscriptionUrl,
        subscriptionEnd: user.subscriptionEnd,
        subscriptionPlan: isExpired ? "expired" : (user.subscriptionPlan || "trial"),
        vpnKey: link,
        subscriptionUrl: link,
        xrayUuid: null,
        referralCode: user.referralCode,
        referrals: user.referrals,
        paidReferrals: user.paidReferrals,
        balance: user.balance,
        balanceRubles: user.balance / 100,
        cashbackPercent: getLoyaltyInfo(user.paidReferrals).percent,
        loyaltyTier: getLoyaltyInfo(user.paidReferrals).tier,
      },
    });
  } catch (err) {
    console.error("[BOT/STATUS] error:", err);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
