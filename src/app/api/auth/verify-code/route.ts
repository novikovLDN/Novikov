import { NextRequest, NextResponse } from "next/server";
import { verifyCode, getOrCreateUser } from "@/lib/store";

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
    const user = getOrCreateUser(email.toLowerCase(), referralCode || undefined);

    // TODO: Add user to Xray server via xray.ts API client
    // const xrayClient = createXrayApiClient();
    // await xrayClient.addUser("vless-inbound", user.xrayUuid!, user.email);

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
