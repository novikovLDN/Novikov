import { NextRequest, NextResponse } from "next/server";
import { linkTelegramByToken } from "@/lib/store";
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
    const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        daysLeft,
        isExpired: daysLeft === 0,
        subscriptionEnd: user.subscriptionEnd,
        vpnKey: daysLeft > 0 ? user.vpnKey : null,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
