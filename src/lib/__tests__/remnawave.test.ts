/**
 * Contract tests for the Remnawave panel client.
 *
 * These tests document — and pin down — exactly what request bodies
 * we send to the panel, what response envelopes we accept, and how
 * the v3.x-vs-v2.x fallback shims behave. They mock global.fetch so
 * they run without a live panel.
 *
 * Two audiences:
 *   - Us, reviewing changes. If a test breaks, the contract with the
 *     panel changed and we need to think about it.
 *   - The panel side. If they add a field or move a route, the tests
 *     show them what we're actually sending.
 *
 * Every test names the specific v3.0 breaking change it exercises so
 * we can trace back to why the assertion exists.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Env is set in src/lib/__tests__/setup.ts (referenced from vitest.config.ts).

import {
  parseUser,
  extractUserList,
  clampExpireAt,
  isOurPanelUser,
  getUser,
  getUserByUsername,
  createUserWithExpire,
  setUserExpire,
  encryptHappLink,
  deleteUser,
  tagForPlan,
  activateUser,
  disableUser,
  revokeUserSubscription,
} from "../remnawave";

// ─── fetch mock helpers ─────────────────────────────────────────

interface MockCall {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}

const calls: MockCall[] = [];
let nextResponses: Array<{ status: number; body: unknown; text?: string }> = [];

beforeEach(() => {
  calls.length = 0;
  nextResponses = [];
  vi.spyOn(global, "fetch").mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const headers = (init?.headers as Record<string, string>) || {};
    let parsedBody: unknown = undefined;
    if (init?.body) {
      try { parsedBody = JSON.parse(init.body as string); } catch { parsedBody = init.body; }
    }
    calls.push({ url, method: init?.method || "GET", headers, body: parsedBody });

    const r = nextResponses.shift();
    if (!r) throw new Error(`Unexpected fetch call to ${url} — no mock queued`);
    const bodyText = r.text ?? JSON.stringify(r.body);
    return new Response(bodyText, {
      status: r.status,
      headers: { "Content-Type": "application/json" },
    });
  });
});

function mockOk(body: unknown) {
  nextResponses.push({ status: 200, body });
}
function mockStatus(status: number, body: unknown = { message: "err" }) {
  nextResponses.push({ status, body });
}

// ─── parseUser — v3 vs v2 envelope shapes ───────────────────────

describe("parseUser (v3.0 renamed uuid→id, dropped internalSquads from body)", () => {
  it("parses a v3.x { response: user } envelope with `id` instead of `uuid`", () => {
    const raw = {
      response: {
        id: 42,                                   // v3: numeric id, uuid removed
        shortUuid: "abc123",
        username: "ST00000180",
        email: "u@example.com",
        subscriptionUrl: "https://sub.x/abc123",
        expireAt: "2027-01-01T00:00:00.000Z",
        trafficLimitBytes: 0,
        userTraffic: { usedBytes: 12345 },
        status: "ACTIVE",
        vlessUuid: "vless-xyz",
      },
    };
    const u = parseUser(raw);
    expect(u).not.toBeNull();
    expect(u!.uuid).toBe("42");                    // opaque handle — v3 id stringified
    expect(u!.username).toBe("ST00000180");
    expect(u!.email).toBe("u@example.com");
    expect(u!.subscriptionUrl).toBe("https://sub.x/abc123");
    expect(u!.usedTrafficBytes).toBe(12345);       // read from userTraffic.usedBytes
    expect(u!.shortUuid).toBe("abc123");
  });

  it("parses a v2.7 { response: {...} } envelope with legacy `uuid`", () => {
    const raw = {
      response: {
        uuid: "old-uuid-string",
        shortUuid: "short",
        username: "ST00000001",
        email: "legacy@example.com",
        subscriptionUrl: "https://sub.x/short",
        expireAt: "2026-06-01T00:00:00Z",
        trafficLimitBytes: 1000,
        usedTrafficBytes: 500,
        status: "ACTIVE",
      },
    };
    const u = parseUser(raw);
    expect(u!.uuid).toBe("old-uuid-string");
    expect(u!.usedTrafficBytes).toBe(500);
  });

  it("parses a v2.x { response: { user: {...} } } envelope", () => {
    const u = parseUser({ response: { user: { uuid: "u1", username: "n1", email: null } } });
    expect(u!.uuid).toBe("u1");
    expect(u!.email).toBe(null);
  });

  it("returns null when neither id nor uuid is present", () => {
    expect(parseUser({ response: { username: "no-id" } })).toBeNull();
    expect(parseUser({})).toBeNull();
    expect(parseUser(null)).toBeNull();
  });
});

// ─── extractUserList — v3 { response: { users: [...] } } shape ──

describe("extractUserList (v3 list envelope)", () => {
  it("finds users under response.users (v3.x list shape)", () => {
    const raw = { response: { total: 2, users: [{ id: 1, username: "a" }, { id: 2, username: "b" }] } };
    const list = extractUserList(raw);
    expect(list).toHaveLength(2);
    expect(list[0].uuid).toBe("1");
    expect(list[1].username).toBe("b");
  });

  it("returns [] for empty response", () => {
    expect(extractUserList({ response: { users: [] } })).toEqual([]);
    expect(extractUserList(null)).toEqual([]);
  });
});

// ─── clampExpireAt — v3 rejects past dates + our max-13-months ──

describe("clampExpireAt (guards the 10-year ghost-date bug and the 'no past dates' panel validation)", () => {
  it("returns the input unchanged when it's a legitimate future date", () => {
    const inTwoMonths = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
    expect(clampExpireAt(inTwoMonths)).toBe(inTwoMonths);
  });

  it("clamps past dates up to at least NOW + 30s (panel rejects strictly past)", () => {
    const past = new Date(Date.now() - 3600_000).toISOString();
    const clamped = new Date(clampExpireAt(past)).getTime();
    expect(clamped).toBeGreaterThan(Date.now());
    expect(clamped).toBeLessThan(Date.now() + 60_000);
  });

  it("caps far-future ghost dates (e.g. 2036) down to NOW + 400d", () => {
    const ghost = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString();
    const clampedMs = new Date(clampExpireAt(ghost)).getTime();
    const maxMs = Date.now() + 401 * 24 * 60 * 60 * 1000;
    expect(clampedMs).toBeLessThan(maxMs);
  });
});

// ─── isOurPanelUser — safety gate for the shared panel ──────────

describe("isOurPanelUser (never touch panel users owned by the bot)", () => {
  it("recognises ST00000NNN usernames as ours", () => {
    expect(isOurPanelUser({ username: "ST00000001" })).toBe(true);
    expect(isOurPanelUser({ username: "ST99999999" })).toBe(true);
  });

  it("refuses hex panel_id, tg_*_premium, empty and null", () => {
    expect(isOurPanelUser({ username: "d1d1f6d4" })).toBe(false);
    expect(isOurPanelUser({ username: "tg_12345_premium" })).toBe(false);
    expect(isOurPanelUser({ username: "" })).toBe(false);
    expect(isOurPanelUser({ username: null })).toBe(false);
  });
});

// ─── getUser: GET /api/users/{id} ───────────────────────────────

describe("getUser (v3 route: GET /api/users/{id})", () => {
  it("hits /api/users/{id} with bearer auth and parses the response", async () => {
    mockOk({ response: { id: 42, username: "ST00000180", email: null } });
    const u = await getUser("42");
    expect(u!.uuid).toBe("42");
    expect(calls[0].url).toBe("https://rmnw.test.example/api/users/42");
    expect(calls[0].method).toBe("GET");
    expect(calls[0].headers.Authorization).toBe("Bearer test-token-abc");
  });

  it("returns null on 404 (user gone from panel)", async () => {
    mockStatus(404, { message: "not found" });
    expect(await getUser("gone-uuid")).toBeNull();
  });
});

// ─── getUserByUsername: v3 route ────────────────────────────────

describe("getUserByUsername (v3 route: GET /api/users/by-username/{username})", () => {
  it("hits /api/users/by-username/{u} and returns exact match", async () => {
    mockOk({ response: { id: 7, username: "ST00000007", email: "a@b" } });
    const u = await getUserByUsername("ST00000007");
    expect(u!.username).toBe("ST00000007");
    expect(calls[0].url).toBe("https://rmnw.test.example/api/users/by-username/ST00000007");
  });

  it("falls through 4 path variants when panel returns 404 on first", async () => {
    mockStatus(404);   // /by-username/ 404
    mockStatus(404);   // /username/ 404
    mockStatus(404);   // ?username= 404
    mockStatus(404);   // ?search= 404
    expect(await getUserByUsername("nobody")).toBeNull();
    expect(calls.map((c) => c.url)).toEqual([
      "https://rmnw.test.example/api/users/by-username/nobody",
      "https://rmnw.test.example/api/users/username/nobody",
      "https://rmnw.test.example/api/users?username=nobody",
      "https://rmnw.test.example/api/users?search=nobody",
    ]);
  });

  it("refuses to accept a list-response user whose username does NOT exactly match (fuzzy-match guard)", async () => {
    // Some Remnawave builds ignore the query param and return the full
    // list. We must never adopt list[0] if it doesn't match — that was
    // the historical bug where every user got the same panel UUID.
    mockOk({ response: { users: [{ id: 1, username: "someoneElse" }] } });
    mockStatus(404);
    mockStatus(404);
    mockStatus(404);
    expect(await getUserByUsername("ST00000007")).toBeNull();
  });
});

// ─── createUserWithExpire — v3 POST body shape ──────────────────

describe("createUserWithExpire (v3 dropped `internalSquads`)", () => {
  it("sends POST /api/users with activeInternalSquads only, NO internalSquads field", async () => {
    // Adoption lookups → all 404 so we hit CREATE
    mockStatus(404); mockStatus(404); mockStatus(404); mockStatus(404);
    mockOk({
      response: {
        id: 100,
        username: "ST00000010",
        shortUuid: "sh10",
        email: "u@x",
        subscriptionUrl: "https://sub/sh10",
        expireAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      },
    });

    const expire = new Date(Date.now() + 30 * 86400000).toISOString();
    const rw = await createUserWithExpire("u@x", expire, "test", "ST00000010");

    expect(rw!.uuid).toBe("100");
    // The final call is the POST — find it
    const post = calls.find((c) => c.method === "POST" && c.url.endsWith("/api/users"));
    expect(post).toBeDefined();
    const body = post!.body as Record<string, unknown>;
    // MUST have activeInternalSquads
    expect(body.activeInternalSquads).toEqual(["squad-uuid-xyz"]);
    // MUST NOT have the removed field
    expect("internalSquads" in body).toBe(false);
    expect(body.username).toBe("ST00000010");
    expect(body.email).toBe("u@x");
    expect(body.trafficLimitStrategy).toBe("NO_RESET");
  });

  it("adopts an existing panel user with same username instead of duplicating", async () => {
    mockOk({ response: { id: 55, username: "ST00000055", shortUuid: "s55", email: "e", subscriptionUrl: "u" } });
    // PATCH for expireAt after adoption
    mockOk({ response: { id: 55, username: "ST00000055", shortUuid: "s55", email: "e", subscriptionUrl: "u", expireAt: "2027-01-01T00:00:00Z" } });

    const rw = await createUserWithExpire("e@x", new Date(Date.now() + 86400000).toISOString(), "d", "ST00000055");
    expect(rw!.uuid).toBe("55");
    // No POST /api/users at all — we adopted
    expect(calls.filter((c) => c.method === "POST" && c.url.endsWith("/api/users")).length).toBe(0);
  });
});

// ─── setUserExpire: v3 → v2 fallback ────────────────────────────

describe("setUserExpire (v3 PATCH /api/users with {uuid, expireAt}, PUT fallbacks)", () => {
  it("sends the v3 `{uuid, expireAt}` body first (matches CreateUserRequestDto contract) and succeeds on 200", async () => {
    const expire = new Date(Date.now() + 86400000).toISOString();
    mockOk({ response: { id: 42, username: "u", email: null, expireAt: expire, shortUuid: "s", subscriptionUrl: "sub" } });

    const rw = await setUserExpire("42", expire);
    expect(rw!.uuid).toBe("42");
    const patch = calls[0];
    expect(patch.method).toBe("PATCH");
    expect(patch.url).toBe("https://rmnw.test.example/api/users");
    expect(patch.body).toMatchObject({ uuid: "42" });
    // expireAt clamp-tolerant assertion
    expect(typeof (patch.body as Record<string, string>).expireAt).toBe("string");
  });

  it("falls back to `{id, expireAt}` body when `{uuid,…}` returns 400 (field-name variance across forks)", async () => {
    const expire = new Date(Date.now() + 86400000).toISOString();
    mockStatus(400, { message: "uuid: field not allowed" }); // v3 fork rejects uuid
    mockOk({ response: { id: 55, username: "u", email: null, expireAt: expire, shortUuid: "s", subscriptionUrl: "sub" } });

    const rw = await setUserExpire("55", expire);
    expect(rw!.uuid).toBe("55");
    expect(calls[0].body).toMatchObject({ uuid: "55" });
    expect(calls[1].body).toMatchObject({ id: "55" });
    expect(calls[1].url).toBe("https://rmnw.test.example/api/users");
  });

  it("falls back to legacy `PATCH /api/users/{id}` when both body-based PATCH attempts 404", async () => {
    const expire = new Date(Date.now() + 86400000).toISOString();
    mockStatus(404); // PATCH /api/users {uuid,...}
    mockStatus(404); // PATCH /api/users {id,...}
    mockOk({ response: { uuid: "abc", username: "u", email: null, expireAt: expire, shortUuid: "s", subscriptionUrl: "sub" } });

    const rw = await setUserExpire("abc", expire);
    expect(rw!.uuid).toBe("abc");
    expect(calls[2].method).toBe("PATCH");
    expect(calls[2].url).toBe("https://rmnw.test.example/api/users/abc");
  });

  it("falls back to PUT variants when every PATCH shape 404s (some 3.x forks block PATCH at proxy layer)", async () => {
    const expire = new Date(Date.now() + 86400000).toISOString();
    mockStatus(404); // PATCH /api/users {uuid}
    mockStatus(404); // PATCH /api/users {id}
    mockStatus(404); // PATCH /api/users/{id}
    mockOk({ response: { id: 99, username: "u", email: null, expireAt: expire, shortUuid: "s", subscriptionUrl: "sub" } });

    const rw = await setUserExpire("99", expire);
    expect(rw!.uuid).toBe("99");
    expect(calls[3].method).toBe("PUT");
    expect(calls[3].url).toBe("https://rmnw.test.example/api/users");
    expect(calls[3].body).toMatchObject({ uuid: "99" });
  });

  it("returns null and does NOT retry on real errors like 401 unauthorized", async () => {
    mockStatus(401, { message: "unauthorized" });
    const rw = await setUserExpire("x", new Date(Date.now() + 86400000).toISOString());
    expect(rw).toBeNull();
    expect(calls).toHaveLength(1);
  });

  it("passes plan tag + explicit ACTIVE status to the PATCH body when opts are provided", async () => {
    const expire = new Date(Date.now() + 30 * 86400000).toISOString();
    mockOk({ response: { id: 99, username: "u", email: null, expireAt: expire, shortUuid: "s", subscriptionUrl: "sub", status: "ACTIVE", tag: "PLUS" } });

    const rw = await setUserExpire("99", expire, { status: "ACTIVE", plan: "plus" });
    expect(rw!.uuid).toBe("99");
    const body = calls[0].body as Record<string, unknown>;
    expect(body.uuid).toBe("99");
    expect(body.status).toBe("ACTIVE");
    expect(body.tag).toBe("PLUS");
  });

  it("omits tag when plan is not provided (renewal without plan change)", async () => {
    const expire = new Date(Date.now() + 86400000).toISOString();
    mockOk({ response: { id: 7, username: "u", email: null, expireAt: expire, shortUuid: "s", subscriptionUrl: "sub" } });

    await setUserExpire("7", expire);
    const body = calls[0].body as Record<string, unknown>;
    expect("tag" in body).toBe(false);
    expect("status" in body).toBe(false);
  });

  it("maps plan slugs to uppercase tags", () => {
    expect(tagForPlan("trial")).toBe("TRIAL");
    expect(tagForPlan("basic")).toBe("BASIC");
    expect(tagForPlan("plus")).toBe("PLUS");
    expect(tagForPlan(null)).toBeNull();
    expect(tagForPlan("")).toBeNull();
    expect(tagForPlan("unknown_plan")).toBeNull();
  });
});

// ─── createUserWithExpire: plan tag on POST ─────────────────────

describe("createUserWithExpire — plan tag", () => {
  it("sends the tag field derived from the plan slug on CREATE", async () => {
    mockStatus(404); mockStatus(404); mockStatus(404); mockStatus(404);
    mockOk({ response: { id: 200, username: "ST00000200", email: "u@x", shortUuid: "s", subscriptionUrl: "sub", tag: "BASIC" } });

    const expire = new Date(Date.now() + 30 * 86400000).toISOString();
    await createUserWithExpire("u@x", expire, "test", "ST00000200", "basic");

    const post = calls.find((c) => c.method === "POST" && c.url.endsWith("/api/users"));
    expect(post).toBeDefined();
    const body = post!.body as Record<string, unknown>;
    expect(body.tag).toBe("BASIC");
    expect(body.status).toBe("ACTIVE");
    expect(body.trafficLimitBytes).toBe(0);
    expect(body.trafficLimitStrategy).toBe("NO_RESET");
    expect(body.activeInternalSquads).toEqual(["squad-uuid-xyz"]);
  });

  it("omits tag when no plan is passed (legacy call sites)", async () => {
    mockStatus(404); mockStatus(404); mockStatus(404); mockStatus(404);
    mockOk({ response: { id: 201, username: "ST00000201", email: "u@x", shortUuid: "s", subscriptionUrl: "sub" } });

    await createUserWithExpire("u@x", new Date(Date.now() + 86400000).toISOString(), "test", "ST00000201");
    const post = calls.find((c) => c.method === "POST" && c.url.endsWith("/api/users"));
    const body = post!.body as Record<string, unknown>;
    expect("tag" in body).toBe(false);
    // status:ACTIVE is unconditional — new panel users must be active
    expect(body.status).toBe("ACTIVE");
  });
});

// ─── action endpoints: enable / disable / revoke ────────────────

describe("action endpoints", () => {
  it("activateUser POSTs /api/users/{uuid}/actions/enable and returns parsed user", async () => {
    mockOk({ response: { id: 10, username: "u", email: null, expireAt: "", shortUuid: "s", subscriptionUrl: "sub", status: "ACTIVE" } });
    const rw = await activateUser("10");
    expect(rw!.status).toBe("ACTIVE");
    expect(calls[0].method).toBe("POST");
    expect(calls[0].url).toBe("https://rmnw.test.example/api/users/10/actions/enable");
  });

  it("disableUser POSTs /api/users/{uuid}/actions/disable and returns parsed user", async () => {
    mockOk({ response: { id: 11, username: "u", email: null, expireAt: "", shortUuid: "s", subscriptionUrl: "sub", status: "DISABLED" } });
    const rw = await disableUser("11");
    expect(rw!.status).toBe("DISABLED");
    expect(calls[0].url).toBe("https://rmnw.test.example/api/users/11/actions/disable");
  });

  it("revokeUserSubscription POSTs /api/users/{uuid}/actions/revoke", async () => {
    mockOk({ response: { id: 12, username: "u", email: null, expireAt: "", shortUuid: "new-s", subscriptionUrl: "new-sub" } });
    const rw = await revokeUserSubscription("12");
    expect(rw!.subscriptionUrl).toBe("new-sub");
    expect(calls[0].url).toBe("https://rmnw.test.example/api/users/12/actions/revoke");
  });

  it("returns null when panel replies with an error", async () => {
    mockStatus(500);
    expect(await activateUser("x")).toBeNull();
  });
});

// ─── encryptHappLink: v3 removed the endpoint ───────────────────

describe("encryptHappLink (removed in v3.x)", () => {
  it("returns null silently when the panel replies 404 (endpoint gone in v3)", async () => {
    mockStatus(404);
    expect(await encryptHappLink("https://sub/x")).toBeNull();
  });

  it("returns the deep link when the panel is still on 2.x and responds", async () => {
    mockOk({ response: { subscriptionCryptoLink: "https://foo/token123" } });
    const link = await encryptHappLink("https://sub/x");
    expect(link).toBe("happ://crypto/https://foo/token123");
  });

  it("normalises a bare token to a full happ:// URL", async () => {
    mockOk({ response: { subscriptionCryptoLink: "bare-token" } });
    const link = await encryptHappLink("https://sub/x");
    expect(link).toBe("happ://crypto/bare-token");
  });
});

// ─── deleteUser ─────────────────────────────────────────────────

describe("deleteUser (v3 DELETE /api/users/{id})", () => {
  it("hits DELETE /api/users/{id} and returns true on 200", async () => {
    mockOk({ response: { isDeleted: true } });
    expect(await deleteUser("42")).toBe(true);
    expect(calls[0].method).toBe("DELETE");
    expect(calls[0].url).toBe("https://rmnw.test.example/api/users/42");
  });

  it("returns false on 404", async () => {
    mockStatus(404);
    expect(await deleteUser("gone")).toBe(false);
  });
});
