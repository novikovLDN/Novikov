import { NextRequest, NextResponse } from "next/server";
import { getUserByTelegramId, updateUser, createNotificationForUser, createAuditLog } from "@/lib/store";
import { xrayAddUser } from "@/lib/xray";
import { verifyBotApiKey, unauthorizedResponse } from "../auth";

/**
 * POST /api/bot/sync
 *
 * Actions:
 * - "overwrite_site": Bot's subscription overwrites site data
 * - "update_key": Updates only vpnKey and xrayUuid on site
 *
 * IMPORTANT: vpnKey and xrayUuid must be actual string values,
 * not booleans (True/False). Boolean values are ignored.
 */
export async function POST(request: NextRequest) {
  if (!verifyBotApiKey(request)) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { telegramId, action } = body;

    if (!telegramId || !action) {
      return NextResponse.json({ success: false, error: "telegramId and action required" }, { status: 400 });
    }

    const user = await getUserByTelegramId(String(telegramId));
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found. Link Telegram first." }, { status: 404 });
    }

    // Validate: vpnKey and xrayUuid must be strings, not booleans
    const vpnKey = typeof body.vpnKey === "string" && body.vpnKey.length > 5 ? body.vpnKey : null;
    const xrayUuid = typeof body.xrayUuid === "string" && body.xrayUuid.length > 5 ? body.xrayUuid : null;
    const plan = typeof body.plan === "string" ? body.plan : null;
    const subscriptionEnd = body.subscriptionEnd ? new Date(body.subscriptionEnd) : null;

    console.log(`[SYNC] action=${action} user=${user.email} vpnKey=${vpnKey ? "string" : "null"} xrayUuid=${xrayUuid ? "string" : "null"} plan=${plan} end=${subscriptionEnd}`);

    if (action === "overwrite_site") {
      if (!subscriptionEnd || isNaN(subscriptionEnd.getTime())) {
        return NextResponse.json({ success: false, error: "Valid subscriptionEnd required" }, { status: 400 });
      }

      const updates: Record<string, unknown> = {
        subscriptionEnd: subscriptionEnd.toISOString(),
      };

      if (plan && ["trial", "basic", "plus"].includes(plan)) {
        updates.subscriptionPlan = plan;
      }

      if (vpnKey) updates.vpnKey = vpnKey;
      if (xrayUuid) {
        updates.xrayUuid = xrayUuid;
        await xrayAddUser(xrayUuid).catch((err) => {
          console.error(`[SYNC] Failed to add UUID to Xray: ${xrayUuid}`, err);
        });
      }

      await updateUser(user.id, updates);
      await createAuditLog(
        "sync.overwrite",
        `Bot → Site: plan=${plan}, end=${subscriptionEnd.toISOString()}, hasKey=${!!vpnKey}, hasUuid=${!!xrayUuid}`,
        user.id,
        user.email
      );

      // Notify user on site
      await createNotificationForUser(
        user.id,
        "Подписка синхронизирована",
        "Данные подписки обновлены из Telegram-бота."
      ).catch(() => {});

      // Re-read user to return actual current state
      const updated = await getUserByTelegramId(String(telegramId));

      return NextResponse.json({
        success: true,
        data: {
          userId: user.id,
          email: user.email,
          subscriptionEnd: updated?.subscriptionEnd || subscriptionEnd.toISOString(),
          subscriptionPlan: updated?.subscriptionPlan || plan,
          vpnKey: updated?.vpnKey || vpnKey,
          xrayUuid: updated?.xrayUuid || xrayUuid,
          telegramLinked: true,
        },
      });
    }

    if (action === "update_key") {
      if (!vpnKey && !xrayUuid) {
        return NextResponse.json({ success: false, error: "vpnKey (string) or xrayUuid (string) required. Boolean values not accepted." }, { status: 400 });
      }

      const updates: Record<string, unknown> = {};
      if (vpnKey) updates.vpnKey = vpnKey;
      if (xrayUuid) {
        updates.xrayUuid = xrayUuid;
        await xrayAddUser(xrayUuid).catch(() => {});
      }

      await updateUser(user.id, updates);
      await createAuditLog("sync.update_key", `Bot → Site: key=${!!vpnKey} uuid=${!!xrayUuid}`, user.id, user.email);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Unknown action. Use: overwrite_site, update_key" }, { status: 400 });
  } catch (err) {
    console.error("[SYNC] Error:", err);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
