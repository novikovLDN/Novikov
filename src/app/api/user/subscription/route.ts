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

    // Always read fresh from DB
    let user = await getUserById(sessionId);
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

    // Only clear VPN key if TRULY expired (not if bot just synced a new date)
    // Check: subscription expired AND no recent sync (subscriptionEnd is in the past)
    if (isExpired && user.xrayUuid) {
      // Double-check by re-reading from DB (in case bot synced between page loads)
      const freshUser = await getUserById(sessionId);
      if (freshUser) {
        const freshEnd = new Date(freshUser.subscriptionEnd);
        if (freshEnd <= now) {
          // Still expired after re-read — safe to clear
          await xrayRemoveUser(freshUser.xrayUuid!);
          await updateUser(user.id, { xrayUuid: null, vpnKey: null });
          user = { ...freshUser, xrayUuid: null, vpnKey: null };
        } else {
          // Bot synced new date! Use fresh data
          user = freshUser;
        }
      }
    }

    // Recalculate after possible refresh
    const finalEnd = new Date(user.subscriptionEnd);
    const finalMsLeft = Math.max(0, finalEnd.getTime() - now.getTime());
    const finalExpired = finalMsLeft === 0;
    const finalTotalMin = Math.floor(finalMsLeft / (1000 * 60));
    const finalTotalHr = Math.floor(finalTotalMin / 60);
    const finalDays = Math.floor(finalTotalHr / 24);
    const finalHours = finalTotalHr % 24;
    const finalMinutes = finalTotalMin % 60;

    return NextResponse.json({
      success: true,
      data: {
        email: user.email,
        daysLeft: finalDays,
        hoursLeft: finalHours,
        minutesLeft: finalMinutes,
        isExpired: finalExpired,
        subscriptionEnd: user.subscriptionEnd,
        vpnKey: finalExpired ? null : user.vpnKey,
        xrayUuid: finalExpired ? null : user.xrayUuid,
        subToken: finalExpired ? null : user.subToken,
        telegramLinked: user.telegramLinked,
        telegramLinkToken: user.telegramLinkToken,
        referralCode: user.referralCode,
        subscriptionPlan: finalExpired ? "expired" : (user.subscriptionPlan || "trial"),
        referrals: user.referrals,
        paidReferrals: user.paidReferrals,
        isAdmin: !!(process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
