import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { verifyAdmin } from "../middleware";
import {
  ALL_SITE_TAGS,
  LEGACY_SITE_TAGS,
  describeRwError,
  getBandwidthStats,
  getNodes,
  getSystemHealth,
  getSystemStats,
  streamUsersByTag,
  RwResult,
} from "@/lib/remnawave";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/overview — read-only health and business indicators.
 *
 * Every block is computed independently (Promise.allSettled): a panel
 * outage shows up as `panel.error`, it never hides the DB numbers.
 *
 *   panel     — health latency, system stats (WHOLE panel, incl. the bot),
 *               bandwidth, nodes, and site-only users via /users/stream?tag=SITE_*
 *   db        — ping latency, pool usage
 *   sync      — panel_sync_state counts, oldest pending, last errors
 *   revenue   — confirmed payments today / 7d / 30d / all, refunds, by plan (30d)
 *   funnel    — trials → paid conversion (30-day cohort), renewals, expirations
 *   ledger    — subscription events by kind (30d)
 */

function unwrap<T>(r: RwResult<T>): { ok: true; data: T } | { ok: false; error: string } {
  return r.ok ? { ok: true, data: r.data } : { ok: false, error: describeRwError(r) };
}

async function panelBlock() {
  const t0 = Date.now();
  const health = await getSystemHealth();
  const latencyMs = Date.now() - t0;
  const [stats, bandwidth, nodes] = await Promise.all([getSystemStats(), getBandwidthStats(), getNodes()]);

  const siteByTag: Record<string, { total: number; byStatus: Record<string, number>; onlineLast5m: number; truncated: boolean } | { error: string }> = {};
  for (const tag of [...ALL_SITE_TAGS, ...LEGACY_SITE_TAGS]) {
    const r = await streamUsersByTag(tag, 20);
    if (!r.ok) {
      siteByTag[tag] = { error: describeRwError(r) };
      continue;
    }
    const byStatus: Record<string, number> = {};
    let online = 0;
    for (const u of r.data.users) {
      byStatus[u.status] = (byStatus[u.status] || 0) + 1;
      if (u.onlineAt && Date.now() - Date.parse(u.onlineAt) < 5 * 60 * 1000) online += 1;
    }
    siteByTag[tag] = { total: r.data.users.length, byStatus, onlineLast5m: online, truncated: r.data.truncated };
  }

  const nodeList = nodes.ok ? nodes.data : [];
  return {
    reachable: health.ok,
    latencyMs,
    health: unwrap(health),
    stats: unwrap(stats),
    bandwidth: unwrap(bandwidth),
    nodes: nodes.ok
      ? {
          ok: true as const,
          total: nodeList.length,
          connected: nodeList.filter((n) => n.isConnected && !n.isDisabled).length,
          disabled: nodeList.filter((n) => n.isDisabled).length,
          usersOnline: nodeList.reduce((s, n) => s + (n.usersOnline || 0), 0),
          list: nodeList,
        }
      : { ok: false as const, error: describeRwError(nodes) },
    siteUsersByTag: siteByTag,
  };
}

async function dbBlock() {
  const t0 = Date.now();
  await pool.query("SELECT 1");
  return {
    latencyMs: Date.now() - t0,
    pool: { total: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount },
  };
}

async function syncBlock() {
  const [states, oldest, errors] = await Promise.all([
    pool.query<{ state: string; n: number }>("SELECT panel_sync_state AS state, COUNT(*)::int AS n FROM users GROUP BY panel_sync_state"),
    pool.query<{ at: Date | null }>("SELECT MIN(COALESCE(panel_next_sync_at, created_at)) AS at FROM users WHERE panel_sync_state IN ('pending','error')"),
    pool.query(
      `SELECT id, email, public_id, panel_sync_error, panel_sync_attempts, panel_next_sync_at
       FROM users WHERE panel_sync_state = 'error' ORDER BY panel_next_sync_at DESC NULLS LAST LIMIT 10`
    ),
  ]);
  const lastOk = await pool.query<{ at: Date | null }>("SELECT MAX(panel_synced_at) AS at FROM users");
  return {
    byState: Object.fromEntries(states.rows.map((r) => [r.state, r.n])),
    oldestQueuedAt: oldest.rows[0]?.at ?? null,
    lastSuccessfulSyncAt: lastOk.rows[0]?.at ?? null,
    recentErrors: errors.rows,
  };
}

