import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getUserById, createNotificationForUser, createAuditLog } from "@/lib/store";
import { verifyAdmin } from "../../middleware";
import { rotatePanelSubscription, syncUserToPanel } from "@/lib/subscription-sync";
import { applySubscriptionEvent, withTransaction } from "@/lib/subscription-ledger";

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

      // Ledger: extend from max(now, current end); each grant is its own event.
      const led = await withTransaction((c) =>
        applySubscriptionEvent(c, {
          userId,
          kind: "admin_grant",
          sourceId: uuidv4(),
          extendMs: minutes * 60 * 1000,
          plan,
          actor: "admin",
          meta: { duration },
        })
      );
      const sync = await syncUserToPanel(userId);
      if (!sync.ok) console.warn(`[ADMIN-GRANT] ${user.email}: panel sync deferred — ${sync.reason} ${sync.panelError ?? ""}`);

      const planLabel = plan === "plus" ? "Plus" : "Basic";
      await createNotificationForUser(
        userId,
        "Подписка активирована",
        `Вам выдана подписка ${planLabel} на ${formatDuration(duration)}. Приятного пользования!`
      );
      await createAuditLog("admin.grant", `${planLabel} на ${formatDuration(duration)}`, userId, user.email);

      return NextResponse.json({
        success: true,
        data: { newEnd: led.newEnd.toISOString(), plan, panelSynced: sync.ok, panelError: sync.ok ? undefined : sync.panelError },
      });
    }

    if (action === "revoke-subscription") {
      // Local end = now through the ledger; the sync then DISABLES the
      // panel user (its expireAt is still in the future). No grace period.
      await withTransaction((c) =>
        applySubscriptionEvent(c, {
          userId,
          kind: "admin_revoke",
          sourceId: uuidv4(),
          setEnd: new Date(),
          plan: "trial",
          actor: "admin",
        })
      );
      const sync = await syncUserToPanel(userId);
      if (!sync.ok) console.warn(`[ADMIN-REVOKE] ${user.email}: panel disable deferred — ${sync.reason} ${sync.panelError ?? ""}`);

      await createNotificationForUser(
        userId,
        "Подписка деактивирована",
        "Ваша подписка была деактивирована администратором. Ключ удалён."
      );
      await createAuditLog("admin.revoke", `Подписка отозвана (panel: ${sync.action})`, userId, user.email);
      return NextResponse.json({ success: true, data: { panelAction: sync.action, panelSynced: sync.ok, panelError: sync.ok ? undefined : sync.panelError } });
    }

    if (action === "regen-key") {
      // New subscription link in the panel: old URL and old keys stop working.
      const r = await rotatePanelSubscription(userId);
      if (!r.ok) {
        return NextResponse.json({ success: false, error: `Не удалось обновить ключ: ${r.error}` }, { status: 502 });
      }
      await createAuditLog("admin.regen", "Ссылка подписки перевыпущена администратором", userId, user.email);
      return NextResponse.json({ success: true, data: { vpnKey: r.subscriptionUrl, subscriptionUrl: r.subscriptionUrl } });
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
