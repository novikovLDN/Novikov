import { NextRequest, NextResponse } from "next/server";
import { getUserById } from "@/lib/store";

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("session")?.value;
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Не авторизован" },
        { status: 401 }
      );
    }

    const user = getUserById(sessionId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    const now = new Date();
    const end = new Date(user.subscriptionEnd);
    const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    return NextResponse.json({
      success: true,
      data: {
        email: user.email,
        daysLeft,
        subscriptionEnd: user.subscriptionEnd,
        vpnKey: user.vpnKey,
        telegramLinked: user.telegramLinked,
        referralCode: user.referralCode,
        referrals: user.referrals,
        paidReferrals: user.paidReferrals,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
