import { NextRequest, NextResponse } from "next/server";
import { generatePasskeyAuthentication, verifyPasskeyAuthentication } from "@/lib/passkey";

// GET — generate authentication options
export async function GET() {
  try {
    const options = await generatePasskeyAuthentication();
    return NextResponse.json({ success: true, data: options });
  } catch (err) {
    console.error("[PASSKEY] Login options error:", err);
    return NextResponse.json({ success: false, error: "Ошибка сервера" }, { status: 500 });
  }
}

// POST — verify authentication response
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await verifyPasskeyAuthentication(body);

    if (!result.verified || !result.userId) {
      return NextResponse.json({ success: false, error: "Ключ не распознан" }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      data: { userId: result.userId },
    });

    response.cookies.set("session", result.userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[PASSKEY] Login verify error:", err);
    return NextResponse.json({ success: false, error: "Ошибка авторизации" }, { status: 400 });
  }
}
