/**
 * Remnawave API client.
 *
 * Endpoints:
 *   POST   /api/users
 *   GET    /api/users/{uuid}
 *   PATCH  /api/users/{uuid}
 *   DELETE /api/users/{uuid}
 *   POST   /api/system/encrypt-happ-crypto-link
 *
 * Auth: Bearer REMNAWAVE_API_TOKEN.
 * Squad UUID for MainServer: REMNAWAVE_MAINSERVER_SQUAD_UUID.
 *
 * All methods return Promise<T | null>. null means "Remnawave is unreachable
 * or returned a non-recoverable error" — callers should degrade gracefully
 * (show cached data, log a warning, do not crash).
 *
 * The last error from the most recent rwFetch call is stored in
 * lastRwError so admin diagnostics can read it without re-issuing a call.
 */

const API_URL = (process.env.REMNAWAVE_API_URL || "https://rmnw.atlassecure.ru").replace(/\/+$/, "");
const API_TOKEN = process.env.REMNAWAVE_API_TOKEN || "";
const MAIN_SQUAD = process.env.REMNAWAVE_MAINSERVER_SQUAD_UUID || "2c8eba36-6e74-45b1-af5e-54ea0e65e19d";

const REQUEST_TIMEOUT_MS = 5000;
const MAX_RETRIES = 2;

let lastRwError: string | null = null;
export function getLastRwError(): string | null { return lastRwError; }

export interface RemnawaveUser {
  uuid: string;
  shortUuid: string;
  username: string;
  email: string | null;
  subscriptionUrl: string;
  expireAt: string;
  trafficLimitBytes: number;
  usedTrafficBytes: number;
  status: string;
  vlessUuid?: string;
}

/** Minimal fetch with timeout + retry + exponential backoff. */
async function rwFetch(path: string, init: RequestInit = {}): Promise<Response | null> {
  if (!API_TOKEN) {
    lastRwError = "REMNAWAVE_API_TOKEN is not set";
    console.warn("[REMNAWAVE]", lastRwError, "— skipping", path);
    return null;
  }

  const url = `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${API_TOKEN}`,
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string>) || {}),
  };

  let lastErr: unknown = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(url, { ...init, headers, signal: ctrl.signal });
      clearTimeout(timer);
      if (res.ok || (res.status >= 400 && res.status < 500)) {
        if (!res.ok) lastRwError = `${init.method || "GET"} ${path} → HTTP ${res.status}`;
        else lastRwError = null;
        return res;
      }
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
    }
    if (attempt < MAX_RETRIES) {
      const backoff = 200 * Math.pow(2, attempt); // 200ms, 400ms
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  console.warn(`[REMNAWAVE] ${init.method || "GET"} ${path} failed after ${MAX_RETRIES + 1} attempts:`, lastErr);
  return null;
}

/** Parse a Remnawave user payload (handles {user: {...}} and bare {...} shapes). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseUser(data: any): RemnawaveUser | null {
  const u = data?.user ?? data?.data ?? data;
  if (!u || typeof u !== "object" || !u.uuid) return null;
  return {
    uuid: u.uuid,
    shortUuid: u.shortUuid || u.short_uuid || "",
    username: u.username || "",
    email: u.email ?? null,
    subscriptionUrl: u.subscriptionUrl || u.subscription_url || "",
    expireAt: u.expireAt || u.expire_at || "",
    trafficLimitBytes: Number(u.trafficLimitBytes || u.traffic_limit_bytes || 0),
    usedTrafficBytes: Number(u.usedTrafficBytes || u.used_traffic_bytes || 0),
    status: u.status || "ACTIVE",
    vlessUuid: u.vlessUuid || u.vless_uuid,
  };
}

/**
 * Derive a Remnawave-compatible username from an email.
 *
 * Remnawave 2.7.4 validation: ^[a-zA-Z0-9_-]+$ — only letters, digits,
 * underscores and dashes. NO dots, NO @ signs. We:
 *  - lowercase the address
 *  - replace anything outside [a-z0-9_-] (including ".", "@", "+") with "_"
 *  - collapse repeated underscores to a single "_"
 *  - trim leading/trailing underscores
 *  - cap at 32 chars
 *  - if truncated, append a 4-char sha1 suffix of the full email so two
 *    very-long addresses with the same first 27 chars don't collide
 *
 * Examples:
 *   "Foo.Bar+spam@gmail.com" → "foo_bar_spam_gmail_com"
 *   "user@example.com"        → "user_example_com"
 *   "very-long-customer-name+report@some-corp.example.org"
 *                             → "very-long-customer-name_repo_a3f8"
 */
