import { NextRequest, NextResponse } from "next/server";
import { getUserById, getLoyaltyInfo } from "@/lib/store";

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
      return NextResponse.json(
        { success: false, error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    const loyalty = getLoyaltyInfo(user.paidReferrals);

    return NextResponse.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        referrals: user.referrals,
        paidReferrals: user.paidReferrals,
        cashbackPercent: loyalty.percent,
        loyaltyTier: loyalty.tier,
        nextTier: loyalty.nextTier,
        referralsToNextTier: loyalty.referralsToNextTier,
        balance: user.balance / 100,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
