/**
 * Tiny key-value settings store backed by Postgres (kv_settings table).
 *
 * Use for boolean feature flags and similar operational toggles that
 * the admin needs to flip from the UI without redeploys. Not a config
 * system — this is for "kill switches" and "circuit breakers" only.
 *
 * Cached in-process for 30s so hot paths (every bot request) don't
 * round-trip to the DB on each call. setSetting() bumps the cache
 * immediately so the new value is visible right away in the same node.
 */

import { pool } from "./db";

const CACHE_TTL_MS = 30_000;
const cache = new Map<string, { value: string; at: number }>();

export const SETTINGS = {
  /** When false, all mutating bot endpoints reject incoming requests. */
  BOT_SYNC_ENABLED: "bot_sync_enabled",
} as const;

export async function getSetting(key: string): Promise<string | null> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;
  const r = await pool.query<{ value: string }>(
    "SELECT value FROM kv_settings WHERE key = $1",
    [key]
  );
  const value = r.rows[0]?.value ?? null;
  if (value !== null) cache.set(key, { value, at: Date.now() });
  return value;
}

export async function setSetting(key: string, value: string, updatedBy?: string): Promise<void> {
  await pool.query(
    `INSERT INTO kv_settings (key, value, updated_by, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value,
           updated_by = EXCLUDED.updated_by,
           updated_at = NOW()`,
    [key, value, updatedBy || null]
  );
  cache.set(key, { value, at: Date.now() });
}

export async function getBool(key: string, fallback: boolean): Promise<boolean> {
  const v = await getSetting(key);
  if (v === null) return fallback;
  return v === "true" || v === "1";
}

export async function setBool(key: string, value: boolean, updatedBy?: string): Promise<void> {
  await setSetting(key, value ? "true" : "false", updatedBy);
}

/** Convenience wrapper for the bot-sync kill switch. Defaults ON. */
export function isBotSyncEnabled(): Promise<boolean> {
  return getBool(SETTINGS.BOT_SYNC_ENABLED, true);
}
