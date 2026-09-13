import { NextRequest, NextResponse } from "next/server";
import { getUserByTelegramId } from "@/lib/store";
import { confirmTelegramLogin } from "@/lib/telegram-login";
import { verifyBotApiKey, unauthorizedResponse } from "../auth";

/**
 * POST /api/bot/auth-login  { telegramId, nonce }
 *
 * The bot confirms a "sign in with Telegram" request.
 *
 * Flow (see src/lib/telegram-login.ts):
 * 1. The site calls POST /api/auth/telegram-start → nonce bound to the
 *    browser, shows a 4-digit confirm code, opens the bot with
 *    /start tglogin_{nonce}.
 * 2. The bot calls this endpoint with the person's telegramId + nonce.
 *    It can only confirm a nonce the SITE created, once, within 5 minutes
 *    (it can no longer create or rebind one).
 * 3. The response carries `confirmCode` and the requesting browser's
 *    `request.ip` / `request.userAgent`: the bot should show them and let
 *    the person cancel if the code differs from the one on the screen.
 * 4. The site polls /api/auth/telegram-check → session for that browser only.
 *
 * Errors: 404 NOT_LINKED (no site account for this Telegram id),
 *         404 NONCE_INVALID (unknown, expired or already used nonce).
 */
export async function POST(request: NextRequest) {
  if (!verifyBotApiKey(request)) return unauthorizedResponse();

  try {
    const { telegramId, nonce } = await request.json();

    if (!telegramId || !nonce) {
      return NextResponse.json({ success: false, error: "telegramId and nonce required" }, { status: 400 });
    }

    const user = await getUserByTelegramId(String(telegramId));

    if (!user) {
      return NextResponse.json({
        success: false,
        error: "User not found. Not linked to any site account.",
        code: "NOT_LINKED",
      }, { status: 404 });
    }

    const confirmed = await confirmTelegramLogin(String(nonce), user.id, String(telegramId));
    if (!confirmed) {
      return NextResponse.json({
        success: false,
        error: "Login request not found, expired or already used. Start the login on the site again.",
        code: "NONCE_INVALID",
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        confirmCode: confirmed.confirmCode,
        request: {
          ip: confirmed.requestIp,
          userAgent: confirmed.requestUserAgent,
          createdAt: confirmed.createdAt,
          expiresAt: confirmed.expiresAt,
        },
      },
    });
  } catch (err) {
    console.error("[BOT] auth-login error:", err);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
