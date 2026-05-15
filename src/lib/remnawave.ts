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
 */

const API_URL = (process.env.REMNAWAVE_API_URL || "https://rmnw.atlassecure.ru").replace(/\/+$/, "");
const API_TOKEN = process.env.REMNAWAVE_API_TOKEN || "";
const MAIN_SQUAD = process.env.REMNAWAVE_MAINSERVER_SQUAD_UUID || "2c8eba36-6e74-45b1-af5e-54ea0e65e19d";

const REQUEST_TIMEOUT_MS = 5000;
const MAX_RETRIES = 2;

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
    console.warn("[REMNAWAVE] REMNAWAVE_API_TOKEN is not set; skipping API call:", path);
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
      if (res.ok || (res.status >= 400 && res.status < 500)) return res;
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

/** Generate a unique username for a new site signup. */
function makeUsername(): string {
  // 8-char hex prefix, predictable: site_<hex>
  const bytes = require("crypto").randomBytes(4) as Buffer;
  return `site_${bytes.toString("hex")}`;
}

/** Create a Remnawave user with a 24h unlimited trial on the MainServer squad. */
export async function createTrialUser(email: string): Promise<RemnawaveUser | null> {
  const expireAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const body = {
    username: makeUsername(),
    email,
    telegramId: null,
    expireAt,
    trafficLimitBytes: 0,
    trafficLimitStrategy: "NO_RESET",
    activeInternalSquads: [MAIN_SQUAD],
    internalSquads: [MAIN_SQUAD], // some Remnawave versions use this field name
    description: "site signup, trial 1d unlimited",
  };

  const res = await rwFetch("/api/users", { method: "POST", body: JSON.stringify(body) });
  if (!res) return null;
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.warn("[REMNAWAVE] createUser non-ok:", res.status, text.slice(0, 200));
    return null;
  }
  const data = await res.json().catch(() => null);
  return parseUser(data);
}

/** Get a Remnawave user by UUID. */
export async function getUser(uuid: string): Promise<RemnawaveUser | null> {
  const res = await rwFetch(`/api/users/${encodeURIComponent(uuid)}`);
  if (!res || !res.ok) return null;
  const data = await res.json().catch(() => null);
  return parseUser(data);
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

  const res = await rwFetch(`/api/users/${encodeURIComponent(uuid)}`, {
    method: "PATCH",
    body: JSON.stringify({ expireAt: newExpire }),
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
