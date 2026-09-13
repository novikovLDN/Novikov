import { NextRequest, NextResponse } from "next/server";
import { setUserPassword, verifyUserPassword } from "@/lib/store";
import { getSessionUser } from "@/lib/session";
import { revokeAllSessions } from "@/lib/session-store";
import { rateLimitLoginEmail } from "@/lib/rate-limit";

/**
 * A session that has just been opened by a code from the email is proof
 * of owning the mailbox — the "set a password after sign-in" step runs
 * inside this window. Later, REPLACING an existing password needs the
 * current one: a stolen session alone must not be able to lock the
 * owner out.
 */
const FRESH_SESSION_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const auth = await getSessionUser(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Не авторизован" },
        { status: 401 }
      );
    }
    const user = auth.user;

    const body = await request.json().catch(() => null);
    const password = body?.password;
    const currentPassword = body?.currentPassword;

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Пароль должен содержать минимум 8 символов" },
        { status: 400 }
      );
    }

    if (password.length > 128) {
      return NextResponse.json(
        { success: false, error: "Пароль слишком длинный" },
        { status: 400 }
      );
    }

    // Check complexity: at least one letter and one digit
    if (!/[a-zA-Zа-яА-Я]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { success: false, error: "Пароль должен содержать буквы и цифры" },
        { status: 400 }
      );
    }

    // Block common weak passwords
    const weak = ["12345678", "password", "qwerty12", "00000000", "11111111", "123456789", "qwertyui"];
    if (weak.includes(password.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: "Слишком простой пароль. Придумайте другой." },
        { status: 400 }
      );
    }

    const sessionAge = Date.now() - auth.session.createdAt.getTime();
    if (user.passwordHash && sessionAge > FRESH_SESSION_MS) {
      const limit = rateLimitLoginEmail(user.email);
      if (!limit.allowed) {
        return NextResponse.json(
          { success: false, error: `Слишком много попыток. Повторите через ${limit.retryAfterSeconds} сек.` },
          { status: 429 }
        );
      }
      const ok = typeof currentPassword === "string" && currentPassword.length > 0 && !!(await verifyUserPassword(user.email, currentPassword));
      if (!ok) {
        return NextResponse.json(
          { success: false, error: "Введите текущий пароль или смените его через «Забыли пароль?»", code: "current_password_required" },
          { status: 403 }
        );
      }
    }

    const ok = await setUserPassword(user.id, password);
    if (!ok) {
      return NextResponse.json(
        { success: false, error: "Не удалось сохранить пароль" },
        { status: 500 }
      );
    }

    // New password → every OTHER session of this account is signed out.
    await revokeAllSessions(user.id, auth.session.id).catch((err) =>
      console.error("[SET-PASSWORD] could not revoke other sessions:", err instanceof Error ? err.message : err)
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[SET-PASSWORD] Error:", err);
    return NextResponse.json(
      { success: false, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
