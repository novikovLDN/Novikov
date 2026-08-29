/**
 * Contract tests for ghost-date repair.
 *
 * The bug the production system had: users with a legacy
 * `subscription_end` past NOW+400d (residue of the 10-year 3650-day
 * bot bug) got their sync silently SKIPPED. Their local dashboard
 * showed 2032, but the panel still held the original expired date, so
 * the subscription URL was dead.
 *
 * These tests pin down what `computeGhostRepair` produces for the
 * three input classes:
 *   - user has never paid           → expire (subscription_end = NOW-1s)
 *   - latest paid + period is past  → expire (same)
 *   - latest paid + period ahead    → correct future date
 *
 * `pool.query` is mocked to feed the payment history without a DB.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../db", () => ({
  pool: {
    query: vi.fn(),
  },
}));

import { pool } from "../db";
import {
  computeGhostRepair,
  isGhostDate,
  GHOST_THRESHOLD_MS,
  PANEL_EXPIRE_GRACE_MS,
} from "../ghost-date-repair";

const mockPoolQuery = pool.query as ReturnType<typeof vi.fn>;

describe("isGhostDate", () => {
  it("returns true for a date past NOW+400d", () => {
    const ghost = new Date(Date.now() + GHOST_THRESHOLD_MS + 24 * 60 * 60 * 1000);
    expect(isGhostDate(ghost)).toBe(true);
  });

  it("returns false for a date within NOW+400d", () => {
    const normal = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    expect(isGhostDate(normal)).toBe(false);
  });

  it("returns false for a past date", () => {
    const past = new Date(Date.now() - 1000);
    expect(isGhostDate(past)).toBe(false);
  });

  it("accepts ISO strings and Dates", () => {
    const ghostIso = new Date(Date.now() + GHOST_THRESHOLD_MS + 1000).toISOString();
    expect(isGhostDate(ghostIso)).toBe(true);
  });
});

describe("computeGhostRepair", () => {
  beforeEach(() => {
    mockPoolQuery.mockReset();
  });

  it("expires a user who has never paid", async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [] });

    const before = Date.now();
    const plan = await computeGhostRepair("user-1");
    const after = Date.now();

    expect(plan.action).toBe("expired_no_payment");
    expect(plan.confirmedPayments).toBe(0);
    expect(plan.latestPaidAt).toBeNull();

    // newEnd sits in the past — a hair before "now".
    expect(plan.newEnd.getTime()).toBeGreaterThanOrEqual(before - 2000);
    expect(plan.newEnd.getTime()).toBeLessThan(after);

    // panelTarget is NOW + 1 day grace so the panel-side auto-disable
    // fires cleanly instead of the PATCH being rejected.
    expect(plan.panelTarget.getTime()).toBeGreaterThan(before);
    expect(plan.panelTarget.getTime()).toBeGreaterThanOrEqual(
      before + PANEL_EXPIRE_GRACE_MS - 2000
    );
  });

  it("expires a user whose latest payment period has already run out", async () => {
    // Paid 60 days ago for a 30-day tier — expired.
    const paidAt = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    mockPoolQuery.mockResolvedValueOnce({
      rows: [{ plan: "basic", period: 1, paid_at: paidAt }],
    });

    const before = Date.now();
    const plan = await computeGhostRepair("user-2");

    expect(plan.action).toBe("expired_payment_too_old");
    expect(plan.confirmedPayments).toBe(1);
    expect(plan.latestPaidAt).toBe(paidAt.toISOString());
    expect(plan.latestPlan).toBe("basic");
    expect(plan.latestPeriodMonths).toBe(1);
    expect(plan.newEnd.getTime()).toBeLessThan(before);
    expect(plan.panelTarget.getTime()).toBeGreaterThan(before);
  });

  it("recomputes future end date from a valid recent payment", async () => {
    // Paid 10 days ago for a 90-day (3-month) tier → 80 days remain.
    const paidAt = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    mockPoolQuery.mockResolvedValueOnce({
      rows: [{ plan: "plus", period: 3, paid_at: paidAt }],
    });

    const plan = await computeGhostRepair("user-3");

    expect(plan.action).toBe("corrected_from_payment");
    expect(plan.confirmedPayments).toBe(1);
    expect(plan.latestPlan).toBe("plus");
    expect(plan.latestPeriodMonths).toBe(3);

    // paid_at + 90 days
    const expected = paidAt.getTime() + 90 * 24 * 60 * 60 * 1000;
    expect(plan.newEnd.getTime()).toBe(expected);
    // For a future newEnd, panelTarget equals newEnd exactly.
    expect(plan.panelTarget.getTime()).toBe(expected);
  });

  it("picks the latest confirmed payment when multiple exist", async () => {
    const older = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);
    const newer = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    // Ordered DESC by paid_at, per the SQL — the caller relies on that.
    mockPoolQuery.mockResolvedValueOnce({
      rows: [
        { plan: "plus", period: 1, paid_at: newer },
        { plan: "basic", period: 1, paid_at: older },
      ],
    });

    const plan = await computeGhostRepair("user-4");

    expect(plan.action).toBe("corrected_from_payment");
    expect(plan.confirmedPayments).toBe(2);
    expect(plan.latestPaidAt).toBe(newer.toISOString());
    expect(plan.latestPlan).toBe("plus");
    // newer + 30 days
    expect(plan.newEnd.getTime()).toBe(newer.getTime() + 30 * 24 * 60 * 60 * 1000);
  });

  it("defaults unknown period values to 30 days", async () => {
    const paidAt = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    mockPoolQuery.mockResolvedValueOnce({
      rows: [{ plan: "custom", period: 99, paid_at: paidAt }],
    });

    const plan = await computeGhostRepair("user-5");

    expect(plan.action).toBe("corrected_from_payment");
    expect(plan.newEnd.getTime()).toBe(paidAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  });
});
