import { randomBytes, createHash, timingSafeEqual } from "crypto";

/**
 * Одноразовые токены смены пароля.
 *
 * Раньше интерфейс пускал на шаг «новый пароль» с любыми шестью
 * цифрами и проверял код только при отправке нового пароля (владелец,
 * 13.09.2026: «ввёл придуманный код — пропустило на сброс»). Теперь код
 * проверяет сервер (`/api/auth/reset-password/verify`): верный код
 * сгорает и обменивается на токен — 32 случайных байта, 10 минут,
 * привязка к почте, одно использование. Храним только хэш токена.
 *
 * Хранилище — в памяти процесса, как и сами коды входа (`saveCode` в
 * store.ts): коды и токены живут минуты, а сайт работает одним
 * экземпляром. При переходе на несколько экземпляров перенести и то, и
 * другое в БД.
 */
const TTL_MS = 10 * 60 * 1000;

interface ResetRecord {
  email: string;
  expiresAt: number;
}

const g = globalThis as unknown as { __resetTokens?: Map<string, ResetRecord> };
if (!g.__resetTokens) g.__resetTokens = new Map();
const tokens = g.__resetTokens;

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

function sweep(now: number) {
  for (const [k, v] of tokens) if (v.expiresAt <= now) tokens.delete(k);
}

/** Выдать токен после проверенного кода. Прежние токены этой почты гаснут. */
export function issueResetToken(email: string, now = Date.now()): string {
  sweep(now);
  for (const [k, v] of tokens) if (v.email === email) tokens.delete(k);
  const token = randomBytes(32).toString("base64url");
  tokens.set(hash(token), { email, expiresAt: now + TTL_MS });
  return token;
}

/** Погасить токен: true только для живого токена этой почты, один раз. */
export function consumeResetToken(token: string, email: string, now = Date.now()): boolean {
  if (typeof token !== "string" || token.length < 20 || token.length > 200) return false;
  const key = hash(token);
  const rec = tokens.get(key);
  if (!rec) return false;
  tokens.delete(key);
  if (rec.expiresAt <= now) return false;
  const a = Buffer.from(rec.email);
  const b = Buffer.from(email);
  return a.length === b.length && timingSafeEqual(a, b);
}
