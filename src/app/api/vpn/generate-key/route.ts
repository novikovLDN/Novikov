import { NextRequest, NextResponse } from "next/server";
import { getUserById, regenerateUserKey } from "@/lib/store";
import { xrayAddUser, xrayRemoveUser } from "@/lib/xray";

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("session")?.value;
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Не авторизован" },
        { status: 401 }
      );
    }

    const user = await getUserById(sessionId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    // Block key regeneration if subscription expired
    const now = new Date();
    const end = new Date(user.subscriptionEnd);
    if (now >= end) {
      return NextResponse.json(
        { success: false, error: "Подписка истекла. Продлите подписку для генерации нового ключа." },
        { status: 403 }
      );
    }

    // Remove old UUID from Xray server
    if (user.xrayUuid) {
      await xrayRemoveUser(user.xrayUuid);
    }

    const updated = await regenerateUserKey(user.id);

    // Add new UUID to Xray server
    if (updated?.xrayUuid) {
      const added = await xrayAddUser(updated.xrayUuid);
      if (!added) {
        console.error(`[VPN] Failed to add new key to Xray: ${user.email}`);
      }
    }

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
