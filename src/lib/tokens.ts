/**
 * Secret tokens — always from Node's CSPRNG (crypto.randomBytes), never
 * from SQL (Postgres random() is not cryptographically secure, and
 * pgcrypto may not be installable).
 */

import crypto from "crypto";

/**
 * Telegram link token: binds a Telegram account to a site account, so
 * it is a secret. 16 lowercase hex chars (8 random bytes) — the format
 * all existing tokens already have.
 */
export function generateTelegramLinkToken(): string {
  return crypto.randomBytes(8).toString("hex");
}

type Query = (sql: string, params?: unknown[]) => Promise<{ rows: Array<Record<string, unknown>>; rowCount?: number | null }>;

export const LINK_TOKEN_BATCH = 1000;

/**
 * Give every user without a telegram_link_token a fresh CSPRNG token,
 * up to LINK_TOKEN_BATCH rows per UPDATE. Returns the number of rows filled.
 */
export async function backfillTelegramLinkTokens(query: Query, batch = LINK_TOKEN_BATCH): Promise<number> {
  let total = 0;
  for (;;) {
    const ids = (await query("SELECT id FROM users WHERE telegram_link_token IS NULL LIMIT $1", [batch])).rows.map((r) => String(r.id));
    if (ids.length === 0) return total;
    const params: string[] = [];
    const values = ids.map((id, i) => {
      params.push(id, generateTelegramLinkToken());
      return `($${2 * i + 1}::text, $${2 * i + 2}::text)`;
    });
    const r = await query(
      `UPDATE users AS u SET telegram_link_token = v.tok
       FROM (VALUES ${values.join(", ")}) AS v(id, tok)
       WHERE u.id = v.id AND u.telegram_link_token IS NULL`,
      params
    );
    const n = r.rowCount ?? 0;
    total += n;
    // Nothing updated although rows were selected → a concurrent writer
    // filled them; stop rather than loop forever.
    if (n === 0) return total;
  }
}
