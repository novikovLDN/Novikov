/**
 * Trial activation flow: anti-fraud check, Remnawave user creation,
 * Happ crypto link generation, local cache persistence.
 */

import { pool } from "./db";
import { normalizeEmail } from "./email-normalize";
import { createTrialUser, encryptHappLink } from "./remnawave";
import { getUserById } from "./store";

export interface TrialActivationResult {
  success: boolean;
  reason?: "already_used_email" | "ip_limit" | "remnawave_unavailable";
  subscriptionUrl?: string;
  happCryptoLink?: string | null;
  remnawaveUuid?: string;
  expireAt?: string;
}

const TRIALS_PER_IP_LIMIT = 3;
const TRIALS_PER_IP_WINDOW_DAYS = 30;

/**
 * Check whether the trial can be issued for this (email, ip) combo.
 * Returns null if allowed, or a reason string if blocked.
 */
export async function checkTrialEligibility(
  email: string,
  ip: string | null
): Promise<"already_used_email" | "ip_limit" | null> {
  const normalized = normalizeEmail(email);

  const emailRow = await pool.query(
    "SELECT 1 FROM trial_blocklist WHERE email_normalized = $1",
    [normalized]
  );
  if (emailRow.rows.length > 0) return "already_used_email";

  if (ip && ip !== "unknown") {
    const ipCount = await pool.query<{ c: string }>(
      `SELECT COUNT(DISTINCT email_normalized)::text AS c
       FROM trial_blocklist
       WHERE ip = $1 AND first_seen_at > NOW() - ($2::int * INTERVAL '1 day')`,
      [ip, TRIALS_PER_IP_WINDOW_DAYS]
    );
    const c = parseInt(ipCount.rows[0]?.c || "0", 10);
    if (c >= TRIALS_PER_IP_LIMIT) return "ip_limit";
  }

  return null;
}

/**
 * Record a trial as used in the blocklist (idempotent — increments trial_count
 * if email already exists).
 */
export async function recordTrialUsage(email: string, ip: string | null, fingerprint?: string | null): Promise<void> {
  const normalized = normalizeEmail(email);
  await pool.query(
    `INSERT INTO trial_blocklist (email_normalized, ip, device_fingerprint, trial_count, first_seen_at)
     VALUES ($1, $2, $3, 1, NOW())
     ON CONFLICT (email_normalized) DO UPDATE
       SET trial_count = trial_blocklist.trial_count + 1`,
    [normalized, ip, fingerprint || null]
  );
}

/**
 * Issue a Remnawave trial for the given local user (by id + email).
 * On success: persists remnawave_user_uuid, remnawave_short_uuid,
 * subscription_url, happ_crypto_link, trial_used_at on the users row, and
 * records the email in trial_blocklist.
 *
 * On Remnawave failure: returns success=false with reason="remnawave_unavailable".
 * The user row is left untouched so the next dashboard visit can retry.
 */
export async function issueTrial(
  userId: string,
  email: string,
  ip: string | null,
  fingerprint?: string | null
): Promise<TrialActivationResult> {
  const block = await checkTrialEligibility(email, ip);
  if (block) return { success: false, reason: block };

  const local = await getUserById(userId);
  // Use public_id (ST00000NNN) as the panel username — that's what
  // admins copy from the dashboard and search for. The legacy
  // panel_id (8-char hex) is kept as a column for backwards compat
  // but is NOT a useful identifier in the Remnawave UI.
  const rwUser = await createTrialUser(email, local?.publicId || local?.panelId || null);
  if (!rwUser) return { success: false, reason: "remnawave_unavailable" };

  const happLink = await encryptHappLink(rwUser.subscriptionUrl);

  await pool.query(
    `UPDATE users SET
       remnawave_user_uuid = $1,
       remnawave_short_uuid = $2,
       subscription_url = $3,
       happ_crypto_link = $4,
       crypto_link_updated_at = $5,
       trial_used_at = NOW(),
       subscription_end = $6
     WHERE id = $7 AND remnawave_user_uuid IS NULL`,
    [
      rwUser.uuid,
      rwUser.shortUuid || null,
      rwUser.subscriptionUrl,
      happLink,
      happLink ? new Date() : null,
      rwUser.expireAt ? new Date(rwUser.expireAt) : new Date(Date.now() + 24 * 60 * 60 * 1000),
      userId,
    ]
  );

  await recordTrialUsage(email, ip, fingerprint);

  return {
    success: true,
    subscriptionUrl: rwUser.subscriptionUrl,
    happCryptoLink: happLink,
    remnawaveUuid: rwUser.uuid,
    expireAt: rwUser.expireAt,
  };
}
