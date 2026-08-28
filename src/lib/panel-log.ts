/**
 * Structured logging for panel interaction and subscription lifecycle.
 *
 * Goal — for every operation that touches Remnawave or mutates a
 * user's subscription state we can trace end-to-end in production
 * logs: what flow (trial / purchase / renew / admin-grant / bot-sync
 * / reconcile), which user, what request/response happened, how long
 * it took, and whether it succeeded.
 *
 * Output is JSON-line — grep/jq-friendly, easy to ship to any log
 * aggregator. Every entry carries:
 *   - ts   ISO timestamp
 *   - lvl  "info" | "warn" | "error"
 *   - flow one of the FlowKind values (or "system")
 *   - rid  request/correlation id (uuid v4) — set once per top-level
 *          flow, propagated through nested calls via startFlow()
 *   - evt  short verb-noun event name, e.g. "panel.create.start"
 *   - extra ...arbitrary structured context
 *
 * IMPORTANT: never logs full API tokens, subscription URLs or Happ
 * links — these are truncated/redacted by the helpers here.
 */

import crypto from "crypto";

export type FlowKind =
  | "trial"          // free trial issuance
  | "purchase"       // paid subscription creation / renewal (site side)
  | "bot-purchase"   // paid subscription initiated from the bot
  | "admin-grant"    // admin manually granted / extended
  | "admin-revoke"   // admin revoked
  | "reconcile"      // sync-worker / reconcile pass
  | "resync"         // per-user force-resync from admin
  | "dashboard"      // on-demand sync triggered by dashboard load
  | "bot-sync"       // bot pushed data to site
  | "cleanup"        // expired-user cleanup
  | "system";        // catch-all

interface FlowContext {
  rid: string;
  flow: FlowKind;
  userId?: string;
  email?: string;
  startedAt: number;
}

function newRid(): string {
  return crypto.randomBytes(8).toString("hex");
}

function nowIso(): string {
  return new Date().toISOString();
}

function redact(v: unknown): unknown {
  if (typeof v !== "string") return v;
  if (v.length > 200) return v.slice(0, 200) + "…";
  return v;
}

function serialize(extra: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!extra) return {};
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(extra)) {
    if (val === undefined) continue;
    if (k === "token" || k === "apiToken" || k === "authorization") {
      out[k] = "***";
      continue;
    }
    if (k === "subscriptionUrl" || k === "happLink") {
      out[k] = typeof val === "string" ? val.slice(0, 60) + "…" : val;
      continue;
    }
    if (val && typeof val === "object") {
      try {
        out[k] = JSON.parse(JSON.stringify(val));
      } catch {
        out[k] = String(val);
      }
    } else {
      out[k] = redact(val);
    }
  }
  return out;
}

/**
 * Emit a structured log line. Prefer using flow.info() / .warn() /
 * .error() on a FlowContext so the rid is threaded through automatically.
 */
export function log(
  lvl: "info" | "warn" | "error",
  ctx: Partial<FlowContext> | null,
  evt: string,
  extra?: Record<string, unknown>
): void {
  const line = {
    ts: nowIso(),
    lvl,
    flow: ctx?.flow || "system",
    rid: ctx?.rid || "-",
    evt,
    ...(ctx?.userId ? { userId: ctx.userId } : {}),
    ...(ctx?.email ? { email: ctx.email } : {}),
    ...(ctx?.startedAt ? { elapsedMs: Date.now() - ctx.startedAt } : {}),
    ...serialize(extra),
  };
  const s = JSON.stringify(line);
  if (lvl === "error") console.error(s);
  else if (lvl === "warn") console.warn(s);
  else console.log(s);
}

/**
 * Start a top-level flow. Every subsequent log() call that passes
 * this context will carry the same rid so the whole chain is
 * groupable in a log viewer with `grep <rid>`.
 */
export function startFlow(
  flow: FlowKind,
  init?: { userId?: string; email?: string }
): FlowContext {
  const ctx: FlowContext = {
    rid: newRid(),
    flow,
    userId: init?.userId,
    email: init?.email,
    startedAt: Date.now(),
  };
  log("info", ctx, `${flow}.start`);
  return ctx;
}

export function endFlow(
  ctx: FlowContext,
  outcome: "ok" | "failed" | "skipped",
  extra?: Record<string, unknown>
): void {
  log(outcome === "failed" ? "error" : "info", ctx, `${ctx.flow}.end`, { outcome, ...extra });
}

/**
 * Convenience helpers so call-sites read cleanly:
 *   info(ctx, "panel.create.start", { username })
 */
export const info = (ctx: FlowContext | null, evt: string, extra?: Record<string, unknown>) =>
  log("info", ctx, evt, extra);
export const warn = (ctx: FlowContext | null, evt: string, extra?: Record<string, unknown>) =>
  log("warn", ctx, evt, extra);
export const error = (ctx: FlowContext | null, evt: string, extra?: Record<string, unknown>) =>
  log("error", ctx, evt, extra);
