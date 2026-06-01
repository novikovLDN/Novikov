import { NextRequest, NextResponse } from "next/server";
import { getUserByTelegramId, updateUser, createAuditLog, getCashbackPercent, getLoyaltyInfo } from "@/lib/store";
import { verifyBotApiKey, unauthorizedResponse } from "../auth";
import { botSyncDisabledResponse } from "../sync-guard";

/**
 * POST /api/bot/sync-referrals
 *
 * Syncs referral counts between bot and site.
 * Takes MAX of both sides to never lose data.
 *
 * Body: {
 *   telegramId: string,
 *   referrals: number,       // total invited (registered)
 *   paidReferrals: number,   // total who paid
 *   referralCode?: string    // bot's 6-char code (for display sync)
 * }
 */
export async function POST(request: NextRequest) {
  if (!verifyBotApiKey(request)) return unauthorizedResponse();
  const disabled = await botSyncDisabledResponse();
  if (disabled) return disabled;

  try {
    const { telegramId, referrals, paidReferrals, referralCode } = await request.json();

    if (!telegramId) {
      return NextResponse.json({ success: false, error: "telegramId required" }, { status: 400 });
    }

    const user = await getUserByTelegramId(String(telegramId));
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const botReferrals = typeof referrals === "number" ? referrals : 0;
    const botPaid = typeof paidReferrals === "number" ? paidReferrals : 0;

    // Take MAX of both sides — never lose referrals
    const newReferrals = Math.max(user.referrals, botReferrals);
    const newPaid = Math.max(user.paidReferrals, botPaid);

    const updates: Record<string, unknown> = {};
    let changed = false;

    if (newReferrals !== user.referrals) {
      updates.referrals = newReferrals;
      changed = true;
    }
    if (newPaid !== user.paidReferrals) {
      updates.paidReferrals = newPaid;
      changed = true;
    }

    if (changed) {
      await updateUser(user.id, updates);
      await createAuditLog(
        "sync.referrals",
        `Bot→Site: referrals ${user.referrals}→${newReferrals}, paid ${user.paidReferrals}→${newPaid}`,
        user.id, user.email
      );
      console.log(`[SYNC] Referrals for ${user.email}: ${user.referrals}→${newReferrals}, paid ${user.paidReferrals}→${newPaid}`);
    }

    const loyaltyInfo = getLoyaltyInfo(newPaid);

    return NextResponse.json({
      success: true,
      data: {
        referrals: newReferrals,
        paidReferrals: newPaid,
        referralCode: user.referralCode,
        siteReferralCode: user.referralCode,
        botReferralCode: referralCode || null,
        balance: user.balance,
        balanceRubles: user.balance / 100,
        cashbackPercent: loyaltyInfo.percent,
        loyaltyTier: loyaltyInfo.tier,
        nextTier: loyaltyInfo.nextTier,
        referralsToNextTier: loyaltyInfo.referralsToNextTier,
      },
    });
  } catch (err) {
    console.error("[SYNC] Referrals error:", err);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
