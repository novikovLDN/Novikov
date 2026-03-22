import { NextRequest, NextResponse } from "next/server";
import { verifyCode, getOrCreateUser } from "@/lib/store";
import { xrayAddUser } from "@/lib/xray";

export async function POST(request: NextRequest) {
  try {
    const { email, code, referralCode } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: "Email и код обязательны" },
        { status: 400 }
      );
    }

    const result = verifyCode(email.toLowerCase(), code);
    if (!result.valid) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Create user with trial period or return existing
    // If referral code provided, link it
    const user = await getOrCreateUser(email.toLowerCase(), referralCode || undefined);

    // Only add to Xray for newly created users (not on repeat login)
    if (user.isNew && user.xrayUuid) {
      xrayAddUser(user.xrayUuid).catch(() => {
        console.error(`[AUTH] Failed to add user to Xray: ${user.email}`);
      });
    }

    const response = NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        subscriptionEnd: user.subscriptionEnd,
        vpnKey: user.vpnKey,
        xrayUuid: user.xrayUuid,
      },
    });

    response.cookies.set("session", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3 * 60 * 60, // 3 hours
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
