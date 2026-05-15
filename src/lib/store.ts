// PostgreSQL-backed store for user data.
// Verification codes remain in-memory (ephemeral, 10min TTL).

import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { pool } from "./db";
import { generateXrayUuid, buildConnectionUri, xrayRemoveUser, generateSubToken, generateSubId, buildSubscriptionUrl } from "./xray";

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
  subscriptionPlan: string;
  subToken: string | null;
  subId: string | null;
  keyRegenCount: number;
  keyRegenWindowStart: string | null;
  telegramLinkToken: string | null;
  registrationIp: string | null;
  balance: number;
  remnawaveUserUuid: string | null;
  remnawaveShortUuid: string | null;
  subscriptionUrl: string | null;
  happCryptoLink: string | null;
  cryptoLinkUpdatedAt: string | null;
  trialUsedAt: string | null;
  panelId: string | null;
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
    subscriptionPlan: row.subscription_plan || "trial",
    subToken: row.sub_token,
    subId: row.sub_id,
    keyRegenCount: row.key_regen_count ?? 0,
    keyRegenWindowStart: row.key_regen_window_start ? new Date(row.key_regen_window_start).toISOString() : null,
    telegramLinkToken: row.telegram_link_token,
    registrationIp: row.registration_ip,
    balance: row.balance ?? 0,
    remnawaveUserUuid: row.remnawave_user_uuid ?? null,
    remnawaveShortUuid: row.remnawave_short_uuid ?? null,
    subscriptionUrl: row.subscription_url ?? null,
    happCryptoLink: row.happ_crypto_link ?? null,
    cryptoLinkUpdatedAt: row.crypto_link_updated_at ? new Date(row.crypto_link_updated_at).toISOString() : null,
    trialUsedAt: row.trial_used_at ? new Date(row.trial_used_at).toISOString() : null,
    panelId: row.panel_id ?? null,
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

