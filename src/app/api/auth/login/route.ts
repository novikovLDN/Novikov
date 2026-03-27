import { NextRequest, NextResponse } from "next/server";
import { verifyUserPassword } from "@/lib/store";
import { rateLimitLogin } from "@/lib/rate-limit";

const SESSION_MAX_AGE = 3 * 60 * 60; // 3 hours

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 login attempts per 15 minutes per IP
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip") || "unknown";
    const limit = rateLimitLogin(clientIp);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: `Слишком много попыток. Повторите через ${limit.retryAfterSeconds} сек.` },
        { status: 429 }
      );
    }

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
      data: { userId: user.id, email: user.email },
    });

    response.cookies.set("session", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
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
