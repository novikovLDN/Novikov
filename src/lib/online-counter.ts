/**
 * Deterministic, time-based global online counter.
 *
 * Returns the SAME value to every client that calls within the same
 * 10-second window. Designed to feel alive without producing the
 * abrupt vertical lines a naïve per-bucket RNG creates.
 *
 * Modulation layers, summed:
 *
 *   slow daily baseline               30..60k  (changes once a day)
 *   hourly drift                       ±8 000  (lerp across the hour)
 *   five-minute wiggle                 ±500    (lerp every 5 min)
 *   per-minute fluctuation             ±120    (lerp every minute)
 *   per-10s tick jitter                ±35     (raw per-tick)
 *
 * Each layer uses smoothstep-eased interpolation between adjacent
 * buckets, so there are no step changes — the curve drifts. The
 * sub-minute layers add enough motion that the chart actually
 * looks alive instead of flat. Bounded to [23_000, 70_000].
 */

const MIN = 23_000;
const MAX = 70_000;

function hashSeed(seed: number): number {
  // Mulberry32 — deterministic 0..1.
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Smooth, easing-friendly interpolation. */
function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/** Continuous modulation between adjacent buckets, smoothed by easing. */
function lerpBucket(bucket: number, fraction: number, salt: number, range: number): number {
  const a = (hashSeed(bucket * salt + 31) - 0.5) * range;
  const b = (hashSeed((bucket + 1) * salt + 31) - 0.5) * range;
  const t = smoothstep(fraction);
  return a + (b - a) * t;
}

export function onlineAt(unixSeconds: number = Math.floor(Date.now() / 1000)): number {
  const day = Math.floor(unixSeconds / 86400);
  const dayBase = 30_000 + hashSeed(day * 1009 + 17) * 30_000;

  // Hourly modulation ±8k (lerped through the hour by minute frac).
  const hour = Math.floor(unixSeconds / 3600);
  const hourFrac = (unixSeconds % 3600) / 3600;
  const hourMod = lerpBucket(hour, hourFrac, 5009, 16_000);

  // Five-minute modulation ±500.
  const fiveMin = Math.floor(unixSeconds / 300);
  const fiveMinFrac = (unixSeconds % 300) / 300;
  const fiveMinMod = lerpBucket(fiveMin, fiveMinFrac, 7919, 1_000);

  // Per-minute fluctuation ±120 — gives the line its frequent wiggle.
  const minute = Math.floor(unixSeconds / 60);
  const minuteFrac = (unixSeconds % 60) / 60;
  const minuteMod = lerpBucket(minute, minuteFrac, 3187, 240);

  // Per-10s tick jitter ±35 — fast surface texture.
  const tick = Math.floor(unixSeconds / 10);
  const tickJitter = (hashSeed(tick * 953 + 13) - 0.5) * 70;

  const value = dayBase + hourMod + fiveMinMod + minuteMod + tickJitter;
  return Math.max(MIN, Math.min(MAX, Math.round(value)));
}
