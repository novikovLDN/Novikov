import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getUser } from "@/lib/remnawave";
import { verifyAdmin } from "../../middleware";

/**
 * Verify that every local user with a remnawave_user_uuid actually
 * exists in the panel and that the panel's expireAt matches the local
 * subscription_end (within a 2-minute tolerance for clock skew).
 *
 * Reports per-user: ok | missing_in_panel | expire_drift | no_sub_url.
 * Read-only — does not modify anything.
 */
export async function POST() {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
  }

  const rows = (
    await pool.query<{
      id: string;
      email: string;
      subscription_end: Date;
      remnawave_user_uuid: string | null;
      subscription_url: string | null;
    }>(
      `SELECT id, email, subscription_end, remnawave_user_uuid, subscription_url
       FROM users
       WHERE remnawave_user_uuid IS NOT NULL
       ORDER BY subscription_end DESC`
    )
  ).rows;

  const TOLERANCE_MS = 2 * 60 * 1000;
  const result = {
    checked: rows.length,
    ok: 0,
    missing_in_panel: 0,
    expire_drift: 0,
    no_sub_url: 0,
    issues: [] as Array<{
      email: string;
      problem: string;
      local_end?: string;
      panel_end?: string;
    }>,
  };

  for (const row of rows) {
    const panelUser = await getUser(row.remnawave_user_uuid as string);

    if (!panelUser) {
      result.missing_in_panel += 1;
      result.issues.push({ email: row.email, problem: "не найден в панели (uuid протух)" });
      continue;
    }

    if (!panelUser.subscriptionUrl) {
      result.no_sub_url += 1;
      result.issues.push({ email: row.email, problem: "панель не вернула subscriptionUrl" });
      continue;
    }

    const localEnd = new Date(row.subscription_end).getTime();
    const panelEnd = new Date(panelUser.expireAt || 0).getTime();
    if (Math.abs(localEnd - panelEnd) > TOLERANCE_MS) {
      result.expire_drift += 1;
      result.issues.push({
        email: row.email,
        problem: "expireAt не совпадает",
        local_end: new Date(localEnd).toISOString(),
        panel_end: new Date(panelEnd).toISOString(),
      });
      continue;
    }

    result.ok += 1;
  }

  return NextResponse.json({ success: true, data: result });
}
