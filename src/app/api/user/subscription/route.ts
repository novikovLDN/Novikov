import { NextRequest, NextResponse } from "next/server";
import { getUserById, updateUser } from "@/lib/store";
import { xrayRemoveUser } from "@/lib/xray";

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
    const daysLeft = Math.max(
      0,
      Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );

    const isExpired = daysLeft === 0;

    // If subscription expired, remove user from Xray and clear VPN key
    if (isExpired && user.xrayUuid) {
      await xrayRemoveUser(user.xrayUuid);
      await updateUser(user.id, { xrayUuid: null, vpnKey: null });
    }

    return NextResponse.json({
      success: true,
      data: {
        email: user.email,
        daysLeft,
        isExpired,
        subscriptionEnd: user.subscriptionEnd,
        vpnKey: isExpired ? null : user.vpnKey,
        xrayUuid: isExpired ? null : user.xrayUuid,
        telegramLinked: user.telegramLinked,
        telegramLinkToken: user.telegramLinkToken,
        referralCode: user.referralCode,
        referrals: user.referrals,
        paidReferrals: user.paidReferrals,
        isAdmin: user.email === "novikov.ldnwq@gmail.com",
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
