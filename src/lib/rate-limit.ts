/**
 * In-memory rate limiter.
 * Tracks request counts per key (IP or email) within a sliding window.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 5 * 60 * 1000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Check rate limit for a given key.
 * @param key - Unique identifier (IP, email, or combined)
 * @param maxRequests - Max requests allowed in the window
 * @param windowMs - Time window in milliseconds
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, retryAfterSeconds: 0 };
  }

  if (entry.count >= maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds: retryAfter };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, retryAfterSeconds: 0 };
}

// Preset limiters
export function rateLimitByIp(ip: string, maxRequests = 5, windowMs = 60_000) {
  return checkRateLimit(`ip:${ip}`, maxRequests, windowMs);
}

export function rateLimitByEmail(email: string, maxRequests = 3, windowMs = 300_000) {
  return checkRateLimit(`email:${email}`, maxRequests, windowMs);
}

export function rateLimitLogin(ip: string, maxRequests = 10, windowMs = 900_000) {
  return checkRateLimit(`login:${ip}`, maxRequests, windowMs);
}

/**
 * Codes per email per day. The 3-per-5-minutes window alone still allowed
 * ~4 300 code guesses a day against one mailbox (5 attempts × 864 codes);
 * with this cap it is 5 × 15 = 75.
 */
export function rateLimitEmailDaily(email: string, maxRequests = 15, windowMs = 24 * 60 * 60_000) {
  return checkRateLimit(`email-day:${email}`, maxRequests, windowMs);
}

/**
 * Password attempts per ACCOUNT, independent of the IP (which a client can
 * vary). 10 per 15 minutes, then a pause — sign-in by email code still works.
 */
export function rateLimitLoginEmail(email: string, maxRequests = 10, windowMs = 900_000) {
  return checkRateLimit(`login-email:${email}`, maxRequests, windowMs);
}
