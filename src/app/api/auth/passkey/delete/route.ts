import { NextRequest, NextResponse } from "next/server";
import { getUserById } from "@/lib/store";
import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("session")?.value;
    if (!sessionId) return NextResponse.json({ success: false }, { status: 401 });

    const user = await getUserById(sessionId);
    if (!user) return NextResponse.json({ success: false }, { status: 404 });

    await pool.query("DELETE FROM passkey_credentials WHERE user_id = $1", [user.id]);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Ошибка сервера" }, { status: 500 });
  }
}
