/**
 * Atlas Secure ↔ Remnawave subscription synchronization.
 *
 * ONE function. ONE source of truth: users.subscription_end.
 *
 * Simple rules:
 *   - Every local user has a stable public_id of form "ST00000042".
 *   - We send that public_id to Remnawave as the panel username, so
 *     admins recognize site-issued users at a glance.
 *   - Whenever a local user's subscription_end changes (signup, payment,
 *     admin grant, admin revoke, expiration), call syncSubscriptionToPanel
 *     and the panel reflects the new value.
 *   - If the panel user doesn't exist, we create it. If it exists, we PATCH
 *     its expireAt. There is no third state.
 *   - When subscription_end is in the past, the panel auto-disables the
 *     user — no explicit "delete" needed.
 *
 * Every step writes a [SYNC] log line so support can trace what happened
 * for any user from server logs alone.
 */

import { pool } from "./db";
import { getUserById, UserRecord, createAuditLog } from "./store";
import {
  createUserWithExpire,
  setUserExpire,
  encryptHappLink,
  getUser,
  getUserByUsername,
  getLastRwError,
  RemnawaveUser,
} from "./remnawave";
import {
  isGhostDate,
  computeGhostRepair,
  applyGhostRepair,
} from "./ghost-date-repair";

export type SyncReason =
  | "user_not_found"
  | "no_public_id"
  | "panel_unreachable"
  | "create_failed"
  | "patch_failed"
  | "persist_conflict";

export interface SyncResult {
  ok: boolean;
  publicId: string | null;
  uuid: string | null;
  subscriptionUrl: string | null;
  expireAt: string | null;
  action: "skip" | "patched" | "created" | "adopted" | "failed";
  reason?: SyncReason;
  /** Raw panel error message for the most recent failed call, when known. */
  panelError?: string;
  /** Actual username the panel has the user under, after the sync ran. */
  panelUsername?: string | null;
}

