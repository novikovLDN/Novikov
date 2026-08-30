/**
 * Panel-sync audit — the single source of truth for "does this local
 * user match what the Remnawave panel actually holds?"
 *
 * Every problem class we can detect is enumerated in `AuditProblem`
 * so the UI never has to guess what "kind of broken" a user is; the
 * fix flow uses the same problem list to pick which users to touch.
 *
 * Kept in its own module so both the /api/admin/remnawave/audit
 * endpoint and the unit tests can exercise the same logic against a
 * mocked panel client.
 */

import { pool } from "./db";
import { getUser, tagForPlan, RemnawaveUser } from "./remnawave";
import type { UserRecord } from "./store";

export type AuditProblem =
  /** No remnawave_user_uuid on the local row → user was never provisioned. */
  | "no_uuid"
  /** uuid points at a panel record that no longer exists (404 from panel). */
  | "missing_in_panel"
  /** Panel didn't return a subscriptionUrl at all. */
  | "url_missing"
  /** Local subscription_end and panel expireAt disagree beyond tolerance. */
  | "date_drift"
  /** Local subscription is live but panel status is not ACTIVE. */
  | "status_mismatch"
  /** Panel tag doesn't match the local plan (e.g. panel still says TRIAL for a paid user). */
  | "tag_mismatch";

export interface AuditRow {
  userId: string;
  email: string;
  publicId: string | null;
  panelUuid: string | null;
  localSubscriptionEnd: string;
  panelExpireAt: string | null;
  localPlan: string;
  panelTag: string | null;
  panelStatus: string | null;
  panelSubscriptionUrl: string | null;
  problems: AuditProblem[];
  /** Only populated when `apply=true` — result of the repair pass. */
  fixApplied?: boolean;
  fixError?: string;
  fixSummary?: string;
}

export interface AuditReport {
  scanned: number;
  ok: number;
  /** How many rows had at least one problem. */
  broken: number;
  /** Applied fixes count (0 when dryRun). */
  fixed: number;
  fixFailed: number;
  byProblem: Record<AuditProblem, number>;
  rows: AuditRow[];
}

/** ±2 minutes on date comparison — covers panel/local clock drift. */
export const DATE_DRIFT_TOLERANCE_MS = 2 * 60 * 1000;

/** How far back to include already-expired users in the audit. */
const RECENT_EXPIRY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

interface UserRow {
  id: string;
  email: string;
  public_id: string | null;
  subscription_end: Date;
  subscription_plan: string | null;
  remnawave_user_uuid: string | null;
}

function emptyByProblem(): Record<AuditProblem, number> {
  return {
    no_uuid: 0,
    missing_in_panel: 0,
    url_missing: 0,
    date_drift: 0,
    status_mismatch: 0,
    tag_mismatch: 0,
  };
}

/**
 * Compute the audit problems for ONE local user against ONE fresh
 * panel snapshot. Pure — no DB or network access; both are injected.
 * Used by both the bulk audit endpoint and unit tests.
 */
export function diffUser(
  local: Pick<UserRow, "subscription_end" | "subscription_plan" | "remnawave_user_uuid">,
  panelUser: RemnawaveUser | null
): {
  problems: AuditProblem[];
  panelExpireAt: string | null;
  panelTag: string | null;
  panelStatus: string | null;
  panelSubscriptionUrl: string | null;
} {
  const problems: AuditProblem[] = [];

  if (!local.remnawave_user_uuid) {
    return {
      problems: ["no_uuid"],
      panelExpireAt: null,
      panelTag: null,
      panelStatus: null,
      panelSubscriptionUrl: null,
    };
  }

  if (!panelUser) {
    return {
      problems: ["missing_in_panel"],
      panelExpireAt: null,
      panelTag: null,
      panelStatus: null,
      panelSubscriptionUrl: null,
    };
  }

  if (!panelUser.subscriptionUrl) {
    problems.push("url_missing");
  }

  const localEndMs = new Date(local.subscription_end).getTime();
  const panelEndMs = new Date(panelUser.expireAt || 0).getTime();
  if (Math.abs(localEndMs - panelEndMs) > DATE_DRIFT_TOLERANCE_MS) {
    problems.push("date_drift");
  }

  const nowMs = Date.now();
  const localLive = localEndMs > nowMs;
  if (localLive && panelUser.status !== "ACTIVE") {
    problems.push("status_mismatch");
  }

  const expectedTag = tagForPlan(local.subscription_plan);
  if (expectedTag && (panelUser.tag ?? null) !== expectedTag) {
    problems.push("tag_mismatch");
  }

  return {
    problems,
    panelExpireAt: panelUser.expireAt || null,
    panelTag: panelUser.tag ?? null,
    panelStatus: panelUser.status ?? null,
    panelSubscriptionUrl: panelUser.subscriptionUrl || null,
  };
}

/**
 * Walk every local user with either an active-ish subscription_end
 * (up to 7 days after expiry) or a stored panel uuid, and emit a
 * per-user diff. Read-only.
 */
export async function auditPanelSync(): Promise<AuditReport> {
  const cutoff = new Date(Date.now() - RECENT_EXPIRY_WINDOW_MS);
  const rows = (
    await pool.query<UserRow>(
      `SELECT id, email, public_id, subscription_end, subscription_plan, remnawave_user_uuid
       FROM users
       WHERE remnawave_user_uuid IS NOT NULL
          OR subscription_end > $1
       ORDER BY subscription_end DESC`,
      [cutoff]
    )
  ).rows;

  const byProblem = emptyByProblem();
  const outRows: AuditRow[] = [];
  let ok = 0;
  let broken = 0;

  for (const row of rows) {
    let panelUser: RemnawaveUser | null = null;
    if (row.remnawave_user_uuid) {
      panelUser = await getUser(row.remnawave_user_uuid);
    }
    const diff = diffUser(row, panelUser);

    for (const p of diff.problems) byProblem[p] += 1;
    if (diff.problems.length === 0) ok += 1;
    else broken += 1;

    outRows.push({
      userId: row.id,
      email: row.email,
      publicId: row.public_id,
      panelUuid: row.remnawave_user_uuid,
      localSubscriptionEnd: new Date(row.subscription_end).toISOString(),
      panelExpireAt: diff.panelExpireAt,
      localPlan: row.subscription_plan || "trial",
      panelTag: diff.panelTag,
      panelStatus: diff.panelStatus,
      panelSubscriptionUrl: diff.panelSubscriptionUrl,
      problems: diff.problems,
    });
  }

  return {
    scanned: rows.length,
    ok,
    broken,
    fixed: 0,
    fixFailed: 0,
    byProblem,
    rows: outRows,
  };
}

// Legacy alias so a caller doesn't have to reach for `UserRecord` here.
export type _UserRecord = UserRecord;
