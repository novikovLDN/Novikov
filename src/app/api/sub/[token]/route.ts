import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { buildConnectionUri } from "@/lib/xray";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const subId = request.nextUrl.searchParams.get("id");

    if (!token) {
      return new NextResponse("Invalid subscription", { status: 400 });
    }

    // Look up user by sub_token (and optionally verify sub_id)
    const result = subId
      ? await pool.query(
          "SELECT * FROM users WHERE sub_token = $1 AND sub_id = $2",
          [token, subId]
        )
      : await pool.query(
          "SELECT * FROM users WHERE sub_token = $1",
          [token]
        );

    if (result.rows.length === 0) {
      return new NextResponse("Subscription not found", { status: 404 });
    }

    const user = result.rows[0];

    // Check subscription expiry
    const now = new Date();
    const end = new Date(user.subscription_end);
    if (now >= end) {
      return new NextResponse("Subscription expired", { status: 403 });
    }

    // Check user has an active Xray UUID
    if (!user.xray_uuid) {
      return new NextResponse("No active configuration", { status: 404 });
    }

    // Build connection URI(s)
    const vlessUri = buildConnectionUri(user.xray_uuid, user.email);

    // VPN clients expect plain text with one URI per line
    // base64-encode for compatibility with subscription format
    const body = Buffer.from(vlessUri).toString("base64");

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Content-Disposition": "inline",
        "Subscription-Userinfo": buildUserinfo(user),
        "Profile-Title": "Atlas Secure",
        "Profile-Update-Interval": "12",
      },
    });
  } catch (error) {
    console.error("[SUB] Error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

/** Build Subscription-Userinfo header (traffic stats placeholder) */
function buildUserinfo(user: { subscription_end: string }): string {
  const end = new Date(user.subscription_end);
  const expireTimestamp = Math.floor(end.getTime() / 1000);
  // upload/download/total are placeholders — replace with real stats if available
  return `upload=0; download=0; total=0; expire=${expireTimestamp}`;
}
