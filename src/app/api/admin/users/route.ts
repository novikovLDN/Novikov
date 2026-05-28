import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { verifyAdmin } from "../middleware";

export async function GET() {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
  }

  const result = await pool.query(
    `SELECT id, email, created_at, subscription_end, subscription_plan, telegram_linked, referrals, paid_referrals, registration_ip,
            panel_id, public_id, remnawave_user_uuid, subscription_url, happ_crypto_link
     FROM users ORDER BY created_at DESC`
  );

  // Count accounts per IP
  const ipCounts: Record<string, number> = {};
  for (const row of result.rows) {
    const ip = row.registration_ip || "unknown";
    ipCounts[ip] = (ipCounts[ip] || 0) + 1;
  }

  const users = result.rows.map((row) => ({
    id: row.id,
    email: row.email,
    createdAt: new Date(row.created_at).toISOString(),
    subscriptionEnd: new Date(row.subscription_end).toISOString(),
    subscriptionPlan: row.subscription_plan || "trial",
    telegramLinked: row.telegram_linked,
    referrals: row.referrals,
    paidReferrals: row.paid_referrals,
    isActive: new Date(row.subscription_end) > new Date(),
    registrationIp: row.registration_ip || null,
    accountsOnIp: ipCounts[row.registration_ip || "unknown"] || 1,
    // Remnawave subscription
    publicId: row.public_id || null,
    panelId: row.panel_id || null,
    remnawaveUserUuid: row.remnawave_user_uuid || null,
    subscriptionUrl: row.subscription_url || null,
    happCryptoLink: row.happ_crypto_link || null,
  }));

  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    expired: users.filter((u) => !u.isActive).length,
    telegramLinked: users.filter((u) => u.telegramLinked).length,
  };

  return NextResponse.json({ success: true, data: { users, stats } });
}
