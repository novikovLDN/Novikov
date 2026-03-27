import { NextRequest, NextResponse } from "next/server";
import { getUserById, updateUser, createNotificationForUser, createAuditLog, regenerateUserKey } from "@/lib/store";
import { generateXrayUuid, generateSubToken, generateSubId, buildSubscriptionUrl, xrayRemoveUser, xrayAddUser } from "@/lib/xray";
import { verifyAdmin } from "../../middleware";

// Duration presets in minutes
const DURATION_MAP: Record<string, number> = {
  "30m": 30,
  "1h": 60,
  "12h": 720,
  "24h": 1440,
  "3d": 4320,
  "7d": 10080,
  "14d": 20160,
  "30d": 43200,
  "60d": 86400,
  "180d": 259200,
  "365d": 525600,
};

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
  }

  try {
    const { action, userId, plan, duration, title, message } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId обязателен" }, { status: 400 });
    }

    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: "Пользователь не найден" }, { status: 404 });
    }

    if (action === "grant-subscription") {
      if (!plan || !duration) {
        return NextResponse.json({ success: false, error: "Укажите тариф и срок" }, { status: 400 });
      }

      const minutes = DURATION_MAP[duration];
      if (!minutes) {
        return NextResponse.json({ success: false, error: "Неверный срок" }, { status: 400 });
      }

      if (!["basic", "plus"].includes(plan)) {
        return NextResponse.json({ success: false, error: "Неверный тариф" }, { status: 400 });
      }

      // Extend subscription from now or from current end (whichever is later)
      const now = new Date();
      const currentEnd = new Date(user.subscriptionEnd);
      const base = currentEnd > now ? currentEnd : now;
      const newEnd = new Date(base.getTime() + minutes * 60 * 1000);

      // If user has no VPN key, regenerate
      const updates: Record<string, unknown> = {
        subscriptionEnd: newEnd.toISOString(),
        subscriptionPlan: plan,
      };

      if (!user.xrayUuid) {
        const newUuid = generateXrayUuid();
        const newSubToken = generateSubToken();
        const subId = user.subId || generateSubId(user.email);
        const newKey = buildSubscriptionUrl(newSubToken, subId);
        updates.xrayUuid = newUuid;
        updates.vpnKey = newKey;
        updates.subToken = newSubToken;
        updates.subId = subId;

        // Add UUID to Xray server
        const added = await xrayAddUser(newUuid);
        if (!added) {
          console.error(`[ADMIN] Failed to add UUID to Xray: ${newUuid} for ${user.email}`);
        }
      }

      await updateUser(userId, updates);

      // Send notification to user
      const planLabel = plan === "plus" ? "Plus" : "Basic";
      await createNotificationForUser(
        userId,
        "Подписка активирована",
        `Вам выдана подписка ${planLabel} на ${formatDuration(duration)}. Приятного пользования!`
      );

      await createAuditLog("admin.grant", `${planLabel} на ${formatDuration(duration)}`, userId, user.email);

      return NextResponse.json({ success: true, data: { newEnd: newEnd.toISOString(), plan } });
    }

    if (action === "revoke-subscription") {
      // Remove from Xray server
      if (user.xrayUuid) {
        try {
          await xrayRemoveUser(user.xrayUuid);
        } catch (err) {
          console.error(`[ADMIN] Failed to remove user from Xray: ${user.xrayUuid}`, err);
        }
      }

      // Set subscription to now (expired), clear VPN key, reset plan
      await updateUser(userId, {
        subscriptionEnd: new Date().toISOString(),
        subscriptionPlan: "trial",
        xrayUuid: null,
        vpnKey: null,
      });

      await createNotificationForUser(
        userId,
        "Подписка деактивирована",
        "Ваша подписка была деактивирована администратором. VPN-ключ удалён."
      );

      await createAuditLog("admin.revoke", "Подписка отозвана", userId, user.email);
      console.log(`[ADMIN] Revoked subscription for ${user.email}`);
      return NextResponse.json({ success: true });
    }

    if (action === "regen-key") {
      const result = await regenerateUserKey(userId);
      if (result.limitExceeded) {
        return NextResponse.json({ success: false, error: `Лимит обновлений. Сброс: ${result.resetAt}` }, { status: 429 });
      }
      if (!result.user) {
        return NextResponse.json({ success: false, error: "Не удалось обновить ключ" }, { status: 500 });
      }
      // Add new UUID to Xray
      if (result.user.xrayUuid) {
        await xrayAddUser(result.user.xrayUuid);
      }
      await createAuditLog("admin.regen", "Ключ обновлён администратором", userId, user.email);
      return NextResponse.json({ success: true, data: { vpnKey: result.user.vpnKey } });
    }

    if (action === "send-notification") {
      if (!title?.trim() || !message?.trim()) {
        return NextResponse.json({ success: false, error: "Укажите заголовок и сообщение" }, { status: 400 });
      }

      await createNotificationForUser(userId, title.trim(), message.trim());
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Неизвестное действие" }, { status: 400 });
  } catch (err) {
    console.error("[ADMIN] Manage user error:", err);
    return NextResponse.json({ success: false, error: "Внутренняя ошибка" }, { status: 500 });
  }
}

function formatDuration(key: string): string {
  const map: Record<string, string> = {
    "30m": "30 минут",
    "1h": "1 час",
    "12h": "12 часов",
    "24h": "24 часа",
    "3d": "3 дня",
    "7d": "7 дней",
    "14d": "14 дней",
    "30d": "30 дней",
    "60d": "60 дней",
    "180d": "180 дней",
    "365d": "365 дней",
  };
  return map[key] || key;
}
