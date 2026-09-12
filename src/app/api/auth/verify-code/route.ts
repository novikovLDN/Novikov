import { NextRequest, NextResponse } from "next/server";
import { completeEmailSignIn } from "@/lib/auth-flow";

/**
 * JSON variant of the email sign-in. Delegates to the same shared
 * function as the server action (src/app/actions.ts), so there is one
 * trial path with one set of anti-abuse checks.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, code, referralCode, fingerprint } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ success: false, error: "Email и код обязательны" }, { status: 400 });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null;
    const result = await completeEmailSignIn({
      email: String(email),
      code: String(code),
      referralCode: referralCode ? String(referralCode) : undefined,
      fingerprint: fingerprint ? String(fingerprint) : undefined,
      ip,
    });
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
    const user = result.user;

    const response = NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        subscriptionEnd: user.subscriptionEnd,
        // Legacy field names kept for old clients; both carry the panel link.
        vpnKey: user.subscriptionUrl,
        subscriptionUrl: user.subscriptionUrl,
        xrayUuid: null,
        isNew: user.isNew,
        trialGranted: user.trialGranted,
      },
    });

    response.cookies.set("session", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3 * 60 * 60, // 3 hours
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[AUTH] verify-code failed:", err);
    return NextResponse.json({ success: false, error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
