import { NextRequest, NextResponse } from "next/server";
import { getUserById, regenerateUserKey, checkRegenLimit } from "@/lib/store";
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

    // Check regeneration limit
    const limit = await checkRegenLimit(user.id);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Вы исчерпали лимит обновлений ключа (2 за 48 часов).",
          resetAt: limit.resetAt,
        },
        { status: 429 }
      );
    }

    // Remove old UUID from Xray server
    if (user.xrayUuid) {
      await xrayRemoveUser(user.xrayUuid);
    }

    const result = await regenerateUserKey(user.id);

    if (result.limitExceeded) {
      return NextResponse.json(
        {
          success: false,
          error: "Вы исчерпали лимит обновлений ключа (2 за 48 часов).",
          resetAt: result.resetAt,
        },
        { status: 429 }
      );
    }

    // Add new UUID to Xray server
    if (result.user?.xrayUuid) {
      const added = await xrayAddUser(result.user.xrayUuid);
      if (!added) {
        console.error(`[VPN] Failed to add new key to Xray: ${user.email}`);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        vpnKey: result.user?.vpnKey,
        xrayUuid: result.user?.xrayUuid,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
