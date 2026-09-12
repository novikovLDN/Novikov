import { NextRequest, NextResponse } from "next/server";
import { getUserById } from "@/lib/store";
import { describeRwError, getUserIpJob, startUserIpJob } from "@/lib/remnawave";
import { verifyAdmin } from "../../../middleware";

/**
 * IP addresses of a user's connections (read-only; the panel computes
 * them asynchronously):
 *   POST /api/admin/users/{userId}/ips          → { jobId }
 *   GET  /api/admin/users/{userId}/ips?jobId=…  → { isCompleted, isFailed, progress, result }
 */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const auth = await verifyAdmin();
  if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
  try {
    const { userId } = await params;
    const user = await getUserById(userId);
    if (!user) return NextResponse.json({ success: false, error: "Пользователь не найден" }, { status: 404 });
    if (!user.panelUserId) return NextResponse.json({ success: false, error: "У пользователя нет записи в панели" }, { status: 409 });
    const r = await startUserIpJob(user.panelUserId);
    if (!r.ok) return NextResponse.json({ success: false, error: `Панель не ответила: ${describeRwError(r)}` }, { status: 502 });
    return NextResponse.json({ success: true, data: r.data });
  } catch (err) {
    console.error("[ADMIN/IPS] start error:", err);
    return NextResponse.json({ success: false, error: "Внутренняя ошибка" }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const auth = await verifyAdmin();
  if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
  try {
    await params;
    const jobId = request.nextUrl.searchParams.get("jobId");
    if (!jobId) return NextResponse.json({ success: false, error: "jobId обязателен" }, { status: 400 });
    const r = await getUserIpJob(jobId);
    if (!r.ok) return NextResponse.json({ success: false, error: `Панель не ответила: ${describeRwError(r)}` }, { status: 502 });
    return NextResponse.json({ success: true, data: r.data });
  } catch (err) {
    console.error("[ADMIN/IPS] poll error:", err);
    return NextResponse.json({ success: false, error: "Внутренняя ошибка" }, { status: 500 });
  }
}
