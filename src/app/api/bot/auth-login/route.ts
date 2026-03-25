import { NextRequest, NextResponse } from "next/server";
import { getUserByTelegramId } from "@/lib/store";
import { verifyBotApiKey, unauthorizedResponse } from "../auth";

/**
 * GET /api/bot/auth-login?telegram_id=XXX
 *
 * Bot calls this to check if a Telegram user has a linked site account.
 * Returns a one-time auth token that the site can use to log in the user.
 *
 * Flow:
 * 1. User clicks "Войти через Telegram" on site → opens bot with deep link
 * 2. Bot sends /start tglogin_{nonce}
 * 3. Bot calls this endpoint with telegram_id
 * 4. If user exists → returns authToken (stored in DB)
 * 5. Site polls /api/auth/telegram-check?nonce=XXX → gets session
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

    // Store nonce → userId mapping for the site to verify
    const { pool } = await import("@/lib/db");
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Upsert: create or update telegram_auth_nonces table entry
    await pool.query(
      `CREATE TABLE IF NOT EXISTS telegram_auth_nonces (
        nonce TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        telegram_id TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL,
        used BOOLEAN NOT NULL DEFAULT FALSE
      )`
    );

    await pool.query(
      `INSERT INTO telegram_auth_nonces (nonce, user_id, telegram_id, expires_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (nonce) DO UPDATE SET user_id = $2, telegram_id = $3, expires_at = $4, used = FALSE`,
      [nonce, user.id, String(telegramId), expiresAt]
    );

    return NextResponse.json({
      success: true,
      data: { userId: user.id, email: user.email },
    });
  } catch (err) {
    console.error("[BOT] auth-login error:", err);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
