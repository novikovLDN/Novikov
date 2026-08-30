/**
 * Contract tests for the panel-sync audit.
 *
 * `diffUser` is the pure kernel — takes a local user snapshot + a
 * (mocked) panel user, returns the list of problems. Every problem
 * class the audit endpoint reports has an explicit test here so a
 * regression can't sneak past the summary numbers on the admin card.
 */

import { describe, it, expect } from "vitest";
import { diffUser, DATE_DRIFT_TOLERANCE_MS } from "../panel-audit";
import type { RemnawaveUser } from "../remnawave";

function localOk(overrides: Partial<{
  subscription_end: Date;
  subscription_plan: string | null;
  remnawave_user_uuid: string | null;
}> = {}) {
  return {
    subscription_end: new Date(Date.now() + 30 * 86400000),
    subscription_plan: "basic",
    remnawave_user_uuid: "uuid-123",
    ...overrides,
  };
}

function panelOk(overrides: Partial<RemnawaveUser> = {}): RemnawaveUser {
  return {
    uuid: "uuid-123",
    shortUuid: "s123",
    username: "ST00000001",
    email: "u@x",
    subscriptionUrl: "https://sub/s123",
    expireAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    trafficLimitBytes: 0,
    usedTrafficBytes: 0,
    status: "ACTIVE",
    tag: "BASIC",
    description: "",
    telegramId: null,
    hwidDeviceLimit: null,
    ...overrides,
  };
}

describe("diffUser (panel-sync audit kernel)", () => {
  it("returns zero problems when local and panel agree", () => {
    const local = localOk();
    const panel = panelOk({ expireAt: local.subscription_end.toISOString() });
    const diff = diffUser(local, panel);
    expect(diff.problems).toEqual([]);
    expect(diff.panelStatus).toBe("ACTIVE");
    expect(diff.panelTag).toBe("BASIC");
  });

  it("flags `no_uuid` when the local row was never provisioned to the panel", () => {
    const diff = diffUser(localOk({ remnawave_user_uuid: null }), null);
    expect(diff.problems).toEqual(["no_uuid"]);
  });

  it("flags `missing_in_panel` when uuid points at a record the panel no longer has", () => {
    const diff = diffUser(localOk(), null);
    expect(diff.problems).toEqual(["missing_in_panel"]);
  });

  it("flags `url_missing` when panel returned no subscriptionUrl", () => {
    const local = localOk();
    const panel = panelOk({ subscriptionUrl: "", expireAt: local.subscription_end.toISOString() });
    const diff = diffUser(local, panel);
    expect(diff.problems).toContain("url_missing");
  });

  it("flags `date_drift` when local and panel expireAt disagree beyond tolerance", () => {
    const local = localOk();
    const panelEnd = new Date(local.subscription_end.getTime() + DATE_DRIFT_TOLERANCE_MS + 60_000);
    const panel = panelOk({ expireAt: panelEnd.toISOString() });
    const diff = diffUser(local, panel);
    expect(diff.problems).toContain("date_drift");
  });

  it("does NOT flag drift within the ±2min tolerance", () => {
    const local = localOk();
    const panel = panelOk({
      expireAt: new Date(local.subscription_end.getTime() + 60_000).toISOString(),
    });
    const diff = diffUser(local, panel);
    expect(diff.problems).not.toContain("date_drift");
  });

  it("flags `status_mismatch` when local is live but panel is EXPIRED", () => {
    const local = localOk(); // ends in +30d
    const panel = panelOk({ status: "EXPIRED", expireAt: local.subscription_end.toISOString() });
    const diff = diffUser(local, panel);
    expect(diff.problems).toContain("status_mismatch");
  });

  it("does NOT flag status_mismatch when local is already expired", () => {
    // If local shows expired too, EXPIRED on the panel is the correct state.
    const local = localOk({ subscription_end: new Date(Date.now() - 1000) });
    const panel = panelOk({ status: "EXPIRED", expireAt: local.subscription_end.toISOString() });
    const diff = diffUser(local, panel);
    expect(diff.problems).not.toContain("status_mismatch");
  });

  it("flags `tag_mismatch` when panel tag doesn't match the local plan", () => {
    const local = localOk({ subscription_plan: "plus" });
    const panel = panelOk({ tag: "BASIC", expireAt: local.subscription_end.toISOString() });
    const diff = diffUser(local, panel);
    expect(diff.problems).toContain("tag_mismatch");
  });

  it("does NOT flag tag_mismatch when local plan is 'trial' — panel may still hold 'TRIAL' or the migrated tag", () => {
    // For 'trial' plan expected tag is TRIAL; matching that is fine.
    const local = localOk({ subscription_plan: "trial" });
    const panel = panelOk({ tag: "TRIAL", expireAt: local.subscription_end.toISOString() });
    const diff = diffUser(local, panel);
    expect(diff.problems).not.toContain("tag_mismatch");
  });

  it("does NOT flag tag_mismatch when local plan has no known tag mapping", () => {
    // Custom / null plan → no expected tag; anything panel-side is OK.
    const local = localOk({ subscription_plan: null });
    const panel = panelOk({ tag: "WHATEVER", expireAt: local.subscription_end.toISOString() });
    const diff = diffUser(local, panel);
    expect(diff.problems).not.toContain("tag_mismatch");
  });

  it("accumulates multiple problems into one row", () => {
    const local = localOk({ subscription_plan: "plus" });
    const panel = panelOk({
      status: "EXPIRED",
      tag: "BASIC",
      subscriptionUrl: "",
      expireAt: new Date(local.subscription_end.getTime() + 10 * 60 * 1000).toISOString(),
    });
    const diff = diffUser(local, panel);
    // status + tag + url + drift = 4 problems
    expect(diff.problems.sort()).toEqual(
      ["date_drift", "status_mismatch", "tag_mismatch", "url_missing"].sort()
    );
  });
});
