/**
 * Background worker status for the admin overview.
 *
 * In-process state (is the worker running HERE, and if not — why) plus
 * the last-run timestamps persisted in `worker_state`, so another
 * instance or a freshly restarted one still shows when the passes last
 * ran anywhere.
 */

import { pool } from "./db";

export type WorkerEventKey = "pending" | "reconcile" | "health";

export interface WorkerLocalState {
  running: boolean;
  startedAt: string | null;
  /** Why the worker is not running in this process (null while running). */
  reason: string | null;
  lastPendingAt: string | null;
  lastReconcileAt: string | null;
  lastHealthAt: string | null;
  lastError: { where: string; message: string; at: string } | null;
}

const g = globalThis as unknown as { __atlasWorkerState?: WorkerLocalState };

export function localWorkerState(): WorkerLocalState {
  if (!g.__atlasWorkerState) {
    g.__atlasWorkerState = {
      running: false,
      startedAt: null,
      reason: "воркер ещё не запускался в этом процессе",
      lastPendingAt: null,
      lastReconcileAt: null,
      lastHealthAt: null,
      lastError: null,
    };
  }
  return g.__atlasWorkerState;
}

export function setWorkerRunning(running: boolean, reason: string | null): void {
  const s = localWorkerState();
  s.running = running;
  s.reason = running ? null : reason;
  if (running) s.startedAt = new Date().toISOString();
}

async function persist(key: string, value: Record<string, unknown>): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO worker_state (key, value, updated_at) VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [key, JSON.stringify(value)]
    );
  } catch (err) {
    console.error(`[WORKER-STATE] could not persist ${key}:`, err instanceof Error ? err.message : err);
  }
}

export async function recordWorkerEvent(key: WorkerEventKey, result: Record<string, unknown> = {}): Promise<void> {
  const at = new Date().toISOString();
  const s = localWorkerState();
  if (key === "pending") s.lastPendingAt = at;
  else if (key === "reconcile") s.lastReconcileAt = at;
  else s.lastHealthAt = at;
  await persist(key, { at, ...result });
}

export async function recordWorkerError(where: string, err: unknown): Promise<void> {
  const message = err instanceof Error ? err.message : String(err);
  const at = new Date().toISOString();
  localWorkerState().lastError = { where, message, at };
  await persist("error", { where, message, at });
}

export interface WorkerStatus {
  thisInstance: { running: boolean; startedAt: string | null; reason: string | null };
  lastPendingAt: string | null;
  lastPendingResult: Record<string, unknown> | null;
  lastReconcileAt: string | null;
  lastReconcileResult: Record<string, unknown> | null;
  lastHealthSampleAt: string | null;
  lastError: { where: string; message: string; at: string } | null;
}

const later = (a: string | null | undefined, b: string | null | undefined): string | null => {
  if (!a) return b ?? null;
  if (!b) return a;
  return Date.parse(a) >= Date.parse(b) ? a : b;
};

/** Merge this process's state with the persisted one (any instance). */
export async function getWorkerStatus(): Promise<WorkerStatus> {
  const s = localWorkerState();
  const rows = (await pool.query<{ key: string; value: Record<string, unknown> | null }>("SELECT key, value FROM worker_state")).rows;
  const byKey = Object.fromEntries(rows.map((r) => [r.key, r.value ?? {}])) as Record<string, Record<string, unknown>>;
  const at = (k: string) => (typeof byKey[k]?.at === "string" ? (byKey[k].at as string) : null);
  const persistedError = byKey.error && typeof byKey.error.message === "string"
    ? { where: String(byKey.error.where ?? ""), message: String(byKey.error.message), at: String(byKey.error.at ?? "") }
    : null;
  const lastError =
    s.lastError && persistedError ? (Date.parse(s.lastError.at) >= Date.parse(persistedError.at) ? s.lastError : persistedError) : s.lastError ?? persistedError;
  return {
    thisInstance: { running: s.running, startedAt: s.startedAt, reason: s.reason },
    lastPendingAt: later(s.lastPendingAt, at("pending")),
    lastPendingResult: byKey.pending ?? null,
    lastReconcileAt: later(s.lastReconcileAt, at("reconcile")),
    lastReconcileResult: byKey.reconcile ?? null,
    lastHealthSampleAt: later(s.lastHealthAt, at("health")),
    lastError,
  };
}
