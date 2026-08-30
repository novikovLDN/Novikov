import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "../../middleware";
import { auditPanelSync, AuditReport, AuditRow } from "@/lib/panel-audit";
import { syncSubscriptionToPanel } from "@/lib/subscription-sync";
import { getUser } from "@/lib/remnawave";
import { diffUser } from "@/lib/panel-audit";
import { pool } from "@/lib/db";

/**
 * POST /api/admin/remnawave/audit
 *
 * Full local ↔ panel sync audit + optional apply-fix.
 *
 * Body: { apply?: boolean } (default false — dry-run only)
 *
 * Dry-run response: per-user diff of every mismatch class (missing
 * panel user, uuid stale, subscriptionUrl empty, date drift, status
 * !== ACTIVE while local is live, tag doesn't match plan).
 *
 * apply=true: for every broken user, runs syncSubscriptionToPanel —
 * which already carries the full repair pipeline: ghost-date fix,
 * expireAt push, status: ACTIVE, plan tag. Re-audits each fixed user
 * so the response also shows the AFTER state. Returns per-user error
 * messages verbatim on failure so the UI can surface them.
 */
export async function POST(request: NextRequest) {
  // Top-level try/catch guarantees a JSON response even if something
  // deep in the pipeline throws. Without it, a Next.js default 500 HTML
  // page comes back and the browser's res.json() dies with the
  // Safari-specific "The string did not match the expected pattern"
  // message — impossible to diagnose from the UI.
  try {
    const auth = await verifyAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const apply = body?.apply === true;
    // Process a chunk per call so nginx doesn't 504. Default chunk 25:
    // ~4-5 sec per user × 25 = ~2 min headroom well under most reverse
    // proxy timeouts. UI iterates calls with `offset` until `hasMore`
    // is false.
    const chunk = Number.isFinite(body?.chunk) && body.chunk > 0 && body.chunk <= 100 ? body.chunk : 25;
    const offset = Number.isFinite(body?.offset) && body.offset >= 0 ? body.offset : 0;

    const report: AuditReport = await auditPanelSync();

    if (!apply) {
      return NextResponse.json({ success: true, data: { ...report, hasMore: false } });
    }

    // ─── Apply pass ───
    let fixed = 0;
    let fixFailed = 0;
    // Only touch rows in the current chunk window whose problems > 0.
    // Skip rows before `offset` and stop after `chunk` broken rows
    // fixed. Rows outside the window retain their pre-apply diff.
    let brokenSeen = 0;
    let brokenProcessedInChunk = 0;
    for (const row of report.rows) {
      if (row.problems.length === 0) continue;
      const localIndex = brokenSeen;
      brokenSeen += 1;
      if (localIndex < offset) continue;
      if (brokenProcessedInChunk >= chunk) continue;
      brokenProcessedInChunk += 1;

      try {
        const syncResult = await syncSubscriptionToPanel(row.userId);
        if (!syncResult.ok) {
          row.fixApplied = false;
          row.fixError =
            `sync action=${syncResult.action} reason=${syncResult.reason ?? "unknown"}` +
            (syncResult.panelError ? ` panelError="${syncResult.panelError}"` : "");
          fixFailed += 1;
          continue;
        }

        // Re-audit this specific user to show AFTER state. Wrapped so
        // a re-audit failure only affects reporting for that row —
        // the fix itself already succeeded.
        let diff: ReturnType<typeof diffUser> | null = null;
        try {
          const fresh = await pool.query<{
            subscription_end: Date;
            subscription_plan: string | null;
            remnawave_user_uuid: string | null;
          }>(
            `SELECT subscription_end, subscription_plan, remnawave_user_uuid
             FROM users WHERE id = $1`,
            [row.userId]
          );
          const nowRow = fresh.rows[0];
          const panelUser = nowRow?.remnawave_user_uuid
            ? await getUser(nowRow.remnawave_user_uuid).catch(() => null)
            : null;
          diff = nowRow ? diffUser(nowRow, panelUser) : null;
        } catch (reErr) {
          console.warn(
            `[AUDIT] re-audit threw for ${row.email}:`,
            reErr instanceof Error ? reErr.message : String(reErr)
          );
        }

        row.fixApplied = true;
        if (diff) {
          row.fixSummary =
            `after: expireAt=${diff.panelExpireAt ?? "—"} status=${diff.panelStatus ?? "—"} tag=${diff.panelTag ?? "—"} problems=${diff.problems.length ? diff.problems.join(",") : "none"}`;
          row.problems = diff.problems;
          row.panelExpireAt = diff.panelExpireAt;
          row.panelTag = diff.panelTag;
          row.panelStatus = diff.panelStatus;
          row.panelSubscriptionUrl = diff.panelSubscriptionUrl;
        } else {
          row.fixSummary = "after: re-audit failed (см. server-side лог)";
        }
        fixed += 1;
      } catch (err) {
        row.fixApplied = false;
        row.fixError = err instanceof Error ? err.message : String(err);
        fixFailed += 1;
      }
    }

    // Recompute summary numbers after re-audit
    const byProblem = { ...report.byProblem };
    Object.keys(byProblem).forEach((k) => ((byProblem as Record<string, number>)[k] = 0));
    let ok = 0;
    let broken = 0;
    for (const r of report.rows) {
      for (const p of r.problems) (byProblem as Record<string, number>)[p] += 1;
      if (r.problems.length === 0) ok += 1;
      else broken += 1;
    }

    const finalReport: AuditReport & { hasMore: boolean; nextOffset: number } = {
      scanned: report.scanned,
      ok,
      broken,
      fixed,
      fixFailed,
      byProblem,
      rows: report.rows,
      hasMore: broken > offset + brokenProcessedInChunk,
      nextOffset: offset + brokenProcessedInChunk,
    };

    return NextResponse.json({ success: true, data: finalReport });
  } catch (err) {
    console.error("[ADMIN/AUDIT] top-level error:", err);
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error
            ? `${err.name}: ${err.message}`
            : "Внутренняя ошибка. См. server-side лог.",
      },
      { status: 500 }
    );
  }
}

// suppress lint on AuditRow unused import when TS re-exports through
// `AuditReport`.
export type _AuditRow = AuditRow;
