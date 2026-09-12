/**
 * The audit kernel: one local user vs one panel snapshot.
 */

import { describe, it, expect, vi } from "vitest";

// diffUser is pure; keep the real pg pool (and its connection attempt) out of the test.
vi.mock("../db", () => ({ pool: { query: vi.fn(), connect: vi.fn() }, dbReady: Promise.resolve(), waitForDb: async () => {} }));

import { diffUser, DATE_DRIFT_TOLERANCE_MS } from "../panel-audit";
import { panelUser } from "./fixtures";

const DAY = 86400000;

function local(overrides: Partial<{ subscription_end: Date; subscription_plan: string | null; panel_user_id: string | null }> = {}) {
  const end = new Date(Date.now() + 30 * DAY);
  return { subscription_end: end, subscription_plan: "basic", panel_user_id: "1234", ...overrides };
}

describe("diffUser", () => {
  it("no problems when panel matches a live local subscription", () => {
    const l = local();
    const d = diffUser(l, panelUser({ expireAt: l.subscription_end.toISOString(), tag: "SITE_BASIC" }));
    expect(d.problems).toEqual([]);
  });

  it("no_uuid only for live subscriptions without a panel id", () => {
    expect(diffUser(local({ panel_user_id: null }), null).problems).toEqual(["no_uuid"]);
    expect(diffUser(local({ panel_user_id: null, subscription_end: new Date(Date.now() - DAY) }), null).problems).toEqual([]);
  });

  it("missing_in_panel when the panel says the user is gone (live)", () => {
    expect(diffUser(local(), null).problems).toEqual(["missing_in_panel"]);
  });

  it("panel_error when the panel could not be asked — never 'missing'", () => {
    expect(diffUser(local(), null, "GET /api/users/1234 → unavailable").problems).toEqual(["panel_error"]);
  });

  it("date_drift beyond tolerance, not within it", () => {
    const l = local();
    const far = new Date(l.subscription_end.getTime() - DATE_DRIFT_TOLERANCE_MS - 60000).toISOString();
    const near = new Date(l.subscription_end.getTime() - 30000).toISOString();
    expect(diffUser(l, panelUser({ expireAt: far, tag: "SITE_BASIC" })).problems).toEqual(["date_drift"]);
    expect(diffUser(l, panelUser({ expireAt: near, tag: "SITE_BASIC" })).problems).toEqual([]);
  });

  it("status_mismatch when live locally but the panel is EXPIRED/DISABLED", () => {
    const l = local();
    expect(diffUser(l, panelUser({ expireAt: l.subscription_end.toISOString(), status: "DISABLED", tag: "SITE_BASIC" })).problems).toEqual(["status_mismatch"]);
  });

  it("tag_mismatch for legacy tags (they get rewritten to SITE_*)", () => {
    const l = local();
    expect(diffUser(l, panelUser({ expireAt: l.subscription_end.toISOString(), tag: "BASIC" })).problems).toEqual(["tag_mismatch"]);
  });

  it("active_after_expiry when local ended but the panel still serves the user", () => {
    const l = local({ subscription_end: new Date(Date.now() - 2 * DAY) });
    expect(diffUser(l, panelUser({ status: "ACTIVE", expireAt: new Date(Date.now() + DAY).toISOString() })).problems).toEqual(["active_after_expiry"]);
    expect(diffUser(l, panelUser({ status: "EXPIRED", expireAt: new Date(Date.now() - DAY).toISOString() })).problems).toEqual([]);
  });

  it("url_missing accumulates with other problems", () => {
    const l = local();
    const d = diffUser(l, panelUser({ subscriptionUrl: "", status: "EXPIRED", tag: "SITE_BASIC", expireAt: l.subscription_end.toISOString() }));
    expect(d.problems).toEqual(["url_missing", "status_mismatch"]);
  });
});
