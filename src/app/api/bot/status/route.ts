import { NextRequest, NextResponse } from "next/server";
import { getUserByTelegramId, getLoyaltyInfo } from "@/lib/store";
import { verifyBotApiKey, unauthorizedResponse } from "../auth";

/**
 * GET /api/bot/status?telegram_id=XXX
 *
 * Returns full synced status for a Telegram user.
 * Bot should call this to display current subscription info.
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

    const now = new Date();
    const end = new Date(user.subscriptionEnd);
    const msLeft = Math.max(0, end.getTime() - now.getTime());
    const totalMinutes = Math.floor(msLeft / (1000 * 60));
    const totalHours = Math.floor(totalMinutes / 60);
    const daysLeft = Math.floor(totalHours / 24);
    const hoursLeft = totalHours % 24;
    const minutesLeft = totalMinutes % 60;
    const isExpired = msLeft === 0;

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        telegramId: user.telegramId,
        telegramLinked: user.telegramLinked,
        daysLeft,
        hoursLeft,
        minutesLeft,
        isExpired,
        hasActiveSubscription: !isExpired && !!user.vpnKey,
        subscriptionEnd: user.subscriptionEnd,
        subscriptionPlan: isExpired ? "expired" : (user.subscriptionPlan || "trial"),
        vpnKey: isExpired ? null : user.vpnKey,
        xrayUuid: isExpired ? null : user.xrayUuid,
        referralCode: user.referralCode,
        referrals: user.referrals,
        paidReferrals: user.paidReferrals,
        balance: user.balance,
        balanceRubles: user.balance / 100,
        cashbackPercent: getLoyaltyInfo(user.paidReferrals).percent,
        loyaltyTier: getLoyaltyInfo(user.paidReferrals).tier,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
