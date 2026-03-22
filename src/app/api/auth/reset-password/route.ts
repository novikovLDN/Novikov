import { NextRequest, NextResponse } from "next/server";
import { verifyCode, resetUserPassword, getUserByEmail } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const { email, code, password } = await request.json();

    if (!email || !code || !password) {
      return NextResponse.json(
        { success: false, error: "Все поля обязательны" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Пароль должен содержать минимум 6 символов" },
        { status: 400 }
      );
    }

    if (password.length > 128) {
      return NextResponse.json(
        { success: false, error: "Пароль слишком длинный" },
        { status: 400 }
      );
    }

    // Check user exists
    const user = await getUserByEmail(normalizedEmail);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    // Verify the OTP code
    const result = verifyCode(normalizedEmail, code);
    if (!result.valid) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Reset the password
    const ok = await resetUserPassword(normalizedEmail, password);
    if (!ok) {
      return NextResponse.json(
        { success: false, error: "Не удалось сменить пароль" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
