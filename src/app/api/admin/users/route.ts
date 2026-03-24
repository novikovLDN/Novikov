import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { verifyAdmin } from "../middleware";

export async function GET() {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
  }

  const result = await pool.query(
    `SELECT id, email, created_at, subscription_end, telegram_linked, referrals, paid_referrals
     FROM users ORDER BY created_at DESC`
  );

  const users = result.rows.map((row) => ({
    id: row.id,
    email: row.email,
    createdAt: new Date(row.created_at).toISOString(),
    subscriptionEnd: new Date(row.subscription_end).toISOString(),
    telegramLinked: row.telegram_linked,
    referrals: row.referrals,
    paidReferrals: row.paid_referrals,
    isActive: new Date(row.subscription_end) > new Date(),
  }));

  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    expired: users.filter((u) => !u.isActive).length,
    telegramLinked: users.filter((u) => u.telegramLinked).length,
  };

  return NextResponse.json({ success: true, data: { users, stats } });
}
