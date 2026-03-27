import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const BOT_API_KEY = process.env.BOT_API_KEY || "";

export function verifyBotApiKey(request: NextRequest): boolean {
  if (!BOT_API_KEY) return false;
  const key = request.headers.get("X-Bot-Api-Key");
  if (!key) return false;

  // Timing-safe comparison to prevent character-by-character guessing
  try {
    const a = Buffer.from(key, "utf-8");
    const b = Buffer.from(BOT_API_KEY, "utf-8");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function unauthorizedResponse() {
  return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
}
