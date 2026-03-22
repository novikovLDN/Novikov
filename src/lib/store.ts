// In-memory store for development.
// Replace with a real database (PostgreSQL, MongoDB, Redis) in production.

import { v4 as uuidv4 } from "uuid";
import { generateXrayUuid, buildConnectionUri, xrayRemoveUser } from "./xray";

// ─── Types ───────────────────────────────────────────────────────

export interface UserRecord {
  id: string;
  email: string;
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

// ─── Storage (persist across HMR in dev) ────────────────────────

interface StoreData {
  users: Map<string, UserRecord>;
  codes: Map<string, CodeRecord>;
  emailToUserId: Map<string, string>;
  referralToUserId: Map<string, string>;
}

const globalStore = globalThis as unknown as { __store?: StoreData };

if (!globalStore.__store) {
  globalStore.__store = {
    users: new Map(),
    codes: new Map(),
    emailToUserId: new Map(),
    referralToUserId: new Map(),
  };
}

const users = globalStore.__store.users;
const codes = globalStore.__store.codes;
const emailToUserId = globalStore.__store.emailToUserId;
const referralToUserId = globalStore.__store.referralToUserId;

// ─── Helpers ─────────────────────────────────────────────────────

function generateReferralCode(): string {
  return uuidv4().slice(0, 8).toUpperCase();
}

// ─── Verification Codes ──────────────────────────────────────────

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

// ─── User Management ─────────────────────────────────────────────

export function getOrCreateUser(email: string, referredByCode?: string): UserRecord {
  const existingId = emailToUserId.get(email);
  if (existingId) {
    return users.get(existingId)!;
  }

  const now = new Date();
  const trialEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days trial
  const xrayUuid = generateXrayUuid();
  const referralCode = generateReferralCode();

  const user: UserRecord = {
    id: uuidv4(),
    email,
    createdAt: now.toISOString(),
    subscriptionEnd: trialEnd.toISOString(),
    vpnKey: buildConnectionUri(xrayUuid, email),
    xrayUuid,
    telegramId: null,
    telegramLinked: false,
    referralCode,
    referredBy: referredByCode || null,
    referrals: 0,
    paidReferrals: 0,
  };

  users.set(user.id, user);
  emailToUserId.set(email, user.id);
  referralToUserId.set(referralCode, user.id);

  // Credit referrer
  if (referredByCode) {
    const referrerId = referralToUserId.get(referredByCode);
    if (referrerId) {
      const referrer = users.get(referrerId);
      if (referrer) {
        referrer.referrals++;
      }
    }
  }

  return user;
}

export function getUserByEmail(email: string): UserRecord | null {
  const id = emailToUserId.get(email);
  if (!id) return null;
  return users.get(id) ?? null;
}

export function getUserById(id: string): UserRecord | null {
  return users.get(id) ?? null;
}

export function updateUser(id: string, updates: Partial<UserRecord>): UserRecord | null {
  const user = users.get(id);
  if (!user) return null;
  const updated = { ...user, ...updates };
  users.set(id, updated);
  return updated;
}

export function regenerateUserKey(userId: string): UserRecord | null {
  const user = users.get(userId);
  if (!user) return null;

  const newUuid = generateXrayUuid();
  const newKey = buildConnectionUri(newUuid, user.email);

  return updateUser(userId, {
    xrayUuid: newUuid,
    vpnKey: newKey,
  });
}

export function linkTelegram(userId: string, telegramId: string): UserRecord | null {
  const user = users.get(userId);
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

// ─── Expired Subscription Cleanup ───────────────────────────────

/** Find all users with expired subscriptions who still have active VPN keys */
export function getExpiredUsersWithKeys(): UserRecord[] {
  const now = new Date();
  const expired: UserRecord[] = [];
  for (const user of users.values()) {
    if (user.xrayUuid && new Date(user.subscriptionEnd) <= now) {
      expired.push(user);
    }
  }
  return expired;
}

/** Remove VPN keys from all users whose subscriptions have expired */
export async function cleanupExpiredUsers(): Promise<{ cleaned: number; errors: number }> {
  const expired = getExpiredUsersWithKeys();
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
      updateUser(user.id, { xrayUuid: null, vpnKey: null });
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

/** Start the background cleanup scheduler */
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
  // Don't block process exit
  if (cleanupTimer && typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }
}

/** Stop the background cleanup scheduler */
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
