import { NextRequest, NextResponse } from "next/server";
import { getUserById } from "@/lib/store";
import { buildAllServerUris } from "@/lib/xray";

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("session")?.value;
    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Не авторизован" }, { status: 401 });
    }

    const user = await getUserById(sessionId);
    if (!user) {
      return NextResponse.json({ success: false, error: "Пользователь не найден" }, { status: 404 });
    }

    if (!user.xrayUuid) {
      return NextResponse.json({ success: false, error: "Нет активной подписки" }, { status: 403 });
    }

    const now = new Date();
    const end = new Date(user.subscriptionEnd);
    if (now >= end) {
      return NextResponse.json({ success: false, error: "Подписка истекла" }, { status: 403 });
    }

    const uris = buildAllServerUris(user.xrayUuid);

    return NextResponse.json({
      success: true,
      data: { uris },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Ошибка сервера" }, { status: 500 });
  }
}
