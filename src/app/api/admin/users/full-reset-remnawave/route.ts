import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import {
  getAllUsersByEmail,
  deleteUser as rwDeleteUser,
  createUserWithExpire,
  encryptHappLink,
  getLastRwError,
} from "@/lib/remnawave";
import { verifyAdmin } from "../../middleware";
import crypto from "crypto";

/**
 * NUCLEAR: for every locally-active user
 *   1. Find every panel user that matches their email — DELETE all of them.
 *   2. Reset local Remnawave columns (uuid, subscription_url, happ link).
 *   3. Ensure panel_id exists.
 *   4. Create a fresh panel user with username = panel_id and
 *      expireAt = subscription_end.
 *   5. Persist uuid + subscription_url + happ_crypto_link.
 *
 * Returns per-user records: email, panel_id, deleted (count of duplicates
 * removed), uuid (new), subscription_url (new), error.
 *
 * This is the recovery tool for installations that ended up with
 * inconsistent panel state from earlier integration bugs.
 */
export async function POST() {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
  }

  const rows = (
    await pool.query<{ id: string; email: string; subscription_end: Date; panel_id: string | null }>(
      `SELECT id, email, subscription_end, panel_id FROM users
       WHERE subscription_end > NOW()
       ORDER BY subscription_end DESC`
    )
  ).rows;

  type Row = {
    email: string;
    panel_id: string | null;
    deleted: number;
    uuid: string | null;
    subscription_url: string | null;
    error: string | null;
  };

  const result: { total: number; created: number; failed: number; users: Row[] } = {
    total: rows.length,
    created: 0,
    failed: 0,
    users: [],
  };

  for (const row of rows) {
    const record: Row = {
      email: row.email,
      panel_id: row.panel_id,
      deleted: 0,
      uuid: null,
      subscription_url: null,
      error: null,
    };

    // 1. Wipe panel users matching this email
    const existing = await getAllUsersByEmail(row.email);
    for (const e of existing) {
      const ok = await rwDeleteUser(e.uuid);
      if (ok) record.deleted += 1;
    }

    // 2. Wipe local Remnawave columns for clean state
    await pool.query(
      `UPDATE users SET
         remnawave_user_uuid = NULL,
         remnawave_short_uuid = NULL,
         subscription_url = NULL,
         happ_crypto_link = NULL,
         crypto_link_updated_at = NULL
       WHERE id = $1`,
      [row.id]
    );

    // 3. Ensure panel_id
    let panelId = row.panel_id;
    if (!panelId) {
      panelId = crypto.randomBytes(4).toString("hex");
      await pool.query(`UPDATE users SET panel_id = $1 WHERE id = $2`, [panelId, row.id]);
      record.panel_id = panelId;
    }

    // 4. Create fresh in panel
    const expireIso = new Date(row.subscription_end).toISOString();
    const rwUser = await createUserWithExpire(row.email, expireIso, "admin full-reset", panelId);
    if (!rwUser) {
      record.error = getLastRwError() || "create failed";
      result.failed += 1;
      result.users.push(record);
      continue;
    }

    // 5. Persist
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
        row.id,
      ]
    );

    record.uuid = rwUser.uuid;
    record.subscription_url = rwUser.subscriptionUrl;
    result.created += 1;
    result.users.push(record);
  }

  return NextResponse.json({ success: true, data: result });
}
