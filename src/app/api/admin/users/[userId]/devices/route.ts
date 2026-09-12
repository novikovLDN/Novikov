import { NextRequest, NextResponse } from "next/server";
import { getUserById } from "@/lib/store";
import { describeRwError, getUserById as rwGetUserById, listHwidDevices } from "@/lib/remnawave";
import { DEVICE_LIMIT } from "@/lib/plans";
import { verifyAdmin } from "../../../middleware";

/** GET /api/admin/users/{userId}/devices — HWID devices from the panel (read-only). */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
  }
  try {
    const { userId } = await params;
    const user = await getUserById(userId);
    if (!user) return NextResponse.json({ success: false, error: "Пользователь не найден" }, { status: 404 });
    if (!user.panelUserId) {
      return NextResponse.json({ success: true, data: { panelUserId: null, total: 0, devices: [], limit: DEVICE_LIMIT } });
    }
    const [devices, panelUser] = await Promise.all([listHwidDevices(user.panelUserId), rwGetUserById(user.panelUserId)]);
    if (!devices.ok) {
      return NextResponse.json({ success: false, error: `Панель не ответила: ${describeRwError(devices)}` }, { status: 502 });
    }
    return NextResponse.json({
      success: true,
      data: {
        panelUserId: user.panelUserId,
        total: devices.data.total,
        devices: devices.data.devices,
        // Panel-side limit (null → the panel's fallback applies); DEVICE_LIMIT is what the site promises.
        limit: panelUser.ok ? panelUser.data.hwidDeviceLimit : null,
        siteLimit: DEVICE_LIMIT,
      },
    });
  } catch (err) {
    console.error("[ADMIN/DEVICES] error:", err);
    return NextResponse.json({ success: false, error: "Внутренняя ошибка" }, { status: 500 });
  }
}
