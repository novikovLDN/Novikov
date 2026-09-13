import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const auth = await getSessionUser(request);
    if (!auth) return NextResponse.json({ success: false }, { status: 401 });

    await pool.query("DELETE FROM passkey_credentials WHERE user_id = $1", [auth.user.id]);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Ошибка сервера" }, { status: 500 });
  }
}
