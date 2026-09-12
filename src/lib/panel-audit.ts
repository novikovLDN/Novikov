/**
 * Panel-sync audit — "does this local user match what the Remnawave
 * panel actually holds?" Read-only; the admin endpoint decides whether
 * to repair (via syncUserToPanel).
 */

import { pool } from "./db";
import { describeRwError, getUserById, isUserGone, PanelUser, SITE_TAGS, tagForPlan } from "./remnawave";
import { MIN_REMAINING_MS } from "./subscription-sync";

export type AuditProblem =
  /** Live subscription but no panel id stored → never provisioned. */
  | "no_uuid"
  /** Stored panel id, the panel says the user does not exist (A025/A063). */
  | "missing_in_panel"
  /** Panel returned no subscriptionUrl. */
  | "url_missing"
  /** Live subscription, local end and panel expireAt disagree beyond tolerance. */
  | "date_drift"
  /** Live subscription, panel status is not ACTIVE. */
  | "status_mismatch"
  /** Panel tag doesn't match the local plan (SITE_TRIAL / SITE_BASIC / SITE_PLUS). */
  | "tag_mismatch"
  /** Local subscription ended, the panel still serves the user. */
  | "active_after_expiry"
  /** The panel could not be asked (network / auth / 5xx). */
  | "panel_error";

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
  fixApplied?: boolean;
  fixError?: string;
  fixSummary?: string;
}

export interface AuditReport {
  scanned: number;
  ok: number;
  broken: number;
  fixed: number;
  fixFailed: number;
  byProblem: Record<AuditProblem, number>;
  rows: AuditRow[];
}

/** ±2 minutes on date comparison — covers panel/local clock drift. */
export const DATE_DRIFT_TOLERANCE_MS = 2 * 60 * 1000;
const RECENT_EXPIRY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export interface AuditLocal {
  subscription_end: Date;
  subscription_plan: string | null;
  panel_user_id: string | number | null;
}

export function emptyByProblem(): Record<AuditProblem, number> {
  return {
    no_uuid: 0,
    missing_in_panel: 0,
    url_missing: 0,
    date_drift: 0,
    status_mismatch: 0,
    tag_mismatch: 0,
    active_after_expiry: 0,
    panel_error: 0,
  };
}

/**
 * Pure kernel: problems of ONE local user against ONE panel snapshot.
 * `panelUser` null + `panelError` null means "the panel says: no such user".
 */
export function diffUser(
  local: AuditLocal,
  panelUser: PanelUser | null,
  panelError: string | null = null,
  now: number = Date.now()
): { problems: AuditProblem[]; panelExpireAt: string | null; panelTag: string | null; panelStatus: string | null; panelSubscriptionUrl: string | null } {
  const empty = { panelExpireAt: null, panelTag: null, panelStatus: null, panelSubscriptionUrl: null };
  const localEndMs = new Date(local.subscription_end).getTime();
  const live = localEndMs - now > MIN_REMAINING_MS;

  if (!local.panel_user_id) return { problems: live ? ["no_uuid"] : [], ...empty };
  if (panelError) return { problems: ["panel_error"], ...empty };
  if (!panelUser) return { problems: live ? ["missing_in_panel"] : [], ...empty };

  const problems: AuditProblem[] = [];
  const panelEndMs = Date.parse(panelUser.expireAt || "");
  if (live) {
    if (!panelUser.subscriptionUrl) problems.push("url_missing");
    if (!Number.isFinite(panelEndMs) || Math.abs(localEndMs - panelEndMs) > DATE_DRIFT_TOLERANCE_MS) problems.push("date_drift");
    if (panelUser.status !== "ACTIVE") problems.push("status_mismatch");
    const expectedTag = tagForPlan(local.subscription_plan) ?? SITE_TAGS.trial;
    if ((panelUser.tag ?? null) !== expectedTag) problems.push("tag_mismatch");
  } else if ((panelUser.status === "ACTIVE" || panelUser.status === "LIMITED") && panelEndMs > now) {
    problems.push("active_after_expiry");
  }

  return {
    problems,
    panelExpireAt: panelUser.expireAt || null,
    panelTag: panelUser.tag ?? null,
    panelStatus: panelUser.status ?? null,
    panelSubscriptionUrl: panelUser.subscriptionUrl || null,
  };
}

/** Fetch one user's panel snapshot for diffUser. */
export async function fetchPanelSnapshot(panelUserId: string | number | null): Promise<{ user: PanelUser | null; error: string | null }> {
  if (!panelUserId) return { user: null, error: null };
  const r = await getUserById(Number(panelUserId));
  if (r.ok) return { user: r.data, error: null };
  if (isUserGone(r)) return { user: null, error: null };
  return { user: null, error: describeRwError(r) };
}

interface UserRow {
  id: string;
  email: string;
  public_id: string | null;
  subscription_end: Date;
  subscription_plan: string | null;
  panel_user_id: string | null;
}

export async function auditPanelSync(): Promise<AuditReport> {
  const cutoff = new Date(Date.now() - RECENT_EXPIRY_WINDOW_MS);
  const rows = (
    await pool.query<UserRow>(
      `SELECT id, email, public_id, subscription_end, subscription_plan, panel_user_id::text AS panel_user_id
       FROM users
       WHERE panel_user_id IS NOT NULL OR subscription_end > $1
       ORDER BY subscription_end DESC`,
      [cutoff]
    )
  ).rows;

  const byProblem = emptyByProblem();
  const outRows: AuditRow[] = [];
  let ok = 0;
  let broken = 0;

  for (const row of rows) {
    let snap: { user: PanelUser | null; error: string | null };
    try {
      snap = await fetchPanelSnapshot(row.panel_user_id);
    } catch (err) {
      snap = { user: null, error: err instanceof Error ? err.message : String(err) };
    }
    const diff = diffUser(row, snap.user, snap.error);
    for (const p of diff.problems) byProblem[p] += 1;
    if (diff.problems.length === 0) ok += 1;
    else broken += 1;
    outRows.push({
      userId: row.id,
      email: row.email,
      publicId: row.public_id,
      panelUuid: row.panel_user_id,
      localSubscriptionEnd: new Date(row.subscription_end).toISOString(),
      panelExpireAt: diff.panelExpireAt,
      localPlan: row.subscription_plan || "trial",
      panelTag: diff.panelTag,
      panelStatus: diff.panelStatus,
      panelSubscriptionUrl: diff.panelSubscriptionUrl,
      problems: diff.problems,
      ...(snap.error ? { fixError: snap.error } : {}),
    });
  }

  return { scanned: rows.length, ok, broken, fixed: 0, fixFailed: 0, byProblem, rows: outRows };
}
