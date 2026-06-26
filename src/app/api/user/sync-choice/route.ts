import { NextRequest, NextResponse } from "next/server";
import { getUserById, updateUser, createAuditLog } from "@/lib/store";
import { xrayAddUser } from "@/lib/xray";

/**
 * POST /api/user/sync-choice
 *
 * When user links Telegram and has active subscriptions in both places,
 * they choose which key/subscription to keep.
 *
 * Body: { choice: "site" | "telegram", telegramVpnKey?, telegramXrayUuid?, telegramSubscriptionEnd?, telegramPlan? }
 *
 * choice = "site": keep site data, bot should pull from /api/bot/status
 * choice = "telegram": overwrite site with bot data
 */
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

    const { choice, telegramVpnKey, telegramXrayUuid, telegramSubscriptionEnd, telegramPlan } = await request.json();

    if (choice === "site") {
      // Keep site data — nothing to change on site side
      // Bot will pull from /api/bot/status and update itself
      await createAuditLog("sync.choice", "User chose: keep site key", user.id, user.email);
      return NextResponse.json({
        success: true,
        data: {
          kept: "site",
          vpnKey: user.vpnKey,
          subscriptionEnd: user.subscriptionEnd,
          subscriptionPlan: user.subscriptionPlan,
        },
      });
    }

    if (choice === "telegram") {
      // Overwrite site with Telegram bot data
      const updates: Record<string, unknown> = {};

      if (telegramVpnKey) updates.vpnKey = telegramVpnKey;
      if (telegramXrayUuid) {
        updates.xrayUuid = telegramXrayUuid;
        await xrayAddUser(telegramXrayUuid).catch(() => {});
      }
      if (telegramSubscriptionEnd) {
        const ts = new Date(telegramSubscriptionEnd).getTime();
        const maxAhead = Date.now() + 400 * 24 * 60 * 60 * 1000;
        if (!Number.isFinite(ts) || ts > maxAhead) {
          console.warn(`[SYNC-CHOICE] REJECTED: ${user.email} telegramSubscriptionEnd=${telegramSubscriptionEnd}`);
          return NextResponse.json(
            { success: false, error: "telegramSubscriptionEnd out of range", code: "sub_end_too_far" },
            { status: 400 }
          );
        }
        updates.subscriptionEnd = new Date(ts).toISOString();
      }
      if (telegramPlan) updates.subscriptionPlan = telegramPlan;

      if (Object.keys(updates).length > 0) {
        await updateUser(user.id, updates);
      }

      await createAuditLog("sync.choice", "User chose: keep Telegram key", user.id, user.email);
      return NextResponse.json({
        success: true,
        data: {
          kept: "telegram",
          vpnKey: telegramVpnKey || user.vpnKey,
          subscriptionEnd: telegramSubscriptionEnd || user.subscriptionEnd,
          subscriptionPlan: telegramPlan || user.subscriptionPlan,
        },
      });
    }

    return NextResponse.json({ success: false, error: "Invalid choice" }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: "Ошибка сервера" }, { status: 500 });
  }
}
