/**
 * syncUserToPanel — the rules that fix К2 and К5:
 *   - expired locally → nothing pushed (no +24h grace);
 *   - early revoke → status DISABLED only;
 *   - live → absolute PATCH {id, expireAt, status: ACTIVE, tag};
 *   - panel unavailable / auth error → no wipe, no create, error recorded;
 *   - only a 404 A025/A063 wipes the link, then the user is re-created.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../db", async () => {
  const m = await import("./fake-db");
  return { pool: m.fakeDb.pool, dbReady: Promise.resolve(), waitForDb: async () => {} };
});
vi.mock("../locks", () => ({
  withUserSyncLock: async (_id: string, fn: () => Promise<unknown>) => ({ acquired: true, result: await fn() }),
  withJobLock: async (_k: number, fn: () => Promise<unknown>) => ({ acquired: true, result: await fn() }),
  LOCK_KEYS: { SYNC_PENDING: 1, RECONCILE: 2, CRON_CLEANUP: 3 },
}));
vi.mock("../remnawave", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../remnawave")>();
  return {
    ...actual,
    getUserById: vi.fn(),
    getUserByUsername: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
  };
});

import { fakeDb } from "./fake-db";
import { panelUser, ERR_USER_NOT_FOUND } from "./fixtures";
import * as rw from "../remnawave";
import { syncUserToPanel } from "../subscription-sync";

const DAY = 86400000;
const USER_ID = "11111111-2222-3333-4444-555555555555";

const notFound = (errorCode: string | null = "A025"): rw.RwError => ({
  ok: false, kind: "not_found", status: 404, errorCode, message: ERR_USER_NOT_FOUND.message, method: "GET", path: "/api/users/x",
});
const unavailable: rw.RwError = { ok: false, kind: "unavailable", status: null, errorCode: null, message: "timeout after 5000ms", method: "GET", path: "/api/users/1234" };
const authError: rw.RwError = { ok: false, kind: "auth", status: 401, errorCode: null, message: "Unauthorized", method: "GET", path: "/api/users/1234" };
const okR = <T,>(data: T): rw.RwResult<T> => ({ ok: true, data, status: 200 });

function seed(overrides: Record<string, unknown> = {}) {
  fakeDb.reset();
  fakeDb.users.set(USER_ID, {
    id: USER_ID,
    email: "u@example.com",
    public_id: "ST00000042",
    panel_id: null,
    panel_username: null,
    panel_user_id: "1234",
    remnawave_user_uuid: "1234",
    subscription_end: new Date(Date.now() + 30 * DAY),
    subscription_plan: "basic",
    subscription_url: "https://sub.atlassecure.ru/Xk3pQ9vT2mL8nR4s",
    panel_sync_attempts: 0,
    panel_sync_state: "pending",
    ...overrides,
  });
  return fakeDb.users.get(USER_ID)!;
}

const m = {
  getUserById: vi.mocked(rw.getUserById),
  getUserByUsername: vi.mocked(rw.getUserByUsername),
  createUser: vi.mocked(rw.createUser),
  updateUser: vi.mocked(rw.updateUser),
};

beforeEach(() => {
  for (const fn of Object.values(m)) fn.mockReset();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("expired locally", () => {
  it("pushes NOTHING when the panel already expired the user (no +24h grace)", async () => {
    seed({ subscription_end: new Date(Date.now() - DAY) });
    m.getUserById.mockResolvedValue(okR(panelUser({ status: "EXPIRED", expireAt: new Date(Date.now() - DAY).toISOString() })));
    const r = await syncUserToPanel(USER_ID);
    expect(r.ok).toBe(true);
    expect(r.action).toBe("noop");
    expect(m.updateUser).not.toHaveBeenCalled();
    expect(m.createUser).not.toHaveBeenCalled();
    expect(fakeDb.users.get(USER_ID)!.panel_sync_state).toBe("ok");
  });

  it("never creates a panel user for an expired local user", async () => {
    seed({ subscription_end: new Date(Date.now() - DAY), panel_user_id: null, remnawave_user_uuid: null, subscription_url: null });
    m.getUserByUsername.mockResolvedValue(notFound());
    const r = await syncUserToPanel(USER_ID);
    expect(r.action).toBe("noop");
    expect(m.createUser).not.toHaveBeenCalled();
    expect(m.updateUser).not.toHaveBeenCalled();
  });

  it("early revoke: panel still ACTIVE with a future expireAt → PATCH {id, status: DISABLED} only", async () => {
    seed({ subscription_end: new Date(Date.now() - 1000) });
    m.getUserById.mockResolvedValue(okR(panelUser({ status: "ACTIVE", expireAt: new Date(Date.now() + 20 * DAY).toISOString() })));
    m.updateUser.mockResolvedValue(okR(panelUser({ status: "DISABLED" })));
    const r = await syncUserToPanel(USER_ID);
    expect(r.action).toBe("disabled");
    expect(m.updateUser).toHaveBeenCalledTimes(1);
    expect(m.updateUser.mock.calls[0][0]).toEqual({ id: 1234, status: "DISABLED" });
  });
});

describe("live locally", () => {
  it("absolute PATCH {id, expireAt: local end, status: ACTIVE, tag: SITE_*}", async () => {
    const u = seed({ subscription_plan: "plus" });
    m.getUserById.mockResolvedValue(okR(panelUser({ status: "EXPIRED", tag: "PLUS", expireAt: new Date(Date.now() - DAY).toISOString() })));
    m.updateUser.mockResolvedValue(okR(panelUser({ tag: "SITE_PLUS", expireAt: (u.subscription_end as Date).toISOString() })));
    const r = await syncUserToPanel(USER_ID);
    expect(r.action).toBe("patched");
    expect(m.updateUser.mock.calls[0][0]).toEqual({
      id: 1234,
      expireAt: (u.subscription_end as Date).toISOString(),
      status: "ACTIVE",
      tag: "SITE_PLUS",
    });
    expect(fakeDb.users.get(USER_ID)!.panel_sync_state).toBe("ok");
  });

  it("does not PATCH when the panel already matches", async () => {
    const u = seed();
    m.getUserById.mockResolvedValue(okR(panelUser({ tag: "SITE_BASIC", expireAt: (u.subscription_end as Date).toISOString() })));
    const r = await syncUserToPanel(USER_ID);
    expect(r.action).toBe("noop");
    expect(m.updateUser).not.toHaveBeenCalled();
  });

  it("stays pending if the subscription changed while talking to the panel", async () => {
    const u = seed();
    m.getUserById.mockResolvedValue(okR(panelUser({ tag: "BASIC" })));
    m.updateUser.mockImplementation(async () => {
      u.subscription_end = new Date(Date.now() + 60 * DAY); // a payment landed meanwhile
      return okR(panelUser());
    });
    await syncUserToPanel(USER_ID);
    expect(fakeDb.users.get(USER_ID)!.panel_sync_state).toBe("pending");
  });
});

describe("panel failures (К5)", () => {
  for (const [name, err] of [["unavailable", unavailable], ["auth error", authError]] as const) {
    it(`${name}: no wipe, no create, error recorded with backoff`, async () => {
      seed();
      m.getUserById.mockResolvedValue(err);
      const r = await syncUserToPanel(USER_ID);
      expect(r.ok).toBe(false);
      expect(m.createUser).not.toHaveBeenCalled();
      expect(m.getUserByUsername).not.toHaveBeenCalled();
      const row = fakeDb.users.get(USER_ID)!;
      expect(row.panel_user_id).toBe("1234");
      expect(row.subscription_url).toBe("https://sub.atlassecure.ru/Xk3pQ9vT2mL8nR4s");
      expect(row.panel_sync_state).toBe("error");
      expect(row.panel_sync_attempts).toBe(1);
      expect(row.panel_next_sync_at).toBeInstanceOf(Date);
    });
  }

  it("a 404 without A025/A063 is not treated as 'gone'", async () => {
    seed();
    m.getUserById.mockResolvedValue(notFound(null));
    await syncUserToPanel(USER_ID);
    expect(fakeDb.users.get(USER_ID)!.panel_user_id).toBe("1234");
    expect(m.createUser).not.toHaveBeenCalled();
  });

  it("no stored link + lookup unavailable → no create (no duplicate)", async () => {
    seed({ panel_user_id: null, remnawave_user_uuid: null, subscription_url: null });
    m.getUserByUsername.mockResolvedValue({ ...unavailable, path: "/api/users/by-username/ST00000042" });
    const r = await syncUserToPanel(USER_ID);
    expect(r.ok).toBe(false);
    expect(m.createUser).not.toHaveBeenCalled();
  });

  it("404 A025 → link wiped, then re-created under the same ST username", async () => {
    seed();
    m.getUserById.mockResolvedValue(notFound("A025"));
    m.getUserByUsername.mockResolvedValue(notFound("A025"));
    m.createUser.mockResolvedValue(okR(panelUser({ id: 5678, subscriptionUrl: "https://sub.atlassecure.ru/NEW" })));
    const r = await syncUserToPanel(USER_ID);
    expect(r.action).toBe("created");
    const body = m.createUser.mock.calls[0][0];
    expect(body.username).toBe("ST00000042");
    expect(body.tag).toBe("SITE_BASIC");
    expect(body.description).toBe(`atlas-site:${USER_ID}`);
    expect(body).not.toHaveProperty("telegramId");
    const row = fakeDb.users.get(USER_ID)!;
    expect(row.panel_user_id).toBe("5678");
    expect(row.subscription_url).toBe("https://sub.atlassecure.ru/NEW");
  });

  it("create → A019 → adopts our existing ST user instead of duplicating", async () => {
    seed({ panel_user_id: null, remnawave_user_uuid: null, subscription_url: null });
    m.getUserByUsername.mockResolvedValueOnce(notFound("A063")).mockResolvedValueOnce(okR(panelUser({ id: 777, tag: "TRIAL" })));
    m.createUser.mockResolvedValue({ ok: false, kind: "conflict", status: 400, errorCode: "A019", message: "exists", method: "POST", path: "/api/users" });
    m.updateUser.mockResolvedValue(okR(panelUser({ id: 777 })));
    const r = await syncUserToPanel(USER_ID);
    expect(r.action).toBe("adopted");
    expect(m.createUser).toHaveBeenCalledTimes(1);
    expect(m.updateUser.mock.calls[0][0]).toMatchObject({ id: 777, status: "ACTIVE", tag: "SITE_BASIC" });
    expect(fakeDb.users.get(USER_ID)!.panel_user_id).toBe("777");
  });

  it("does not adopt a panel user with our username that is not provably ours", async () => {
    seed({ panel_user_id: null, remnawave_user_uuid: null, subscription_url: null, panel_username: "shared_name" });
    m.getUserByUsername
      .mockResolvedValueOnce(notFound("A063")) // ST00000042
      .mockResolvedValueOnce(okR(panelUser({ id: 9, username: "shared_name", tag: null, email: "someone@else.com", description: null })));
    m.createUser.mockResolvedValue(okR(panelUser({ id: 10 })));
    const r = await syncUserToPanel(USER_ID);
    expect(r.action).toBe("created");
    expect(fakeDb.users.get(USER_ID)!.panel_user_id).toBe("10");
  });
});
