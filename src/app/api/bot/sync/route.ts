import { NextRequest, NextResponse } from "next/server";
import { getUserByTelegramId, updateUser, createNotificationForUser, createAuditLog } from "@/lib/store";
import { xrayAddUser } from "@/lib/xray";
import { verifyBotApiKey, unauthorizedResponse } from "../auth";

/**
 * POST /api/bot/sync
 *
 * Synchronizes subscription data between bot and site.
 *
 * Actions:
 * - "overwrite_site": Bot's subscription overwrites site data
 * - "update_key": Updates only vpnKey and xrayUuid on site
 */
export async function POST(request: NextRequest) {
  if (!verifyBotApiKey(request)) return unauthorizedResponse();

  try {
    const { telegramId, action, subscriptionEnd, plan, vpnKey, xrayUuid } = await request.json();

    if (!telegramId || !action) {
      return NextResponse.json({ success: false, error: "telegramId and action required" }, { status: 400 });
    }

    const user = await getUserByTelegramId(String(telegramId));
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found. Link Telegram first." }, { status: 404 });
    }

    if (action === "overwrite_site") {
      if (!subscriptionEnd) {
        return NextResponse.json({ success: false, error: "subscriptionEnd required" }, { status: 400 });
      }

      const updates: Record<string, unknown> = {
        subscriptionEnd: new Date(subscriptionEnd).toISOString(),
      };

      if (plan) updates.subscriptionPlan = plan;

      // If bot provides its own key/uuid, use them (keeps keys identical)
      if (vpnKey) updates.vpnKey = vpnKey;
      if (xrayUuid) {
        updates.xrayUuid = xrayUuid;
        // Ensure UUID is registered on Xray server
        await xrayAddUser(xrayUuid).catch(() => {});
      }

      await updateUser(user.id, updates);
      await createAuditLog("sync.overwrite", `Bot → Site: plan=${plan || "n/a"}`, user.id, user.email);

      console.log(`[SYNC] overwrite_site for ${user.email}: end=${subscriptionEnd}, plan=${plan}`);

      return NextResponse.json({
        success: true,
        data: {
          userId: user.id,
          subscriptionEnd: updates.subscriptionEnd,
          vpnKey: vpnKey || user.vpnKey,
          subscriptionPlan: plan || user.subscriptionPlan,
        },
      });
    }

    if (action === "update_key") {
      if (!vpnKey && !xrayUuid) {
        return NextResponse.json({ success: false, error: "vpnKey or xrayUuid required" }, { status: 400 });
      }

      const updates: Record<string, unknown> = {};
      if (vpnKey) updates.vpnKey = vpnKey;
      if (xrayUuid) {
        updates.xrayUuid = xrayUuid;
        await xrayAddUser(xrayUuid).catch(() => {});
      }

      await updateUser(user.id, updates);
      await createAuditLog("sync.update_key", "Bot → Site: key updated", user.id, user.email);

      console.log(`[SYNC] update_key for ${user.email}`);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[SYNC] Error:", err);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
