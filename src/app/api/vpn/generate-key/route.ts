import { NextRequest, NextResponse } from "next/server";
import { getUserById, updateUser } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("session")?.value;
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Не авторизован" },
        { status: 401 }
      );
    }

    const user = getUserById(sessionId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    // Generate new VPN key (reset)
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const segments = [];
    for (let s = 0; s < 4; s++) {
      let segment = "";
      for (let i = 0; i < 8; i++) {
        segment += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      segments.push(segment);
    }
    const newKey = `vless://${segments.join("-")}@atlas-secure.vpn`;

    const updated = updateUser(user.id, { vpnKey: newKey });

    return NextResponse.json({
      success: true,
      data: { vpnKey: updated?.vpnKey },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
