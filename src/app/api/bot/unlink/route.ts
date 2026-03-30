import { NextRequest, NextResponse } from "next/server";
import { getUserByTelegramId, updateUser, createAuditLog } from "@/lib/store";
import { verifyBotApiKey, unauthorizedResponse } from "../auth";

/**
 * POST /api/bot/unlink
 *
 * Bot calls this when user wants to unlink their site account from Telegram.
 * Clears telegramId and telegramLinked, generates new link token.
 * Subscription and VPN key on site are NOT affected.
 *
 * Body: { "telegramId": "6214188086" }
 */
export async function POST(request: NextRequest) {
  if (!verifyBotApiKey(request)) return unauthorizedResponse();

  try {
    const { telegramId } = await request.json();

    if (!telegramId) {
      return NextResponse.json({ success: false, error: "telegramId required" }, { status: 400 });
    }

    const user = await getUserByTelegramId(String(telegramId));
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found or not linked" }, { status: 404 });
    }

    const crypto = require("crypto");
    const newToken = crypto.randomBytes(8).toString("hex");

    await updateUser(user.id, {
      telegramId: null,
      telegramLinked: false,
      telegramLinkToken: newToken,
    });

    await createAuditLog("telegram.unlink", `TG:${telegramId} unlinked from bot`, user.id, user.email);

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        unlinked: true,
      },
    });
  } catch (err) {
    console.error("[BOT] Unlink error:", err);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
