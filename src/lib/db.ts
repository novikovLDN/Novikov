import { Pool } from "pg";

const globalPool = globalThis as unknown as { __pgPool?: Pool };

if (!globalPool.__pgPool) {
  globalPool.__pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  });
}

export const pool = globalPool.__pgPool;

/** Initialize database tables */
export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      subscription_end TIMESTAMPTZ NOT NULL,
      vpn_key TEXT,
      xray_uuid TEXT,
      telegram_id TEXT,
      password_hash TEXT,
      telegram_linked BOOLEAN NOT NULL DEFAULT FALSE,
      referral_code TEXT UNIQUE NOT NULL,
      referred_by TEXT,
      referrals INTEGER NOT NULL DEFAULT 0,
      paid_referrals INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
    CREATE INDEX IF NOT EXISTS idx_users_subscription_end ON users(subscription_end);
  `);

  console.log("[DB] Tables initialized");
}

// Auto-init on first import (server-side only)
if (typeof window === "undefined") {
  initDb().catch((err) => {
    console.error("[DB] Failed to initialize:", err);
  });
}
