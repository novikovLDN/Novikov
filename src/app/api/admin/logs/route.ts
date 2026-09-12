import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "../middleware";
import { listLogs, parseLogsParams } from "@/lib/admin-users";

/**
 * GET /api/admin/logs?userId=&level=info|warn|error&limit=&cursor=
 * → { success, data: AdminLogItem[], nextCursor } — `data` stays an
 * array (the existing UI reads it as such); newest first, default 200.
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
  }
  const parsed = parseLogsParams(request.nextUrl.searchParams);
  if (!parsed.ok) return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
  try {
    const r = await listLogs(parsed.params);
    return NextResponse.json({ success: true, data: r.logs, nextCursor: r.nextCursor });
  } catch (err) {
    console.error("[ADMIN/LOGS] error:", err);
    return NextResponse.json({ success: false, error: "Не удалось загрузить журнал" }, { status: 500 });
  }
}
