import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { buildAllServerUris } from "@/lib/xray";

// Force this route to be dynamic (never cached at edge)
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Handle HEAD requests (some VPN clients send HEAD first to check availability)
export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  return handleSubscription(request, params);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  return handleSubscription(request, params);
}

async function handleSubscription(
  request: NextRequest,
  paramsPromise: Promise<{ token: string }>
) {
  try {
    const { token } = await paramsPromise;
    const subId = request.nextUrl.searchParams.get("id");

    if (!token) {
      return new NextResponse("Invalid subscription", {
        status: 200,
        headers: subHeaders(),
      });
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
      // Return empty valid response instead of error status
      // VPN clients handle empty config gracefully, but choke on 4xx
      return new NextResponse(Buffer.from("").toString("base64"), {
        status: 200,
        headers: subHeaders(),
      });
    }

    const user = result.rows[0];

    // Check subscription expiry
    const now = new Date();
    const end = new Date(user.subscription_end);
    if (now >= end) {
      return new NextResponse(Buffer.from("").toString("base64"), {
        status: 200,
        headers: {
          ...subHeaders(),
          "Subscription-Userinfo": `upload=0; download=0; total=0; expire=${Math.floor(end.getTime() / 1000)}`,
        },
      });
    }

    // Check user has an active Xray UUID
    if (!user.xray_uuid) {
      return new NextResponse(Buffer.from("").toString("base64"), {
        status: 200,
        headers: subHeaders(),
      });
    }

    // Build VLESS URIs for all servers
    const uris = buildAllServerUris(user.xray_uuid);

    // VPN clients expect base64-encoded text with one URI per line
    const body = Buffer.from(uris.join("\n")).toString("base64");

    return new NextResponse(body, {
      status: 200,
      headers: {
        ...subHeaders(),
        "Subscription-Userinfo": buildUserinfo(user),
        "Profile-Title": "base64:" + Buffer.from("Atlas Secure").toString("base64"),
        "Profile-Update-Interval": "12",
        "Support-Url": "https://t.me/Atlas_SupportSecurity",
      },
    });
  } catch (error) {
    console.error("[SUB] Error:", error);
    return new NextResponse("", {
      status: 200,
      headers: subHeaders(),
    });
  }
}

/** Common headers for all subscription responses */
function subHeaders(): Record<string, string> {
  return {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Content-Disposition": "inline",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "X-Robots-Tag": "noindex",
  };
}

/** Build Subscription-Userinfo header */
function buildUserinfo(user: { subscription_end: string }): string {
  const end = new Date(user.subscription_end);
  const expireTimestamp = Math.floor(end.getTime() / 1000);
  const totalBytes = 107374182400; // 100 GB placeholder
  return `upload=0; download=0; total=${totalBytes}; expire=${expireTimestamp}`;
}
