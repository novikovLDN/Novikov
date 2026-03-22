import { NextRequest, NextResponse } from "next/server";
import { verifyCode, getOrCreateUser } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: "Email и код обязательны" },
        { status: 400 }
      );
    }

    const isValid = verifyCode(email.toLowerCase(), code);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Неверный или просроченный код" },
        { status: 400 }
      );
    }

    // Create user with trial period or return existing
    const user = getOrCreateUser(email.toLowerCase());

    const response = NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        subscriptionEnd: user.subscriptionEnd,
        vpnKey: user.vpnKey,
        isNewUser: !user.vpnKey,
      },
    });

    // Set a simple session cookie
    response.cookies.set("session", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
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
