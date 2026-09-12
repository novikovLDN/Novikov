/**
 * Trial eligibility (anti-abuse). Pure DB checks — no panel calls.
 *
 * The trial itself is granted inside user creation
 * (store.getOrCreateUser → ledger event `trial`); the panel user is
 * created afterwards by the sync. There is exactly one trial path for
 * the site UI, the legacy /api/auth/verify-code route and the bot.
 */

import { normalizeEmail } from "./email-normalize";
import type { Queryable } from "./subscription-ledger";

export type TrialBlockReason = "already_used_email" | "ip_limit" | "fingerprint_limit";

/** Distinct emails that may start a trial from one IP within the window. */
export const TRIALS_PER_IP_LIMIT = 3;
/** Distinct emails that may start a trial from one device fingerprint within the window. */
export const TRIALS_PER_FINGERPRINT_LIMIT = 2;
export const TRIAL_WINDOW_DAYS = 30;

const IPV4 = /^(\d{1,3}\.){3}\d{1,3}$/;
const IPV6 = /^[0-9a-f:]+$/i;

/** Only real addresses count for the IP limit ("unknown", "telegram-bot" do not). */
export function realIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const v = ip.trim();
  if (IPV4.test(v) || (v.includes(":") && IPV6.test(v))) return v;
  return null;
}

function cleanFingerprint(fp: string | null | undefined): string | null {
  if (!fp) return null;
  const v = fp.trim();
  return v.length >= 8 && v.length <= 200 ? v : null;
}

export async function checkTrialEligibility(
  db: Queryable,
  input: { email: string; ip?: string | null; fingerprint?: string | null }
): Promise<TrialBlockReason | null> {
  const normalized = normalizeEmail(input.email);
  const byEmail = await db.query("SELECT 1 FROM trial_blocklist WHERE email_normalized = $1", [normalized]);
  if (byEmail.rows.length > 0) return "already_used_email";

  const ip = realIp(input.ip);
  if (ip) {
    const r = await db.query<{ c: string }>(
      `SELECT COUNT(DISTINCT email_normalized)::text AS c FROM trial_blocklist
       WHERE ip = $1 AND first_seen_at > NOW() - ($2::int * INTERVAL '1 day')`,
      [ip, TRIAL_WINDOW_DAYS]
    );
    if (parseInt(r.rows[0]?.c || "0", 10) >= TRIALS_PER_IP_LIMIT) return "ip_limit";
  }

  const fp = cleanFingerprint(input.fingerprint);
  if (fp) {
    const r = await db.query<{ c: string }>(
      `SELECT COUNT(DISTINCT email_normalized)::text AS c FROM trial_blocklist
       WHERE device_fingerprint = $1 AND first_seen_at > NOW() - ($2::int * INTERVAL '1 day')`,
      [fp, TRIAL_WINDOW_DAYS]
    );
    if (parseInt(r.rows[0]?.c || "0", 10) >= TRIALS_PER_FINGERPRINT_LIMIT) return "fingerprint_limit";
  }
  return null;
}

/** Record a granted trial (idempotent per normalized email). */
export async function recordTrialUsage(
  db: Queryable,
  input: { email: string; ip?: string | null; fingerprint?: string | null }
): Promise<void> {
  await db.query(
    `INSERT INTO trial_blocklist (email_normalized, ip, device_fingerprint, trial_count, first_seen_at)
     VALUES ($1, $2, $3, 1, NOW())
     ON CONFLICT (email_normalized) DO UPDATE SET trial_count = trial_blocklist.trial_count + 1`,
    [normalizeEmail(input.email), realIp(input.ip), cleanFingerprint(input.fingerprint)]
  );
}
