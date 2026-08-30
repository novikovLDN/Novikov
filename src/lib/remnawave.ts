/**
 * Remnawave API client.
 *
 * Endpoints:
 *   POST   /api/users
 *   GET    /api/users/{uuid}
 *   GET    /api/users (paginated list)
 *   PATCH  /api/users           — v2.x: body carries { uuid, ... }
 *   PATCH  /api/users/{uuid}    — pre-v2.x fallback
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

/**
 * Plan → panel tag map.
 *
 * Remnawave 3.x `tag` field is `^[A-Z0-9_]+$`, max 16 chars. Setting
 * it means the admin sees "TRIAL / BASIC / PLUS" in the panel next to
 * every user — no more guessing which local plan a panel record maps
 * to. Only three values so the mapping is exhaustive.
 */
const PLAN_TAG: Record<string, string> = {
  trial: "TRIAL",
  basic: "BASIC",
  plus: "PLUS",
};

/**
 * Panel-visible status of a user account.
 *
 * The panel manages EXPIRED / LIMITED transitions internally (once
 * expireAt or trafficLimitBytes is crossed) — PATCH /api/users only
 * accepts ACTIVE | DISABLED as an operator-driven state. That's why
 * we use one of those two here.
 */
export type RemnawaveStatus = "ACTIVE" | "DISABLED" | "LIMITED" | "EXPIRED";

export function tagForPlan(plan: string | null | undefined): string | null {
  if (!plan) return null;
  return PLAN_TAG[plan.toLowerCase()] ?? null;
}