function log(level: "info" | "warn" | "error", userId: string, msg: string, extra?: object) {
  const tag = `[SYNC ${userId.slice(0, 8)}]`;
  const line = extra ? `${tag} ${msg} ${JSON.stringify(extra)}` : `${tag} ${msg}`;
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

/**
 * Ensure the user has a public_id. Generates one inline using the
 * postgres sequence if missing (defensive — startup backfill should
 * have already covered every row).
 */
async function ensurePublicId(user: UserRecord): Promise<string | null> {
  if (user.publicId) return user.publicId;
  log("warn", user.id, "user has no public_id — generating now");
  const r = await pool.query<{ public_id: string }>(
    `UPDATE users
     SET public_id = 'ST' || LPAD(NEXTVAL('user_public_id_seq')::text, 8, '0')
     WHERE id = $1 AND public_id IS NULL
     RETURNING public_id`,
    [user.id]
  );
  if (r.rows.length > 0) return r.rows[0].public_id;
  // Lost a race — re-read
  const refreshed = await getUserById(user.id);
  return refreshed?.publicId || null;
}

/** Cache panel user fields onto users row. */
async function persistPanelUser(userId: string, rwUser: RemnawaveUser, happLink: string | null) {
  await pool.query(
    `UPDATE users SET
       remnawave_user_uuid = $1,
       remnawave_short_uuid = $2,
       subscription_url = $3,
       happ_crypto_link = $4,
       crypto_link_updated_at = $5,
       panel_username = $6
     WHERE id = $7`,
    [
      rwUser.uuid,
      rwUser.shortUuid || null,
      rwUser.subscriptionUrl,
      happLink,
      happLink ? new Date() : null,
      rwUser.username || null,
      userId,
    ]
  );
}

/**
 * The one and only function for keeping a single user's panel state
 * in sync with their local subscription_end.
 *
 * Idempotent — safe to call as many times as you want.
 */
export async function syncSubscriptionToPanel(userId: string): Promise<SyncResult> {
  const t0 = Date.now();
  log("info", userId, "syncSubscriptionToPanel: start");

  let user = await getUserById(userId);
  if (!user) {
    log("error", userId, "user not found");
    return { ok: false, publicId: null, uuid: null, subscriptionUrl: null, expireAt: null, action: "failed", reason: "user_not_found" };
  }

  // ─── Public ID ───
  const publicId = await ensurePublicId(user);
  if (!publicId) {
    log("error", userId, "no public_id, cannot sync");
    return { ok: false, publicId: null, uuid: null, subscriptionUrl: null, expireAt: null, action: "failed", reason: "no_public_id" };
  }
  if (user.publicId !== publicId) {
    const refreshed = await getUserById(userId);
    if (refreshed) user = refreshed;
  }
  log("info", userId, `public_id=${publicId} email=${user.email}`);

  // ─── Auto-repair ghost dates in-line ───
  // Old code SKIPPED here for fear of overwriting a manual admin fix,
  // but the side effect was that any user with a ghost subscription_end
  // (residue of the legacy 10-year bug) got a dashboard showing e.g.
  // 2032 while the panel still held the original, long-since-expired
  // date — a broken subscription URL with no self-heal path.
  //
  // Instead: detect the ghost, recompute the honest subscription_end
  // from the user's payment history (same logic as the admin cleanup
  // endpoint), write it locally, then fall through and PATCH the panel
  // with the repaired value in the same call.
  if (isGhostDate(user.subscriptionEnd)) {
    log(
      "warn",
      userId,
      `ghost date detected local=${user.subscriptionEnd} — computing repair`
    );
    let repaired = false;
    try {
      const plan = await computeGhostRepair(userId);
      await applyGhostRepair(userId, plan);
      log(
        "info",
        userId,
        `ghost repaired: ${user.subscriptionEnd} → ${plan.newEnd.toISOString()} (${plan.action}, payments=${plan.confirmedPayments})`
      );
      await createAuditLog(
        "system.ghost_date_repair",
        `${user.email}: ${user.subscriptionEnd} → ${plan.newEnd.toISOString()} (${plan.action})`,
        user.id,
        user.email
      ).catch(() => null);
      const refreshed = await getUserById(userId);
      if (refreshed) user = refreshed;
      repaired = true;
    } catch (err) {
      log("error", userId, "ghost repair failed", {
        error: err instanceof Error ? err.message : String(err),
      });
      await createAuditLog(
        "system.ghost_date_repair_failed",
        `${user.email}: repair threw ${err instanceof Error ? err.message : String(err)} — panel will get a safe fallback`,
        user.id,
        user.email
      ).catch(() => null);
    }

    // If repair itself blew up, we still refuse to push the ghost
    // value to the panel. The safe fallback is NOW + 1 day: the panel
    // stays alive for a short grace period, the user's dashboard now
    // shows a 24h window rather than the 6-year fiction, and the next
    // hourly sync (or manual "Обновить подписку") gets another shot at
    // the real repair. Do NOT return; the panel PATCH below still
    // needs to run so the user's URL keeps working.
    if (!repaired) {
      const grace = new Date(Date.now() + 24 * 60 * 60 * 1000);
      log(
        "warn",
        userId,
        `repair fallback: clamping local to ${grace.toISOString()} (NOW+1d) so panel and local agree`
      );
      try {
        await pool.query(
          "UPDATE users SET subscription_end = $1 WHERE id = $2",
          [grace, userId]
        );
        const refreshed = await getUserById(userId);
        if (refreshed) user = refreshed;
      } catch (err) {
        log("error", userId, "fallback clamp write failed", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  // If subscription_end is now in the past (either it was already or
  // the repair landed us there), push a small grace window to the
  // panel so the panel-side auto-disable fires cleanly instead of
  // rejecting the past-date PATCH. clampExpireAt in remnawave.ts also
  // enforces a NOW+30s floor, but making the grace explicit here means
  // the panel target reflects our intent instead of a defensive nudge.
  const localEndMs = new Date(user.subscriptionEnd).getTime();
  const nowMs = Date.now();
  const panelTargetMs =
    localEndMs <= nowMs ? nowMs + 24 * 60 * 60 * 1000 : localEndMs;
  const expireIso = new Date(panelTargetMs).toISOString();
  // Explicit ACTIVE reactivates a user the panel had auto-transitioned
  // to EXPIRED / LIMITED on prior expiry. When local subscription_end
  // is in the future we WANT the user's key to work — pushing expireAt
  // alone doesn't flip a panel-side EXPIRED back to ACTIVE on 3.x.
  const desiredStatus: "ACTIVE" | undefined =
    localEndMs > nowMs ? "ACTIVE" : undefined;
  log("info", userId, `target expireAt=${expireIso} plan=${user.subscriptionPlan || "trial"} status=${desiredStatus ?? "(unchanged)"}`);

  // ─── Have a UUID? Try PATCH first ───
  if (user.remnawaveUserUuid) {
    log("info", userId, `have uuid=${user.remnawaveUserUuid.slice(0, 8)}…, checking panel`);
    const live = await getUser(user.remnawaveUserUuid);
    if (live) {
      log(
        "info",
        userId,
        `panel user exists (uuidString=${live.uuidString ? live.uuidString.slice(0, 12) + "…" : "—"}), patching expireAt + plan tag + status`
      );
      const updated = await setUserExpire(user.remnawaveUserUuid, expireIso, {
        status: desiredStatus,
        plan: user.subscriptionPlan || "trial",
        // Pass v3's UUID-string handle (from live GET) so setUserExpire
        // can try `{uuid: <UUID>, ...}` — some 3.x builds validate the
        // body identifier as UUID-format and reject integer PKs.
        uuidString: live.uuidString ?? undefined,
      });
      if (updated) {
        // Refresh cached subscriptionUrl + panel_username in case
        // either changed since last sync.
        if (
          (updated.subscriptionUrl && updated.subscriptionUrl !== user.subscriptionUrl) ||
          (updated.username && updated.username !== user.panelUsername)
        ) {
          await pool.query(
            `UPDATE users SET
               subscription_url = COALESCE($1, subscription_url),
               remnawave_short_uuid = COALESCE($2, remnawave_short_uuid),
               panel_username = COALESCE($3, panel_username)
             WHERE id = $4`,
            [updated.subscriptionUrl || null, updated.shortUuid || null, updated.username || null, userId]
          );
          log("info", userId, "refreshed cached panel fields");
        }
        // Legacy users had `panel_id` (8-char hex) as their panel
        // username. Migrate them on the fly to the ST00000NNN form
        // so admins can find them by the same identifier the site
        // shows. Best-effort: a failed rename doesn't fail the sync.
        const finalUser = updated;
        log("info", userId, `done patched in ${Date.now() - t0}ms`);
        return {
          ok: true,
          publicId,
          uuid: finalUser.uuid,
          subscriptionUrl: finalUser.subscriptionUrl,
          expireAt: finalUser.expireAt,
          action: "patched",
          panelUsername: finalUser.username || null,
        };
      }
      const panelError = getLastRwError() || undefined;
      log("warn", userId, "PATCH failed", panelError ? { panelError } : undefined);
      return {
        ok: false,
        publicId,
        uuid: user.remnawaveUserUuid,
        subscriptionUrl: user.subscriptionUrl,
        expireAt: null,
        action: "failed",
        reason: "patch_failed",
        panelError,
      };
    }
    // UUID is stale — clear and fall through to create
    log("warn", userId, "uuid is stale (404 from panel), clearing local cache");
    await pool.query(
      `UPDATE users SET
         remnawave_user_uuid = NULL,
         remnawave_short_uuid = NULL,
         subscription_url = NULL,
         happ_crypto_link = NULL,
         crypto_link_updated_at = NULL
       WHERE id = $1`,
      [userId]
    );
    const refreshed = await getUserById(userId);
    if (refreshed) user = refreshed;
  }

  // ─── Look up by public_id (username) in case panel already has us ───
  log("info", userId, `lookup panel by username=${publicId}`);
  const existing = await getUserByUsername(publicId);
  if (existing?.uuid) {
    log("info", userId, `found existing panel user uuid=${existing.uuid.slice(0, 8)}…, adopting`);
    // Conflict check
    const conflict = await pool.query<{ id: string; email: string }>(
      `SELECT id, email FROM users WHERE remnawave_user_uuid = $1 AND id != $2`,
      [existing.uuid, userId]
    );
    if (conflict.rows.length > 0) {
      log("error", userId, `uuid ${existing.uuid.slice(0, 8)}… already owned by ${conflict.rows[0].email}`);
      return { ok: false, publicId, uuid: existing.uuid, subscriptionUrl: existing.subscriptionUrl, expireAt: null, action: "failed", reason: "persist_conflict" };
    }
    const patched = await setUserExpire(existing.uuid, expireIso, {
      status: desiredStatus,
      plan: user.subscriptionPlan || "trial",
      uuidString: existing.uuidString ?? undefined,
    });
    const finalUser = patched || existing;
    const happLink = await encryptHappLink(finalUser.subscriptionUrl).catch(() => null);
    await persistPanelUser(userId, finalUser, happLink);
    log("info", userId, `adopted in ${Date.now() - t0}ms`);
    return {
      ok: true,
      publicId,
      uuid: finalUser.uuid,
      subscriptionUrl: finalUser.subscriptionUrl,
      expireAt: finalUser.expireAt,
      action: "adopted",
      panelUsername: finalUser.username || null,
    };
  }

  // ─── Create fresh ───
  log("info", userId, `creating new panel user with username=${publicId} plan=${user.subscriptionPlan || "trial"}`);
  const rwUser = await createUserWithExpire(
    user.email,
    expireIso,
    `atlas-secure site (${publicId})`,
    publicId,
    user.subscriptionPlan || "trial"
  );
  if (!rwUser) {
    const panelError = getLastRwError() || undefined;
    log("error", userId, "createUser failed", panelError ? { panelError } : undefined);
    return { ok: false, publicId, uuid: null, subscriptionUrl: null, expireAt: null, action: "failed", reason: "create_failed", panelError };
  }

  // Conflict check
  const conflict = await pool.query<{ id: string; email: string }>(
    `SELECT id, email FROM users WHERE remnawave_user_uuid = $1 AND id != $2`,
    [rwUser.uuid, userId]
  );
  if (conflict.rows.length > 0) {
    log("error", userId, `uuid conflict: ${rwUser.uuid.slice(0, 8)}… already owned by ${conflict.rows[0].email}`);
    return { ok: false, publicId, uuid: rwUser.uuid, subscriptionUrl: rwUser.subscriptionUrl, expireAt: null, action: "failed", reason: "persist_conflict" };
  }

  const happLink = await encryptHappLink(rwUser.subscriptionUrl).catch(() => null);
  await persistPanelUser(userId, rwUser, happLink);
  log("info", userId, `created in ${Date.now() - t0}ms uuid=${rwUser.uuid.slice(0, 8)}… url=${rwUser.subscriptionUrl.slice(0, 60)}`);
  return {
    ok: true,
    publicId,
    uuid: rwUser.uuid,
    subscriptionUrl: rwUser.subscriptionUrl,
    expireAt: rwUser.expireAt,
    action: "created",
    panelUsername: rwUser.username || null,
  };
}

// Backwards-compatibility alias for the old name used by other modules.
export const syncUserToRemnawave = syncSubscriptionToPanel;
