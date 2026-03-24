import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("session")?.value;
  if (!userId) {
    return NextResponse.json({ success: false, error: "Не авторизован" }, { status: 401 });
  }

  // Mark all unread notifications as read for this user
  await pool.query(
    `INSERT INTO notification_reads (user_id, notification_id)
     SELECT $1, n.id FROM notifications n
     WHERE (n.target = 'all' OR n.target = $1)
       AND n.id NOT IN (SELECT notification_id FROM notification_reads WHERE user_id = $1)`,
    [userId]
  );

  return NextResponse.json({ success: true });
}
