/**
 * Ghost-date repair — single source of truth.
 *
 * A "ghost date" is `users.subscription_end > NOW + 400 days` — almost
 * certainly a residue of the legacy 10-year bug where the bot pushed
 * days=3650 with no cap. The `MAX_EXTEND_DAYS = 400` guard in
 * `updateUser` prevents new ghost writes going forward, but old rows
 * (or rows written via direct SQL) are still poisoned.
 *
 * Symptom in production: a user opens the dashboard, sees
 * `subscription_end = 2032-09-16`, but the Remnawave-issued
 * subscription URL says "expired". That's because Remnawave stores the
 * value from when the user was originally provisioned — the sync worker
 * used to `SKIP` ghost-dated users out of fear of overwriting an
 * admin's manual fix, so the panel expireAt was never patched to match
 * the (bogus) local date, and the user's actual paid period ran out
 * silently on the panel side.
 *
 * This module contains the honest re-grant logic:
 *   - if the user has a confirmed payment, recompute subscription_end
 *     as `latest_paid_at + period_days`. If that's already in the past,
 *     expire them.
 *   - if the user has never paid, expire them.
 *
 * Two entry points are exposed:
 *   - `computeGhostRepair(userId)` — read-only; returns a plan
 *   - `applyGhostRepair(userId, plan)` — writes local subscription_end
 *
 * The panel push is intentionally left to `syncSubscriptionToPanel` so
 * repair + sync stay one atomic flow at the caller: repair → refresh
 * user → run the normal sync pipeline against the repaired date.
 */

import { pool } from "./db";

export const GHOST_THRESHOLD_MS = 400 * 24 * 60 * 60 * 1000;
export const PANEL_EXPIRE_GRACE_MS = 1 * 24 * 60 * 60 * 1000;

const PERIOD_DAYS: Record<number, number> = { 1: 30, 3: 90, 6: 180, 12: 365 };

export type RepairAction =
  | "expired_no_payment"
  | "expired_payment_too_old"
  | "corrected_from_payment";

export interface RepairPlan {
  /** New local subscription_end. May be in the past (expiry) or future. */
  newEnd: Date;
  /** Value to push to the panel — clamped to `[NOW+1d, newEnd]` so an
   *  expired user still shows in the panel for the grace period. */
  panelTarget: Date;
  action: RepairAction;
  confirmedPayments: number;
  latestPaidAt: string | null;
  latestPlan: string | null;
  latestPeriodMonths: number | null;
}

/**
 * True if the local subscription_end looks like a ghost value.
 */
export function isGhostDate(subscriptionEnd: Date | string): boolean {
  const ts = new Date(subscriptionEnd).getTime();
  return Number.isFinite(ts) && ts > Date.now() + GHOST_THRESHOLD_MS;
}

/**
 * Compute the correct subscription_end for a ghost-dated user based
 * on their payment history. Read-only.
 */
export async function computeGhostRepair(userId: string): Promise<RepairPlan> {
  const now = new Date();

  const paymentsRes = await pool.query<{
    plan: string;
    period: number;
    paid_at: Date;
  }>(
    `SELECT plan, period, paid_at
     FROM payments
     WHERE user_id = $1 AND status = 'confirmed' AND paid_at IS NOT NULL
     ORDER BY paid_at DESC`,
    [userId]
  );
  const payments = paymentsRes.rows;
  const latest = payments[0] || null;

  let newEnd: Date;
  let action: RepairAction;

  if (!latest) {
    newEnd = new Date(now.getTime() - 1000);
    action = "expired_no_payment";
  } else {
    const days = PERIOD_DAYS[latest.period] ?? 30;
    const candidate = new Date(
      new Date(latest.paid_at).getTime() + days * 24 * 60 * 60 * 1000
    );
    if (candidate.getTime() <= now.getTime()) {
      newEnd = new Date(now.getTime() - 1000);
      action = "expired_payment_too_old";
    } else {
      newEnd = candidate;
      action = "corrected_from_payment";
    }
  }

  const panelTarget =
    newEnd.getTime() <= now.getTime()
      ? new Date(now.getTime() + PANEL_EXPIRE_GRACE_MS)
      : newEnd;

  return {
    newEnd,
    panelTarget,
    action,
    confirmedPayments: payments.length,
    latestPaidAt: latest ? new Date(latest.paid_at).toISOString() : null,
    latestPlan: latest?.plan ?? null,
    latestPeriodMonths: latest?.period ?? null,
  };
}

/**
 * Write the repaired subscription_end to the DB.
 *
 * Bypasses `updateUser`'s MAX_EXTEND_DAYS guard on purpose — we're
 * writing a known-good clamped value, not one from an untrusted
 * caller. The guard is there to catch upstream bugs, not to block
 * downstream fixes for those bugs.
 */
export async function applyGhostRepair(
  userId: string,
  plan: RepairPlan
): Promise<void> {
  await pool.query("UPDATE users SET subscription_end = $1 WHERE id = $2", [
    plan.newEnd,
    userId,
  ]);
}
