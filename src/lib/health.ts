/**
 * Health samples: one row per minute, written by the sync worker (under
 * its own advisory lock, so one instance writes), kept 7 days.
 * The overview shows the last 24 h downsampled to ≤ 96 points.
 */

import { pool } from "./db";
import { getNodes, getSystemHealth } from "./remnawave";
import { recordWorkerEvent } from "./worker-state";

export interface HealthSample {
  ts: string;
  panelMs: number | null;
  panelOk: boolean;
  dbMs: number | null;
  nodesOnline: number | null;
  nodesTotal: number | null;
  queuePending: number;
  queueError: number;
}

export interface HealthPoint {
  /** Bucket start (ISO). */
  ts: string;
  samples: number;
  panelMs: number | null;
  /** Share of samples in the bucket where the panel answered (0..1). */
  panelOkRatio: number;
  dbMs: number | null;
  nodesOnline: number | null;
  nodesTotal: number | null;
  queuePending: number;
  queueError: number;
}

export const HEALTH_RETENTION_DAYS = 7;
export const HEALTH_HISTORY_HOURS = 24;
export const HEALTH_MAX_POINTS = 96;

export async function collectHealthSample(): Promise<HealthSample> {
  const t0 = Date.now();
  const health = await getSystemHealth();
  const panelMs = health.ok ? Date.now() - t0 : null;
  const nodes = await getNodes();

  let dbMs: number | null = null;
  let queuePending = 0;
  let queueError = 0;
  try {
    const t1 = Date.now();
    await pool.query("SELECT 1");
    dbMs = Date.now() - t1;
    const q = await pool.query<{ pending: number; error: number }>(
      `SELECT COUNT(*) FILTER (WHERE panel_sync_state = 'pending')::int AS pending,
              COUNT(*) FILTER (WHERE panel_sync_state = 'error')::int AS error
       FROM users`
    );
    queuePending = q.rows[0]?.pending ?? 0;
    queueError = q.rows[0]?.error ?? 0;
  } catch (err) {
    console.error("[HEALTH] db probe failed:", err instanceof Error ? err.message : err);
  }

  return {
    ts: new Date().toISOString(),
    panelMs,
    panelOk: health.ok,
    dbMs,
    nodesOnline: nodes.ok ? nodes.data.filter((n) => n.isConnected && !n.isDisabled).length : null,
    nodesTotal: nodes.ok ? nodes.data.length : null,
    queuePending,
    queueError,
  };
}

export async function recordHealthSample(): Promise<HealthSample> {
  const s = await collectHealthSample();
  await pool.query(
    `INSERT INTO health_samples (ts, panel_ms, panel_ok, db_ms, nodes_online, nodes_total, queue_pending, queue_error)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (ts) DO NOTHING`,
    [s.ts, s.panelMs, s.panelOk, s.dbMs, s.nodesOnline, s.nodesTotal, s.queuePending, s.queueError]
  );
  await pool.query(`DELETE FROM health_samples WHERE ts < NOW() - ($1::int * INTERVAL '1 day')`, [HEALTH_RETENTION_DAYS]);
  await recordWorkerEvent("health", { panelOk: s.panelOk, panelMs: s.panelMs, dbMs: s.dbMs });
  return s;
}

const avg = (xs: Array<number | null>): number | null => {
  const v = xs.filter((x): x is number => typeof x === "number");
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
};
const minOf = (xs: Array<number | null>): number | null => {
  const v = xs.filter((x): x is number => typeof x === "number");
  return v.length ? Math.min(...v) : null;
};
const maxOf = (xs: Array<number | null>): number | null => {
  const v = xs.filter((x): x is number => typeof x === "number");
  return v.length ? Math.max(...v) : null;
};

/**
 * Pure: split [from, to) into `maxPoints` equal time buckets and
 * aggregate the samples in each (empty buckets are omitted).
 * Latencies are averaged, "nodes online" takes the worst (min), queue
 * sizes the worst (max) — a bad minute must stay visible.
 */
export function downsample(samples: HealthSample[], maxPoints: number, from: number, to: number): HealthPoint[] {
  if (maxPoints <= 0 || to <= from) return [];
  const bucketMs = (to - from) / maxPoints;
  const buckets = new Map<number, HealthSample[]>();
  for (const s of samples) {
    const t = Date.parse(s.ts);
    if (!Number.isFinite(t) || t < from || t >= to) continue;
    const i = Math.min(maxPoints - 1, Math.floor((t - from) / bucketMs));
    const list = buckets.get(i) ?? [];
    list.push(s);
    buckets.set(i, list);
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([i, list]) => ({
      ts: new Date(from + i * bucketMs).toISOString(),
      samples: list.length,
      panelMs: avg(list.map((s) => s.panelMs)),
      panelOkRatio: Math.round((list.filter((s) => s.panelOk).length / list.length) * 1000) / 1000,
      dbMs: avg(list.map((s) => s.dbMs)),
      nodesOnline: minOf(list.map((s) => s.nodesOnline)),
      nodesTotal: maxOf(list.map((s) => s.nodesTotal)),
      queuePending: maxOf(list.map((s) => s.queuePending)) ?? 0,
      queueError: maxOf(list.map((s) => s.queueError)) ?? 0,
    }));
}

export async function getHealthHistory(hours = HEALTH_HISTORY_HOURS, maxPoints = HEALTH_MAX_POINTS): Promise<HealthPoint[]> {
  const to = Date.now();
  const from = to - hours * 3600 * 1000;
  const rows = (
    await pool.query<{
      ts: Date;
      panel_ms: number | null;
      panel_ok: boolean;
      db_ms: number | null;
      nodes_online: number | null;
      nodes_total: number | null;
      queue_pending: number;
      queue_error: number;
    }>(
      `SELECT ts, panel_ms, panel_ok, db_ms, nodes_online, nodes_total, queue_pending, queue_error
       FROM health_samples WHERE ts >= $1 ORDER BY ts ASC`,
      [new Date(from)]
    )
  ).rows;
  const samples: HealthSample[] = rows.map((r) => ({
    ts: new Date(r.ts).toISOString(),
    panelMs: r.panel_ms,
    panelOk: r.panel_ok,
    dbMs: r.db_ms,
    nodesOnline: r.nodes_online,
    nodesTotal: r.nodes_total,
    queuePending: r.queue_pending,
    queueError: r.queue_error,
  }));
  return downsample(samples, maxPoints, from, to + 1);
}
