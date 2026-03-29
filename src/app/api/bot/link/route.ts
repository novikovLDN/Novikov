import { NextRequest, NextResponse } from "next/server";
import { linkTelegramByToken, createAuditLog } from "@/lib/store";
import { verifyBotApiKey, unauthorizedResponse } from "../auth";

// POST /api/bot/link — bot links telegram_id to user by token
export async function POST(request: NextRequest) {
  if (!verifyBotApiKey(request)) return unauthorizedResponse();

  try {
    const { token, telegramId } = await request.json();

    if (!token || !telegramId) {
      return NextResponse.json(
        { success: false, error: "token and telegramId required" },
        { status: 400 }
      );
    }

    const user = await linkTelegramByToken(token, String(telegramId));
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found or already linked" },
        { status: 404 }
      );
    }

    const now = new Date();
    const end = new Date(user.subscriptionEnd);
    const msLeft = Math.max(0, end.getTime() - now.getTime());
    const daysLeft = Math.floor(msLeft / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.floor((msLeft / (1000 * 60 * 60)) % 24);
    const isExpired = msLeft === 0;
    const hasActiveSubscription = !isExpired && !!user.xrayUuid;

    await createAuditLog("telegram.link", `TG:${telegramId} linked`, user.id, user.email);

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        daysLeft,
        hoursLeft,
        isExpired,
        hasActiveSubscription,
        subscriptionEnd: user.subscriptionEnd,
        subscriptionPlan: isExpired ? "expired" : (user.subscriptionPlan || "trial"),
        vpnKey: isExpired ? null : user.vpnKey,
        xrayUuid: isExpired ? null : user.xrayUuid,
        referralCode: user.referralCode,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
