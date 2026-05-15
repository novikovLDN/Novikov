import { NextRequest, NextResponse } from "next/server";
import { getUserById, getLoyaltyInfo } from "@/lib/store";
import { buildSubscriptionUrl } from "@/lib/xray";

export async function GET(request: NextRequest) {
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
      const response = NextResponse.json(
        { success: false, error: "Пользователь не найден" },
        { status: 404 }
      );
      response.cookies.delete("session");
      return response;
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

    // Prefer the Remnawave-issued subscription URL — it's the panel-managed
    // endpoint that delivers up-to-date server list, traffic limits and
    // expireAt to the client. Fall back to the legacy local /api/sub/...
    // URL only when Remnawave hasn't provisioned this user yet (background
    // trial-creation in flight, or a legacy account predating the migration).
    let displayKey: string | null = null;
    if (!isExpired) {
      if (user.subscriptionUrl) {
        displayKey = user.subscriptionUrl;
      } else if (user.subToken && user.subId) {
        displayKey = buildSubscriptionUrl(user.subToken, user.subId);
      } else if (user.subToken) {
        displayKey = buildSubscriptionUrl(user.subToken, "");
      } else {
        displayKey = user.vpnKey;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        email: user.email,
        daysLeft,
        hoursLeft,
        minutesLeft,
        isExpired,
        subscriptionEnd: user.subscriptionEnd,
        vpnKey: displayKey,
        xrayUuid: isExpired ? null : user.xrayUuid,
        subToken: isExpired ? null : user.subToken,
        telegramLinked: user.telegramLinked,
        telegramLinkToken: user.telegramLinkToken,
        referralCode: user.referralCode,
        subscriptionPlan: isExpired ? "expired" : (user.subscriptionPlan || "trial"),
        referrals: user.referrals,
        paidReferrals: user.paidReferrals,
        balance: user.balance / 100,
        cashbackPercent: getLoyaltyInfo(user.paidReferrals).percent,
        loyaltyTier: getLoyaltyInfo(user.paidReferrals).tier,
        isAdmin: !!(process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL),
        // ── Remnawave-issued subscription (preferred) ──
        subscriptionUrl: isExpired ? null : user.subscriptionUrl,
        happCryptoLink: isExpired ? null : user.happCryptoLink,
        trialUsedAt: user.trialUsedAt,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
