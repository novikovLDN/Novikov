import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { buildAllServerUris } from "@/lib/xray";

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

    // Build VLESS URIs for all servers
    const uris = buildAllServerUris(user.xray_uuid);

    // VPN clients expect base64-encoded text with one URI per line
    // Use \n line endings — some clients choke on \r\n
    const body = Buffer.from(uris.join("\n")).toString("base64");

    const headers: Record<string, string> = {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Content-Disposition": "inline",
      "Subscription-Userinfo": buildUserinfo(user),
      "Profile-Title": "base64:" + Buffer.from("Atlas Secure").toString("base64"),
      "Profile-Update-Interval": "12",
    };

    // Support-URL for clients that show a support link
    headers["Support-Url"] = "https://t.me/Atlas_SupportSecurity";

    return new NextResponse(body, { status: 200, headers });
  } catch (error) {
    console.error("[SUB] Error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

/** Build Subscription-Userinfo header (traffic stats placeholder) */
function buildUserinfo(user: { subscription_end: string }): string {
  const end = new Date(user.subscription_end);
  const expireTimestamp = Math.floor(end.getTime() / 1000);
  // total must be non-zero — V2Ray/Hiddify treat total=0 as "no quota" (blocked/401)
  const totalBytes = 107374182400; // 100 GB placeholder
  return `upload=0; download=0; total=${totalBytes}; expire=${expireTimestamp}`;
}
