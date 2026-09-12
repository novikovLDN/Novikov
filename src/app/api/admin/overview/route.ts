import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "../middleware";
import { getOverview } from "@/lib/admin-overview";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/overview[?fresh=1] — read-only health and business
 * indicators (src/lib/admin-overview.ts). Cached per instance for 30 s;
 * `fresh=1` rebuilds. `cached` / `cachedAt` tell which one you got.
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
  }
  try {
    const data = await getOverview({ fresh: request.nextUrl.searchParams.get("fresh") === "1" });
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[ADMIN/OVERVIEW] error:", err);
    return NextResponse.json({ success: false, error: "Не удалось собрать сводку" }, { status: 500 });
  }
}
