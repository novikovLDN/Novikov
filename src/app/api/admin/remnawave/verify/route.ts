import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { describeRwError, getUserById, isUserGone } from "@/lib/remnawave";
import { verifyAdmin } from "../../middleware";

/**
 * Read-only: every local user with a stored panel id — does the panel
 * user exist, does it have a link, does expireAt match (±2 min, only
 * meaningful for live subscriptions)?
 */
export async function POST() {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
  }

  try {
    const rows = (
      await pool.query<{ email: string; subscription_end: Date; panel_user_id: string }>(
        `SELECT email, subscription_end, panel_user_id::text AS panel_user_id
         FROM users WHERE panel_user_id IS NOT NULL ORDER BY subscription_end DESC`
      )
    ).rows;

    const TOLERANCE_MS = 2 * 60 * 1000;
    const result = {
      checked: rows.length,
      ok: 0,
      missing_in_panel: 0,
      expire_drift: 0,
      no_sub_url: 0,
      panel_errors: 0,
      issues: [] as Array<{ email: string; problem: string; local_end?: string; panel_end?: string }>,
    };

    for (const row of rows) {
      const r = await getUserById(Number(row.panel_user_id));
      if (!r.ok) {
        if (isUserGone(r)) {
          result.missing_in_panel += 1;
          result.issues.push({ email: row.email, problem: "не найден в панели" });
        } else {
          result.panel_errors += 1;
          result.issues.push({ email: row.email, problem: `панель не ответила: ${describeRwError(r)}` });
        }
        continue;
      }
      if (!r.data.subscriptionUrl) {
        result.no_sub_url += 1;
        result.issues.push({ email: row.email, problem: "панель не вернула subscriptionUrl" });
        continue;
      }
      const localEnd = new Date(row.subscription_end).getTime();
      const panelEnd = Date.parse(r.data.expireAt || "");
      if (localEnd > Date.now() && Math.abs(localEnd - panelEnd) > TOLERANCE_MS) {
        result.expire_drift += 1;
        result.issues.push({
          email: row.email,
          problem: "expireAt не совпадает",
          local_end: new Date(localEnd).toISOString(),
          panel_end: Number.isFinite(panelEnd) ? new Date(panelEnd).toISOString() : "—",
        });
        continue;
      }
      result.ok += 1;
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error("[ADMIN/VERIFY] error:", err);
    return NextResponse.json({ success: false, error: "Внутренняя ошибка" }, { status: 500 });
  }
}
