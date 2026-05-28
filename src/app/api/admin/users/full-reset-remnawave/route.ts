import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAllUsersByEmail, deleteUser as rwDeleteUser, isOurPanelUser } from "@/lib/remnawave";
import { syncSubscriptionToPanel } from "@/lib/subscription-sync";
import { verifyAdmin } from "../../middleware";

/**
 * Full reset for every locally-active user.
 *
 * Step 1: list all panel users that match each local user's email,
 *         and DELETE them (any stale records from earlier integration
 *         attempts).
 * Step 2: clear local Remnawave cache columns.
 * Step 3: call syncSubscriptionToPanel(id) — that creates a fresh
 *         panel user with username = public_id (ST00000xxx) and
 *         expireAt = subscription_end, then caches uuid +
 *         subscription_url + happ_crypto_link.
 *
 * Returns per-user details: email, public_id, deleted (count),
 * new uuid, new subscription_url, error.
 */
export async function POST() {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
  }

  const rows = (
    await pool.query<{ id: string; email: string }>(
      `SELECT id, email FROM users
       WHERE subscription_end > NOW()
       ORDER BY subscription_end DESC`
    )
  ).rows;

  type Row = {
    email: string;
    public_id: string | null;
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

  console.log(`[FULL-RESET] starting for ${rows.length} active users`);

  for (const row of rows) {
    const record: Row = {
      email: row.email,
      public_id: null,
      deleted: 0,
      uuid: null,
      subscription_url: null,
      error: null,
    };

    // 1. Delete ONLY panel users that belong to us.
    //
    // SAFETY: the panel is shared with the Telegram bot service. We
    // refuse to delete any panel user whose username doesn't start
    // with "ST" — even if the email matches, that record may belong
    // to the other service.
    try {
      const existing = await getAllUsersByEmail(row.email);
      for (const e of existing) {
        if (!isOurPanelUser(e)) {
          console.log(`[FULL-RESET] skip non-ours: ${e.username} (uuid=${e.uuid.slice(0, 8)}…) for ${row.email}`);
          continue;
        }
        const ok = await rwDeleteUser(e.uuid);
        if (ok) record.deleted += 1;
      }
    } catch (err) {
      console.warn(`[FULL-RESET] ${row.email} delete-existing exception:`, err);
    }

    // 2. Wipe local cache
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

    // 3. Run the standard sync flow (creates panel user with public_id)
    const sync = await syncSubscriptionToPanel(row.id);
    record.public_id = sync.publicId;
    record.uuid = sync.uuid;
    record.subscription_url = sync.subscriptionUrl;

    if (sync.ok) {
      result.created += 1;
    } else {
      result.failed += 1;
      record.error = sync.reason || sync.action;
    }
    result.users.push(record);
  }

  console.log(`[FULL-RESET] done — created=${result.created} failed=${result.failed}`);
  return NextResponse.json({ success: true, data: result });
}
