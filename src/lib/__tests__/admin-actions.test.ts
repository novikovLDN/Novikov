/**
 * Admin actions: grant by days, set-plan without extension, device
 * removal, per-user history.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../db", async () => {
  const m = await import("./fake-db");
  return { pool: m.fakeDb.pool, dbReady: Promise.resolve(), waitForDb: async () => {} };
});
vi.mock("../store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../store")>();
  return { ...actual, createAuditLog: vi.fn(async () => {}) };
});
vi.mock("../remnawave", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../remnawave")>();
  return { ...actual, deleteHwidDevice: vi.fn(), deleteAllHwidDevices: vi.fn() };
});

import { fakeDb } from "./fake-db";
import { adminGrant, adminSetPlan, parseDeviceTarget, parseGrant, removeUserDevices } from "../admin-actions";
import { getUserHistory } from "../admin-users";
import * as store from "../store";
import * as rw from "../remnawave";

const DAY = 86400000;

function seed(extra: Record<string, unknown> = {}) {
  fakeDb.reset();
  const end = new Date(Date.now() + 10 * DAY);
  fakeDb.users.set("u1", {
    id: "u1",
    email: "u1@example.com",
    created_at: new Date(),
    subscription_end: end,
    subscription_plan: "basic",
    referral_code: "U1CODE00",
    panel_user_id: "1234",
    panel_sync_state: "ok",
    ...extra,
  });
  return end;
}

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.mocked(store.createAuditLog).mockClear();
});

describe("grant", () => {
  it("accepts days 1–400 as an alternative to a preset", async () => {
    const end = seed();
    const r = await adminGrant("u1", { plan: "plus", days: 10 });
    expect(r.ok).toBe(true);
    const u = fakeDb.users.get("u1")!;
    expect((u.subscription_end as Date).getTime()).toBe(end.getTime() + 10 * DAY);
    expect(u.subscription_plan).toBe("plus");
    expect(u.panel_sync_state).toBe("pending");
    expect(fakeDb.events[0]).toMatchObject({ kind: "admin_grant", plan: "plus" });
  });

  it("rejects bad days and plans in Russian", () => {
    for (const bad of [{ plan: "plus", days: 0 }, { plan: "plus", days: 401 }, { plan: "plus", days: 1.5 }, { plan: "gold", days: 5 }, { plan: "basic" }]) {
      const r = parseGrant(bad);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toMatch(/[а-яё]/i);
    }
    expect(parseGrant({ plan: "basic", duration: "30d" })).toMatchObject({ ok: true, minutes: 43200 });
  });
});

describe("set-plan", () => {
  it("changes the plan without touching the end date; queues a panel sync", async () => {
    const end = seed();
    const r = await adminSetPlan("u1", "plus");
    expect(r).toMatchObject({ ok: true, changed: true, plan: "plus" });
    const u = fakeDb.users.get("u1")!;
    expect(u.subscription_plan).toBe("plus");
    expect((u.subscription_end as Date).getTime()).toBe(end.getTime());
    expect(u.panel_sync_state).toBe("pending");
    expect(fakeDb.events).toHaveLength(1);
    expect(fakeDb.events[0]).toMatchObject({ kind: "admin_set_plan", plan: "plus", days: 0 });
  });

  it("same plan → no ledger event", async () => {
    seed();
    const r = await adminSetPlan("u1", "basic");
    expect(r).toMatchObject({ ok: true, changed: false });
    expect(fakeDb.events).toHaveLength(0);
  });

  it("rejects unknown plans and unknown users", async () => {
    seed();
    expect(await adminSetPlan("u1", "gold")).toMatchObject({ ok: false, status: 400 });
    expect(await adminSetPlan("nobody", "plus")).toMatchObject({ ok: false, status: 404 });
  });
});

describe("device removal", () => {
  const device = { hwid: "HWID-AAAA-0001", userId: 1234, platform: "ios", osVersion: "26", deviceModel: "iPhone", userAgent: null, requestIp: null, createdAt: null, updatedAt: null };

  it("parses the body", () => {
    expect(parseDeviceTarget({ hwid: " X1 " })).toEqual({ hwid: "X1" });
    expect(parseDeviceTarget({ all: true })).toEqual({ all: true });
    expect(parseDeviceTarget({ all: "yes" })).toBeNull();
    expect(parseDeviceTarget(null)).toBeNull();
  });

  it("removes one device, returns the fresh list, writes the admin journal", async () => {
    seed();
    vi.mocked(rw.deleteHwidDevice).mockResolvedValue({ ok: true, status: 200, data: { total: 1, devices: [device] } });
    const r = await removeUserDevices("u1", { hwid: "HWID-BBBB-0002" });
    expect(rw.deleteHwidDevice).toHaveBeenCalledWith(1234, "HWID-BBBB-0002");
    expect(r).toMatchObject({ ok: true, data: { total: 1, removed: "one" } });
    expect(store.createAuditLog).toHaveBeenCalledWith("admin.device_delete", expect.stringContaining("HWID-BBBB-0002"), "u1", "u1@example.com");
  });

  it("removes all devices", async () => {
    seed();
    vi.mocked(rw.deleteAllHwidDevices).mockResolvedValue({ ok: true, status: 200, data: { total: 0, devices: [] } });
    const r = await removeUserDevices("u1", { all: true });
    expect(r).toMatchObject({ ok: true, data: { total: 0, removed: "all" } });
    expect(store.createAuditLog).toHaveBeenCalledWith("admin.devices_delete_all", expect.any(String), "u1", "u1@example.com");
  });

  it("maps panel errors: A204 → 404, other → 502; no panel user → 409", async () => {
    seed();
    vi.mocked(rw.deleteHwidDevice).mockResolvedValue({ ok: false, kind: "not_found", status: 404, errorCode: "A204", message: "not found", method: "POST", path: "/api/hwid/devices/delete" });
    expect(await removeUserDevices("u1", { hwid: "X" })).toMatchObject({ ok: false, status: 404, error: "Устройство не найдено" });
    vi.mocked(rw.deleteHwidDevice).mockResolvedValue({ ok: false, kind: "unavailable", status: null, errorCode: null, message: "timeout", method: "POST", path: "/api/hwid/devices/delete" });
    expect(await removeUserDevices("u1", { hwid: "X" })).toMatchObject({ ok: false, status: 502 });
    seed({ panel_user_id: null });
    expect(await removeUserDevices("u1", { hwid: "X" })).toMatchObject({ ok: false, status: 409 });
    expect(store.createAuditLog).not.toHaveBeenCalled();
  });
});

describe("history", () => {
  it("returns payments and ledger events, newest first", async () => {
    seed();
    fakeDb.payments.set("p-old", { id: "p-old", user_id: "u1", status: "confirmed", amount: "199.00", currency: "RUB", plan: "basic", period: 1, transaction_id: "yk-1", created_at: new Date("2026-08-01T10:00:00Z"), paid_at: new Date("2026-08-01T10:01:00Z"), applied_at: new Date("2026-08-01T10:01:00Z"), refunded_at: null, refund_id: null });
    fakeDb.payments.set("p-new", { id: "p-new", user_id: "u1", status: "refunded", amount: "349.00", currency: "RUB", plan: "plus", period: 1, transaction_id: "yk-2", created_at: new Date("2026-09-01T10:00:00Z"), paid_at: new Date("2026-09-01T10:01:00Z"), applied_at: new Date("2026-09-01T10:01:00Z"), refunded_at: new Date("2026-09-02T10:00:00Z"), refund_id: "rf-1" });
    fakeDb.payments.set("other", { id: "other", user_id: "u2", status: "confirmed", amount: "1.00", plan: "basic", period: 1, created_at: new Date() });
    await adminGrant("u1", { plan: "plus", days: 5 });
    await adminSetPlan("u1", "basic");

    const h = await getUserHistory("u1");
    expect(h.payments.map((p) => p.id)).toEqual(["p-new", "p-old"]);
    expect(h.payments[0]).toMatchObject({ status: "refunded", amount: 349, refundId: "rf-1", refundedAt: "2026-09-02T10:00:00.000Z" });
    expect(h.events.map((e) => e.kind)).toEqual(expect.arrayContaining(["admin_grant", "admin_set_plan"]));
    expect(h.events[0].createdAt >= h.events[1].createdAt).toBe(true);
    expect(h.events.find((e) => e.kind === "admin_grant")).toMatchObject({ days: 5, plan: "plus", actor: "admin" });
  });
});
