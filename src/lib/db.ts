import { Pool } from "pg";

/** Simple string hash to generate stable numeric ID from email */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}

const globalPool = globalThis as unknown as { __pgPool?: Pool };

if (!globalPool.__pgPool) {
  globalPool.__pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: process.env.DATABASE_URL?.includes("sslmode=require") || process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : undefined,
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
      sub_token TEXT UNIQUE,
      sub_id TEXT UNIQUE,
      telegram_id TEXT,
      password_hash TEXT,
      key_regen_count INTEGER NOT NULL DEFAULT 0,
      key_regen_window_start TIMESTAMPTZ,
      telegram_linked BOOLEAN NOT NULL DEFAULT FALSE,
      telegram_link_token TEXT UNIQUE,
      registration_ip TEXT,
      referral_code TEXT UNIQUE NOT NULL,
      referred_by TEXT,
      referrals INTEGER NOT NULL DEFAULT 0,
      paid_referrals INTEGER NOT NULL DEFAULT 0,
      subscription_plan TEXT NOT NULL DEFAULT 'trial',
      balance INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
    CREATE INDEX IF NOT EXISTS idx_users_subscription_end ON users(subscription_end);

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      transaction_id TEXT,
      plan TEXT NOT NULL,
      period INTEGER NOT NULL,
      amount NUMERIC(10,2) NOT NULL,
      currency TEXT NOT NULL DEFAULT 'RUB',
      status TEXT NOT NULL DEFAULT 'pending',
      redirect_url TEXT,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      paid_at TIMESTAMPTZ
    );

    CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
    CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      target TEXT NOT NULL DEFAULT 'all',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS notification_reads (
      user_id TEXT NOT NULL REFERENCES users(id),
      notification_id TEXT NOT NULL REFERENCES notifications(id),
      read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, notification_id)
    );

    CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_email TEXT,
      action TEXT NOT NULL,
      details TEXT,
      ip TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);

    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      endpoint TEXT NOT NULL UNIQUE,
      keys_p256dh TEXT NOT NULL,
      keys_auth TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id);

    CREATE TABLE IF NOT EXISTS passkey_credentials (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      credential_id TEXT NOT NULL UNIQUE,
      public_key TEXT NOT NULL,
      counter BIGINT NOT NULL DEFAULT 0,
      device_name TEXT,
      transports TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_passkey_user ON passkey_credentials(user_id);
    CREATE INDEX IF NOT EXISTS idx_passkey_cred ON passkey_credentials(credential_id);

    CREATE TABLE IF NOT EXISTS balance_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      type TEXT NOT NULL,
      source TEXT,
      description TEXT,
      related_user_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_balance_tx_user ON balance_transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_balance_tx_created ON balance_transactions(created_at DESC);

    CREATE TABLE IF NOT EXISTS referral_rewards (
      id TEXT PRIMARY KEY,
      referrer_id TEXT NOT NULL,
      buyer_id TEXT NOT NULL,
      purchase_id TEXT,
      purchase_amount INTEGER NOT NULL,
      percent INTEGER NOT NULL,
      reward_amount INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer ON referral_rewards(referrer_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_rewards_unique ON referral_rewards(buyer_id, purchase_id);
  `);

  // ─── Migrations: add columns that may be missing on older DBs ───
  const migrations = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS key_regen_count INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS key_regen_window_start TIMESTAMPTZ",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_link_token TEXT UNIQUE",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_ip TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS device_fingerprint TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS sub_token TEXT UNIQUE",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS sub_id TEXT UNIQUE",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan TEXT NOT NULL DEFAULT 'trial'",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS balance INTEGER NOT NULL DEFAULT 0",
  ];

  for (const sql of migrations) {
    try {
      await pool.query(sql);
    } catch {
      // Column may already exist — ignore
    }
  }

  // Generate telegram_link_token for existing users who don't have one
  try {
    const usersWithoutToken = await pool.query(
      "SELECT id FROM users WHERE telegram_link_token IS NULL"
    );
    for (const row of usersWithoutToken.rows) {
      const token = require("crypto").randomBytes(8).toString("hex");
      await pool.query(
        "UPDATE users SET telegram_link_token = $1 WHERE id = $2",
        [token, row.id]
      );
    }
    if (usersWithoutToken.rows.length > 0) {
      console.log(`[DB] Generated telegram_link_token for ${usersWithoutToken.rows.length} existing users`);
    }
  } catch (err) {
    console.error("[DB] Failed to generate tokens:", err);
  }

  // Generate sub_token and sub_id for existing users who don't have them
  try {
    const usersWithoutSub = await pool.query(
      "SELECT id, email FROM users WHERE sub_token IS NULL"
    );
    const crypto = require("crypto");
    for (const row of usersWithoutSub.rows) {
      const subToken = crypto.randomBytes(24).toString("base64url");
      const subId = String(Math.abs(hashCode(row.email))).slice(0, 10).padEnd(10, "0");
      await pool.query(
        "UPDATE users SET sub_token = $1, sub_id = $2 WHERE id = $3",
        [subToken, subId, row.id]
      );
    }
    if (usersWithoutSub.rows.length > 0) {
      console.log(`[DB] Generated sub_token/sub_id for ${usersWithoutSub.rows.length} existing users`);
    }
  } catch (err) {
    console.error("[DB] Failed to generate sub tokens:", err);
  }

  console.log("[DB] Tables initialized");
}

// Auto-init on first import (server-side only)
if (typeof window === "undefined") {
  initDb().catch((err) => {
    console.error("[DB] Failed to initialize:", err);
  });
}
