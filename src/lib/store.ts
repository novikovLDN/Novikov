// PostgreSQL-backed store for user data.
// Verification codes remain in-memory (ephemeral, 10min TTL).

import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { pool } from "./db";
import { generateXrayUuid, buildConnectionUri, xrayRemoveUser } from "./xray";

// ─── Types ───────────────────────────────────────────────────────

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string | null;
  createdAt: string;
  subscriptionEnd: string;
  vpnKey: string | null;
  xrayUuid: string | null;
  telegramId: string | null;
  telegramLinked: boolean;
  referralCode: string;
  referredBy: string | null;
  referrals: number;
  paidReferrals: number;
}

export interface CodeRecord {
  email: string;
  code: string;
  expiresAt: number;
  attempts: number;
}

// ─── Row → UserRecord mapper ────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToUser(row: any): UserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: new Date(row.created_at).toISOString(),
    subscriptionEnd: new Date(row.subscription_end).toISOString(),
    vpnKey: row.vpn_key,
    xrayUuid: row.xray_uuid,
    telegramId: row.telegram_id,
    telegramLinked: row.telegram_linked,
    referralCode: row.referral_code,
    referredBy: row.referred_by,
    referrals: row.referrals,
    paidReferrals: row.paid_referrals,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────

function generateReferralCode(): string {
  return uuidv4().slice(0, 8).toUpperCase();
}

// ─── Verification Codes (in-memory, ephemeral) ──────────────────

const globalCodes = globalThis as unknown as { __codes?: Map<string, CodeRecord> };
if (!globalCodes.__codes) {
  globalCodes.__codes = new Map();
}
const codes = globalCodes.__codes;

const MAX_CODE_ATTEMPTS = 5;

export function saveCode(email: string, code: string): void {
  codes.set(email, {
    email,
    code,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    attempts: 0,
  });
}

export function verifyCode(email: string, code: string): { valid: boolean; error?: string } {
  const record = codes.get(email);
  if (!record) {
    return { valid: false, error: "Код не найден. Запросите новый код." };
  }

  if (Date.now() > record.expiresAt) {
    codes.delete(email);
    return { valid: false, error: "Код истёк. Запросите новый код." };
  }

  if (record.attempts >= MAX_CODE_ATTEMPTS) {
    codes.delete(email);
    return { valid: false, error: "Превышено количество попыток. Запросите новый код." };
  }

  if (record.code !== code) {
    record.attempts++;
    return { valid: false, error: `Неверный код. Осталось попыток: ${MAX_CODE_ATTEMPTS - record.attempts}` };
  }

  codes.delete(email);
  return { valid: true };
}

// ─── User Management (PostgreSQL) ───────────────────────────────

