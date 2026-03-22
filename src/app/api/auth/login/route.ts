import { NextRequest, NextResponse } from "next/server";
import { verifyUserPassword } from "@/lib/store";

const SESSION_MAX_AGE = 3 * 60 * 60; // 3 hours

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email и пароль обязательны" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await verifyUserPassword(normalizedEmail, password);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Неверный email или пароль" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
      },
    });

    response.cookies.set("session", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
