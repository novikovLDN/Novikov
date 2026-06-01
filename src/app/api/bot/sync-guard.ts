import { NextResponse } from "next/server";
import { isBotSyncEnabled } from "@/lib/settings";

/**
 * Resolves to null when sync is allowed, or to a 503 response when the
 * admin has flipped the global "bot sync" kill switch off. Use at the
 * top of any bot endpoint that mutates user state (extend, sync,
 * sync-referrals, sync-balance, link, unlink, register).
 *
 * Read-only bot endpoints (status, user lookups) should NOT use this —
 * the bot still needs to read while sync is paused.
 */
export async function botSyncDisabledResponse(): Promise<NextResponse | null> {
  if (await isBotSyncEnabled()) return null;
  return NextResponse.json(
    { success: false, error: "Bot sync is disabled by admin", code: "bot_sync_disabled" },
    { status: 503 }
  );
}
