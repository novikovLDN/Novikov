/**
 * Background panel sync.
 *
 *   every 60 s — push users whose panel_sync_state is 'pending', or
 *                'error' with an elapsed backoff (panel_next_sync_at);
 *   every hour — reconciliation: compare local ↔ panel, repair only
 *                what differs (src/lib/reconciliation.ts).
 *
 * Both run under Postgres advisory locks, so with several app
 * processes only one of them works at a time.
 */

import { dbReady, pool } from "./db";
import { LOCK_KEYS, withJobLock } from "./locks";
import { runReconciliation, ReconciliationReport } from "./reconciliation";
import { syncUserToPanel } from "./subscription-sync";

const PENDING_INTERVAL_MS = 60 * 1000;
const RECONCILE_INTERVAL_MS = 60 * 60 * 1000;
const PENDING_BATCH = 50;

export interface PendingPassResult {
  acquired: boolean;
  scanned: number;
  ok: number;
  failed: number;
}

export async function runPendingPass(limit = PENDING_BATCH): Promise<PendingPassResult> {
  await dbReady; // never run on a half-migrated schema (rejects → caller logs)
  const locked = await withJobLock(LOCK_KEYS.SYNC_PENDING, async () => {
    const rows = (
      await pool.query<{ id: string }>(
        `SELECT id FROM users
         WHERE panel_sync_state IN ('pending', 'error')
           AND (panel_next_sync_at IS NULL OR panel_next_sync_at <= NOW())
         ORDER BY panel_next_sync_at NULLS FIRST, subscription_end DESC
         LIMIT $1`,
        [limit]
      )
    ).rows;
    let ok = 0;
    let failed = 0;
    for (const r of rows) {
      const res = await syncUserToPanel(r.id);
      if (res.ok) ok += 1;
      else if (res.action !== "busy") failed += 1;
    }
    if (rows.length > 0) console.log(`[SYNC-WORKER] pending pass: scanned=${rows.length} ok=${ok} failed=${failed}`);
    return { scanned: rows.length, ok, failed };
  });
  return locked.acquired ? { acquired: true, ...locked.result } : { acquired: false, scanned: 0, ok: 0, failed: 0 };
}

export async function runReconcilePass(): Promise<{ acquired: boolean; report: ReconciliationReport | null }> {
  await dbReady;
  const locked = await withJobLock(LOCK_KEYS.RECONCILE, () => runReconciliation());
  return locked.acquired ? { acquired: true, report: locked.result } : { acquired: false, report: null };
}

const g = globalThis as unknown as { __atlasSyncWorker?: { pending: ReturnType<typeof setInterval>; reconcile: ReturnType<typeof setInterval> } };

const gStarting = globalThis as unknown as { __atlasSyncWorkerStarting?: boolean };

/**
 * Starts only after the migrations succeeded (dbReady). If they failed,
 * the worker stays stopped and says so loudly — it must not write panel
 * state against a half-migrated schema.
 */
export function startSyncWorker(): void {
  if (g.__atlasSyncWorker || gStarting.__atlasSyncWorkerStarting) return;
  gStarting.__atlasSyncWorkerStarting = true;
  dbReady.then(
    () => {
      if (g.__atlasSyncWorker) return;
      const safe = (name: string, fn: () => Promise<unknown>) => () => {
        fn().catch((err) => console.error(`[SYNC-WORKER] ${name} error:`, err instanceof Error ? err.message : err));
      };
      const pending = setInterval(safe("pending", () => runPendingPass()), PENDING_INTERVAL_MS);
      const reconcile = setInterval(safe("reconcile", () => runReconcilePass()), RECONCILE_INTERVAL_MS);
      pending.unref?.();
      reconcile.unref?.();
      g.__atlasSyncWorker = { pending, reconcile };
      safe("pending", () => runPendingPass())();
      console.log(`[SYNC-WORKER] started (pending every ${PENDING_INTERVAL_MS / 1000}s, reconcile every ${RECONCILE_INTERVAL_MS / 60000}min)`);
    },
    (err) => {
      gStarting.__atlasSyncWorkerStarting = false;
      console.error("[SYNC-WORKER] NOT STARTED — database initialization failed; fix the migration and restart:", err instanceof Error ? err.message : err);
    }
  );
}
