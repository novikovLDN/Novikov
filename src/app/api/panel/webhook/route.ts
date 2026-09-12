import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { pool, waitForDb } from "@/lib/db";
import { parsePanelUser } from "@/lib/remnawave";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Remnawave 3.4.3 webhook receiver (optional).
 *
 * Enabled only when REMNAWAVE_WEBHOOK_SECRET is set (otherwise 404).
 * Panel side: WEBHOOK_ENABLED=true, WEBHOOK_URL=<site>/api/panel/webhook,
 * WEBHOOK_SECRET_HEADER=<same secret, ≥32 alphanumerics>.
 *
 * Verification (backend src/queue/notifications/webhook-logger):
 *   X-Remnawave-Signature = hex HMAC-SHA256(secret, raw body)
 *   X-Remnawave-Timestamp = ISO time of the event (must be fresh)
 *
 * Effect: refresh the cached panel fields of the matching local user
 * (link, status, expireAt). Nothing destructive: `user.deleted` only
 * queues a sync — the sync decides what to do with its own checks.
 */
const MAX_SKEW_MS = 10 * 60 * 1000;

function safeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export async function POST(request: NextRequest) {
  const secret = process.env.REMNAWAVE_WEBHOOK_SECRET || "";
  if (!secret) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const raw = await request.text();
  const signature = (request.headers.get("x-remnawave-signature") || "").trim().toLowerCase();
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  if (!signature || !safeEqualHex(signature, expected)) {
    console.warn("[PANEL-WEBHOOK] bad signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const ts = Date.parse(request.headers.get("x-remnawave-timestamp") || "");
  if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > MAX_SKEW_MS) {
    console.warn("[PANEL-WEBHOOK] stale or missing timestamp");
    return NextResponse.json({ error: "Stale event" }, { status: 401 });
  }

  let payload: { scope?: string; event?: string; data?: unknown };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const event = String(payload.event || "unknown");

  try {
    await waitForDb();
    const dedupeKey = crypto.createHash("sha256").update(raw).digest("hex");
    const fresh = await pool.query(
      "INSERT INTO panel_webhook_events (dedupe_key, event) VALUES ($1, $2) ON CONFLICT (dedupe_key) DO NOTHING RETURNING dedupe_key",
      [dedupeKey, event]
    );
    if (fresh.rows.length === 0) return NextResponse.json({ ok: true, duplicate: true });

    if (payload.scope === "user") {
      const panel = parsePanelUser(payload.data);
      if (panel) {
        if (event === "user.deleted") {
          await pool.query(
            "UPDATE users SET panel_sync_state = 'pending', panel_next_sync_at = NOW() WHERE panel_user_id = $1",
            [panel.id]
          );
        } else {
          await pool.query(
            `UPDATE users SET
               remnawave_short_uuid = COALESCE($2, remnawave_short_uuid),
               subscription_url = COALESCE($3, subscription_url),
               panel_status = $4,
               panel_expire_at = $5,
               panel_username = $6
             WHERE panel_user_id = $1`,
            [panel.id, panel.shortUuid || null, panel.subscriptionUrl || null, panel.status || null, panel.expireAt ? new Date(panel.expireAt) : null, panel.username]
          );
        }
      }
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[PANEL-WEBHOOK] ${event} failed:`, err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
