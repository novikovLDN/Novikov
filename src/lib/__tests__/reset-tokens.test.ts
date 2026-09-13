import { describe, it, expect } from "vitest";
import { issueResetToken, consumeResetToken } from "../reset-tokens";

describe("reset tokens", () => {
  it("один раз и только для своей почты", () => {
    const t = issueResetToken("a@example.com");
    expect(consumeResetToken(t, "b@example.com")).toBe(false);
    // Попытка с чужой почтой сжигает токен — повторить нельзя.
    expect(consumeResetToken(t, "a@example.com")).toBe(false);

    const t2 = issueResetToken("a@example.com");
    expect(consumeResetToken(t2, "a@example.com")).toBe(true);
    expect(consumeResetToken(t2, "a@example.com")).toBe(false);
  });

  it("истекает через 10 минут", () => {
    const now = Date.now();
    const t = issueResetToken("c@example.com", now);
    expect(consumeResetToken(t, "c@example.com", now + 10 * 60 * 1000 + 1)).toBe(false);
  });

  it("новый токен гасит прежний той же почты", () => {
    const t1 = issueResetToken("d@example.com");
    const t2 = issueResetToken("d@example.com");
    expect(consumeResetToken(t1, "d@example.com")).toBe(false);
    expect(consumeResetToken(t2, "d@example.com")).toBe(true);
  });

  it("мусор и придуманные значения не проходят", () => {
    expect(consumeResetToken("123456", "e@example.com")).toBe(false);
    expect(consumeResetToken("", "e@example.com")).toBe(false);
    expect(consumeResetToken("x".repeat(43), "e@example.com")).toBe(false);
  });

  it("токены случайные и длинные", () => {
    const set = new Set(Array.from({ length: 500 }, (_, i) => issueResetToken(`u${i}@example.com`)));
    expect(set.size).toBe(500);
    for (const t of set) expect(t).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });
});