function makeUsername(email: string): string {
  const cleaned = email
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[_-]+|[_-]+$/g, "");
  if (cleaned.length === 0) return "user_unnamed";
  if (cleaned.length <= 32) return cleaned;
  const crypto = require("crypto") as typeof import("crypto");
  const suffix = crypto.createHash("sha1").update(email.toLowerCase()).digest("hex").slice(0, 4);
  return `${cleaned.slice(0, 27)}_${suffix}`;
}

/** Create a Remnawave user with a 24h unlimited trial on the MainServer squad. */
export async function createTrialUser(email: string, panelId?: string | null): Promise<RemnawaveUser | null> {
  const expireAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  return createUserWithExpire(email, expireAt, "site signup, trial 1d unlimited", panelId);
}

/**
 * Create a Remnawave user with an arbitrary expireAt (used by admin bulk
 * migration of legacy users and by admin grant-subscription).
 */
/**
 * Idempotent create-or-adopt for a Remnawave user, keyed by a stable
 * 8-char panel_id we control on both sides. Email is metadata only —
 * the panel index is the username.
 *
 * Flow:
 *   1. GET /api/users/by-username/{panelId} — if the panel already has
 *      this user, PATCH its expireAt to the requested value and return.
 *      No POST is attempted, so no duplicate can be created.
 *   2. Else POST /api/users with username=panelId. On success — return.
 *   3. Else if the panel responds "already exists" (A019/409/422), one
 *      of the very rare concurrent calls beat us to it; re-run step 1
 *      and adopt.
 *
 * Because panelId is unique per local user, two concurrent provisions
 * of the same local user can only collide on the panel's unique
 * username constraint — they cannot produce two different panel users.
 */
export async function createUserWithExpire(
  email: string,
  expireAtIso: string,
  description?: string,
  panelId?: string | null
): Promise<RemnawaveUser | null> {
  const username = (panelId && panelId.trim()) || makeUsername(email);

  // Step 1: pre-check. If the panel has us already → adopt without POST.
  const preExisting = await getUserByUsername(username);
  if (preExisting?.uuid) {
    const updated = await setUserExpire(preExisting.uuid, expireAtIso);
    if (updated) {
      console.log(`[REMNAWAVE] adopted ${username} (uuid=${preExisting.uuid.slice(0, 8)}…) without POST`);
      return updated;
    }
    return preExisting;
  }

  // Step 2: POST.
  const body = {
    username,
    email,
    telegramId: null,
    expireAt: expireAtIso,
    trafficLimitBytes: 0,
    trafficLimitStrategy: "NO_RESET",
    activeInternalSquads: [MAIN_SQUAD],
    internalSquads: [MAIN_SQUAD],
    description: description || "site admin issue",
  };

  const res = await rwFetch("/api/users", { method: "POST", body: JSON.stringify(body) });
  if (!res) return null;
  if (res.ok) {
    const data = await res.json().catch(() => null);
    return parseUser(data);
  }

  const bodyText = await res.text().catch(() => "");
  const alreadyExists =
    bodyText.includes('"A019"') ||
    bodyText.toLowerCase().includes("already exists") ||
    res.status === 409 ||
    res.status === 422;

  if (alreadyExists) {
    // Step 3: race-loser path — another worker created us a moment ago.
    const existing = (await getUserByUsername(username)) || (await getUserByEmail(email));
    if (existing?.uuid) {
      const updated = await setUserExpire(existing.uuid, expireAtIso);
      console.log(`[REMNAWAVE] race-loser adopted ${username} uuid=${existing.uuid.slice(0, 8)}…`);
      return updated || existing;
    }
    lastRwError = `createUser ${res.status} (already exists) but lookup failed for username=${username}`;
    console.warn(`[REMNAWAVE] ${lastRwError}`);
    return null;
  }

  lastRwError = `createUser HTTP ${res.status}: ${bodyText.slice(0, 200)}`;
  console.warn("[REMNAWAVE] createUser non-ok:", res.status, bodyText.slice(0, 200));
  return null;
}

