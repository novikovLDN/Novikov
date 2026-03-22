import { NextRequest, NextResponse } from "next/server";
import { getUserById, regenerateUserKey } from "@/lib/store";

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

    // TODO: Remove old UUID from Xray server
    // const xrayClient = createXrayApiClient();
    // await xrayClient.removeUser("vless-inbound", user.email);

    const updated = regenerateUserKey(user.id);

    // TODO: Add new UUID to Xray server
    // await xrayClient.addUser("vless-inbound", updated.xrayUuid!, updated.email);

    return NextResponse.json({
      success: true,
      data: {
        vpnKey: updated?.vpnKey,
        xrayUuid: updated?.xrayUuid,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