async function revenueBlock() {
  const sums = await pool.query(
    `SELECT
       COALESCE(SUM(amount) FILTER (WHERE paid_at >= date_trunc('day', NOW())), 0)::float AS today,
       COALESCE(SUM(amount) FILTER (WHERE paid_at >= NOW() - INTERVAL '7 days'), 0)::float AS d7,
       COALESCE(SUM(amount) FILTER (WHERE paid_at >= NOW() - INTERVAL '30 days'), 0)::float AS d30,
       COALESCE(SUM(amount), 0)::float AS all_time,
       COUNT(*) FILTER (WHERE paid_at >= NOW() - INTERVAL '30 days')::int AS count30
     FROM payments WHERE status IN ('confirmed', 'refunded') AND paid_at IS NOT NULL`
  );
  const refunds = await pool.query(
    `SELECT COUNT(*)::int AS n, COALESCE(SUM(amount), 0)::float AS amount
     FROM payments WHERE refunded_at >= NOW() - INTERVAL '30 days'`
  );
  const byPlan = await pool.query(
    `SELECT plan, period, COUNT(*)::int AS n, COALESCE(SUM(amount), 0)::float AS amount
     FROM payments WHERE status IN ('confirmed', 'refunded') AND paid_at >= NOW() - INTERVAL '30 days'
     GROUP BY plan, period ORDER BY plan, period`
  );
  return { gross: sums.rows[0], refunds30d: refunds.rows[0], byPlan30d: byPlan.rows, currency: "RUB" };
}

async function funnelBlock() {
  const trials = await pool.query(
    `SELECT COUNT(*)::int AS trials,
            COUNT(*) FILTER (WHERE EXISTS (
              SELECT 1 FROM payments p WHERE p.user_id = u.id AND p.status IN ('confirmed','refunded')
            ))::int AS converted
     FROM users u WHERE u.trial_used_at >= NOW() - INTERVAL '30 days'`
  );
  const renewals = await pool.query(
    `SELECT COUNT(*)::int AS n FROM payments p
     WHERE p.status IN ('confirmed','refunded') AND p.paid_at >= NOW() - INTERVAL '30 days'
       AND EXISTS (SELECT 1 FROM payments q WHERE q.user_id = p.user_id AND q.status IN ('confirmed','refunded') AND q.paid_at < p.paid_at)`
  );
  const users = await pool.query(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE subscription_end > NOW())::int AS live,
            COUNT(*) FILTER (WHERE subscription_end > NOW() AND subscription_plan = 'trial')::int AS live_trial,
            COUNT(*) FILTER (WHERE subscription_end > NOW() AND subscription_plan IN ('basic','plus'))::int AS live_paid,
            COUNT(*) FILTER (WHERE subscription_end BETWEEN NOW() - INTERVAL '7 days' AND NOW())::int AS expired_7d,
            COUNT(*) FILTER (WHERE subscription_end BETWEEN NOW() - INTERVAL '30 days' AND NOW())::int AS expired_30d,
            COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS new_7d
     FROM users`
  );
  const t = trials.rows[0];
  return {
    trials30d: t.trials,
    trialsConverted30d: t.converted,
    trialConversionRate: t.trials > 0 ? Math.round((t.converted / t.trials) * 1000) / 10 : null,
    renewals30d: renewals.rows[0].n,
    users: users.rows[0],
    note: "expired_* считаются по текущему subscription_end (пользователь, продливший после истечения, выпадает); точная история — в subscription_events",
  };
}

async function ledgerBlock() {
  const r = await pool.query<{ kind: string; n: number }>(
    "SELECT kind, COUNT(*)::int AS n FROM subscription_events WHERE created_at >= NOW() - INTERVAL '30 days' GROUP BY kind"
  );
  return Object.fromEntries(r.rows.map((x) => [x.kind, x.n]));
}

function settled<T>(r: PromiseSettledResult<T>): T | { error: string } {
  return r.status === "fulfilled" ? r.value : { error: r.reason instanceof Error ? r.reason.message : String(r.reason) };
}

export async function GET() {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
  }
  const [panel, db, sync, revenue, funnel, ledger] = await Promise.allSettled([
    panelBlock(),
    dbBlock(),
    syncBlock(),
    revenueBlock(),
    funnelBlock(),
    ledgerBlock(),
  ]);
  return NextResponse.json({
    success: true,
    data: {
      generatedAt: new Date().toISOString(),
      panel: settled(panel),
      db: settled(db),
      sync: settled(sync),
      revenue: settled(revenue),
      funnel: settled(funnel),
      ledger30d: settled(ledger),
    },
  });
}
