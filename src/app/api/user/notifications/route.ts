import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function GET(request: NextRequest) {
  const auth = await getSessionUser(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: "Не авторизован" }, { status: 401 });
  }
  const userId = auth.user.id;

  const result = await pool.query(
    `SELECT n.id, n.title, n.message, n.created_at,
       CASE WHEN nr.user_id IS NOT NULL THEN true ELSE false END AS read
     FROM notifications n
     LEFT JOIN notification_reads nr ON nr.notification_id = n.id AND nr.user_id = $1
     WHERE n.target = 'all' OR n.target = $1
     ORDER BY n.created_at DESC
     LIMIT 50`,
    [userId]
  );

  const data = result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    message: row.message,
    createdAt: new Date(row.created_at).toISOString(),
    read: row.read,
  }));

  return NextResponse.json({ success: true, data });
}
