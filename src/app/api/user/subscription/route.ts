import { NextRequest, NextResponse } from "next/server";
import { getUserById, getLoyaltyInfo } from "@/lib/store";
import { createUserWithExpire, getUser, encryptHappLink, REMNAWAVE_CONFIG } from "@/lib/remnawave";
import { pool } from "@/lib/db";
import crypto from "crypto";

/**
 * Single source of truth for the user's subscription.
 *
 * CRITICAL: every interaction with the Remnawave panel is wrapped in
 * try/catch so a panel error or unique-constraint violation can NEVER
 * break the dashboard. The handler must always return something useful
 * — even if that means showing a cached URL or letting the user know
 * the panel is unreachable.
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
      // ─── Step 1: ensure panel_id (never throws — pure DB op) ───
      try {
        if (!user.panelId) {
          const pid = crypto.randomBytes(4).toString("hex");
          await pool.query(
            `UPDATE users SET panel_id = $1 WHERE id = $2 AND panel_id IS NULL`,
            [pid, user.id]
          );
          const refreshed = await getUserById(user.id);
          if (refreshed) user = refreshed;
        }
      } catch (err) {
        console.warn("[USER/SUBSCRIPTION] panel_id backfill failed:", err);
      }

      // ─── Step 2: live-fetch from panel if we have a UUID ───
      // Wrapped — if panel is unreachable, we keep using the cached URL.
      try {
        if (user.remnawaveUserUuid) {
          const live = await getUser(user.remnawaveUserUuid);
          if (live && live.subscriptionUrl && live.subscriptionUrl !== user.subscriptionUrl) {
            await pool.query(
              `UPDATE users SET subscription_url = $1, remnawave_short_uuid = $2 WHERE id = $3`,
              [live.subscriptionUrl, live.shortUuid || user.remnawaveShortUuid, user.id]
            );
            const refreshed = await getUserById(user.id);
            if (refreshed) user = refreshed;
          } else if (!live && REMNAWAVE_CONFIG.isConfigured) {
            // 404 from panel — stale uuid. Clear so step 3 re-provisions.
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
      } catch (err) {
        console.warn("[USER/SUBSCRIPTION] live-fetch failed:", err);
      }

      // ─── Step 3: provision if needed ───
      // Wrapped specifically against the UNIQUE(remnawave_user_uuid)
      // constraint — adoption across multiple local users could in the
      // past assign the same uuid twice.
      try {
        if (!user.remnawaveUserUuid && user.panelId) {
          const rwUser = await createUserWithExpire(
            user.email,
            end.toISOString(),
            "user/subscription sync-provision",
            user.panelId
          );
          if (rwUser) {
            // Refuse to write a UUID that's already attached to a
            // different local user — that's the constraint we keep
            // tripping on. Diagnose explicitly.
            const conflict = await pool.query<{ id: string; email: string }>(
              `SELECT id, email FROM users WHERE remnawave_user_uuid = $1 AND id != $2`,
              [rwUser.uuid, user.id]
            );
            if (conflict.rows.length > 0) {
              provisioningError = `panel uuid ${rwUser.uuid.slice(0, 8)}… belongs to another local user (${conflict.rows[0].email}); admin must reset`;
              console.warn("[USER/SUBSCRIPTION] UUID conflict:", provisioningError);
            } else {
              const happLink = await encryptHappLink(rwUser.subscriptionUrl).catch(() => null);
              try {
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
              } catch (dbErr) {
                // unique_violation on remnawave_user_uuid
                provisioningError = "uuid_conflict_caught";
                console.warn("[USER/SUBSCRIPTION] persist failed:", dbErr);
              }
            }
          } else {
            provisioningError = "remnawave_create_failed";
          }
        }
      } catch (err) {
        provisioningError = "provision_exception";
        console.warn("[USER/SUBSCRIPTION] provision failed:", err);
      }

      // ─── Step 4: refresh Happ link if missing ───
      try {
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
      } catch (err) {
        console.warn("[USER/SUBSCRIPTION] happ-link refresh failed:", err);
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
        subscriptionUrl: vpnKey,
        happCryptoLink: isExpired ? null : user.happCryptoLink,
        panelId: user.panelId,
        trialUsedAt: user.trialUsedAt,
        provisioningError,
      },
    });
  } catch (err) {
    // Catch-all: even if everything explodes, never 500 the dashboard.
    console.error("[USER/SUBSCRIPTION] catch-all error:", err);
    return NextResponse.json(
      { success: false, error: "Временная ошибка, попробуйте обновить страницу" },
      { status: 500 }
    );
  }
}
