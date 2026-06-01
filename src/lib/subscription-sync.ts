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

import crypto from "crypto";
import { pool } from "./db";
import { getUserById, UserRecord } from "./store";
import {
  createUserWithExpire,
  setUserExpire,
  encryptHappLink,
  getUser,
  getUserByUsername,
  getLastRwError,
  RemnawaveUser,
} from "./remnawave";

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
       crypto_link_updated_at = $5
     WHERE id = $6`,
    [
      rwUser.uuid,
      rwUser.shortUuid || null,
      rwUser.subscriptionUrl,
      happLink,
      happLink ? new Date() : null,
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

  const expireIso = new Date(user.subscriptionEnd).toISOString();
  log("info", userId, `target expireAt=${expireIso} (subscription_end)`);

  // ─── Have a UUID? Try PATCH first ───
  if (user.remnawaveUserUuid) {
    log("info", userId, `have uuid=${user.remnawaveUserUuid.slice(0, 8)}…, checking panel`);
    const live = await getUser(user.remnawaveUserUuid);
    if (live) {
      log("info", userId, "panel user exists, patching expireAt");
      const updated = await setUserExpire(user.remnawaveUserUuid, expireIso);
      if (updated) {
        // Refresh cached subscriptionUrl in case panel rotated it
        if (updated.subscriptionUrl && updated.subscriptionUrl !== user.subscriptionUrl) {
          await pool.query(
            `UPDATE users SET subscription_url = $1, remnawave_short_uuid = $2 WHERE id = $3`,
            [updated.subscriptionUrl, updated.shortUuid || null, userId]
          );
          log("info", userId, "refreshed subscription_url from panel");
        }
        log("info", userId, `done patched in ${Date.now() - t0}ms`);
        return {
          ok: true,
          publicId,
          uuid: updated.uuid,
          subscriptionUrl: updated.subscriptionUrl,
          expireAt: updated.expireAt,
          action: "patched",
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
    const patched = await setUserExpire(existing.uuid, expireIso);
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
    };
  }

  // ─── Create fresh ───
  log("info", userId, `creating new panel user with username=${publicId}`);
  const rwUser = await createUserWithExpire(user.email, expireIso, `atlas-secure site (${publicId})`, publicId);
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
  };
}

// Backwards-compatibility alias for the old name used by other modules.
export const syncUserToRemnawave = syncSubscriptionToPanel;
