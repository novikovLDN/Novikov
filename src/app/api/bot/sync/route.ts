import { NextRequest, NextResponse } from "next/server";
import { getUserByTelegramId, updateUser, createNotificationForUser, createAuditLog } from "@/lib/store";
import { verifyBotApiKey, unauthorizedResponse } from "../auth";
import { botSyncDisabledResponse } from "../sync-guard";

// Hard cap on how far in the future a subscriptionEnd may land. Anything
// beyond ~13 months is almost certainly a bug on the caller side (we had
// users silently given 10-year "lifetime" subs because the bot pushed
// 2036 dates and we accepted them). Reject loudly so the source surfaces.
const MAX_SUB_END_MS_AHEAD = 400 * 24 * 60 * 60 * 1000;

/**
 * POST /api/bot/sync
 *
 * Syncs SUBSCRIPTION DATA only (not VPN keys).
 * Each side keeps its own vpnKey/xrayUuid.
 *
 * action = "overwrite_site": sync subscriptionEnd + plan from bot
 * action = "revoke": deactivate subscription on site
 */
export async function POST(request: NextRequest) {
  if (!verifyBotApiKey(request)) return unauthorizedResponse();
  const disabled = await botSyncDisabledResponse();
  if (disabled) return disabled;

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

    const plan = typeof body.plan === "string" ? body.plan : null;
    const subscriptionEnd = body.subscriptionEnd ? new Date(body.subscriptionEnd) : null;

    console.log(`[SYNC] action=${action} userId=${user.id} email=${user.email} plan=${plan} end=${subscriptionEnd?.toISOString() || "null"}`);

    if (action === "overwrite_site") {
      if (!subscriptionEnd || isNaN(subscriptionEnd.getTime())) {
        return NextResponse.json({ success: false, error: "Valid subscriptionEnd required" }, { status: 400 });
      }

      // Check revocation (plan=none or epoch date)
      const isRevocation = plan === "none" || subscriptionEnd.getTime() <= 0;

      // Reject implausibly-far-future dates from the bot. Revocation
      // (epoch / past date) is exempt because it's legitimately "set to past".
      if (!isRevocation && subscriptionEnd.getTime() > Date.now() + MAX_SUB_END_MS_AHEAD) {
        console.warn(`[SYNC] REJECTED overwrite: ${user.email} end=${subscriptionEnd.toISOString()} > now+400d`);
        return NextResponse.json(
          { success: false, error: "subscriptionEnd must be within 400 days from now", code: "sub_end_too_far" },
          { status: 400 }
        );
      }

      const updates: Record<string, unknown> = {
        subscriptionEnd: subscriptionEnd.toISOString(),
      };

      if (isRevocation) {
        updates.subscriptionPlan = "trial";
        console.log(`[SYNC] REVOCATION for ${user.email}`);
      } else if (plan && ["trial", "basic", "plus"].includes(plan)) {
        updates.subscriptionPlan = plan;
      }

      // DO NOT sync vpnKey/xrayUuid — each side keeps its own keys

      const updated = await updateUser(user.id, updates);
      if (!updated) {
        return NextResponse.json({ success: false, error: "Failed to update" }, { status: 500 });
      }

      console.log(`[SYNC] DONE: plan=${updated.subscriptionPlan} end=${updated.subscriptionEnd}`);

      await createAuditLog("sync.overwrite", `Bot→Site: plan=${updated.subscriptionPlan}, end=${updated.subscriptionEnd}`, user.id, user.email);
      await createNotificationForUser(user.id, "Подписка синхронизирована", "Данные подписки обновлены из Telegram-бота.").catch(() => {});

      return NextResponse.json({
        success: true,
        data: {
          userId: updated.id,
          email: updated.email,
          subscriptionEnd: updated.subscriptionEnd,
          subscriptionPlan: updated.subscriptionPlan,
          telegramLinked: updated.telegramLinked,
        },
      });
    }

    return NextResponse.json({ success: false, error: "Unknown action. Use: overwrite_site" }, { status: 400 });
  } catch (err) {
    console.error("[SYNC] Error:", err);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
