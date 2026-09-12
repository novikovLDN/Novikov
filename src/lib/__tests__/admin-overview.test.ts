/**
 * Overview cache (30 s per instance, ?fresh=1 bypass), bounded
 * concurrency, health downsampling, journal levels.
 */

import { describe, it, expect, vi } from "vitest";

vi.mock("../db", () => ({ pool: { query: vi.fn() }, dbReady: Promise.resolve(), waitForDb: async () => {} }));

import { createTtlCache, mapLimit, OVERVIEW_TTL_MS } from "../admin-overview";
import { downsample, HealthSample } from "../health";
import { auditLevelFor } from "../audit-level";

describe("overview cache", () => {
  it("hit within the TTL, miss after it, bypass with fresh", async () => {
    let t = 1_000_000;
    const cache = createTtlCache<number>(OVERVIEW_TTL_MS, () => t);
    let calls = 0;
    const loader = async () => ++calls;

    expect(await cache.get(loader)).toMatchObject({ data: 1, cached: false });
    t += 10_000;
    expect(await cache.get(loader)).toMatchObject({ data: 1, cached: true });
    expect(await cache.get(loader, { fresh: true })).toMatchObject({ data: 2, cached: false });
    t += OVERVIEW_TTL_MS + 1;
    expect(await cache.get(loader)).toMatchObject({ data: 3, cached: false });
    expect(calls).toBe(3);
  });

  it("concurrent callers share one in-flight build", async () => {
    const cache = createTtlCache<string>(OVERVIEW_TTL_MS);
    let calls = 0;
    const loader = () => new Promise<string>((ok) => setTimeout(() => ok(`v${++calls}`), 10));
    const [a, b] = await Promise.all([cache.get(loader), cache.get(loader)]);
    expect(calls).toBe(1);
    expect(a.data).toBe("v1");
    expect(b).toMatchObject({ data: "v1", cached: true });
  });

  it("a failed build is not cached", async () => {
    const cache = createTtlCache<number>(OVERVIEW_TTL_MS);
    await expect(cache.get(async () => { throw new Error("boom"); })).rejects.toThrow("boom");
    expect(await cache.get(async () => 7)).toMatchObject({ data: 7, cached: false });
  });
});

describe("mapLimit", () => {
  it("keeps order and never exceeds the limit", async () => {
    let inFlight = 0;
    let peak = 0;
    const out = await mapLimit([1, 2, 3, 4, 5, 6, 7], 3, async (n) => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise((ok) => setTimeout(ok, 5));
      inFlight -= 1;
      return n * 10;
    });
    expect(out).toEqual([10, 20, 30, 40, 50, 60, 70]);
    expect(peak).toBe(3);
  });
});

describe("health downsample", () => {
  const sample = (min: number, panelMs: number | null, ok: boolean, nodesOnline: number): HealthSample => ({
    ts: new Date(Date.UTC(2026, 8, 12, 0, min)).toISOString(),
    panelMs,
    panelOk: ok,
    dbMs: 5,
    nodesOnline,
    nodesTotal: 4,
    queuePending: min,
    queueError: 0,
  });

  it("24 h of minute samples → at most 96 points; worst-case nodes and queue are kept", () => {
    const from = Date.UTC(2026, 8, 12, 0, 0);
    const to = from + 24 * 3600 * 1000;
    const samples: HealthSample[] = [];
    for (let m = 0; m < 24 * 60; m++) samples.push(sample(m, 100, true, 4));
    samples[3] = sample(3, null, false, 1); // one bad minute in the first 15-min bucket
    const pts = downsample(samples, 96, from, to);
    expect(pts.length).toBe(96);
    expect(pts[0]).toMatchObject({ samples: 15, nodesOnline: 1, queuePending: 14, panelMs: 100 });
    expect(pts[0].panelOkRatio).toBeCloseTo(14 / 15, 3);
    expect(pts[1]).toMatchObject({ nodesOnline: 4, panelOkRatio: 1 });
  });

  it("omits empty buckets", () => {
    const from = Date.UTC(2026, 8, 12, 0, 0);
    const pts = downsample([sample(0, 50, true, 4), sample(600, 70, true, 4)], 96, from, from + 24 * 3600 * 1000);
    expect(pts).toHaveLength(2);
  });
});

describe("journal level", () => {
  it("derives levels from the action", () => {
    expect(auditLevelFor("user.login")).toBe("info");
    expect(auditLevelFor("admin.revoke")).toBe("warn");
    expect(auditLevelFor("system.ghost_date_repair_failed")).toBe("error");
  });
});
