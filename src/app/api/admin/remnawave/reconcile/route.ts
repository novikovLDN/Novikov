import { NextResponse } from "next/server";
import { verifyAdmin } from "../../middleware";
import { runReconcilePass } from "@/lib/sync-worker";

/**
 * POST /api/admin/remnawave/reconcile — run the reconciliation now
 * (the same pass the worker runs hourly, under the same lock).
 */
export async function POST() {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
  }
  try {
    const r = await runReconcilePass();
    if (!r.acquired || !r.report) {
      return NextResponse.json({ success: false, error: "Сверка уже идёт — повторите через минуту" }, { status: 409 });
    }
    return NextResponse.json({ success: true, data: r.report });
  } catch (err) {
    console.error("[ADMIN/RECONCILE] error:", err);
    return NextResponse.json({ success: false, error: "Внутренняя ошибка" }, { status: 500 });
  }
}
