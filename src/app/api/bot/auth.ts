import { NextRequest, NextResponse } from "next/server";

const BOT_API_KEY = process.env.BOT_API_KEY || "";

export function verifyBotApiKey(request: NextRequest): boolean {
  if (!BOT_API_KEY) return false;
  const key = request.headers.get("X-Bot-Api-Key");
  return key === BOT_API_KEY;
}

export function unauthorizedResponse() {
  return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
}
