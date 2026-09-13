import { NextRequest, NextResponse } from "next/server";
import { verifyCode, resetUserPassword, getUserByEmail } from "@/lib/store";
import { consumeResetToken } from "@/lib/reset-tokens";

/**
 * POST /api/auth/reset-password — новый пароль.
 *
 * Основной путь: `resetToken` из `/api/auth/reset-password/verify`
 * (код уже проверен сервером, токен одноразовый и привязан к почте).
 * Запасной путь для вкладок, открытых до обновления: `code` —
 * проверяется здесь же. Без одного из них пароль не меняется.
 *
 * Ответы нейтральные: по форме сброса нельзя узнать, зарегистрирована
 * ли почта.
 */
const FAIL = "Не удалось сменить пароль. Запросите новый код и попробуйте ещё раз.";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = body?.password;
    const resetToken = typeof body?.resetToken === "string" ? body.resetToken : "";
    const code = typeof body?.code === "string" ? body.code : "";

    if (!email || !password || (!resetToken && !code)) {
      return NextResponse.json({ success: false, error: "Все поля обязательны" }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ success: false, error: "Пароль должен содержать минимум 6 символов" }, { status: 400 });
    }
    if (password.length > 128) {
      return NextResponse.json({ success: false, error: "Пароль слишком длинный" }, { status: 400 });
    }

    // Сначала — доказательство владения почтой (токен или код), потом
    // всё остальное: до проверки ничего не раскрываем.
    if (resetToken) {
      if (!consumeResetToken(resetToken, email)) {
        return NextResponse.json({ success: false, error: FAIL }, { status: 400 });
      }
    } else {
      const result = verifyCode(email, code);
      if (!result.valid) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ success: false, error: FAIL }, { status: 400 });
    }

    const ok = await resetUserPassword(email, password);
    if (!ok) {
      return NextResponse.json({ success: false, error: FAIL }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