/** Get a Remnawave user by UUID. */
export async function getUser(uuid: string): Promise<RemnawaveUser | null> {
  const res = await rwFetch(`/api/users/${encodeURIComponent(uuid)}`);
  if (!res || !res.ok) return null;
  const data = await res.json().catch(() => null);
  return parseUser(data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractUserList(data: any): RemnawaveUser[] {
  if (!data) return [];
  if (Array.isArray(data)) return data.map(parseUser).filter((u): u is RemnawaveUser => !!u);
  const candidates = [data.users, data.data?.users, data.data, data.items, data.results];
  for (const c of candidates) {
    if (Array.isArray(c)) return c.map(parseUser).filter((u): u is RemnawaveUser => !!u);
  }
  const single = parseUser(data);
  return single ? [single] : [];
}

/**
 * Look up an existing Remnawave user by username, trying every path
 * variation observed across Remnawave builds:
 *   /api/users/by-username/{u}
 *   /api/users/username/{u}
 *   /api/users?username={u}
 *   /api/users?search={u}
 */
export async function getUserByUsername(username: string): Promise<RemnawaveUser | null> {
  for (const path of [
    `/api/users/by-username/${encodeURIComponent(username)}`,
    `/api/users/username/${encodeURIComponent(username)}`,
    `/api/users?username=${encodeURIComponent(username)}`,
    `/api/users?search=${encodeURIComponent(username)}`,
  ]) {
    const res = await rwFetch(path);
    if (!res?.ok) continue;
    const data = await res.json().catch(() => null);
    const list = extractUserList(data);
    const match = list.find((u) => u.username === username) || list[0];
    if (match) return match;
  }
  return null;
}

/** Look up an existing Remnawave user by email — same path variation set. */
export async function getUserByEmail(email: string): Promise<RemnawaveUser | null> {
  for (const path of [
    `/api/users/by-email/${encodeURIComponent(email)}`,
    `/api/users/email/${encodeURIComponent(email)}`,
    `/api/users?email=${encodeURIComponent(email)}`,
    `/api/users?search=${encodeURIComponent(email)}`,
  ]) {
    const res = await rwFetch(path);
    if (!res?.ok) continue;
    const data = await res.json().catch(() => null);
    const list = extractUserList(data);
    const match = list.find((u) => (u.email || "").toLowerCase() === email.toLowerCase()) || list[0];
    if (match) return match;
  }
  return null;
}

/**
 * Extend a Remnawave user's expireAt to max(current, now) + days.
 * Returns the updated user, or null on failure.
 */
export async function extendUserExpire(uuid: string, days: number): Promise<RemnawaveUser | null> {
  const current = await getUser(uuid);
  if (!current) return null;

  const currentEnd = new Date(current.expireAt || 0).getTime();
  const base = Math.max(currentEnd, Date.now());
  const newExpire = new Date(base + days * 24 * 60 * 60 * 1000).toISOString();

  return setUserExpire(uuid, newExpire);
}

/**
 * Set a Remnawave user's expireAt to an exact ISO timestamp.
 *
 * This is the preferred way to keep Remnawave in sync with the local DB
 * after the local subscription_end has already been computed: the caller
 * does the max(current, now) + duration math against its own
 * subscription_end and then mirrors the exact target here. Avoids drift
 * between the two stores caused by minute-vs-day rounding or by Remnawave
 * having a slightly different current expireAt.
 */
export async function setUserExpire(uuid: string, expireAtIso: string): Promise<RemnawaveUser | null> {
  const res = await rwFetch(`/api/users/${encodeURIComponent(uuid)}`, {
    method: "PATCH",
    body: JSON.stringify({ expireAt: expireAtIso }),
  });
  if (!res || !res.ok) return null;
  const data = await res.json().catch(() => null);
  return parseUser(data);
}

/** Delete a Remnawave user. Use only from admin tools. */
export async function deleteUser(uuid: string): Promise<boolean> {
  const res = await rwFetch(`/api/users/${encodeURIComponent(uuid)}`, { method: "DELETE" });
  return Boolean(res?.ok);
}

/**
 * Encrypt a plain subscription URL into a happ://crypto/... deep link.
 * Returns null if the endpoint is unavailable — callers should hide the Happ button.
 */
export async function encryptHappLink(subscriptionUrl: string): Promise<string | null> {
  const res = await rwFetch("/api/system/encrypt-happ-crypto-link", {
    method: "POST",
    body: JSON.stringify({ data: subscriptionUrl }),
  });
  if (!res || !res.ok) return null;
  const data = await res.json().catch(() => null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyData = data as any;
  return anyData?.cryptoLink || anyData?.link || anyData?.data?.cryptoLink || anyData?.data?.link || null;
}

export const REMNAWAVE_CONFIG = {
  apiUrl: API_URL,
  mainSquadUuid: MAIN_SQUAD,
  trialDurationMs: 24 * 60 * 60 * 1000,
};
