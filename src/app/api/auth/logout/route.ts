import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, endSession, SESSION_COOKIE } from "@/lib/session";

/** Revokes the session on the server (not only the cookie) and clears the cookie. */
export async function POST(request: NextRequest) {
  await endSession(request.cookies.get(SESSION_COOKIE)?.value);
  const response = NextResponse.json({ success: true });
  clearSessionCookie(response);
  return response;
}
