// In-memory store for development.
// Replace with a real database (PostgreSQL, MongoDB, Redis) in production.

import { v4 as uuidv4 } from "uuid";
import { generateXrayUuid, buildConnectionUri } from "./xray";

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

// ─── Storage ─────────────────────────────────────────────────────

const users = new Map<string, UserRecord>();
const codes = new Map<string, CodeRecord>();
const emailToUserId = new Map<string, string>();
const referralToUserId = new Map<string, string>();

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
