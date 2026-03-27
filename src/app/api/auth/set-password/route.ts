import { NextRequest, NextResponse } from "next/server";
import { getUserById, setUserPassword } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("session")?.value;
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Не авторизован" },
        { status: 401 }
      );
    }

    const user = await getUserById(sessionId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    const { password } = await request.json();

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

    const ok = await setUserPassword(user.id, password);
    if (!ok) {
      return NextResponse.json(
        { success: false, error: "Не удалось сохранить пароль" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[SET-PASSWORD] Error:", err);
    return NextResponse.json(
      { success: false, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
