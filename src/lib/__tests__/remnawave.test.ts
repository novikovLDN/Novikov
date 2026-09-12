/**
 * Contract tests for the Remnawave 3.4.3 client (fetch is mocked).
 * Fixtures follow @remnawave/backend-contract 3.4.13 — see fixtures.ts.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  buildCreateUserBody,
  createUser,
  DEFAULT_MAINSERVER_SQUAD_UUID,
  DEFAULT_REMNAWAVE_API_URL,
  deleteUser,
  findUsersByEmail,
  getUserById,
  getUserByUsername,
  isOurPanelUser,
  isUserGone,
  parsePanelUser,
  revokeUserSubscription,
  squadsForPlan,
  tagForPlan,
  updateUser,
} from "../remnawave";
import { DEVICE_LIMIT } from "../plans";
import { contractUser, ERR_USER_NOT_FOUND, ERR_USERNAME_EXISTS, ERR_VALIDATION } from "./fixtures";

interface MockCall {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}

const calls: MockCall[] = [];
type Queued = { status: number; body?: unknown } | { networkError: true };
let queue: Queued[] = [];

beforeEach(() => {
  calls.length = 0;
  queue = [];
  vi.spyOn(global, "fetch").mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    let body: unknown = undefined;
    if (init?.body) body = JSON.parse(init.body as string);
    calls.push({ url, method: init?.method || "GET", headers: (init?.headers as Record<string, string>) || {}, body });
    const next = queue.shift();
    if (!next) throw new Error(`unexpected fetch to ${url}`);
    if ("networkError" in next) throw new TypeError("fetch failed");
    return new Response(next.status === 204 ? null : JSON.stringify(next.body), { status: next.status, headers: { "Content-Type": "application/json" } });
  });
});

const ok = (body: unknown, status = 200) => queue.push({ status, body });
const fail = (status: number, body: unknown) => queue.push({ status, body });
const down = () => queue.push({ networkError: true });

describe("transport", () => {
  it("sends Bearer token and the X-Forwarded-* headers the 3.4.3 proxy check requires", async () => {
    ok({ response: contractUser() });
    await getUserById(1234);
    expect(calls[0].url).toBe("https://rmnw.test.example/api/users/1234");
    expect(calls[0].headers.Authorization).toBe("Bearer test-token-abc");
    expect(calls[0].headers["X-Forwarded-For"]).toBe("127.0.0.1");
    expect(calls[0].headers["X-Forwarded-Proto"]).toBe("https");
  });

  it("omits X-Forwarded-* when REMNAWAVE_FORWARDED_HEADERS=false", async () => {
    process.env.REMNAWAVE_FORWARDED_HEADERS = "false";
    try {
      ok({ response: contractUser() });
      await getUserById(1234);
      expect(calls[0].headers["X-Forwarded-For"]).toBeUndefined();
    } finally {
      delete process.env.REMNAWAVE_FORWARDED_HEADERS;
    }
  });

  it("falls back to the production URL / squad defaults when env is unset", async () => {
    const url = process.env.REMNAWAVE_API_URL;
    const squad = process.env.REMNAWAVE_MAINSERVER_SQUAD_UUID;
    delete process.env.REMNAWAVE_API_URL;
    delete process.env.REMNAWAVE_MAINSERVER_SQUAD_UUID;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      ok({ response: contractUser() });
      await getUserById(1);
      expect(calls[0].url.startsWith(DEFAULT_REMNAWAVE_API_URL)).toBe(true);
      expect(squadsForPlan("basic")).toEqual([DEFAULT_MAINSERVER_SQUAD_UUID]);
    } finally {
      process.env.REMNAWAVE_API_URL = url;
      process.env.REMNAWAVE_MAINSERVER_SQUAD_UUID = squad;
      warn.mockRestore();
    }
  });

  it("returns kind=config and sends nothing without a token", async () => {
    const token = process.env.REMNAWAVE_API_TOKEN;
    delete process.env.REMNAWAVE_API_TOKEN;
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const r = await getUserById(1);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.kind).toBe("config");
      expect(calls).toHaveLength(0);
    } finally {
      process.env.REMNAWAVE_API_TOKEN = token;
      err.mockRestore();
    }
  });

  it("retries GET on network errors, then reports unavailable (3 attempts)", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    down();
    down();
    down();
    const r = await getUserById(1234);
    expect(calls).toHaveLength(3);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.kind).toBe("unavailable");
    expect(isUserGone(r)).toBe(false);
    warn.mockRestore();
  });

  it("maps 401 to kind=auth (never 'user gone')", async () => {
    fail(401, { statusCode: 401, message: "Unauthorized" });
    const r = await getUserById(1234);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.kind).toBe("auth");
    expect(isUserGone(r)).toBe(false);
  });
});

describe("parsePanelUser (contract 3.4.13 ExtendedUsersSchema)", () => {
  it("parses the integer id, link, traffic and squads", () => {
    const u = parsePanelUser(contractUser());
    expect(u).not.toBeNull();
    expect(u!.id).toBe(1234);
    expect(u!.subscriptionUrl).toBe("https://sub.atlassecure.ru/Xk3pQ9vT2mL8nR4s");
    expect(u!.usedTrafficBytes).toBe(1048576);
    expect(u!.hwidDeviceLimit).toBe(14);
    expect(u!.activeInternalSquads).toEqual([{ uuid: "squad-uuid-xyz", name: "MainServer" }]);
  });

  it("rejects objects without an integer id (2.x uuid-only shape)", () => {
    expect(parsePanelUser({ uuid: "0b5f…", username: "x" })).toBeNull();
  });
});

describe("GET /api/users/{id}", () => {
  it("404 A025 → not_found and isUserGone", async () => {
    fail(404, ERR_USER_NOT_FOUND);
    const r = await getUserById(9999);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.kind).toBe("not_found");
      expect(r.errorCode).toBe("A025");
    }
    expect(isUserGone(r)).toBe(true);
    expect(calls).toHaveLength(1);
  });

  it("404 without an error code (e.g. a proxy page) is NOT 'user gone'", async () => {
    fail(404, { message: "Cannot GET" });
    const r = await getUserById(9999);
    expect(isUserGone(r)).toBe(false);
  });
});

describe("lookups", () => {
  it("getUserByUsername hits /api/users/by-username/{u}", async () => {
    ok({ response: contractUser() });
    const r = await getUserByUsername("ST00000042");
    expect(calls[0].url).toBe("https://rmnw.test.example/api/users/by-username/ST00000042");
    expect(r.ok && r.data.username).toBe("ST00000042");
  });

  it("findUsersByEmail uses /api/users/stream?email= and keeps exact matches only", async () => {
    ok({ response: { users: [contractUser(), contractUser({ id: 2, username: "other", email: "x@example.com" })], nextCursor: null, hasMore: false } });
    const r = await findUsersByEmail("U@Example.com");
    expect(calls[0].url).toContain("/api/users/stream?email=u%40example.com");
    expect(r.ok && r.data.map((u) => u.id)).toEqual([1234]);
  });
});

describe("POST /api/users", () => {
  const body = buildCreateUserBody({
    publicId: "ST00000042",
    email: "u@example.com",
    userId: "11111111-2222-3333-4444-555555555555",
    expireAt: new Date("2026-10-12T10:00:00.000Z"),
    plan: "basic",
    squadUuids: ["squad-uuid-xyz"],
  });

  it("builds the site body: ST username, SITE_* tag, description, device limit, no telegramId", () => {
    expect(body).toEqual({
      username: "ST00000042",
      status: "ACTIVE",
      expireAt: "2026-10-12T10:00:00.000Z",
      email: "u@example.com",
      description: "atlas-site:11111111-2222-3333-4444-555555555555",
      tag: "SITE_BASIC",
      trafficLimitBytes: 0,
      trafficLimitStrategy: "NO_RESET",
      hwidDeviceLimit: DEVICE_LIMIT,
      activeInternalSquads: ["squad-uuid-xyz"],
    });
    expect(body).not.toHaveProperty("telegramId");
    expect(body.username).toMatch(/^[a-zA-Z0-9_-]{3,36}$/);
    expect(body.tag).toMatch(/^[A-Z0-9_]{1,16}$/);
  });

  it("201 → ok with the created user", async () => {
    ok({ response: contractUser() }, 201);
    const r = await createUser(body);
    expect(calls[0].method).toBe("POST");
    expect(calls[0].body).toEqual(body);
    expect(r.ok && r.data.id).toBe(1234);
  });

  it("400 A019 → conflict", async () => {
    fail(400, ERR_USERNAME_EXISTS);
    const r = await createUser(body);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.kind).toBe("conflict");
      expect(r.errorCode).toBe("A019");
    }
  });

  it("is NOT retried on a network error (no duplicate creates)", async () => {
    down();
    const r = await createUser(body);
    expect(calls).toHaveLength(1);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.kind).toBe("unavailable");
  });
});

describe("PATCH /api/users", () => {
  it("sends {id, expireAt, status, tag} — absolute values", async () => {
    ok({ response: contractUser() });
    await updateUser({ id: 1234, expireAt: "2026-10-12T10:00:00.000Z", status: "ACTIVE", tag: "SITE_PLUS" });
    expect(calls[0].method).toBe("PATCH");
    expect(calls[0].url).toBe("https://rmnw.test.example/api/users");
    expect(calls[0].body).toEqual({ id: 1234, expireAt: "2026-10-12T10:00:00.000Z", status: "ACTIVE", tag: "SITE_PLUS" });
  });

  it("400 validation → kind=validation with the zod details in the message", async () => {
    fail(400, ERR_VALIDATION);
    const r = await updateUser({ id: 1234, expireAt: "2020-01-01T00:00:00.000Z" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.kind).toBe("validation");
      expect(r.message).toContain("Expiration date cannot be in the past");
    }
  });

  it("retries on 503 and succeeds", async () => {
    fail(503, { message: "busy" });
    ok({ response: contractUser() });
    const r = await updateUser({ id: 1234, status: "DISABLED" });
    expect(calls).toHaveLength(2);
    expect(r.ok).toBe(true);
  });

  it("refuses to send without id or username", async () => {
    const r = await updateUser({ status: "ACTIVE" });
    expect(r.ok).toBe(false);
    expect(calls).toHaveLength(0);
  });
});

describe("actions", () => {
  it("revoke rotates the link (revokeOnlyPasswords=false by default)", async () => {
    ok({ response: contractUser({ shortUuid: "NEWshortUuid00001", subscriptionUrl: "https://sub.atlassecure.ru/NEWshortUuid00001" }) });
    const r = await revokeUserSubscription(1234);
    expect(calls[0].url).toBe("https://rmnw.test.example/api/users/1234/actions/revoke");
    expect(calls[0].body).toEqual({ revokeOnlyPasswords: false });
    expect(r.ok && r.data.subscriptionUrl).toContain("NEWshortUuid00001");
  });

  it("DELETE → 204 is ok", async () => {
    queue.push({ status: 204 });
    const r = await deleteUser(1234);
    expect(calls[0].method).toBe("DELETE");
    expect(r.ok).toBe(true);
  });
});

describe("site conventions", () => {
  it("maps plans to SITE_* tags", () => {
    expect(tagForPlan("trial")).toBe("SITE_TRIAL");
    expect(tagForPlan("basic")).toBe("SITE_BASIC");
    expect(tagForPlan("PLUS")).toBe("SITE_PLUS");
    expect(tagForPlan("none")).toBeNull();
  });

  it("isOurPanelUser: SITE_* tag or ST username; a legacy tag alone is not proof", () => {
    expect(isOurPanelUser({ username: "anything", tag: "SITE_PLUS" })).toBe(true);
    expect(isOurPanelUser({ username: "ST00000042", tag: "BASIC" })).toBe(true);
    expect(isOurPanelUser({ username: "ST00000042", tag: null })).toBe(true);
    expect(isOurPanelUser({ username: "tg_12345", tag: "BASIC" })).toBe(false);
    expect(isOurPanelUser({ username: "a1b2c3d4", tag: null })).toBe(false);
  });

  it("per-plan squads override the main squad only when set", () => {
    expect(squadsForPlan("plus")).toEqual(["squad-uuid-xyz"]);
    process.env.REMNAWAVE_SQUAD_PLUS = "plus-1,plus-2";
    try {
      expect(squadsForPlan("plus")).toEqual(["plus-1", "plus-2"]);
      expect(squadsForPlan("basic")).toEqual(["squad-uuid-xyz"]);
    } finally {
      delete process.env.REMNAWAVE_SQUAD_PLUS;
    }
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});
