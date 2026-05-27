import { NextResponse } from "next/server";
import { verifyAdmin } from "../../middleware";
import { runSyncPass } from "@/lib/sync-worker";

/**
 * Force-run the background sync pass NOW.
 *
 * Iterates every user with a recent or future subscription_end and
 * calls syncUserToRemnawave(id). Used when the admin wants to force a
 * fix without waiting for the hourly scheduler.
 */
export async function POST() {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
  }
  const result = await runSyncPass();
  return NextResponse.json({ success: true, data: result });
}
