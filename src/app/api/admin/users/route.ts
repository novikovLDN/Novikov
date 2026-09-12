import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "../middleware";
import { listUsers, parseUsersParams } from "@/lib/admin-users";

/**
 * GET /api/admin/users
 *
 * Without query params: every user (legacy shape `{ users, stats }`) plus
 * `counts` and the new per-user fields.
 * With any of q / filter / sort / limit / cursor: one page
 * `{ users, stats, counts, total, nextCursor }` (see src/lib/admin-users.ts).
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
  }
  const parsed = parseUsersParams(request.nextUrl.searchParams);
  if (!parsed.ok) return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
  try {
    const data = await listUsers(parsed.params);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[ADMIN/USERS] error:", err);
    return NextResponse.json({ success: false, error: "Не удалось загрузить пользователей" }, { status: 500 });
  }
}