export async function getOrCreateUser(email: string, referredByCode?: string): Promise<UserRecord> {
  // Check existing user
  const existing = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  if (existing.rows.length > 0) {
    return rowToUser(existing.rows[0]);
  }

  // Create new user
  const now = new Date();
  const trialEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days trial
  const xrayUuid = generateXrayUuid();
  const referralCode = generateReferralCode();
  const vpnKey = buildConnectionUri(xrayUuid, email);
  const id = uuidv4();

  const result = await pool.query(
    `INSERT INTO users (id, email, created_at, subscription_end, vpn_key, xray_uuid, referral_code, referred_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [id, email, now, trialEnd, vpnKey, xrayUuid, referralCode, referredByCode || null]
  );

  // Credit referrer
  if (referredByCode) {
    await pool.query(
      "UPDATE users SET referrals = referrals + 1 WHERE referral_code = $1",
      [referredByCode]
    );
  }

  return rowToUser(result.rows[0]);
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  if (result.rows.length === 0) return null;
  return rowToUser(result.rows[0]);
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  if (result.rows.length === 0) return null;
  return rowToUser(result.rows[0]);
}

export async function updateUser(id: string, updates: Partial<UserRecord>): Promise<UserRecord | null> {
  // Map UserRecord fields to DB columns
  const fieldMap: Record<string, string> = {
    email: "email",
    passwordHash: "password_hash",
    subscriptionEnd: "subscription_end",
    vpnKey: "vpn_key",
    xrayUuid: "xray_uuid",
    telegramId: "telegram_id",
    telegramLinked: "telegram_linked",
    referralCode: "referral_code",
    referredBy: "referred_by",
    referrals: "referrals",
    paidReferrals: "paid_referrals",
  };

  const setClauses: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    const column = fieldMap[key];
    if (!column) continue;
    setClauses.push(`${column} = $${paramIndex}`);
    values.push(value);
    paramIndex++;
  }

  if (setClauses.length === 0) return getUserById(id);

  values.push(id);
  const result = await pool.query(
    `UPDATE users SET ${setClauses.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  if (result.rows.length === 0) return null;
  return rowToUser(result.rows[0]);
}

export async function regenerateUserKey(userId: string): Promise<UserRecord | null> {
  const user = await getUserById(userId);
  if (!user) return null;

  const newUuid = generateXrayUuid();
  const newKey = buildConnectionUri(newUuid, user.email);

  return updateUser(userId, {
    xrayUuid: newUuid,
    vpnKey: newKey,
  });
}

export async function linkTelegram(userId: string, telegramId: string): Promise<UserRecord | null> {
  const user = await getUserById(userId);
  if (!user) return null;
  if (user.telegramLinked) return user;

  // Add 7 days bonus for Telegram linking
  const currentEnd = new Date(user.subscriptionEnd);
  const newEnd = new Date(currentEnd.getTime() + 7 * 24 * 60 * 60 * 1000);

  return updateUser(userId, {
    telegramId,
    telegramLinked: true,
    subscriptionEnd: newEnd.toISOString(),
  });
}

// ─── Password Management ────────────────────────────────────────

const BCRYPT_ROUNDS = 10;

export async function setUserPassword(userId: string, password: string): Promise<boolean> {
  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const result = await pool.query(
    "UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id",
    [hash, userId]
  );
  return result.rows.length > 0;
}

export async function verifyUserPassword(email: string, password: string): Promise<UserRecord | null> {
  const user = await getUserByEmail(email);
  if (!user || !user.passwordHash) return null;
  const match = await bcrypt.compare(password, user.passwordHash);
  return match ? user : null;
}

export async function resetUserPassword(email: string, password: string): Promise<boolean> {
  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const result = await pool.query(
    "UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id",
    [hash, email]
  );
  return result.rows.length > 0;
}

export async function userHasPassword(email: string): Promise<boolean> {
  const result = await pool.query(
    "SELECT password_hash FROM users WHERE email = $1",
    [email]
  );
  return result.rows.length > 0 && !!result.rows[0].password_hash;
}

// ─── Expired Subscription Cleanup ───────────────────────────────

export async function getExpiredUsersWithKeys(): Promise<UserRecord[]> {
  const result = await pool.query(
    "SELECT * FROM users WHERE xray_uuid IS NOT NULL AND subscription_end <= NOW()"
  );
  return result.rows.map(rowToUser);
}

export async function cleanupExpiredUsers(): Promise<{ cleaned: number; errors: number }> {
  const expired = await getExpiredUsersWithKeys();
  let cleaned = 0;
  let errors = 0;

  for (const user of expired) {
    try {
      if (user.xrayUuid) {
        const removed = await xrayRemoveUser(user.xrayUuid);
        if (!removed) {
          console.error(`[CLEANUP] Failed to remove Xray user: ${user.xrayUuid} (${user.email})`);
          errors++;
          continue;
        }
      }
      await updateUser(user.id, { xrayUuid: null, vpnKey: null });
      console.log(`[CLEANUP] Deactivated expired key for ${user.email}`);
      cleaned++;
    } catch (error) {
      console.error(`[CLEANUP] Error cleaning up user ${user.email}:`, error);
      errors++;
    }
  }

  if (cleaned > 0 || errors > 0) {
    console.log(`[CLEANUP] Done: ${cleaned} cleaned, ${errors} errors, ${expired.length} total expired`);
  }

  return { cleaned, errors };
}

// ─── Auto-Cleanup Scheduler ─────────────────────────────────────

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

export function startCleanupScheduler(): void {
  if (cleanupTimer) return;
  console.log("[CLEANUP] Scheduler started (interval: 1h)");
  cleanupTimer = setInterval(async () => {
    try {
      await cleanupExpiredUsers();
    } catch (error) {
      console.error("[CLEANUP] Scheduler error:", error);
    }
  }, CLEANUP_INTERVAL_MS);
  if (cleanupTimer && typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }
}

export function stopCleanupScheduler(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
    console.log("[CLEANUP] Scheduler stopped");
  }
}

// Auto-start scheduler on module load (server-side only)
if (typeof window === "undefined") {
  startCleanupScheduler();
}
