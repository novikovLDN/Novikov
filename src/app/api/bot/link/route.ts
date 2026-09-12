import { NextRequest, NextResponse } from "next/server";
import {
  linkTelegramByToken,
  getUserByTelegramLinkToken,
  grantTelegramBonus,
  getUserById,
  createAuditLog,
  createNotificationForUser,
} from "@/lib/store";
import { syncUserToPanel } from "@/lib/subscription-sync";
import { TELEGRAM_BONUS_DAYS } from "@/lib/brand-facts";
import { plural } from "@/lib/ru-words";
import { verifyBotApiKey, unauthorizedResponse } from "../auth";
import { botSyncDisabledResponse } from "../sync-guard";

/**
 * POST /api/bot/link — the bot links a telegram_id to a site account by
 * its link token. On a successful link the account gets
 * +TELEGRAM_BONUS_DAYS once (per account and per Telegram id).
 */
export async function POST(request: NextRequest) {
  if (!verifyBotApiKey(request)) return unauthorizedResponse();
  const disabled = await botSyncDisabledResponse();
  if (disabled) return disabled;

  try {
    const { token, telegramId } = await request.json();
    if (!token || !telegramId) {
      return NextResponse.json({ success: false, error: "token and telegramId required" }, { status: 400 });
    }
    const tgId = String(telegramId);

    const owner = await getUserByTelegramLinkToken(String(token));
    const linked = await linkTelegramByToken(String(token), tgId);
    if (!linked) {
      return NextResponse.json({ success: false, error: "User not found or already linked" }, { status: 404 });
    }

    // Bonus only when THIS token's account now carries THIS Telegram id
    // (linkTelegramByToken returns another account if the id is taken).
    let bonus: { granted: boolean; reason?: string } = { granted: false, reason: "not_linked_to_token_owner" };
    if (owner && linked.id === owner.id && linked.telegramId === tgId) {
      bonus = await grantTelegramBonus(linked.id, tgId);
      if (bonus.granted) {
        const sync = await syncUserToPanel(linked.id);
        if (!sync.ok) console.warn(`[BOT/LINK] ${linked.email}: panel sync deferred — ${sync.reason} ${sync.panelError ?? ""}`);
        await createNotificationForUser(
          linked.id,
          "Telegram привязан",
          `+${TELEGRAM_BONUS_DAYS} ${plural(TELEGRAM_BONUS_DAYS, ["день", "дня", "дней"])} к подписке за привязку бота.`
        );
      }
    }

    const user = (await getUserById(linked.id)) ?? linked;
    const msLeft = Math.max(0, new Date(user.subscriptionEnd).getTime() - Date.now());
    const daysLeft = Math.floor(msLeft / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.floor((msLeft / (1000 * 60 * 60)) % 24);
    const isExpired = msLeft === 0;
    const link = isExpired ? null : user.subscriptionUrl;

    await createAuditLog("telegram.link", `TG:${tgId} linked; bonus ${bonus.granted ? "granted" : bonus.reason}`, user.id, user.email);

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        daysLeft,
        hoursLeft,
        isExpired,
        hasActiveSubscription: !isExpired && !!user.subscriptionUrl,
        subscriptionEnd: user.subscriptionEnd,
        subscriptionPlan: isExpired ? "expired" : (user.subscriptionPlan || "trial"),
        vpnKey: link,
        subscriptionUrl: link,
        xrayUuid: null,
        referralCode: user.referralCode,
        telegramBonus: { granted: bonus.granted, days: bonus.granted ? TELEGRAM_BONUS_DAYS : 0, reason: bonus.granted ? undefined : bonus.reason },
      },
    });
  } catch (err) {
    console.error("[BOT/LINK] error:", err);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
