import { NextRequest, NextResponse } from "next/server";
import { getUserById } from "@/lib/store";
import { generatePasskeyRegistration, verifyPasskeyRegistration } from "@/lib/passkey";

// GET — generate registration options
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("session")?.value;
    if (!sessionId) return NextResponse.json({ success: false, error: "Не авторизован" }, { status: 401 });

    const user = await getUserById(sessionId);
    if (!user) return NextResponse.json({ success: false, error: "Пользователь не найден" }, { status: 404 });

    const options = await generatePasskeyRegistration(user.id, user.email);
    return NextResponse.json({ success: true, data: options });
  } catch (err) {
    console.error("[PASSKEY] Register options error:", err);
    return NextResponse.json({ success: false, error: "Ошибка сервера" }, { status: 500 });
  }
}

// POST — verify registration response
export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("session")?.value;
    if (!sessionId) return NextResponse.json({ success: false, error: "Не авторизован" }, { status: 401 });

    const user = await getUserById(sessionId);
    if (!user) return NextResponse.json({ success: false, error: "Пользователь не найден" }, { status: 404 });

    const body = await request.json();
    const result = await verifyPasskeyRegistration(user.id, body);

    return NextResponse.json({ success: result.verified });
  } catch (err) {
    console.error("[PASSKEY] Register verify error:", err);
    return NextResponse.json({ success: false, error: "Не удалось зарегистрировать ключ" }, { status: 400 });
  }
}
