/**
 * Atlas Secure ↔ Remnawave reconciliation worker.
 *
 * Pass-by-pass verifier *and* fixer. Walks every user in our DB that
 * might need a working VPN profile (active or recently-expired
 * subscription, or telegram-linked) and confirms three things:
 *
 *   1. A panel profile exists for them.
 *   2. The panel's expireAt matches users.subscription_end.
 *   3. We have a subscription_url cached locally.
 *
 * For any user that is already consistent: do nothing.
 * For any user that isn't: call syncSubscriptionToPanel (idempotent;
 * only create or PATCH, never DELETE). Then re-classify so the report
 * shows what was repaired.
 *
 * Non-destructive by design: this worker never deletes a panel user,
 * never wipes a subscription, never lowers subscription_end. The only
 * side effects are
 *   - create missing panel profile,
 *   - PATCH expireAt up or down to match local subscription_end (which
 *     is our source of truth — admins edit that, not the panel),
 *   - cache panel uuid / subscription_url locally if they were missing.
 *
 * Background to the bug this catches: when a user already has a
 * Telegram-bot subscription and then links Telegram to a freshly
 * created site account, the link flow updates telegram_id but never
 * triggers a panel sync, so the site shows a broken key until the
 * hourly sync-worker catches up. This pass runs the same fix on
 * demand and produces a per-user audit trail so support can verify.
 */

import { pool } from "./db";
import { getUser } from "./remnawave";
import { syncSubscriptionToPanel } from "./subscription-sync";

const SCAN_GRACE_MS = 7 * 24 * 60 * 60 * 1000;
const EXPIRE_TOLERANCE_MS = 2 * 60 * 1000;

export type IssueKind =
  | "missing_panel_user"
  | "stale_uuid"
  | "expire_drift"
  | "no_sub_url";

export interface UserIssue {
  userId: string;
  email: string;
  publicId: string | null;
  telegramId: string | null;
  kind: IssueKind;
  localEnd: string;
  panelEnd: string | null;
  fixed: boolean;
  fixAction: "skip" | "patched" | "created" | "adopted" | "failed" | null;
  fixError?: string;
}

export interface ReconciliationReport {
  scanned: number;
  ok: number;
  needed_fix: number;
  fixed: number;
  failed: number;
  by_kind: Record<IssueKind, number>;
  issues: UserIssue[];
  durationMs: number;
}

interface UserRow {
  id: string;
  email: string;
  public_id: string | null;
  telegram_id: string | null;
  subscription_end: Date;
  remnawave_user_uuid: string | null;
  subscription_url: string | null;
}

let running = false;

/**
 * Classify a single user's panel state before any fix is attempted.
 * Returns null if everything is in order.
 *
 * Already-expired users (subscription_end in the past) are deliberately
 * skipped — Remnawave auto-disables on expireAt, so once both sides
 * are past there's nothing to reconcile and any PATCH would just hit
 * the panel's "Expiration date cannot be in the past" validator.
 */
async function classify(row: UserRow): Promise<{ kind: IssueKind; panelEnd: string | null } | null> {
  const now = Date.now();
  const localMs = new Date(row.subscription_end).getTime();
  const localExpired = localMs <= now;

  if (!row.remnawave_user_uuid) {
    // Expired sub without panel profile — leave alone; creating an
    // immediately-disabled user is noise.
    if (localExpired) return null;
    return { kind: "missing_panel_user", panelEnd: null };
  }
  const panel = await getUser(row.remnawave_user_uuid);
  if (!panel) {
    // Expired sub whose panel profile is also gone — nothing to do.
    if (localExpired) return null;
    return { kind: "stale_uuid", panelEnd: null };
  }
  if (!panel.subscriptionUrl || !row.subscription_url) {
    return { kind: "no_sub_url", panelEnd: panel.expireAt || null };
  }
  const panelMs = panel.expireAt ? new Date(panel.expireAt).getTime() : 0;
  // Both sides already expired — panel handles disable on its own.
  if (localExpired && panelMs <= now) return null;
  if (Math.abs(localMs - panelMs) > EXPIRE_TOLERANCE_MS) {
    return { kind: "expire_drift", panelEnd: panel.expireAt || null };
  }
  return null;
}

/**
 * Run one full reconciliation pass. Safe to call concurrently — extra
 * calls return immediately with an empty report instead of stacking
 * panel requests.
 */
export async function runReconciliation(): Promise<ReconciliationReport> {
  const t0 = Date.now();
  const empty: ReconciliationReport = {
    scanned: 0,
    ok: 0,
    needed_fix: 0,
    fixed: 0,
    failed: 0,
    by_kind: { missing_panel_user: 0, stale_uuid: 0, expire_drift: 0, no_sub_url: 0 },
    issues: [],
    durationMs: 0,
  };

  if (running) {
    console.log("[RECONCILE] previous pass in flight, skipping");
    return empty;
  }
  running = true;

  try {
    const rows = (
      await pool.query<UserRow>(
        `SELECT id, email, public_id, telegram_id, subscription_end,
                remnawave_user_uuid, subscription_url
         FROM users
         WHERE subscription_end > NOW() - INTERVAL '${SCAN_GRACE_MS} milliseconds'
            OR telegram_linked = TRUE
         ORDER BY subscription_end DESC`
      )
    ).rows;

    const report: ReconciliationReport = { ...empty, scanned: rows.length };

    for (const row of rows) {
      const verdict = await classify(row);
      if (!verdict) {
        report.ok += 1;
        continue;
      }

      report.needed_fix += 1;
      report.by_kind[verdict.kind] += 1;

      const issue: UserIssue = {
        userId: row.id,
        email: row.email,
        publicId: row.public_id,
        telegramId: row.telegram_id,
        kind: verdict.kind,
        localEnd: new Date(row.subscription_end).toISOString(),
        panelEnd: verdict.panelEnd,
        fixed: false,
        fixAction: null,
      };

      try {
        const result = await syncSubscriptionToPanel(row.id);
        issue.fixAction = result.action;
        issue.fixed = result.ok && result.action !== "failed";
        if (issue.fixed) report.fixed += 1;
        else {
          report.failed += 1;
          issue.fixError = result.panelError
            ? `${result.reason || "unknown"}: ${result.panelError}`
            : result.reason || "unknown";
        }
      } catch (err) {
        report.failed += 1;
        issue.fixAction = "failed";
        issue.fixError = err instanceof Error ? err.message : String(err);
        console.error(`[RECONCILE] sync threw for ${row.email}:`, err);
      }

      report.issues.push(issue);
    }

    report.durationMs = Date.now() - t0;
    console.log(
      `[RECONCILE] pass complete — scanned=${report.scanned} ok=${report.ok} ` +
        `needed_fix=${report.needed_fix} fixed=${report.fixed} failed=${report.failed} ` +
        `(${report.durationMs}ms)`
    );
    return report;
  } catch (err) {
    console.error("[RECONCILE] pass error:", err);
    return { ...empty, durationMs: Date.now() - t0 };
  } finally {
    running = false;
  }
}
