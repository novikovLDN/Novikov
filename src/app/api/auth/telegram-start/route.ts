import { NextRequest, NextResponse } from "next/server";
import { startTelegramLogin, TG_LOGIN_COOKIE, TG_LOGIN_COOKIE_PATH, TG_LOGIN_TTL_MS } from "@/lib/telegram-login";
import { checkRateLimit } from "@/lib/rate-limit";
import { clientIpFrom } from "@/lib/client-ip";

/**
 * POST /api/auth/telegram-start — begin "sign in with Telegram".
 *
 * Creates a nonce bound to THIS browser (httpOnly cookie `tg_login`,
 * path /api/auth, 5 minutes). The page opens the bot with
 * `/start tglogin_<nonce>` and shows `confirmCode`; the bot shows the same
 * code and asks the person to confirm. Then the page polls
 * /api/auth/telegram-check?nonce=… .
 *
 * Optional env TELEGRAM_BOT_USERNAME (without @) fills `botUrl`.
 */
const BOT_USERNAME_RE = /^[A-Za-z0-9_]{3,64}$/;

export async function POST(request: NextRequest) {
  const ip = clientIpFrom(request.headers);
  const limit = checkRateLimit(`tg-start:${ip || "unknown"}`, 10, 10 * 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: `Слишком много попыток. Повторите через ${limit.retryAfterSeconds} сек.` },
      { status: 429 }
    );
  }

  try {
    const s = await startTelegramLogin({ ip, userAgent: request.headers.get("user-agent") });
    const bot = (process.env.TELEGRAM_BOT_USERNAME || "").trim().replace(/^@/, "");
    const startParam = `tglogin_${s.nonce}`;

    const response = NextResponse.json({
      success: true,
      data: {
        nonce: s.nonce,
        startParam,
        botUrl: BOT_USERNAME_RE.test(bot) ? `https://t.me/${bot}?start=${startParam}` : null,
        confirmCode: s.confirmCode,
        expiresAt: s.expiresAt.toISOString(),
      },
    });
    response.cookies.set(TG_LOGIN_COOKIE, s.secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: TG_LOGIN_COOKIE_PATH,
      maxAge: Math.floor(TG_LOGIN_TTL_MS / 1000),
    });
    return response;
  } catch (err) {
    console.error("[AUTH/TELEGRAM-START] error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ success: false, error: "Ошибка сервера" }, { status: 500 });
  }
}
