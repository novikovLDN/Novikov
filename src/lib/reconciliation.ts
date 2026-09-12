/**
 * Local ↔ Remnawave reconciliation: compare, and repair only what differs.
 *
 * Scope: users whose subscription is live or ended in the last 8 days,
 * plus anyone the panel was last seen holding ACTIVE/LIMITED (to catch
 * users who kept access after expiry under the old +24h behaviour).
 *
 * Repair = syncUserToPanel (create / absolute PATCH / DISABLE on early
 * revoke). Never deletes a panel user, never pushes a grace period.
 * A panel that cannot be asked is reported as an error, not "fixed".
 */

import { pool } from "./db";
import { describeRwError, getUserById, isUserGone, SITE_TAGS, tagForPlan } from "./remnawave";
import { MIN_REMAINING_MS, syncUserToPanel } from "./subscription-sync";

const EXPIRE_TOLERANCE_MS = 2 * 60 * 1000;

export type IssueKind = "missing_panel_user" | "stale_uuid" | "expire_drift" | "no_sub_url";

export interface UserIssue {
  userId: string;
  email: string;
  publicId: string | null;
  telegramId: string | null;
  kind: IssueKind;
  localEnd: string;
  panelEnd: string | null;
  panelUsername?: string | null;
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
  /** Users the panel could not be asked about (network/auth/5xx). */
  errors: Array<{ userId: string; email: string; error: string }>;
  durationMs: number;
}

interface UserRow {
  id: string;
  email: string;
  public_id: string | null;
  telegram_id: string | null;
  subscription_end: Date;
  subscription_plan: string | null;
  panel_user_id: string | null;
  subscription_url: string | null;
}

type Verdict = { kind: IssueKind; panelEnd: string | null; panelUsername?: string | null } | { error: string } | null;

async function classify(row: UserRow): Promise<Verdict> {
  const now = Date.now();
  const localMs = new Date(row.subscription_end).getTime();
  const live = localMs - now > MIN_REMAINING_MS;
  const id = row.panel_user_id ? Number(row.panel_user_id) : null;

  if (!id) return live ? { kind: "missing_panel_user", panelEnd: null } : null;

  const r = await getUserById(id);
  if (!r.ok) {
    if (isUserGone(r)) return live ? { kind: "stale_uuid", panelEnd: null } : null;
    return { error: describeRwError(r) };
  }
  const p = r.data;
  const panelMs = Date.parse(p.expireAt);

  if (!live) {
    const stillActive = (p.status === "ACTIVE" || p.status === "LIMITED") && panelMs > now;
    return stillActive ? { kind: "expire_drift", panelEnd: p.expireAt, panelUsername: p.username } : null;
  }
  if (!p.subscriptionUrl || !row.subscription_url || p.subscriptionUrl !== row.subscription_url) {
    return { kind: "no_sub_url", panelEnd: p.expireAt || null, panelUsername: p.username };
  }
  const expectedTag = tagForPlan(row.subscription_plan) ?? SITE_TAGS.trial;
  if (Math.abs(localMs - panelMs) > EXPIRE_TOLERANCE_MS || p.status !== "ACTIVE" || p.tag !== expectedTag) {
    return { kind: "expire_drift", panelEnd: p.expireAt || null, panelUsername: p.username };
  }
  return null;
}

let running = false;

export async function runReconciliation(): Promise<ReconciliationReport> {
  const t0 = Date.now();
  const report: ReconciliationReport = {
    scanned: 0,
    ok: 0,
    needed_fix: 0,
    fixed: 0,
    failed: 0,
    by_kind: { missing_panel_user: 0, stale_uuid: 0, expire_drift: 0, no_sub_url: 0 },
    issues: [],
    errors: [],
    durationMs: 0,
  };
  if (running) {
    console.log("[RECONCILE] previous pass in flight, skipping");
    return report;
  }
  running = true;
  try {
    const rows = (
      await pool.query<UserRow>(
        `SELECT id, email, public_id, telegram_id, subscription_end, subscription_plan,
                panel_user_id::text AS panel_user_id, subscription_url
         FROM users
         WHERE subscription_end > NOW() - INTERVAL '8 days'
            OR panel_status IN ('ACTIVE', 'LIMITED')
         ORDER BY subscription_end DESC`
      )
    ).rows;
    report.scanned = rows.length;

    for (const row of rows) {
      let verdict: Verdict;
      try {
        verdict = await classify(row);
      } catch (err) {
        verdict = { error: err instanceof Error ? err.message : String(err) };
      }
      if (verdict === null) {
        report.ok += 1;
        continue;
      }
      if ("error" in verdict) {
        report.failed += 1;
        report.errors.push({ userId: row.id, email: row.email, error: verdict.error });
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
        panelUsername: verdict.panelUsername ?? null,
        fixed: false,
        fixAction: null,
      };
      const res = await syncUserToPanel(row.id);
      const action = res.action;
      issue.fixAction =
        action === "created" || action === "adopted" || action === "patched" ? action : action === "disabled" ? "patched" : action === "noop" ? "skip" : "failed";
      issue.fixed = res.ok;
      if (res.ok) report.fixed += 1;
      else {
        report.failed += 1;
        issue.fixError = res.panelError ? `${res.reason ?? "unknown"}: ${res.panelError}` : res.reason ?? "unknown";
      }
      report.issues.push(issue);
    }

    report.durationMs = Date.now() - t0;
    console.log(
      `[RECONCILE] scanned=${report.scanned} ok=${report.ok} needed_fix=${report.needed_fix} fixed=${report.fixed} failed=${report.failed} (${report.durationMs}ms)`
    );
    return report;
  } finally {
    running = false;
  }
}
