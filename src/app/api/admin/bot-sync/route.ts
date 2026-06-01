import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "../middleware";
import { isBotSyncEnabled, setBool, SETTINGS } from "@/lib/settings";
import { createAuditLog } from "@/lib/store";
import { cookies } from "next/headers";

/** GET /api/admin/bot-sync — current value of the bot-sync kill switch. */
export async function GET() {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
  }
  return NextResponse.json({ success: true, data: { enabled: await isBotSyncEnabled() } });
}

/** POST /api/admin/bot-sync — { enabled: boolean }. */
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body.enabled !== "boolean") {
    return NextResponse.json({ success: false, error: "enabled (boolean) required" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const adminId = cookieStore.get("session")?.value || "admin";

  await setBool(SETTINGS.BOT_SYNC_ENABLED, body.enabled, adminId);
  await createAuditLog(
    body.enabled ? "bot_sync.enabled" : "bot_sync.disabled",
    `bot sync ${body.enabled ? "enabled" : "disabled"} by admin`,
    adminId
  );

  return NextResponse.json({ success: true, data: { enabled: body.enabled } });
}
