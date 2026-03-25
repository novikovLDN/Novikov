import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

/**
 * GET /api/auth/telegram-check?nonce=XXX
 *
 * Site polls this endpoint after showing the Telegram login QR/link.
 * Once the bot confirms the user (via /api/bot/auth-login), this returns
 * the session cookie and redirects to dashboard.
 */
export async function GET(request: NextRequest) {
  try {
    const nonce = request.nextUrl.searchParams.get("nonce");
    if (!nonce) {
      return NextResponse.json({ success: false, error: "nonce required" }, { status: 400 });
    }

    // Check if nonce exists and is valid
    try {
      const result = await pool.query(
        `SELECT user_id, expires_at, used FROM telegram_auth_nonces WHERE nonce = $1`,
        [nonce]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ success: false, status: "pending" });
      }

      const row = result.rows[0];

      if (row.used) {
        return NextResponse.json({ success: false, status: "used" });
      }

      if (new Date(row.expires_at) < new Date()) {
        return NextResponse.json({ success: false, status: "expired" });
      }

      // Mark as used
      await pool.query(
        `UPDATE telegram_auth_nonces SET used = TRUE WHERE nonce = $1`,
        [nonce]
      );

      // Set session cookie
      const response = NextResponse.json({
        success: true,
        data: { userId: row.user_id },
      });

      response.cookies.set("session", row.user_id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 3 * 60 * 60,
        path: "/",
      });

      return response;
    } catch {
      // Table might not exist yet — that's fine, means no auth attempts
      return NextResponse.json({ success: false, status: "pending" });
    }
  } catch {
    return NextResponse.json({ success: false, error: "Ошибка сервера" }, { status: 500 });
  }
}
