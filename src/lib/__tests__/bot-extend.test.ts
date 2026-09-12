/**
 * POST /api/bot/extend idempotency (review fix): extension + cashback
 * exactly once per paymentId; without paymentId a retry of the same
 * (days, plan, amount) within 120 s applies nothing.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../db", async () => {
  const m = await import("./fake-db");
  return { pool: m.fakeDb.pool, dbReady: Promise.resolve(), waitForDb: async () => {} };
});

import { fakeDb } from "./fake-db";
import { botExtendSubscription, BOT_EXTEND_DEDUPE_SECONDS } from "../store";

const DAY = 86400000;

function seed() {
  fakeDb.reset();
  const end = new Date(Date.now() + 10 * DAY);
  fakeDb.users.set("ref", { id: "ref", email: "ref@example.com", referral_code: "REFCODE1", paid_referrals: 0, balance: 0, created_at: new Date(), subscription_end: new Date() });
  fakeDb.users.set("buyer", {
    id: "buyer",
    email: "buyer@example.com",
    telegram_id: "700",
    referred_by: "REFCODE1",
    referral_paid_counted_at: null,
    referral_code: "BUYER001",
    subscription_end: end,
    subscription_plan: "trial",
    created_at: new Date(),
    paid_referrals: 0,
    balance: 0,
  });
  return end;
}

const bot = () => fakeDb.events.filter((e) => e.kind === "bot_extend");
const endOf = () => (fakeDb.users.get("buyer")!.subscription_end as Date).getTime();

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("botExtendSubscription", () => {
  it("no paymentId: a retry within 120 s → one extension, one cashback", async () => {
    const end = seed();
    const a = await botExtendSubscription("700", 30, { plan: "basic", amount: 199 });
    const b = await botExtendSubscription("700", 30, { plan: "basic", amount: 199 });
    expect(a!.applied).toBe(true);
    expect(b!.applied).toBe(false);
    expect(b!.duplicate).toBe(true);
    expect(b!.sourceId).toBe(a!.sourceId);
    expect(bot()).toHaveLength(1);
    expect(endOf()).toBe(end.getTime() + 30 * DAY);
    expect(fakeDb.users.get("ref")!.balance).toBe(1990);
    expect(fakeDb.rewards).toHaveLength(1);
    expect(fakeDb.rewards[0].purchase_id).toBe(a!.sourceId); // cashback key == ledger key, no uuid fallback
  });

  it("no paymentId: logs bot-extend.no-payment-id", async () => {
    seed();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await botExtendSubscription("700", 30, { plan: "basic", amount: 199 });
    expect(warn.mock.calls.some((c) => String(c[0]).includes("bot-extend.no-payment-id"))).toBe(true);
  });

  it("no paymentId: a different amount is a new purchase", async () => {
    seed();
    await botExtendSubscription("700", 30, { plan: "basic", amount: 199 });
    const b = await botExtendSubscription("700", 30, { plan: "basic", amount: 349 });
    expect(b!.applied).toBe(true);
    expect(bot()).toHaveLength(2);
  });

  it("no paymentId: the same call after the 120 s window applies again", async () => {
    seed();
    await botExtendSubscription("700", 30, { plan: "basic", amount: 199 });
    bot()[0].created_at = new Date(Date.now() - (BOT_EXTEND_DEDUPE_SECONDS + 5) * 1000);
    const b = await botExtendSubscription("700", 30, { plan: "basic", amount: 199 });
    expect(b!.applied).toBe(true);
    expect(bot()).toHaveLength(2);
  });

  it("two different paymentIds → two extensions", async () => {
    const end = seed();
    await botExtendSubscription("700", 30, { plan: "basic", amount: 199, idempotencyKey: "pay-1" });
    await botExtendSubscription("700", 30, { plan: "basic", amount: 199, idempotencyKey: "pay-2" });
    expect(bot()).toHaveLength(2);
    expect(endOf()).toBe(end.getTime() + 60 * DAY);
    expect(fakeDb.users.get("ref")!.balance).toBe(2 * 1990);
    expect(fakeDb.users.get("ref")!.paid_referrals).toBe(1);
  });

  it("the same paymentId twice → one extension, one cashback", async () => {
    const end = seed();
    const a = await botExtendSubscription("700", 30, { plan: "plus", amount: 349, idempotencyKey: "pay-1" });
    const b = await botExtendSubscription("700", 30, { plan: "plus", amount: 349, idempotencyKey: "pay-1" });
    expect(a!.sourceId).toBe("bot:pay-1");
    expect(b!.applied).toBe(false);
    expect(b!.duplicate).toBe(true);
    expect(bot()).toHaveLength(1);
    expect(endOf()).toBe(end.getTime() + 30 * DAY);
    expect(fakeDb.users.get("ref")!.balance).toBe(3490);
  });

  it("unknown Telegram id → null", async () => {
    seed();
    expect(await botExtendSubscription("999", 30)).toBeNull();
  });
});
