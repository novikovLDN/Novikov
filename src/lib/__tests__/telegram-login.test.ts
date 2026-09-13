/**
 * Telegram sign-in (security audit 13.09.2026). The old flow let anyone
 * who knew a nonce collect the session of whoever confirmed it in the bot
 * ("login by someone else's link"). Now the nonce is created by the site,
 * bound to the browser, confirmable once by the bot and claimable once by
 * that browser only.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../db", async () => {
  const m = await import("./session-fake");
  return { pool: m.secDb.pool, dbReady: Promise.resolve(), waitForDb: async () => {} };
});

import { secDb, seedUser } from "./session-fake";
import { claimTelegramLogin, confirmTelegramLogin, startTelegramLogin, TG_LOGIN_TTL_MS } from "../telegram-login";

beforeEach(() => {
  secDb.reset();
  seedUser("victim", { telegram_id: "111", telegram_linked: true });
});

describe("telegram sign-in nonce", () => {
  it("happy path: start → bot confirms → the same browser claims once", async () => {
    const s = await startTelegramLogin({ ip: "1.2.3.4", userAgent: "UA" });
    expect(s.nonce).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(s.confirmCode).toMatch(/^\d{4}$/);

    expect(await claimTelegramLogin(s.nonce, s.secret)).toEqual({ status: "pending" });

    const c = await confirmTelegramLogin(s.nonce, "victim", "111");
    expect(c?.confirmCode).toBe(s.confirmCode);
    expect(c?.requestIp).toBe("1.2.3.4");

    expect(await claimTelegramLogin(s.nonce, s.secret)).toEqual({ status: "ok", userId: "victim" });
    expect(await claimTelegramLogin(s.nonce, s.secret)).toEqual({ status: "used" });
  });

  it("ATTACK: knowing the nonce without the browser secret gets nothing", async () => {
    const s = await startTelegramLogin();
    await confirmTelegramLogin(s.nonce, "victim", "111");
    expect(await claimTelegramLogin(s.nonce, "")).toEqual({ status: "invalid" });
    expect(await claimTelegramLogin(s.nonce, "B".repeat(43))).toEqual({ status: "invalid" });
    // the real browser still can
    expect((await claimTelegramLogin(s.nonce, s.secret)).status).toBe("ok");
  });

  it("ATTACK: the bot cannot mint a nonce the site did not create", async () => {
    expect(await confirmTelegramLogin("attackerChosenNonce123", "victim", "111")).toBeNull();
    expect(secDb.nonces.size).toBe(0);
  });

  it("ATTACK: a confirmed nonce cannot be rebound to another account", async () => {
    seedUser("other", { telegram_id: "222", telegram_linked: true });
    const s = await startTelegramLogin();
    expect(await confirmTelegramLogin(s.nonce, "victim", "111")).not.toBeNull();
    expect(await confirmTelegramLogin(s.nonce, "other", "222")).toBeNull();
    expect(await claimTelegramLogin(s.nonce, s.secret)).toEqual({ status: "ok", userId: "victim" });
  });

  it("expired nonces can be neither confirmed nor claimed", async () => {
    const t0 = new Date("2026-09-13T10:00:00Z");
    const s = await startTelegramLogin({}, t0);
    const late = new Date(t0.getTime() + TG_LOGIN_TTL_MS + 1000);
    expect(await confirmTelegramLogin(s.nonce, "victim", "111", late)).toBeNull();

    const s2 = await startTelegramLogin({}, t0);
    await confirmTelegramLogin(s2.nonce, "victim", "111", new Date(t0.getTime() + 1000));
    expect(await claimTelegramLogin(s2.nonce, s2.secret, late)).toEqual({ status: "expired" });
  });

  it("legacy rows (created by the old bot upsert, no browser binding) are never claimable", async () => {
    secDb.nonces.set("legacyNonce1234567890", {
      nonce: "legacyNonce1234567890", browser_hash: null, user_id: "victim", telegram_id: "111",
      used: false, expires_at: new Date(Date.now() + 60_000), created_at: new Date(),
    });
    expect(await claimTelegramLogin("legacyNonce1234567890", "C".repeat(43))).toEqual({ status: "invalid" });
  });

  it("malformed input is rejected before touching the DB", async () => {
    secDb.log = [];
    expect(await claimTelegramLogin("x", "y")).toEqual({ status: "invalid" });
    expect(await confirmTelegramLogin("bad nonce!", "victim", "111")).toBeNull();
    expect(secDb.log).toHaveLength(0);
  });
});
