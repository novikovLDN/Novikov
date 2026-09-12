/**
 * Telegram link tokens are secrets: CSPRNG, 16 hex chars, and the
 * backfill fills them from Node in batches — never via SQL random().
 */

import { describe, it, expect } from "vitest";
import { backfillTelegramLinkTokens, generateTelegramLinkToken } from "../tokens";

describe("generateTelegramLinkToken", () => {
  it("is 16 lowercase hex chars and does not repeat", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 2000; i++) {
      const t = generateTelegramLinkToken();
      expect(t).toMatch(/^[0-9a-f]{16}$/);
      seen.add(t);
    }
    expect(seen.size).toBe(2000);
  });
});

describe("backfillTelegramLinkTokens", () => {
  it("fills every NULL token in batches, with Node-generated values in parameters only", async () => {
    const rows = new Map<string, string | null>();
    for (let i = 0; i < 2500; i++) rows.set(`u${i}`, i % 5 === 0 ? "keepme0000000000" : null);
    const sqls: string[] = [];

    const query = async (sql: string, params: unknown[] = []) => {
      sqls.push(sql);
      if (sql.startsWith("SELECT id FROM users WHERE telegram_link_token IS NULL")) {
        const limit = Number(params[0]);
        return { rows: [...rows].filter(([, t]) => t === null).slice(0, limit).map(([id]) => ({ id })) };
      }
      if (sql.includes("UPDATE users AS u SET telegram_link_token = v.tok")) {
        let n = 0;
        for (let i = 0; i < params.length; i += 2) {
          const id = String(params[i]);
          if (rows.get(id) === null) {
            rows.set(id, String(params[i + 1]));
            n += 1;
          }
        }
        return { rows: [], rowCount: n };
      }
      throw new Error(`unexpected SQL: ${sql}`);
    };

    const filled = await backfillTelegramLinkTokens(query, 1000);
    expect(filled).toBe(2000);
    expect([...rows.values()].every((t) => t !== null)).toBe(true);
    expect(rows.get("u0")).toBe("keepme0000000000"); // existing tokens untouched
    const updates = sqls.filter((s) => s.includes("UPDATE"));
    expect(updates).toHaveLength(2); // 2000 NULL rows / 1000 per batch
    expect(updates.every((s) => !/random\(|md5\(|gen_random/i.test(s))).toBe(true);
    const tokens = [...rows.values()].filter((t) => t !== "keepme0000000000");
    expect(new Set(tokens).size).toBe(tokens.length);
    expect(tokens.every((t) => /^[0-9a-f]{16}$/.test(t!))).toBe(true);
  });
});
