import { NextRequest, NextResponse } from "next/server";
import { getUserById, getLoyaltyInfo } from "@/lib/store";
import { createUserWithExpire, getUser, encryptHappLink, REMNAWAVE_CONFIG } from "@/lib/remnawave";
import { pool } from "@/lib/db";
import crypto from "crypto";

/**
 * Single source of truth for the user's subscription.
 *
 * Resolution order while subscription is active:
 *
 *   1. Ensure users.panel_id exists (inline backfill).
 *   2. If users.remnawave_user_uuid IS NOT NULL:
 *        GET /api/users/{uuid}.
 *        If 200 → use panel's subscriptionUrl, refresh local cache.
 *        If 404 → clear local uuid, fall through to step 3.
 *   3. createUserWithExpire(email, end, "...", panel_id):
 *        Pre-checks the panel by panel_id (username) → adopts if found,
 *        else POSTs. Cannot create duplicates because panel_id is unique
 *        per local user.
 *   4. Persist uuid + subscription_url + happ_crypto_link.
 *   5. Return user.subscription_url as vpnKey. No qodev fallback.
 *
 * If the panel is unreachable AND we have never cached a URL, vpnKey is
 * null — the dashboard will show "preparing" copy until a refresh.
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

    let provisioningError: string | null = null;

    if (!isExpired) {
      // ── Step 1: ensure panel_id ──
      if (!user.panelId) {
        const pid = crypto.randomBytes(4).toString("hex");
        await pool.query(
          `UPDATE users SET panel_id = $1 WHERE id = $2 AND panel_id IS NULL`,
          [pid, user.id]
        );
        const refreshed = await getUserById(user.id);
        if (refreshed) user = refreshed;
      }

      // ── Step 2: if we have a UUID, fetch live state from panel ──
      if (user.remnawaveUserUuid) {
        const live = await getUser(user.remnawaveUserUuid);
        if (live) {
          // Panel is the source of truth for subscriptionUrl. Refresh cache.
          if (
            live.subscriptionUrl &&
            live.subscriptionUrl !== user.subscriptionUrl
          ) {
            await pool.query(
              `UPDATE users SET subscription_url = $1, remnawave_short_uuid = $2 WHERE id = $3`,
              [live.subscriptionUrl, live.shortUuid || user.remnawaveShortUuid, user.id]
            );
            const refreshed = await getUserById(user.id);
            if (refreshed) user = refreshed;
          }
        } else if (REMNAWAVE_CONFIG.isConfigured) {
          // Panel responded but we couldn't parse / 404 — uuid is stale.
          // Clear local pointer so step 3 can re-provision cleanly.
          await pool.query(
            `UPDATE users SET
               remnawave_user_uuid = NULL,
               subscription_url = NULL,
               happ_crypto_link = NULL,
               crypto_link_updated_at = NULL
             WHERE id = $1`,
            [user.id]
          );
          const refreshed = await getUserById(user.id);
          if (refreshed) user = refreshed;
        }
      }

      // ── Step 3: provision if no UUID ──
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
             WHERE id = $6`,
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
        } else {
          provisioningError = "remnawave_create_failed";
        }
      }

      // ── Step 4: refresh Happ link if missing ──
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

    const vpnKey = isExpired ? null : (user.subscriptionUrl || null);

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
        // Remnawave
        subscriptionUrl: vpnKey,
        happCryptoLink: isExpired ? null : user.happCryptoLink,
        panelId: user.panelId,
        trialUsedAt: user.trialUsedAt,
        // Diagnostic — helps the dashboard distinguish "preparing" from
        // "panel actually returned no URL"
        provisioningError,
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
