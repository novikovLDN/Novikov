import { NextRequest, NextResponse } from "next/server";
import { updateUser, createAuditLog } from "@/lib/store";
import { getSessionUser } from "@/lib/session";
import { generateTelegramLinkToken } from "@/lib/tokens";

export async function POST(request: NextRequest) {
  try {
    const auth = await getSessionUser(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: "Не авторизован" }, { status: 401 });
    }
    const user = auth.user;

    if (!user.telegramLinked) {
      return NextResponse.json({ success: false, error: "Telegram не привязан" }, { status: 400 });
    }

    const newToken = generateTelegramLinkToken();
    const oldTelegramId = user.telegramId;

    await updateUser(user.id, {
      telegramId: null,
      telegramLinked: false,
      telegramLinkToken: newToken,
    });

    await createAuditLog("telegram.unlink", `TG:${oldTelegramId} unlinked from site`, user.id, user.email);

    return NextResponse.json({ success: true, data: { telegramLinkToken: newToken } });
  } catch {
    return NextResponse.json({ success: false, error: "Ошибка сервера" }, { status: 500 });
  }
}
