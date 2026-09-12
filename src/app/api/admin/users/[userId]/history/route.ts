import { NextRequest, NextResponse } from "next/server";
import { getUserById } from "@/lib/store";
import { getUserHistory } from "@/lib/admin-users";
import { verifyAdmin } from "../../../middleware";

/**
 * GET /api/admin/users/{userId}/history
 * → { success, data: { payments: [...], events: [...] } } — newest first, up to 200 each.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
  }
  try {
    const { userId } = await params;
    const user = await getUserById(userId);
    if (!user) return NextResponse.json({ success: false, error: "Пользователь не найден" }, { status: 404 });
    return NextResponse.json({ success: true, data: await getUserHistory(userId) });
  } catch (err) {
    console.error("[ADMIN/HISTORY] error:", err);
    return NextResponse.json({ success: false, error: "Не удалось загрузить историю" }, { status: 500 });
  }
}
