/**
 * Server-side sessions (security audit 13.09.2026): the cookie is a random
 * token stored only as a hash; a raw user id in the cookie grants nothing;
 * revocation, sliding expiry with an absolute cap, sign-out everywhere on
 * password reset.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../db", async () => {
  const m = await import("./session-fake");
  return { pool: m.secDb.pool, dbReady: Promise.resolve(), waitForDb: async () => {} };
});

import { secDb, seedUser } from "./session-fake";
import {
  createSession,
  findSessionWithUser,
  hashToken,
  revokeAllSessions,
  revokeSessionByToken,
  slidingExpiry,
  SESSION_ABSOLUTE_MS,
  SESSION_TOUCH_MS,
  SESSION_TTL_MS,
} from "../session-store";
import { getSessionUser, SESSION_COOKIE } from "../session";
import { resetUserPassword } from "../store";

const req = (value?: string) => ({ cookies: { get: (n: string) => (n === SESSION_COOKIE && value !== undefined ? { value } : undefined) } });

beforeEach(() => {
  secDb.reset();
  seedUser("u1");
  seedUser("u2");
});

describe("session tokens", () => {
  it("issues a 256-bit random token and stores only its SHA-256", async () => {
    const { token, session } = await createSession("u1", { ip: "1.2.3.4", userAgent: "UA" });
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(token).not.toContain("u1");
    const row = secDb.sessions[0];
    expect(row.token_hash).toBe(hashToken(token));
    expect(JSON.stringify(row)).not.toContain(token);
    expect(session.userId).toBe("u1");
  });

  it("two sign-ins give two different tokens", async () => {
    const a = await createSession("u1");
    const b = await createSession("u1");
    expect(a.token).not.toBe(b.token);
  });

  it("resolves a live token to its user", async () => {
    const { token } = await createSession("u1");
    const su = await getSessionUser(req(token));
    expect(su?.user.id).toBe("u1");
    expect(su?.user.email).toBe("u1@example.com");
  });

  it("REJECTS the old scheme: a raw user id in the cookie is not a session (and costs no DB query)", async () => {
    secDb.log = [];
    expect(await getSessionUser(req("u1"))).toBeNull();
    expect(await getSessionUser(req("7f9c2d4e-1b2a-4c3d-8e9f-0a1b2c3d4e5f"))).toBeNull();
    expect(secDb.log).toHaveLength(0);
  });

  it("an unknown but well-formed token is rejected", async () => {
    expect(await getSessionUser(req("A".repeat(43)))).toBeNull();
  });

  it("no cookie → null", async () => {
    expect(await getSessionUser(req())).toBeNull();
  });
});

describe("revocation", () => {
  it("logout revokes exactly that session", async () => {
    const a = await createSession("u1");
    const b = await createSession("u1");
    await revokeSessionByToken(a.token);
    expect(await getSessionUser(req(a.token))).toBeNull();
    expect((await getSessionUser(req(b.token)))?.user.id).toBe("u1");
  });

  it("revokeAllSessions can keep the caller's session", async () => {
    const a = await createSession("u1");
    const b = await createSession("u1");
    const other = await createSession("u2");
    expect(await revokeAllSessions("u1", a.session.id)).toBe(1);
    expect(await getSessionUser(req(a.token))).not.toBeNull();
    expect(await getSessionUser(req(b.token))).toBeNull();
    expect(await getSessionUser(req(other.token))).not.toBeNull();
  });

  it("password reset signs the account out everywhere", async () => {
    const a = await createSession("u1");
    const b = await createSession("u1");
    const other = await createSession("u2");
    expect(await resetUserPassword("u1@example.com", "NewPassw0rd")).toBe(true);
    expect(await getSessionUser(req(a.token))).toBeNull();
    expect(await getSessionUser(req(b.token))).toBeNull();
    expect(await getSessionUser(req(other.token))).not.toBeNull();
  });
});

describe("expiry", () => {
  it("expired sessions are rejected", async () => {
    const t0 = new Date("2026-09-01T00:00:00Z");
    const { token } = await createSession("u1", {}, t0);
    const later = new Date(t0.getTime() + SESSION_TTL_MS + 1000);
    expect(await findSessionWithUser(token, later)).toBeNull();
  });

  it("activity slides the expiry (at most one write per touch interval)", async () => {
    const t0 = new Date("2026-09-01T00:00:00Z");
    const { token } = await createSession("u1", {}, t0);

    const soon = new Date(t0.getTime() + 60_000);
    const r1 = await findSessionWithUser(token, soon);
    expect(r1?.touched).toBe(false);

    const t1 = new Date(t0.getTime() + SESSION_TOUCH_MS + 1000);
    const r2 = await findSessionWithUser(token, t1);
    expect(r2?.touched).toBe(true);
    expect(r2?.session.expiresAt.getTime()).toBe(t1.getTime() + SESSION_TTL_MS);
  });

  it("never beyond the absolute cap from sign-in", () => {
    const created = new Date("2026-09-01T00:00:00Z");
    const late = new Date(created.getTime() + SESSION_ABSOLUTE_MS - 60_000);
    expect(slidingExpiry(created, late).getTime()).toBe(created.getTime() + SESSION_ABSOLUTE_MS);
  });
});
