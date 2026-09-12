import { NextRequest, NextResponse } from "next/server";
import { getUserByTelegramId } from "@/lib/store";
import { verifyBotApiKey, unauthorizedResponse } from "../auth";

// GET /api/bot/user-by-telegram?telegram_id=XXX
export async function GET(request: NextRequest) {
  if (!verifyBotApiKey(request)) return unauthorizedResponse();

  try {
    const telegramId = request.nextUrl.searchParams.get("telegram_id");
    if (!telegramId) {
      return NextResponse.json({ success: false, error: "telegram_id required" }, { status: 400 });
    }

    const user = await getUserByTelegramId(telegramId);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const daysLeft = Math.max(0, Math.ceil((new Date(user.subscriptionEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    const link = daysLeft > 0 ? user.subscriptionUrl : null;

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        telegramId: user.telegramId,
        daysLeft,
        isExpired: daysLeft === 0,
        subscriptionEnd: user.subscriptionEnd,
        // `vpnKey` kept for the bot: now the Remnawave subscription link.
        vpnKey: link,
        subscriptionUrl: link,
        referralCode: user.referralCode,
      },
    });
  } catch (err) {
    console.error("[BOT/USER-BY-TELEGRAM] error:", err);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
