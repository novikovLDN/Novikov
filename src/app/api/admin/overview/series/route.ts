import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "../../middleware";
import { getDailySeries } from "@/lib/admin-series";

export const dynamic = "force-dynamic";

/** GET /api/admin/overview/series?days=30|90 — daily series by Moscow days. */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
  }
  const raw = request.nextUrl.searchParams.get("days") ?? "30";
  if (raw !== "30" && raw !== "90") {
    return NextResponse.json({ success: false, error: "days: 30 или 90" }, { status: 400 });
  }
  try {
    const data = await getDailySeries(Number(raw));
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[ADMIN/SERIES] error:", err);
    return NextResponse.json({ success: false, error: "Не удалось посчитать ряды" }, { status: 500 });
  }
}
