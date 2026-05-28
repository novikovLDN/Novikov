import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import {
  getUserByEmail as rwGetUserByEmail,
  getUserByUsername as rwGetUserByUsername,
  deleteUser as rwDeleteUser,
  setUserExpire,
  getLastRwError,
  isOurPanelUser,
} from "@/lib/remnawave";
import { verifyAdmin } from "../../middleware";

/**
 * Clean up duplicate Remnawave users created by previous buggy migration
 * runs.
 *
 * Strategy: for each local user with a panel_id we
 *   1. fetch the canonical panel user by panel_id (the username we now
 *      always use)
 *   2. fetch panel users by email — every hit whose username differs
 *      from panel_id is a duplicate
 *   3. delete the duplicates
 *   4. align the canonical's expireAt with the local subscription_end
 *   5. ensure our DB row stores the canonical uuid + subscription_url
 *
 * Safe to re-run; idempotent.
 */
export async function POST() {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
  }

  const rows = (
    await pool.query<{ id: string; email: string; subscription_end: Date; panel_id: string | null; remnawave_user_uuid: string | null }>(
      `SELECT id, email, subscription_end, panel_id, remnawave_user_uuid FROM users
       WHERE panel_id IS NOT NULL
       ORDER BY subscription_end DESC`
    )
  ).rows;

  const result = {
    scanned: rows.length,
    canonical_repaired: 0,
    duplicates_deleted: 0,
    failed: 0,
    failures: [] as Array<{ email: string; reason: string }>,
  };

  for (const row of rows) {
    if (!row.panel_id) continue;

    const canonical = await rwGetUserByUsername(row.panel_id);
    const byEmail = await rwGetUserByEmail(row.email);

    // Collect every panel uuid touching this email
    const seen = new Map<string, { uuid: string; username: string }>();
    if (canonical?.uuid) seen.set(canonical.uuid, { uuid: canonical.uuid, username: canonical.username });
    if (byEmail?.uuid) seen.set(byEmail.uuid, { uuid: byEmail.uuid, username: byEmail.username });

    if (seen.size === 0) {
      // Nothing in panel for this user — skip.
      continue;
    }

    // Pick the canonical: prefer the one whose username === panel_id;
    // fall back to byEmail if canonical lookup missed it.
    const chosen = canonical?.uuid || byEmail?.uuid;
    if (!chosen) {
      result.failed += 1;
      result.failures.push({ email: row.email, reason: getLastRwError() || "no canonical found" });
      continue;
    }

    // Delete every other panel user that maps to this email — but
    // ONLY if its username starts with "ST" (our prefix). Panel users
    // from the shared Telegram bot service must be left alone even if
    // they share an email.
    for (const entry of seen.values()) {
      if (entry.uuid === chosen) continue;
      if (!isOurPanelUser({ username: entry.username })) {
        console.log(`[CLEANUP] skip non-ours: ${entry.username} (uuid=${entry.uuid.slice(0, 8)}…) for ${row.email}`);
        continue;
      }
      const ok = await rwDeleteUser(entry.uuid);
      if (ok) {
        result.duplicates_deleted += 1;
        console.log(`[CLEANUP] deleted duplicate ${entry.username} (${entry.uuid.slice(0, 8)}…) for ${row.email}`);
      } else {
        result.failed += 1;
        result.failures.push({ email: row.email, reason: `delete ${entry.uuid.slice(0, 8)}… failed: ${getLastRwError() || "unknown"}` });
      }
    }

    // Sync canonical's expireAt to local subscription_end
    const expireIso = new Date(row.subscription_end).toISOString();
    await setUserExpire(chosen, expireIso);

    // Repair local DB if it points to a different (deleted) uuid or no uuid
    if (row.remnawave_user_uuid !== chosen) {
      await pool.query(
        `UPDATE users SET remnawave_user_uuid = $1 WHERE id = $2`,
        [chosen, row.id]
      );
      result.canonical_repaired += 1;
    }
  }

  return NextResponse.json({ success: true, data: result });
}
