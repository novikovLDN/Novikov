import { NextRequest, NextResponse } from "next/server";
import { getUserById, updateUser } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("session")?.value;
    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Не авторизован" }, { status: 401 });
    }

    const user = await getUserById(sessionId);
    if (!user) {
      return NextResponse.json({ success: false, error: "Пользователь не найден" }, { status: 404 });
    }

    if (!user.telegramLinked) {
      return NextResponse.json({ success: false, error: "Telegram не привязан" }, { status: 400 });
    }

    // Generate a new link token so user can re-link later
    const crypto = require("crypto");
    const newToken = crypto.randomBytes(8).toString("hex");

    await updateUser(user.id, {
      telegramId: null,
      telegramLinked: false,
      telegramLinkToken: newToken,
    });

    return NextResponse.json({ success: true, data: { telegramLinkToken: newToken } });
  } catch {
    return NextResponse.json({ success: false, error: "Ошибка сервера" }, { status: 500 });
  }
}
