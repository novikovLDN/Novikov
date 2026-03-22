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

    return NextResponse.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        referrals: user.referrals,
        paidReferrals: user.paidReferrals,
        bonusDays: 20,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