export async function getOrCreateUser(email: string, referredByCode?: string, ip?: string, fingerprint?: string): Promise<UserRecord & { isNew: boolean; trialBlocked?: boolean }> {
  // Check existing user
  const existing = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  if (existing.rows.length > 0) {
    return { ...rowToUser(existing.rows[0]), isNew: false };
  }

  // Create new user
  const now = new Date();
  const trialHours = 24;
  const trialEnd = new Date(now.getTime() + trialHours * 60 * 60 * 1000);
  const xrayUuid = generateXrayUuid();
  const referralCode = generateReferralCode();
  const telegramLinkToken = uuidv4().replace(/-/g, "").slice(0, 16);
  const subToken = generateSubToken();
  const subId = generateSubId(email);
  const vpnKey = buildSubscriptionUrl(subToken, subId);
  const id = uuidv4();
  const crypto = require("crypto") as typeof import("crypto");
  const panelId = crypto.randomBytes(4).toString("hex"); // 8-char hex Remnawave username

  const result = await pool.query(
    `INSERT INTO users (id, email, created_at, subscription_end, vpn_key, xray_uuid, sub_token, sub_id, referral_code, referred_by, telegram_link_token, registration_ip, device_fingerprint, panel_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING *`,
    [id, email, now, trialEnd, vpnKey, xrayUuid, subToken, subId, referralCode, referredByCode || null, telegramLinkToken, ip || null, fingerprint || null, panelId]
  );

  // Credit referrer: +1 referral count (bonus given when friend pays)
  if (referredByCode) {
    await pool.query(
      `UPDATE users SET referrals = referrals + 1 WHERE referral_code = $1`,
      [referredByCode]
    );
  }

  return { ...rowToUser(result.rows[0]), isNew: true };
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
    subToken: "sub_token",
    subId: "sub_id",
    telegramId: "telegram_id",
    telegramLinked: "telegram_linked",
    referralCode: "referral_code",
    referredBy: "referred_by",
    referrals: "referrals",
    paidReferrals: "paid_referrals",
    subscriptionPlan: "subscription_plan",
    keyRegenCount: "key_regen_count",
    keyRegenWindowStart: "key_regen_window_start",
    telegramLinkToken: "telegram_link_token",
    registrationIp: "registration_ip",
    balance: "balance",
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

const MAX_REGEN_PER_WINDOW = 2;
const REGEN_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 hours

export async function checkRegenLimit(userId: string): Promise<{ allowed: boolean; remaining: number; resetAt: string | null }> {
  const user = await getUserById(userId);
  if (!user) return { allowed: false, remaining: 0, resetAt: null };

  const now = Date.now();
  const windowStart = user.keyRegenWindowStart ? new Date(user.keyRegenWindowStart).getTime() : 0;
  const windowExpired = !user.keyRegenWindowStart || (now - windowStart) >= REGEN_WINDOW_MS;

  if (windowExpired) {
    return { allowed: true, remaining: MAX_REGEN_PER_WINDOW, resetAt: null };
  }

  const remaining = MAX_REGEN_PER_WINDOW - user.keyRegenCount;
  const resetAt = new Date(windowStart + REGEN_WINDOW_MS).toISOString();
  return { allowed: remaining > 0, remaining: Math.max(0, remaining), resetAt };
}

export async function regenerateUserKey(userId: string): Promise<{ user: UserRecord | null; limitExceeded?: boolean; resetAt?: string }> {
  const user = await getUserById(userId);
  if (!user) return { user: null };

  const now = Date.now();
  const windowStart = user.keyRegenWindowStart ? new Date(user.keyRegenWindowStart).getTime() : 0;
  const windowExpired = !user.keyRegenWindowStart || (now - windowStart) >= REGEN_WINDOW_MS;

  let newCount: number;
  let newWindowStart: string;

  if (windowExpired) {
    newCount = 1;
    newWindowStart = new Date(now).toISOString();
  } else {
    if (user.keyRegenCount >= MAX_REGEN_PER_WINDOW) {
      const resetAt = new Date(windowStart + REGEN_WINDOW_MS).toISOString();
      return { user: null, limitExceeded: true, resetAt };
    }
    newCount = user.keyRegenCount + 1;
    newWindowStart = user.keyRegenWindowStart!;
  }

  const newUuid = generateXrayUuid();
  const newSubToken = generateSubToken();
  const subId = user.subId || generateSubId(user.email);
  const newKey = buildSubscriptionUrl(newSubToken, subId);

  const updated = await updateUser(userId, {
    xrayUuid: newUuid,
    vpnKey: newKey,
    subToken: newSubToken,
    keyRegenCount: newCount,
    keyRegenWindowStart: newWindowStart,
  });

  return { user: updated };
}

export async function linkTelegram(userId: string, telegramId: string): Promise<UserRecord | null> {
  const user = await getUserById(userId);
  if (!user) return null;
  if (user.telegramLinked) return user;

  return updateUser(userId, {
    telegramId,
    telegramLinked: true,
  });
}

// ─── Telegram Bot Sync ──────────────────────────────────────────

export async function getUserByTelegramLinkToken(token: string): Promise<UserRecord | null> {
  const result = await pool.query("SELECT * FROM users WHERE telegram_link_token = $1", [token]);
  if (result.rows.length === 0) return null;
  return rowToUser(result.rows[0]);
}

export async function getUserByTelegramId(telegramId: string): Promise<UserRecord | null> {
  const result = await pool.query("SELECT * FROM users WHERE telegram_id = $1", [telegramId]);
  if (result.rows.length === 0) return null;
  return rowToUser(result.rows[0]);
}

export async function linkTelegramByToken(token: string, telegramId: string): Promise<UserRecord | null> {
  const user = await getUserByTelegramLinkToken(token);
  if (!user) return null;
  if (user.telegramLinked && user.telegramId === telegramId) return user; // Already linked to this account

  // Check if this telegram_id is already linked to another account
  const existingByTg = await getUserByTelegramId(telegramId);
  if (existingByTg && existingByTg.id !== user.id) {
    // If linked to a placeholder bot account (telegram_*@tg.*), unlink it first
    if (existingByTg.email.startsWith("telegram_") && existingByTg.email.includes("@tg.")) {
      await updateUser(existingByTg.id, { telegramId: null, telegramLinked: false });
      console.log(`[LINK] Unlinked TG:${telegramId} from placeholder ${existingByTg.email} → linking to ${user.email}`);
    } else {
      // Already linked to a real account — don't override
      return existingByTg;
    }
  }

  return updateUser(user.id, {
    telegramId,
    telegramLinked: true,
  });
}

export async function botExtendSubscription(
  telegramId: string,
  days: number,
  plan?: string
): Promise<UserRecord | null> {
  const user = await getUserByTelegramId(telegramId);
  if (!user) return null;

  const currentEnd = new Date(user.subscriptionEnd);
  const now = new Date();
  const base = currentEnd > now ? currentEnd : now;
  const newEnd = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

  // If user has no VPN key (expired and cleaned up), regenerate
  if (!user.xrayUuid) {
    const { generateXrayUuid: genUuid, generateSubToken: genSubToken, generateSubId: genSubId, buildSubscriptionUrl: buildSubUrl } = await import("./xray");
    const newUuid = genUuid();
    const newSubToken = genSubToken();
    const subId = user.subId || genSubId(user.email);
    const newKey = buildSubUrl(newSubToken, subId);
    return updateUser(user.id, {
      subscriptionEnd: newEnd.toISOString(),
      xrayUuid: newUuid,
      vpnKey: newKey,
      subToken: newSubToken,
      subId: subId,
    });
  }

  return updateUser(user.id, { subscriptionEnd: newEnd.toISOString() });
}

// ─── Payment Management ─────────────────────────────────────────

export interface PaymentRecord {
  id: string;
  userId: string;
  transactionId: string | null;
  plan: string;
  period: number;
  amount: number;
  currency: string;
  status: string;
  redirectUrl: string | null;
  expiresAt: string;
  createdAt: string;
  paidAt: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToPayment(row: any): PaymentRecord {
  return {
    id: row.id,
    userId: row.user_id,
    transactionId: row.transaction_id,
    plan: row.plan,
    period: row.period,
    amount: parseFloat(row.amount),
    currency: row.currency,
    status: row.status,
    redirectUrl: row.redirect_url,
    expiresAt: new Date(row.expires_at).toISOString(),
    createdAt: new Date(row.created_at).toISOString(),
    paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : null,
  };
}

export async function createPaymentRecord(
  id: string,
  userId: string,
  plan: string,
  period: number,
  amount: number,
  transactionId: string | null,
  redirectUrl: string | null,
  expiresAt: Date
): Promise<PaymentRecord> {
  const result = await pool.query(
    `INSERT INTO payments (id, user_id, plan, period, amount, transaction_id, redirect_url, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [id, userId, plan, period, amount, transactionId, redirectUrl, expiresAt]
  );
  return rowToPayment(result.rows[0]);
}

export async function getPaymentById(id: string): Promise<PaymentRecord | null> {
  const result = await pool.query("SELECT * FROM payments WHERE id = $1", [id]);
  if (result.rows.length === 0) return null;
  return rowToPayment(result.rows[0]);
}

export async function getPaymentByTransactionId(transactionId: string): Promise<PaymentRecord | null> {
  const result = await pool.query("SELECT * FROM payments WHERE transaction_id = $1", [transactionId]);
  if (result.rows.length === 0) return null;
  return rowToPayment(result.rows[0]);
}

export async function updatePaymentStatus(id: string, status: string, paidAt?: Date): Promise<PaymentRecord | null> {
  const result = paidAt
    ? await pool.query(
        "UPDATE payments SET status = $1, paid_at = $2 WHERE id = $3 RETURNING *",
        [status, paidAt, id]
      )
    : await pool.query(
        "UPDATE payments SET status = $1 WHERE id = $2 RETURNING *",
        [status, id]
      );
  if (result.rows.length === 0) return null;
  return rowToPayment(result.rows[0]);
}

export async function extendSubscription(userId: string, days: number): Promise<UserRecord | null> {
  const user = await getUserById(userId);
  if (!user) return null;

  const currentEnd = new Date(user.subscriptionEnd);
  const now = new Date();
  // If subscription already expired, extend from now; otherwise extend from current end
  const base = currentEnd > now ? currentEnd : now;
  const newEnd = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

  return updateUser(userId, { subscriptionEnd: newEnd.toISOString() });
}

// ─── Loyalty Tiers & Cashback ───────────────────────────────────

export interface LoyaltyInfo {
  tier: string;
  percent: number;
  paidReferrals: number;
  nextTier: string | null;
  referralsToNextTier: number;
}

/** Get cashback percentage based on paid referrals count */
export function getCashbackPercent(paidReferrals: number): number {
  if (paidReferrals >= 50) return 45;
  if (paidReferrals >= 25) return 25;
  return 10;
}

/** Get full loyalty tier info */
export function getLoyaltyInfo(paidReferrals: number): LoyaltyInfo {
  if (paidReferrals >= 50) {
    return { tier: "Партнёр", percent: 45, paidReferrals, nextTier: null, referralsToNextTier: 0 };
  }
  if (paidReferrals >= 25) {
    return { tier: "Продвинутый", percent: 25, paidReferrals, nextTier: "Партнёр", referralsToNextTier: 50 - paidReferrals };
  }
  return { tier: "Стартовый", percent: 10, paidReferrals, nextTier: "Продвинутый", referralsToNextTier: 25 - paidReferrals };
}

// ─── Balance Operations ─────────────────────────────────────────

/**
 * Increase user balance (amount in kopecks). Returns new balance.
 * @param syncedToBot - false for site-originated cashback (pending bot sync)
 */
export async function increaseBalance(
  userId: string,
  amountKopecks: number,
  type: string,
  source: string,
  description: string,
  relatedUserId?: string,
  syncedToBot: boolean = true
): Promise<number> {
  const id = uuidv4();
  const result = await pool.query(
    `UPDATE users SET balance = balance + $1 WHERE id = $2 RETURNING balance`,
    [amountKopecks, userId]
  );
  if (result.rows.length === 0) return 0;

  await pool.query(
    `INSERT INTO balance_transactions (id, user_id, amount, type, source, description, related_user_id, synced_to_bot)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, userId, amountKopecks, type, source, description, relatedUserId || null, syncedToBot]
  );

  return result.rows[0].balance;
}

/** Get user balance in kopecks */
export async function getUserBalance(userId: string): Promise<number> {
  const result = await pool.query("SELECT balance FROM users WHERE id = $1", [userId]);
  return result.rows[0]?.balance ?? 0;
}

/** Get unsynced cashback transactions for a user (pending bot sync) */
export async function getUnsyncedCashback(userId: string): Promise<Array<{
  id: string;
  amount: number;
  description: string | null;
  relatedUserId: string | null;
  createdAt: string;
}>> {
  const result = await pool.query(
    `SELECT id, amount, description, related_user_id, created_at
     FROM balance_transactions
     WHERE user_id = $1 AND synced_to_bot = FALSE
     ORDER BY created_at ASC`,
    [userId]
  );
  return result.rows.map((r) => ({
    id: r.id,
    amount: r.amount,
    description: r.description,
    relatedUserId: r.related_user_id,
    createdAt: new Date(r.created_at).toISOString(),
  }));
}

/** Mark cashback transactions as synced to bot */
export async function markCashbackSynced(transactionIds: string[]): Promise<void> {
  if (transactionIds.length === 0) return;
  await pool.query(
    `UPDATE balance_transactions SET synced_to_bot = TRUE WHERE id = ANY($1)`,
    [transactionIds]
  );
}

// ─── Referral Cashback System ───────────────────────────────────

/**
 * Credit referrer with cashback on a referral's payment.
 *
 * @param userId - the buyer (referred user) who made a payment
 * @param purchaseAmountRubles - payment amount in rubles
 * @param purchaseId - unique payment ID for idempotency
 * @returns cashback info or null if no referrer
 */
export async function creditReferrerOnPayment(
  userId: string,
  purchaseAmountRubles?: number,
  purchaseId?: string
): Promise<{ referrerId: string; percent: number; rewardRubles: number } | null> {
  const user = await getUserById(userId);
  if (!user || !user.referredBy) return null;

  // Find referrer by referral code
  const referrerResult = await pool.query(
    "SELECT * FROM users WHERE referral_code = $1",
    [user.referredBy]
  );
  if (referrerResult.rows.length === 0) return null;
  const referrer = rowToUser(referrerResult.rows[0]);

  // Self-referral protection
  if (referrer.id === userId) return null;

  // If no amount provided, just increment paidReferrals (legacy compat)
  if (!purchaseAmountRubles || purchaseAmountRubles <= 0) {
    await pool.query(
      `UPDATE users SET paid_referrals = paid_referrals + 1 WHERE id = $1`,
      [referrer.id]
    );
    console.log(`[REFERRAL] Incremented paidReferrals for ${referrer.email} (no amount provided)`);
    return null;
  }

  // Idempotency check: don't double-credit same purchase
  if (purchaseId) {
    const existing = await pool.query(
      "SELECT id FROM referral_rewards WHERE buyer_id = $1 AND purchase_id = $2",
      [userId, purchaseId]
    );
    if (existing.rows.length > 0) {
      console.log(`[REFERRAL] Already credited for purchase ${purchaseId}, skipping`);
      return null;
    }
  }

  // Calculate cashback
  const percent = getCashbackPercent(referrer.paidReferrals);
  const rewardKopecks = Math.round(purchaseAmountRubles * percent / 100 * 100);
  const rewardRubles = rewardKopecks / 100;
  const purchaseKopecks = Math.round(purchaseAmountRubles * 100);

  // Credit referrer balance + increment paidReferrals
  await pool.query(
    `UPDATE users SET balance = balance + $1, paid_referrals = paid_referrals + 1 WHERE id = $2`,
    [rewardKopecks, referrer.id]
  );

  // Record balance transaction (synced_to_bot = false — bot will pick up on next sync)
  const txId = uuidv4();
  await pool.query(
    `INSERT INTO balance_transactions (id, user_id, amount, type, source, description, related_user_id, synced_to_bot)
     VALUES ($1, $2, $3, 'cashback', 'referral', $4, $5, FALSE)`,
    [txId, referrer.id, rewardKopecks, `Кешбэк ${percent}% от покупки ${purchaseAmountRubles}₽`, userId]
  );

  // Record referral reward
  const rewardId = uuidv4();
  await pool.query(
    `INSERT INTO referral_rewards (id, referrer_id, buyer_id, purchase_id, purchase_amount, percent, reward_amount)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [rewardId, referrer.id, userId, purchaseId || uuidv4(), purchaseKopecks, percent, rewardKopecks]
  );

  console.log(`[REFERRAL] Credited ${referrer.email}: ${rewardRubles}₽ (${percent}% of ${purchaseAmountRubles}₽) from ${user.email}`);
  return { referrerId: referrer.id, percent, rewardRubles };
}

export async function expirePendingPayments(): Promise<number> {
  const result = await pool.query(
    `UPDATE payments SET status = 'expired'
     WHERE status = 'pending' AND expires_at <= NOW()
     RETURNING id`
  );
  return result.rows.length;
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

// ─── Notifications ────────────────────────────────────────────

export async function createNotificationForUser(userId: string, title: string, message: string): Promise<void> {
  try {
    const id = uuidv4();
    await pool.query(
      "INSERT INTO notifications (id, title, message, target) VALUES ($1, $2, $3, $4)",
      [id, title, message, userId]
    );

    // Send push notification (async, don't block)
    import("./push").then(({ sendPushToUser }) => {
      sendPushToUser(userId, title, message).catch(() => {});
    }).catch(() => {});
  } catch (err) {
    console.error("[STORE] Failed to create notification:", err);
  }
}

// ─── Audit Logs ──────────────────────────────────────────────

export async function createAuditLog(
  action: string,
  details?: string,
  userId?: string,
  userEmail?: string,
  ip?: string
): Promise<void> {
  try {
    const id = uuidv4();
    await pool.query(
      "INSERT INTO audit_logs (id, user_id, user_email, action, details, ip) VALUES ($1, $2, $3, $4, $5, $6)",
      [id, userId || null, userEmail || null, action, details || null, ip || null]
    );
  } catch (err) {
    console.error("[AUDIT] Failed to create log:", err);
  }
}

export async function getAuditLogs(limit = 100, offset = 0): Promise<Array<{
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  details: string | null;
  ip: string | null;
  createdAt: string;
}>> {
  const result = await pool.query(
    "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2",
    [limit, offset]
  );
  return result.rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    userEmail: r.user_email,
    action: r.action,
    details: r.details,
    ip: r.ip,
    createdAt: new Date(r.created_at).toISOString(),
  }));
}

// Auto-start scheduler on module load (server-side only)
if (typeof window === "undefined") {
  startCleanupScheduler();
}
