/**
 * Background reconciliation worker.
 *
 * Simple idea: every N hours, walk through every user with a recent
 * or future subscription_end and push that value into Remnawave. This
 * catches any drift introduced by:
 *   - panel restarts / outages during a webhook
 *   - admin changes made directly in the panel
 *   - earlier integration bugs that left stale data
 *
 * The actual "what to push" logic lives in syncUserToRemnawave —
 * here we just iterate.
 */

import { pool } from "./db";
import { syncUserToRemnawave } from "./subscription-sync";

const INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const EXPIRED_GRACE_MS = 7 * 24 * 60 * 60 * 1000; // include recently-expired users so panel learns about expiry

let timer: ReturnType<typeof setInterval> | null = null;
let running = false;

export async function runSyncPass(): Promise<{ scanned: number; ok: number; failed: number }> {
  if (running) {
    console.log("[SYNC-WORKER] Previous pass still in flight, skipping");
    return { scanned: 0, ok: 0, failed: 0 };
  }
  running = true;
  try {
    const rows = (
      await pool.query<{ id: string }>(
        `SELECT id FROM users
         WHERE subscription_end > NOW() - INTERVAL '${EXPIRED_GRACE_MS} milliseconds'
         ORDER BY subscription_end DESC`
      )
    ).rows;

    let ok = 0;
    let failed = 0;
    for (const r of rows) {
      const result = await syncUserToRemnawave(r.id);
      if (result.ok) ok += 1;
      else failed += 1;
    }
    if (rows.length > 0) {
      console.log(`[SYNC-WORKER] pass complete — scanned=${rows.length} ok=${ok} failed=${failed}`);
    }
    return { scanned: rows.length, ok, failed };
  } catch (err) {
    console.error("[SYNC-WORKER] pass error:", err);
    return { scanned: 0, ok: 0, failed: 0 };
  } finally {
    running = false;
  }
}

export function startSyncWorker(): void {
  if (timer) return;
  console.log(`[SYNC-WORKER] started (interval: ${INTERVAL_MS / 60000} min)`);
  // First pass on startup (delayed a bit so DB / panel are ready)
  setTimeout(() => { runSyncPass().catch(() => null); }, 30_000);
  timer = setInterval(() => { runSyncPass().catch(() => null); }, INTERVAL_MS);
}
