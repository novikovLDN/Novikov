// In-memory store for demo purposes.
// Replace with a real database (PostgreSQL, MongoDB, etc.) in production.

import { v4 as uuidv4 } from "uuid";

export interface UserRecord {
  id: string;
  email: string;
  createdAt: string;
  subscriptionEnd: string;
  vpnKey: string | null;
  telegramLinked: boolean;
  referralCode: string;
  referrals: number;
  paidReferrals: number;
}

export interface CodeRecord {
  email: string;
  code: string;
  expiresAt: number;
}

const users = new Map<string, UserRecord>();
const codes = new Map<string, CodeRecord>();
const emailToUserId = new Map<string, string>();

function generateVpnKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const segments = [];
  for (let s = 0; s < 4; s++) {
    let segment = "";
    for (let i = 0; i < 8; i++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  return `vless://${segments.join("-")}@atlas-secure.vpn`;
}

function generateReferralCode(): string {
  return uuidv4().slice(0, 8).toUpperCase();
}

export function saveCode(email: string, code: string): void {
  codes.set(email, {
    email,
    code,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  });
}

export function verifyCode(email: string, code: string): boolean {
  const record = codes.get(email);
  if (!record) return false;
  if (Date.now() > record.expiresAt) {
    codes.delete(email);
    return false;
  }
  if (record.code !== code) return false;
  codes.delete(email);
  return true;
}

export function getOrCreateUser(email: string): UserRecord {
  const existingId = emailToUserId.get(email);
  if (existingId) {
    return users.get(existingId)!;
  }

  const now = new Date();
  const trialEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days

  const user: UserRecord = {
    id: uuidv4(),
    email,
    createdAt: now.toISOString(),
    subscriptionEnd: trialEnd.toISOString(),
    vpnKey: generateVpnKey(),
    telegramLinked: false,
    referralCode: generateReferralCode(),
    referrals: 0,
    paidReferrals: 0,
  };

  users.set(user.id, user);
  emailToUserId.set(email, user.id);
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
