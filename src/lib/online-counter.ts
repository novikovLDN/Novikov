/**
 * Deterministic, time-based global online counter.
 *
 * Returns the SAME value to every client that calls within the same
 * 10-second window. Designed to feel alive without ever producing
 * the abrupt vertical lines a naïve per-bucket RNG creates:
 *
 *   • Daily baseline 30..60k changes once per day.
 *   • Hour-to-hour modulation (±8k) lerps smoothly across the hour
 *     using minute-of-hour as t, so neighbouring hours blend in.
 *   • 10-min modulation (±300) lerps the same way.
 *   • Per-10s tick adds ±10 jitter.
 *
 * Result: a continuous curve that drifts naturally up and down over
 * the course of the day with no step changes.
 *
 * Bounded to [23_000, 70_000].
 *
 * Synchronized across users because every visitor's onlineAt(now)
 * computes the same value given the same wall-clock second.
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

  // Daily baseline (changes once per day, 30..60k).
  const dayBase = 30_000 + hashSeed(day * 1009 + 17) * 30_000;

  // Hourly modulation — current hour and next hour blended by
  // minute-of-hour. This is what makes the curve drift smoothly
  // through ±8k over the course of an hour instead of jumping.
  const hour = Math.floor(unixSeconds / 3600);
  const hourFrac = (unixSeconds % 3600) / 3600;
  const hourMod = lerpBucket(hour, hourFrac, 5009, 16_000);

  // Ten-minute modulation — adds slower-than-hour wiggle (±300).
  const tenMin = Math.floor(unixSeconds / 600);
  const tenMinFrac = (unixSeconds % 600) / 600;
  const tenMinMod = lerpBucket(tenMin, tenMinFrac, 7919, 600);

  // Per-tick (10s) jitter — small ±10 so the latest digit moves.
  const tick = Math.floor(unixSeconds / 10);
  const tickJitter = (hashSeed(tick * 953 + 13) - 0.5) * 20;

  const value = dayBase + hourMod + tenMinMod + tickJitter;
  return Math.max(MIN, Math.min(MAX, Math.round(value)));
}
