/**
 * Payment confirmation (К3, К4) and refunds.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../db", async () => {
  const m = await import("./fake-db");
  return { pool: m.fakeDb.pool, dbReady: Promise.resolve(), waitForDb: async () => {} };
});
vi.mock("../subscription-sync", () => ({
  syncUserToPanel: vi.fn(async () => ({ ok: true, action: "patched", publicId: "ST00000042", panelUserId: 1, uuid: "1", subscriptionUrl: "https://s/x", expireAt: null })),
  requestPanelSync: vi.fn(),
}));
vi.mock("../yookassa", () => ({
  getPaymentStatus: vi.fn(),
  PaymentStatus: { PENDING: "pending", WAITING_FOR_CAPTURE: "waiting_for_capture", SUCCEEDED: "succeeded", CANCELED: "canceled" },
}));
vi.mock("../email", () => ({
  sendPaymentSucceededEmail: vi.fn(async () => true),
  sendRefundAdminAlertEmail: vi.fn(async () => true),
}));
vi.mock("../store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../store")>();
  return {
    ...actual,
    createNotificationForUser: vi.fn(async () => {}),
    createAuditLog: vi.fn(async () => {}),
    getUserById: vi.fn(async () => null),
  };
});

import { fakeDb } from "./fake-db";
import { confirmPayment, handleRefund, reconcilePaymentWithYooKassa } from "../payments";
import { extendFrom } from "../subscription-ledger";
import { rowToPayment } from "../store";
import * as yk from "../yookassa";

const DAY = 86400000;
const USER = "u-1";

function seed(opts: { end: Date; payStatus?: string; period?: number; plan?: string }) {
  fakeDb.reset();
  fakeDb.users.set(USER, {
    id: USER,
    email: "buyer@example.com",
    subscription_end: opts.end,
    subscription_plan: "trial",
    referred_by: null,
    panel_sync_state: "ok",
    panel_sync_attempts: 0,
  });
  fakeDb.payments.set("p1", {
    id: "p1",
    user_id: USER,
    transaction_id: "yk-1",
    plan: opts.plan ?? "plus",
    period: opts.period ?? 1,
    amount: "349.00",
    currency: "RUB",
    status: opts.payStatus ?? "pending",
    redirect_url: null,
    expires_at: new Date(Date.now() + 15 * 60 * 1000),
    created_at: new Date(),
    paid_at: null,
    applied_at: null,
    refunded_at: null,
    refund_id: null,
  });
}

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("confirmPayment", () => {
  it("webhook and /status polling racing → exactly ONE extension (К3)", async () => {
    const end = new Date(Date.now() + 5 * DAY);
    seed({ end });
    const [a, b] = await Promise.all([confirmPayment("p1", "webhook"), confirmPayment("p1", "status")]);
    expect([a.outcome, b.outcome].sort()).toEqual(["already_applied", "applied"]);
    expect(fakeDb.events.filter((e) => e.kind === "payment")).toHaveLength(1);
    const newEnd = fakeDb.users.get(USER)!.subscription_end as Date;
    expect(newEnd.getTime()).toBe(end.getTime() + 30 * DAY);
    expect(fakeDb.payments.get("p1")!.status).toBe("confirmed");
  });

  it("a replayed webhook after success does nothing", async () => {
    seed({ end: new Date(Date.now() + DAY) });
    await confirmPayment("p1", "webhook");
    const endAfterFirst = (fakeDb.users.get(USER)!.subscription_end as Date).getTime();
    const again = await confirmPayment("p1", "webhook");
    expect(again.outcome).toBe("already_applied");
    expect((fakeDb.users.get(USER)!.subscription_end as Date).getTime()).toBe(endAfterFirst);
  });

  it("12 months on top of 60 days left → end ≈ now + 425 days, no 400-day cap (К4)", async () => {
    const end = new Date(Date.now() + 60 * DAY);
    seed({ end, period: 12 });
    const r = await confirmPayment("p1", "webhook");
    expect(r.outcome).toBe("applied");
    const newEnd = fakeDb.users.get(USER)!.subscription_end as Date;
    expect(newEnd.getTime()).toBe(end.getTime() + 365 * DAY);
    expect(newEnd.getTime()).toBeGreaterThan(Date.now() + 400 * DAY);
    expect(fakeDb.users.get(USER)!.subscription_plan).toBe("plus");
    expect(fakeDb.users.get(USER)!.panel_sync_state).toBe("pending");
  });

  it("an expired user's payment extends from now, not from the old end", async () => {
    seed({ end: new Date(Date.now() - 10 * DAY) });
    const before = Date.now();
    await confirmPayment("p1", "webhook");
    const newEnd = (fakeDb.users.get(USER)!.subscription_end as Date).getTime();
    expect(newEnd).toBeGreaterThanOrEqual(before + 30 * DAY);
    expect(newEnd).toBeLessThan(before + 30 * DAY + 5000);
  });

  it("confirms a payment that was locally marked expired", async () => {
    seed({ end: new Date(), payStatus: "expired" });
    expect((await confirmPayment("p1", "webhook")).outcome).toBe("applied");
  });

  it("does not confirm a canceled payment", async () => {
    seed({ end: new Date(), payStatus: "canceled" });
    expect((await confirmPayment("p1", "webhook")).outcome).toBe("not_confirmable");
    expect(fakeDb.events).toHaveLength(0);
  });
});

describe("reconcilePaymentWithYooKassa", () => {
  it("asks YooKassa about locally-expired payments and applies a success", async () => {
    seed({ end: new Date(), payStatus: "expired" });
    vi.mocked(yk.getPaymentStatus).mockResolvedValue({ id: "yk-1", status: "succeeded" } as never);
    const r = await reconcilePaymentWithYooKassa(rowToPayment(fakeDb.payments.get("p1")), "status");
    expect(r.outcome).toBe("applied");
    expect(fakeDb.payments.get("p1")!.status).toBe("confirmed");
  });

  it("marks canceled when YooKassa says canceled", async () => {
    seed({ end: new Date() });
    vi.mocked(yk.getPaymentStatus).mockResolvedValue({ id: "yk-1", status: "canceled" } as never);
    const r = await reconcilePaymentWithYooKassa(rowToPayment(fakeDb.payments.get("p1")), "status");
    expect(r.outcome).toBe("canceled");
    expect(fakeDb.payments.get("p1")!.status).toBe("canceled");
  });
});

describe("handleRefund (owner decision: no automatic day removal)", () => {
  it("marks refunded, writes a 0-day ledger event, keeps the end date; replay is a duplicate", async () => {
    seed({ end: new Date(Date.now() + DAY) });
    await confirmPayment("p1", "webhook");
    const endBefore = (fakeDb.users.get(USER)!.subscription_end as Date).getTime();
    const refund = { id: "rf-1", payment_id: "yk-1", status: "succeeded" as const, amount: { value: "349.00", currency: "RUB" }, created_at: new Date().toISOString() };
    expect(await handleRefund(refund)).toBe("recorded");
    const p = fakeDb.payments.get("p1")!;
    expect(p.status).toBe("refunded");
    expect(p.refund_id).toBe("rf-1");
    const ev = fakeDb.events.find((e) => e.kind === "refund")!;
    expect(ev.days).toBe(0);
    expect((fakeDb.users.get(USER)!.subscription_end as Date).getTime()).toBe(endBefore);
    expect(await handleRefund(refund)).toBe("duplicate");
  });
});

describe("extendFrom", () => {
  it("extends from the later of now and the current end", () => {
    const now = new Date("2026-09-12T00:00:00Z");
    expect(extendFrom(new Date("2026-09-01T00:00:00Z"), DAY, now).toISOString()).toBe("2026-09-13T00:00:00.000Z");
    expect(extendFrom(new Date("2026-09-20T00:00:00Z"), DAY, now).toISOString()).toBe("2026-09-21T00:00:00.000Z");
  });
});
