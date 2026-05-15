import { NextRequest, NextResponse } from "next/server";
import { getUserById, getLoyaltyInfo } from "@/lib/store";
import { createUserWithExpire, encryptHappLink } from "@/lib/remnawave";
import { pool } from "@/lib/db";
import crypto from "crypto";

/**
 * Single source of truth for the user's subscription. Always returns the
 * Remnawave-issued subscription URL (or null if the panel is unreachable
 * AND we have never cached a URL). No qodev.dev fallback path.
 *
 * Provisioning is synchronous:
 *   - if users.panel_id is missing → generate one inline
 *   - if users.remnawave_user_uuid is missing → call createUserWithExpire
 *     (which pre-checks by panel_id to avoid duplicates) and persist
 *   - re-read user, return the freshly populated columns
 */
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("session")?.value;
    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Не авторизован" }, { status: 401 });
    }

    let user = await getUserById(sessionId);
    if (!user) {
      const response = NextResponse.json(
        { success: false, error: "Пользователь не найден" },
        { status: 404 }
      );
      response.cookies.delete("session");
      return response;
    }

    const now = new Date();
    const end = new Date(user.subscriptionEnd);
    const msLeft = Math.max(0, end.getTime() - now.getTime());
    const totalMinutes = Math.floor(msLeft / (1000 * 60));
    const totalHours = Math.floor(totalMinutes / 60);
    const daysLeft = Math.floor(totalHours / 24);
    const hoursLeft = totalHours % 24;
    const minutesLeft = totalMinutes % 60;
    const isExpired = msLeft === 0;

    // ── Synchronous provisioning while subscription is active ──
    if (!isExpired) {
      // Step 1: ensure panel_id exists (defensive — startup backfill should
      // have already taken care of every existing row).
      if (!user.panelId) {
        const pid = crypto.randomBytes(4).toString("hex");
        await pool.query(
          `UPDATE users SET panel_id = $1 WHERE id = $2 AND panel_id IS NULL`,
          [pid, user.id]
        );
        const refreshed = await getUserById(user.id);
        if (refreshed) user = refreshed;
      }

      // Step 2: ensure Remnawave user exists and we have subscription_url.
      if (!user.remnawaveUserUuid && user.panelId) {
        const rwUser = await createUserWithExpire(
          user.email,
          end.toISOString(),
          "user/subscription sync-provision",
          user.panelId
        );
        if (rwUser) {
          const happLink = await encryptHappLink(rwUser.subscriptionUrl);
          await pool.query(
            `UPDATE users SET
               remnawave_user_uuid = $1,
               remnawave_short_uuid = $2,
               subscription_url = $3,
               happ_crypto_link = $4,
               crypto_link_updated_at = $5
             WHERE id = $6 AND remnawave_user_uuid IS NULL`,
            [
              rwUser.uuid,
              rwUser.shortUuid || null,
              rwUser.subscriptionUrl,
              happLink,
              happLink ? new Date() : null,
              user.id,
            ]
          );
          const refreshed = await getUserById(user.id);
          if (refreshed) user = refreshed;
        }
      }

      // Step 3: refresh Happ crypto link if subscription_url exists but link
      // is missing (e.g. earlier encrypt-API failure).
      if (user.subscriptionUrl && !user.happCryptoLink) {
        const link = await encryptHappLink(user.subscriptionUrl);
        if (link) {
          await pool.query(
            `UPDATE users SET happ_crypto_link = $1, crypto_link_updated_at = NOW() WHERE id = $2`,
            [link, user.id]
          );
          const refreshed = await getUserById(user.id);
          if (refreshed) user = refreshed;
        }
      }
    }

    // The ONLY subscription URL we surface is the Remnawave one. If it
    // isn't ready yet (panel down on a brand-new account), return null —
    // the frontend will show "preparing" copy rather than the legacy URL.
    const vpnKey = isExpired ? null : user.subscriptionUrl || null;

    return NextResponse.json({
      success: true,
      data: {
        email: user.email,
        daysLeft,
        hoursLeft,
        minutesLeft,
        isExpired,
        subscriptionEnd: user.subscriptionEnd,
        vpnKey,
        xrayUuid: isExpired ? null : user.xrayUuid,
        subToken: isExpired ? null : user.subToken,
        telegramLinked: user.telegramLinked,
        telegramLinkToken: user.telegramLinkToken,
        referralCode: user.referralCode,
        subscriptionPlan: isExpired ? "expired" : (user.subscriptionPlan || "trial"),
        referrals: user.referrals,
        paidReferrals: user.paidReferrals,
        balance: user.balance / 100,
        cashbackPercent: getLoyaltyInfo(user.paidReferrals).percent,
        loyaltyTier: getLoyaltyInfo(user.paidReferrals).tier,
        isAdmin: !!(process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL),
        // Remnawave fields
        subscriptionUrl: vpnKey,
        happCryptoLink: isExpired ? null : user.happCryptoLink,
        panelId: user.panelId,
        trialUsedAt: user.trialUsedAt,
      },
    });
  } catch (err) {
    console.error("[USER/SUBSCRIPTION] error:", err);
    return NextResponse.json(
      { success: false, error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
