/**
 * Remnawave API client.
 *
 * Endpoints:
 *   POST   /api/users
 *   GET    /api/users/{uuid}
 *   GET    /api/users (paginated list)
 *   PATCH  /api/users/{uuid}
 *   DELETE /api/users/{uuid}
 *   POST   /api/system/encrypt-happ-crypto-link
 *
 * Auth: Bearer REMNAWAVE_API_TOKEN.
 * Squad UUID for MainServer: REMNAWAVE_MAINSERVER_SQUAD_UUID.
 *
 * Stable identification: every local user has a unique 8-char hex
 * `panel_id` column. We send it to the panel as `username`. The same
 * panel_id is used for lookups, so a re-run of any provisioning flow
 * adopts the existing panel user instead of creating a duplicate.
 */

const API_URL = (process.env.REMNAWAVE_API_URL || "https://rmnw.atlassecure.ru").replace(/\/+$/, "");
const API_TOKEN = process.env.REMNAWAVE_API_TOKEN || "";
const MAIN_SQUAD = process.env.REMNAWAVE_MAINSERVER_SQUAD_UUID || "2c8eba36-6e74-45b1-af5e-54ea0e65e19d";

const REQUEST_TIMEOUT_MS = 10000;
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

/** Fetch with timeout + retry + exponential backoff. */
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
      const backoff = 250 * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  lastRwError = `${init.method || "GET"} ${path} failed after ${MAX_RETRIES + 1} attempts: ${lastErr}`;
  console.warn(`[REMNAWAVE] ${lastRwError}`);
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseUser(data: any): RemnawaveUser | null {
  // Remnawave 2.7.x wraps responses in {response: {...}}. Try that
  // envelope first, then fall back to bare / data / user shapes.
  const u = data?.response?.user ?? data?.response ?? data?.user ?? data?.data ?? data;
  if (!u || typeof u !== "object" || !u.uuid) return null;
  return {
    uuid: u.uuid,
    shortUuid: u.shortUuid || u.short_uuid || u.subscriptionUuid || "",
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractUserList(data: any): RemnawaveUser[] {
  if (!data) return [];
  if (Array.isArray(data)) return data.map(parseUser).filter((u): u is RemnawaveUser => !!u);
  const candidates = [
    data.response?.users,
    data.response,
    data.users,
    data.data?.users,
    data.data,
    data.items,
    data.results,
  ];
  for (const c of candidates) {
    if (Array.isArray(c)) return c.map(parseUser).filter((u): u is RemnawaveUser => !!u);
  }
  const single = parseUser(data);
  return single ? [single] : [];
}

/** GET /api/users/{uuid}. Returns null on 404 or unreachable panel. */
export async function getUser(uuid: string): Promise<RemnawaveUser | null> {
  const res = await rwFetch(`/api/users/${encodeURIComponent(uuid)}`);
  if (!res || !res.ok) return null;
  const data = await res.json().catch(() => null);
  return parseUser(data);
}

/**
 * Look up by username — STRICT exact match only.
 *
 * Some Remnawave variants treat unknown query params as no-ops and
 * happily return the full user list, which previously caused us to
 * pick `list[0]` and assign every local user the same panel UUID.
 * Now we only adopt when u.username === username exactly. If no exact
 * match is found across all path variants, returns null.
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
    const exact = list.find((u) => u.username === username);
    if (exact) return exact;
  }
  return null;
}

/** Look up by email — STRICT exact match only. */
export async function getUserByEmail(email: string): Promise<RemnawaveUser | null> {
  const target = email.toLowerCase();
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
    const exact = list.find((u) => (u.email || "").toLowerCase() === target);
    if (exact) return exact;
  }
  return null;
}

/** Return ALL panel users with matching email — STRICT exact match. */
export async function getAllUsersByEmail(email: string): Promise<RemnawaveUser[]> {
  const target = email.toLowerCase();
  const found: RemnawaveUser[] = [];
  const seen = new Set<string>();
  for (const path of [
    `/api/users/by-email/${encodeURIComponent(email)}`,
    `/api/users?email=${encodeURIComponent(email)}`,
    `/api/users?search=${encodeURIComponent(email)}`,
  ]) {
    const res = await rwFetch(path);
    if (!res?.ok) continue;
    const data = await res.json().catch(() => null);
    const list = extractUserList(data);
    for (const u of list) {
      if (!u.uuid || seen.has(u.uuid)) continue;
      if ((u.email || "").toLowerCase() === target) {
        found.push(u);
        seen.add(u.uuid);
      }
    }
  }
  return found;
}

/** PATCH /api/users/{uuid} with a literal expireAt. */
export async function setUserExpire(uuid: string, expireAtIso: string): Promise<RemnawaveUser | null> {
  const res = await rwFetch(`/api/users/${encodeURIComponent(uuid)}`, {
    method: "PATCH",
    body: JSON.stringify({ expireAt: expireAtIso }),
  });
  if (!res || !res.ok) return null;
  const data = await res.json().catch(() => null);
  return parseUser(data);
}

/** Convenience: max(current, now) + days, then setUserExpire. */
export async function extendUserExpire(uuid: string, days: number): Promise<RemnawaveUser | null> {
  const current = await getUser(uuid);
  if (!current) return null;
  const base = Math.max(new Date(current.expireAt || 0).getTime(), Date.now());
  return setUserExpire(uuid, new Date(base + days * 24 * 60 * 60 * 1000).toISOString());
}

/** DELETE /api/users/{uuid}. */
export async function deleteUser(uuid: string): Promise<boolean> {
  const res = await rwFetch(`/api/users/${encodeURIComponent(uuid)}`, { method: "DELETE" });
  return Boolean(res?.ok);
}

/**
 * POST /api/system/encrypt-happ-crypto-link. Returns the full
 * happ://crypto/<token> URL (Happ's encrypted-subscription deep link).
 *
 * Remnawave 2.7.x wraps the answer in {response: {...}}; older builds
 * return the field at the top level. Some builds prefix the value
 * with "happ://crypto/" themselves, others return just the token —
 * we normalise to a complete happ:// URL.
 *
 * Returns null only when the panel is unreachable / returns no link.
 */
export async function encryptHappLink(subscriptionUrl: string): Promise<string | null> {
  const res = await rwFetch("/api/system/encrypt-happ-crypto-link", {
    method: "POST",
    body: JSON.stringify({ data: subscriptionUrl }),
  });
  if (!res || !res.ok) return null;
  const data = await res.json().catch(() => null);
  if (!data) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data as any;
  const candidates = [
    d.response?.subscriptionCryptoLink,
    d.response?.cryptoLink,
    d.response?.link,
    d.subscriptionCryptoLink,
    d.cryptoLink,
    d.link,
    d.data?.subscriptionCryptoLink,
    d.data?.cryptoLink,
    d.data?.link,
  ];
  let raw = candidates.find((v) => typeof v === "string" && v.length > 0) as string | undefined;
  if (!raw) {
    console.warn("[REMNAWAVE] encrypt-happ-crypto-link: no link field in response", JSON.stringify(data).slice(0, 300));
    return null;
  }
  // Normalize: if panel returned just the token, prepend the scheme.
  if (!raw.startsWith("happ://")) raw = `happ://crypto/${raw}`;
  return raw;
}

/**
 * Idempotent create-or-adopt keyed by panel_id (username).
 *   1. GET by panel_id → adopt + PATCH expireAt.
 *   2. POST with username=panel_id.
 *   3. On A019 / "already exists": re-lookup by username, then by
 *      email, and adopt.
 */
export async function createUserWithExpire(
  email: string,
  expireAtIso: string,
  description?: string,
  panelId?: string | null
): Promise<RemnawaveUser | null> {
  const username = (panelId && panelId.trim()) || email.replace(/[^a-z0-9_-]/gi, "_").slice(0, 32);

  const existing = await getUserByUsername(username);
  if (existing?.uuid) {
    const updated = await setUserExpire(existing.uuid, expireAtIso);
    return updated || existing;
  }

  const body = {
    username,
    email,
    telegramId: null,
    expireAt: expireAtIso,
    trafficLimitBytes: 0,
    trafficLimitStrategy: "NO_RESET",
    activeInternalSquads: [MAIN_SQUAD],
    internalSquads: [MAIN_SQUAD],
    description: description || "atlas-secure site",
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
    // SAFETY: race-loser adoption looks up ONLY by username (our own
    // ST-prefixed public_id). We never adopt by email, because the
    // panel is shared with another service and an email-match could
    // be that other service's user — which we must not modify.
    const raceWinner = await getUserByUsername(username);
    if (raceWinner?.uuid) {
      const updated = await setUserExpire(raceWinner.uuid, expireAtIso);
      return updated || raceWinner;
    }
  }

  lastRwError = `createUser HTTP ${res.status}: ${bodyText.slice(0, 200)}`;
  console.warn("[REMNAWAVE] createUser non-ok:", res.status, bodyText.slice(0, 200));
  return null;
}

/** 24h unlimited trial wrapper. */
export async function createTrialUser(email: string, panelId?: string | null): Promise<RemnawaveUser | null> {
  const expireAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  return createUserWithExpire(email, expireAt, "site signup, trial 1d unlimited", panelId);
}

export const REMNAWAVE_CONFIG = {
  apiUrl: API_URL,
  mainSquadUuid: MAIN_SQUAD,
  trialDurationMs: 24 * 60 * 60 * 1000,
  isConfigured: Boolean(API_TOKEN),
};

/**
 * Strict ownership check.
 *
 * The Remnawave panel is shared with another service (the Telegram
 * bot). We must NEVER delete or modify panel users that don't belong
 * to us. A panel user is OURS only if its username starts with the
 * "ST" prefix — that's the format syncSubscriptionToPanel assigns to
 * every user it creates from the site (`public_id`).
 *
 * Use this guard before any DELETE or destructive PATCH that targets
 * a panel user the site code didn't itself just create.
 */
export function isOurPanelUser(u: { username?: string | null }): boolean {
  return typeof u.username === "string" && /^ST\d+$/.test(u.username);
}
