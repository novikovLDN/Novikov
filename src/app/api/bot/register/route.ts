import { NextRequest, NextResponse } from "next/server";
import { getUserByTelegramId, getOrCreateUser, updateUser } from "@/lib/store";
import { xrayAddUser } from "@/lib/xray";
import { verifyBotApiKey, unauthorizedResponse } from "../auth";
import { botSyncDisabledResponse } from "../sync-guard";

/**
 * POST /api/bot/register
 *
 * Bot calls this when a new user starts the bot and doesn't have a site account.
 * Creates a site account linked to the telegram_id.
 *
 * Body: { telegramId: string, email?: string, referralCode?: string }
 *
 * If email is provided → creates account with that email.
 * If no email → creates with placeholder telegram_{id}@tg.atlas.
 */
export async function POST(request: NextRequest) {
  if (!verifyBotApiKey(request)) return unauthorizedResponse();
  const disabled = await botSyncDisabledResponse();
  if (disabled) return disabled;

  try {
    const { telegramId, email, referralCode } = await request.json();

    if (!telegramId) {
      return NextResponse.json({ success: false, error: "telegramId required" }, { status: 400 });
    }

    // Check if already linked
    const existing = await getUserByTelegramId(String(telegramId));
    if (existing) {
      const now = new Date();
      const end = new Date(existing.subscriptionEnd);
      const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      return NextResponse.json({
        success: true,
        data: {
          userId: existing.id,
          email: existing.email,
          isNew: false,
          daysLeft,
          subscriptionEnd: existing.subscriptionEnd,
          vpnKey: daysLeft > 0 ? existing.vpnKey : null,
          referralCode: existing.referralCode,
          subscriptionPlan: daysLeft > 0 ? (existing.subscriptionPlan || "trial") : "expired",
        },
      });
    }

    // Use provided email or generate a placeholder
    const userEmail = email?.trim().toLowerCase() || `telegram_${telegramId}@tg.atlassecure.uk`;

    // Create account (3-day trial from bot)
    const user = await getOrCreateUser(userEmail, referralCode || undefined, "telegram-bot");

    // Link telegram
    await updateUser(user.id, {
      telegramId: String(telegramId),
      telegramLinked: true,
    });

    // Add to Xray if new
    if (user.isNew && user.xrayUuid) {
      xrayAddUser(user.xrayUuid).catch(() => {
        console.error(`[BOT] Failed to add user to Xray: ${userEmail}`);
      });
    }

    const now = new Date();
    const end = new Date(user.subscriptionEnd);
    const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    console.log(`[BOT] Registered user ${userEmail} linked to TG:${telegramId}`);

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        isNew: user.isNew,
        daysLeft,
        subscriptionEnd: user.subscriptionEnd,
        vpnKey: user.vpnKey,
        referralCode: user.referralCode,
        telegramLinkToken: user.telegramLinkToken,
        subscriptionPlan: user.subscriptionPlan || "trial",
      },
    });
  } catch (err) {
    console.error("[BOT] register error:", err);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