export interface RemnawaveUser {
  uuid: string;
  shortUuid: string;
  username: string;
  email: string | null;
  subscriptionUrl: string;
  expireAt: string;
  trafficLimitBytes: number;
  usedTrafficBytes: number;
  status: RemnawaveStatus | string;
  vlessUuid?: string;
  tag?: string | null;
  description?: string | null;
  telegramId?: number | null;
  hwidDeviceLimit?: number | null;
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

/** @internal exported only for unit tests. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseUser(data: any): RemnawaveUser | null {
  // Remnawave 3.x envelope: { response: ExtendedUsersSchema }.
  // 2.7.x envelope: { response: { user: {...} } } or { response: {...} }.
  // Both handled here with a fallback chain.
  const u = data?.response?.user ?? data?.response ?? data?.user ?? data?.data ?? data;
  if (!u || typeof u !== "object") return null;
  // v3 dropped the `uuid` column and renamed it to `id` (drop user uuid,
  // rename user id column — v3.0 release note). Accept both so we can
  // parse responses from either version without crashing.
  const rawId = u.id ?? u.uuid;
  if (rawId == null) return null;
  const id = String(rawId);
  return {
    // Legacy alias — most of our callers still say `.uuid` and store the
    // value in `users.remnawave_user_uuid`. Keep them working; the string
    // stored is now the v3 numeric-ish id, not a UUID, but treated the
    // same by our code (opaque handle).
    uuid: id,
    shortUuid: u.shortUuid || u.short_uuid || u.subscriptionUuid || "",
    username: u.username || "",
    email: u.email ?? null,
    subscriptionUrl: u.subscriptionUrl || u.subscription_url || "",
    expireAt: u.expireAt || u.expire_at || "",
    trafficLimitBytes: Number(u.trafficLimitBytes || u.traffic_limit_bytes || 0),
    usedTrafficBytes: Number(
      u.usedTrafficBytes ||
        u.used_traffic_bytes ||
        u.userTraffic?.usedBytes ||
        u.userTraffic?.used_bytes ||
        0
    ),
    status: u.status || "ACTIVE",
    vlessUuid: u.vlessUuid || u.vless_uuid,
    tag: u.tag ?? null,
    description: u.description ?? null,
    telegramId: u.telegramId ?? u.telegram_id ?? null,
    hwidDeviceLimit: u.hwidDeviceLimit ?? u.hwid_device_limit ?? null,
  };
}

/** @internal exported only for unit tests. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractUserList(data: any): RemnawaveUser[] {
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

/**
 * Update a panel user's expireAt.
 *
 * Remnawave 2.x took the uuid out of the URL — the canonical endpoint
 * is `PATCH /api/users` with `{ uuid, expireAt, ... }` in the body.
 * Some older builds still use `PATCH /api/users/{uuid}`. We try the
 * modern shape first and fall back to the legacy one ONLY when the
 * panel says "no such route" (404 / 405). Any other HTTP error (auth,
 * validation, server) is propagated as-is — retrying with a different
 * URL would just hide it.
 *
 * Past-date guard: Remnawave validates expireAt and rejects anything
 * strictly in the past ("Expiration date cannot be in the past").
 * Pushing a date that's already expired locally is still useful as
 * an immediate revoke, so we clamp to `now + 30s` rather than skip —
 * the panel auto-disables once it ticks past.
 */
export async function setUserExpire(
  uuid: string,
  expireAtIso: string,
  opts?: {
    /** ACTIVE reactivates a user the panel had auto-transitioned to
     *  EXPIRED or LIMITED. Send it on every renewal so a user who
     *  paid AFTER their expiry actually gets their key working again
     *  — pushing expireAt alone doesn't flip status back on 3.x.
     *  DISABLED lets an admin freeze an account without deleting. */
    status?: "ACTIVE" | "DISABLED";
    /** Plan slug ("trial" | "basic" | "plus"). Maps to a `tag` on the
     *  panel side so an admin sees which plan each user is on at a
     *  glance. Pass `null` explicitly to clear. */
    plan?: string | null;
    /** Free-text panel description; `null` clears. */
    description?: string | null;
  }
): Promise<RemnawaveUser | null> {
  const safeExpireAt = clampExpireAt(expireAtIso);
  if (safeExpireAt !== expireAtIso) {
    console.log("[REMNAWAVE] setUserExpire: clamped past expireAt", expireAtIso, "→", safeExpireAt);
  }

  const extra: Record<string, unknown> = { expireAt: safeExpireAt };
  if (opts?.status) extra.status = opts.status;
  if (opts && "plan" in opts) {
    // `plan` was explicitly passed — set or clear the tag accordingly.
    const t = tagForPlan(opts.plan);
    if (t !== null) extra.tag = t;
    else if (opts.plan === null) extra.tag = null;
  }
  if (opts && "description" in opts) extra.description = opts.description;

  // Remnawave 3.x renamed the identifier column from `uuid` to `id`.
  // We keep `uuid` as our internal alias but must send `id` on the
  // wire for v3. Try `{id,...}` first; fall back to `{uuid,...}` for
  // panels still on 2.x; final fallback to the URL-in-path shape for
  // pre-2.x. Only route-not-found (404/405) and bad-request (400,
  // which fires when the panel rejects an unknown field) trigger the
  // next variant — real errors surface as-is.
  const variants: Array<{ path: string; body: Record<string, unknown> }> = [
    { path: "/api/users", body: { id: uuid, ...extra } },
    { path: "/api/users", body: { uuid, ...extra } },
    { path: `/api/users/${encodeURIComponent(uuid)}`, body: { ...extra } },
  ];

  let lastStatus = 0;
  let lastBodyText = "";

  for (const variant of variants) {
    const res = await rwFetch(variant.path, {
      method: "PATCH",
      body: JSON.stringify(variant.body),
    });
    if (!res) continue;
    if (res.ok) {
      const data = await res.json().catch(() => null);
      const parsed = parseUser(data);
      if (parsed) return parsed;
    }
    lastStatus = res?.status || 0;
    lastBodyText = await res.text().catch(() => "");
    // 404/405 = wrong endpoint, 400 = unknown-field rejection —
    // both merit trying the next variant. Anything else is real.
    if (res.status !== 404 && res.status !== 405 && res.status !== 400) break;
  }

  lastRwError = `PATCH user ${uuid.slice(0, 8)}… → HTTP ${lastStatus} ${lastBodyText.slice(0, 200)}`;
  console.warn(
    "[REMNAWAVE] setUserExpire failed:",
    lastStatus,
    "expireAt=",
    safeExpireAt,
    lastBodyText.slice(0, 300)
  );
  return null;
}

/**
 * Explicit action endpoints — POST /api/users/{uuid}/actions/…
 *
 * PATCH-with-status covers most cases (reactivate on renewal, freeze
 * on operator action). These action endpoints are the belt-and-braces
 * form the panel documents for the same transitions — one-shot POST
 * that returns the full user object.
 *
 * Kept as separate helpers because ops sometimes wants a hard toggle
 * without touching any of the user's other fields.
 */
export async function activateUser(uuid: string): Promise<RemnawaveUser | null> {
  const res = await rwFetch(`/api/users/${encodeURIComponent(uuid)}/actions/enable`, {
    method: "POST",
  });
  if (!res?.ok) return null;
  const data = await res.json().catch(() => null);
  return parseUser(data);
}

export async function disableUser(uuid: string): Promise<RemnawaveUser | null> {
  const res = await rwFetch(`/api/users/${encodeURIComponent(uuid)}/actions/disable`, {
    method: "POST",
  });
  if (!res?.ok) return null;
  const data = await res.json().catch(() => null);
  return parseUser(data);
}

/**
 * Revoke a user's subscription — panel rotates the subscription URL /
 * short UUID so any client with the old URL immediately stops working
 * (needed when a device is lost / password reset / suspicious activity).
 */
export async function revokeUserSubscription(uuid: string): Promise<RemnawaveUser | null> {
  const res = await rwFetch(`/api/users/${encodeURIComponent(uuid)}/actions/revoke`, {
    method: "POST",
  });
  if (!res?.ok) return null;
  const data = await res.json().catch(() => null);
  return parseUser(data);
}

/**
 * Clamp expireAt into the band [NOW + 30s, NOW + 400d].
 *
 * Lower bound — Remnawave validates expireAt and rejects strictly-past
 * dates ("Expiration date cannot be in the past"); a 30-second floor
 * lets revoke/expired states still create a profile that the panel
 * disables on its own.
 *
 * Upper bound — last-line defence against the 10-year ghost-date bug
 * that has been overwriting admin-fixed expireAts. If anything still
 * tries to push 2036 to the panel after our higher-level skip in
 * syncSubscriptionToPanel, we cap it at NOW+400d and emit a loud log
 * line so we can chase down the slipping path.
 */
/** @internal exported only for unit tests. */
export function clampExpireAt(expireAtIso: string): string {
  const target = new Date(expireAtIso).getTime();
  const min = Date.now() + 30_000;
  const max = Date.now() + 400 * 24 * 60 * 60 * 1000;
  if (target > max) {
    console.warn(`[REMNAWAVE] clampExpireAt: requested ${expireAtIso} > NOW+400d, clamping to ${new Date(max).toISOString()}`);
    return new Date(max).toISOString();
  }
  if (target < min) return new Date(min).toISOString();
  return expireAtIso;
}

/**
 * Rename a panel user's username.
 *
 * Used to migrate legacy hex panel_id usernames over to the canonical
 * ST00000NNN public_id format so admins can find users in the panel
 * UI by the same identifier shown on the site. Same endpoint shape as
 * setUserExpire (modern PATCH /api/users + legacy fallback).
 *
 * IMPORTANT: Remnawave 2.x's PATCH /api/users accepts a username field
 * but in some builds silently ignores it (returns 200 OK with the user
 * still on the OLD name). We verify the response actually carries the
 * new username before reporting success, so the sync log doesn't lie
 * to admins about renames that never took.
 */
export async function setUserUsername(uuid: string, username: string): Promise<RemnawaveUser | null> {
  const variants: Array<{ path: string; body: Record<string, unknown> }> = [
    { path: "/api/users", body: { uuid, username } },
    { path: `/api/users/${encodeURIComponent(uuid)}`, body: { username } },
  ];

  let lastStatus = 0;
  let lastBodyText = "";

  for (const variant of variants) {
    const res = await rwFetch(variant.path, {
      method: "PATCH",
      body: JSON.stringify(variant.body),
    });
    if (!res) continue;
    if (res.ok) {
      const data = await res.json().catch(() => null);
      const parsed = parseUser(data);
      if (parsed && parsed.username === username) return parsed;
      // 200 OK but the panel ignored our username — try the next URL
      // shape rather than declaring victory.
      lastStatus = 200;
      lastBodyText = `username unchanged (panel returned "${parsed?.username ?? ""}")`;
      continue;
    }
    lastStatus = res.status;
    lastBodyText = await res.text().catch(() => "");
    if (res.status !== 404 && res.status !== 405) break;
  }

  lastRwError = `PATCH username ${uuid.slice(0, 8)}… → ${lastStatus} ${lastBodyText.slice(0, 200)}`;
  console.warn("[REMNAWAVE] setUserUsername failed:", lastStatus, lastBodyText.slice(0, 300));
  return null;
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
 * Remnawave 3.x removed this endpoint entirely. On 404 we return null
 * silently; Happ accepts the raw subscription URL just fine, so the
 * user's connection continues to work — they just don't get the
 * shorter one-tap crypto deep link.
 */
export async function encryptHappLink(subscriptionUrl: string): Promise<string | null> {
  const res = await rwFetch("/api/system/encrypt-happ-crypto-link", {
    method: "POST",
    body: JSON.stringify({ data: subscriptionUrl }),
  });
  if (!res) return null;
  if (res.status === 404) return null;
  if (!res.ok) return null;
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
  panelId?: string | null,
  plan?: string | null
): Promise<RemnawaveUser | null> {
  const username = (panelId && panelId.trim()) || email.replace(/[^a-z0-9_-]/gi, "_").slice(0, 32);

  // Remnawave rejects POST with expireAt in the past — clamp so we
  // never get stuck unable to create a panel profile for a user whose
  // subscription_end has already elapsed (the profile lives but is
  // immediately disabled by the panel, which is the correct state).
  const safeExpireAt = clampExpireAt(expireAtIso);
  if (safeExpireAt !== expireAtIso) {
    console.log("[REMNAWAVE] createUserWithExpire: clamped past expireAt", expireAtIso, "→", safeExpireAt);
  }

  const existing = await getUserByUsername(username);
  if (existing?.uuid) {
    // Adoption path: user already exists in the panel with our
    // username. Sync BOTH expireAt AND plan-derived tag/status so the
    // adopted record reflects the current local plan, not whatever
    // stale state the panel had.
    const updated = await setUserExpire(existing.uuid, safeExpireAt, {
      status: "ACTIVE",
      plan,
    });
    return updated || existing;
  }

  const tag = tagForPlan(plan);
  const body: Record<string, unknown> = {
    username,
    email,
    telegramId: null,
    expireAt: safeExpireAt,
    status: "ACTIVE",
    trafficLimitBytes: 0,
    trafficLimitStrategy: "NO_RESET",
    // v3 dropped `internalSquads` — validator rejects unknown fields
    // with 400 and the whole create fails, which is why users lost
    // their keys after the panel upgrade. Only `activeInternalSquads`
    // is accepted now.
    activeInternalSquads: [MAIN_SQUAD],
    description: description || "atlas-secure site",
  };
  if (tag !== null) body.tag = tag;

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
      const updated = await setUserExpire(raceWinner.uuid, safeExpireAt, {
        status: "ACTIVE",
        plan,
      });
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
  return createUserWithExpire(email, expireAt, "site signup, trial 1d unlimited", panelId, "trial");
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
