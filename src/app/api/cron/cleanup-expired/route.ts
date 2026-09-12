import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { expirePendingPayments } from "@/lib/store";
import { runPendingPass } from "@/lib/sync-worker";

/**
 * External cron hook. Expired subscriptions need no cleanup any more —
 * the panel expires users itself. This marks stale pending payments as
 * expired and runs one pending panel-sync pass (same lock as the worker).
 *
 * Refuses to run without CRON_SECRET: an unset secret used to leave the
 * endpoint open to anyone.
 */
function authorized(request: NextRequest, secret: string): boolean {
  const header = request.headers.get("authorization") || "";
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET || "";
  if (!secret) {
    console.error("[CRON] CRON_SECRET is not set — refusing to run");
    return NextResponse.json({ success: false, error: "Cron is not configured" }, { status: 503 });
  }
  if (!authorized(request, secret)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const expiredPayments = await expirePendingPayments();
    const sync = await runPendingPass();
    return NextResponse.json({ success: true, data: { expiredPayments, sync } });
  } catch (err) {
    console.error("[CRON] cleanup failed:", err);
    return NextResponse.json({ success: false, error: "Cleanup failed" }, { status: 500 });
  }
}
