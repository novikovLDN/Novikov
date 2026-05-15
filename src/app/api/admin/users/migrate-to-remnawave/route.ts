import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { createUserWithExpire, encryptHappLink, getLastRwError } from "@/lib/remnawave";
import { verifyAdmin } from "../../middleware";

/**
 * Bulk-create Remnawave users for every locally-active subscriber who
 * doesn't yet have a remnawave_user_uuid. Expire date for the panel user
 * mirrors the local subscription_end.
 *
 * Returns counts: { eligible, migrated, failed, skipped }.
 * Idempotent — re-running picks up only the remaining ones.
 */
export async function POST() {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
  }

  const rows = (
    await pool.query<{ id: string; email: string; subscription_end: Date; panel_id: string | null }>(
      `SELECT id, email, subscription_end, panel_id FROM users
       WHERE remnawave_user_uuid IS NULL
         AND subscription_end > NOW()
       ORDER BY subscription_end DESC`
    )
  ).rows;

  const result = {
    eligible: rows.length,
    migrated: 0,
    failed: 0,
    skipped: 0,
    failures: [] as Array<{ email: string; reason: string }>,
  };

  for (const row of rows) {
    if (!row.panel_id) {
      // Should never happen after the panel_id backfill migration runs at
      // startup; report as a failure so the admin can investigate.
      result.failed += 1;
      result.failures.push({ email: row.email, reason: "panel_id is null" });
      continue;
    }

    const expireIso = new Date(row.subscription_end).toISOString();
    const rwUser = await createUserWithExpire(
      row.email,
      expireIso,
      "site admin bulk-migration of active subscription",
      row.panel_id
    );

    if (!rwUser) {
      result.failed += 1;
      result.failures.push({
        email: row.email,
        reason: getLastRwError() || "remnawave_unavailable",
      });
      continue;
    }

    // Refuse to write a UUID already owned by another local user —
    // the unique constraint would throw and abort the entire loop.
    const conflict = await pool.query<{ id: string }>(
      `SELECT id FROM users WHERE remnawave_user_uuid = $1 AND id != $2`,
      [rwUser.uuid, row.id]
    );
    if (conflict.rows.length > 0) {
      result.failed += 1;
      result.failures.push({
        email: row.email,
        reason: `uuid ${rwUser.uuid.slice(0, 8)}… already owned by another local user (use full reset)`,
      });
      continue;
    }

    const happLink = await encryptHappLink(rwUser.subscriptionUrl);

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
          row.id,
        ]
      );
      result.migrated += 1;
    } catch (err) {
      result.failed += 1;
      result.failures.push({
        email: row.email,
        reason: `db write failed: ${(err as Error).message?.slice(0, 100) || "unknown"}`,
      });
    }
  }

  return NextResponse.json({ success: true, data: result });
}
