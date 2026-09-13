import { NextRequest, NextResponse } from "next/server";
import { getLoyaltyInfo } from "@/lib/store";
import { getSessionUser } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const auth = await getSessionUser(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Не авторизован" },
        { status: 401 }
      );
    }
    const user = auth.user;

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
