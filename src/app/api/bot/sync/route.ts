import { NextRequest, NextResponse } from "next/server";
import { getUserByTelegramId, getUserById, updateUser, createNotificationForUser, createAuditLog } from "@/lib/store";
import { xrayAddUser } from "@/lib/xray";
import { verifyBotApiKey, unauthorizedResponse } from "../auth";

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

    // Validate string fields — reject booleans from Python
    const vpnKey = typeof body.vpnKey === "string" && body.vpnKey.length > 5 ? body.vpnKey : null;
    const xrayUuid = typeof body.xrayUuid === "string" && body.xrayUuid.length > 5 ? body.xrayUuid : null;
    const plan = typeof body.plan === "string" ? body.plan : null;
    const subscriptionEnd = body.subscriptionEnd ? new Date(body.subscriptionEnd) : null;

    console.log(`[SYNC] action=${action} userId=${user.id} email=${user.email} telegramId=${telegramId}`);
    console.log(`[SYNC] received: vpnKey=${vpnKey ? vpnKey.slice(0, 30) + "..." : "null"} xrayUuid=${xrayUuid ? xrayUuid.slice(0, 20) + "..." : "null"} plan=${plan} end=${subscriptionEnd?.toISOString() || "null"}`);

    if (action === "overwrite_site") {
      if (!subscriptionEnd || isNaN(subscriptionEnd.getTime())) {
        return NextResponse.json({ success: false, error: "Valid subscriptionEnd required" }, { status: 400 });
      }

      // Build updates object with correct UserRecord field names
      const updates: Record<string, unknown> = {
        subscriptionEnd: subscriptionEnd.toISOString(),
      };

      if (plan && ["trial", "basic", "plus"].includes(plan)) {
        updates.subscriptionPlan = plan;
      }
      if (vpnKey) updates.vpnKey = vpnKey;
      if (xrayUuid) {
        updates.xrayUuid = xrayUuid;
        const added = await xrayAddUser(xrayUuid);
        console.log(`[SYNC] xrayAddUser(${xrayUuid.slice(0, 20)}): ${added}`);
      }

      console.log(`[SYNC] updateUser(${user.id}): ${JSON.stringify(Object.keys(updates))}`);

      const updated = await updateUser(user.id, updates);

      if (!updated) {
        console.error(`[SYNC] updateUser returned null for userId=${user.id}`);
        return NextResponse.json({ success: false, error: "Failed to update user" }, { status: 500 });
      }

      console.log(`[SYNC] AFTER UPDATE: vpnKey=${updated.vpnKey?.slice(0, 30) || "null"} xrayUuid=${updated.xrayUuid?.slice(0, 20) || "null"} plan=${updated.subscriptionPlan} end=${updated.subscriptionEnd}`);

      await createAuditLog(
        "sync.overwrite",
        `Bot→Site: plan=${plan}, end=${subscriptionEnd.toISOString()}, key=${!!vpnKey}, uuid=${!!xrayUuid}`,
        user.id, user.email
      );

      await createNotificationForUser(user.id, "Подписка синхронизирована", "Данные подписки обновлены из Telegram-бота.").catch(() => {});

      return NextResponse.json({
        success: true,
        data: {
          userId: updated.id,
          email: updated.email,
          subscriptionEnd: updated.subscriptionEnd,
          subscriptionPlan: updated.subscriptionPlan,
          vpnKey: updated.vpnKey,
          xrayUuid: updated.xrayUuid,
          telegramLinked: updated.telegramLinked,
        },
      });
    }

    if (action === "update_key") {
      if (!vpnKey && !xrayUuid) {
        return NextResponse.json({ success: false, error: "vpnKey or xrayUuid (string) required" }, { status: 400 });
      }

      const updates: Record<string, unknown> = {};
      if (vpnKey) updates.vpnKey = vpnKey;
      if (xrayUuid) {
        updates.xrayUuid = xrayUuid;
        await xrayAddUser(xrayUuid).catch(() => {});
      }

      const updated = await updateUser(user.id, updates);
      await createAuditLog("sync.update_key", `Bot→Site: key=${!!vpnKey} uuid=${!!xrayUuid}`, user.id, user.email);

      return NextResponse.json({
        success: true,
        data: {
          vpnKey: updated?.vpnKey,
          xrayUuid: updated?.xrayUuid,
        },
      });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[SYNC] Error:", err);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
