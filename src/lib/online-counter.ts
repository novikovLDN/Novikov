/**
 * Deterministic, time-based global online counter.
 *
 * Returns the SAME value to every client that calls within the same
 * 10-second window — so two users open the dashboard side by side and
 * see identical numbers, with no shared server state to maintain.
 *
 * The value is composed from multiple time-scale hashes:
 *   day-of-epoch       30k..60k baseline (rolls daily)
 *   hour-of-epoch      ±4k drift (sub-daily ebb)
 *   5-min-of-epoch     ±100
 *   minute-of-epoch    ±20
 *   10-sec-of-epoch    ±10
 * The combined result is clamped to [23_000, 70_000].
 *
 * Used by /api/network/online so the frontend just polls a JSON
 * endpoint instead of running its own RNG.
 */

const MIN = 23_000;
const MAX = 70_000;

function hashSeed(seed: number): number {
  // Mulberry32 — fast, deterministic 0..1 float.
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function onlineAt(unixSeconds: number = Math.floor(Date.now() / 1000)): number {
  const day = Math.floor(unixSeconds / 86400);
  const hour = Math.floor(unixSeconds / 3600);
  const fiveMin = Math.floor(unixSeconds / 300);
  const minute = Math.floor(unixSeconds / 60);
  const tick = Math.floor(unixSeconds / 10);

  const dayBase = 30_000 + Math.floor(hashSeed(day * 1009 + 17) * 30_000);
  const hourMod = Math.floor((hashSeed(hour * 5009 + 31) - 0.5) * 8_000);
  const fiveMinMod = Math.floor((hashSeed(fiveMin * 7919 + 47) - 0.5) * 200);
  const minMod = Math.floor((hashSeed(minute * 1259 + 89) - 0.5) * 40);
  const tickMod = Math.floor((hashSeed(tick * 953 + 13) - 0.5) * 20);

  const value = dayBase + hourMod + fiveMinMod + minMod + tickMod;
  return Math.max(MIN, Math.min(MAX, value));
}
