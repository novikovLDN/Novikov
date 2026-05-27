/**
 * Single source of truth: users.subscription_end is what the user actually has.
 * Whenever it changes (signup, purchase, admin grant, admin revoke, expiration),
 * call syncUserToRemnawave(userId) and the panel will reflect it.
 *
 * Flow (idempotent, safe to call multiple times):
 *
 *   1. Ensure users.panel_id (generated inline if missing).
 *   2. If users.remnawave_user_uuid is set:
 *        - GET /api/users/{uuid} (live check).
 *        - 200 → PATCH expireAt to current subscription_end. Cache
 *                subscriptionUrl locally.
 *        - 404 → clear local uuid (panel user was deleted), continue
 *                to step 3 to re-create.
 *   3. createUserWithExpire(email, subscription_end, ..., panel_id):
 *        - Pre-checks panel by panel_id (username) — adopts if found.
 *        - Else POSTs with username = panel_id.
 *        - Cannot create duplicates because panel_id is unique per
 *          local user.
 *   4. Persist uuid + subscription_url + happ_crypto_link (with the
 *      "WHERE remnawave_user_uuid IS NULL" guard so a parallel call
 *      can't overwrite).
 *
 * When subscription_end is in the past, the panel auto-disables the
 * user (its built-in expireAt handling). No active "delete" needed.
 */

import crypto from "crypto";
import { pool } from "./db";
import { getUserById } from "./store";
import { createUserWithExpire, setUserExpire, encryptHappLink, getUser } from "./remnawave";

export type SyncReason =
  | "user_not_found"
  | "panel_unavailable"
  | "no_panel_id"
  | "patch_failed"
  | "create_failed"
  | "persist_conflict";

export interface SyncResult {
  ok: boolean;
  uuid: string | null;
  subscriptionUrl: string | null;
  reason?: SyncReason;
}

export async function syncUserToRemnawave(userId: string): Promise<SyncResult> {
  let user = await getUserById(userId);
  if (!user) return { ok: false, uuid: null, subscriptionUrl: null, reason: "user_not_found" };

  // ── Step 1: ensure panel_id (8-hex Remnawave username) ──
  if (!user.panelId) {
    const pid = crypto.randomBytes(4).toString("hex");
    await pool.query(
      `UPDATE users SET panel_id = $1 WHERE id = $2 AND panel_id IS NULL`,
      [pid, user.id]
    );
    const refreshed = await getUserById(user.id);
    if (refreshed) user = refreshed;
  }

  const expireIso = new Date(user.subscriptionEnd).toISOString();

  // ── Step 2: if we already have a panel UUID, patch and we're done ──
  if (user.remnawaveUserUuid) {
    const live = await getUser(user.remnawaveUserUuid);
    if (live) {
      const updated = await setUserExpire(user.remnawaveUserUuid, expireIso);
      if (updated) {
        // Refresh local cache of subscriptionUrl if panel issued a new one
        if (updated.subscriptionUrl && updated.subscriptionUrl !== user.subscriptionUrl) {
          await pool.query(
            `UPDATE users SET subscription_url = $1, remnawave_short_uuid = $2 WHERE id = $3`,
            [updated.subscriptionUrl, updated.shortUuid || user.remnawaveShortUuid, user.id]
          );
        }
        return { ok: true, uuid: updated.uuid, subscriptionUrl: updated.subscriptionUrl };
      }
      return {
        ok: false,
        uuid: user.remnawaveUserUuid,
        subscriptionUrl: user.subscriptionUrl,
        reason: "patch_failed",
      };
    }

    // UUID is stale — panel user was deleted. Clear locally and fall through.
    await pool.query(
      `UPDATE users SET
         remnawave_user_uuid = NULL,
         remnawave_short_uuid = NULL,
         subscription_url = NULL,
         happ_crypto_link = NULL,
         crypto_link_updated_at = NULL
       WHERE id = $1`,
      [user.id]
    );
    const refreshed = await getUserById(user.id);
    if (refreshed) user = refreshed;
  }

  // ── Step 3: create the panel user ──
  if (!user.panelId) return { ok: false, uuid: null, subscriptionUrl: null, reason: "no_panel_id" };

  const rwUser = await createUserWithExpire(user.email, expireIso, "subscription-sync", user.panelId);
  if (!rwUser) return { ok: false, uuid: null, subscriptionUrl: null, reason: "create_failed" };

  // ── Step 4: persist with the IS NULL guard ──
  // Reject if another local user already owns this uuid (cross-user
  // contamination — the migration / reset tools are needed).
  const conflict = await pool.query<{ id: string }>(
    `SELECT id FROM users WHERE remnawave_user_uuid = $1 AND id != $2`,
    [rwUser.uuid, user.id]
  );
  if (conflict.rows.length > 0) {
    return { ok: false, uuid: rwUser.uuid, subscriptionUrl: rwUser.subscriptionUrl, reason: "persist_conflict" };
  }

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
  } catch (err) {
    console.warn("[SYNC] persist conflict for", user.email, err);
    return { ok: false, uuid: rwUser.uuid, subscriptionUrl: rwUser.subscriptionUrl, reason: "persist_conflict" };
  }

  return { ok: true, uuid: rwUser.uuid, subscriptionUrl: rwUser.subscriptionUrl };
}
