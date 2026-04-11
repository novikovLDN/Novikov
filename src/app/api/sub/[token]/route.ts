import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { buildAllServerUris, buildXrayJsonConfigs } from "@/lib/xray";

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
    const format = request.nextUrl.searchParams.get("format");

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
      return new NextResponse(format === "json" ? "[]" : Buffer.from("").toString("base64"), {
        status: 200,
        headers: subHeaders(format === "json"),
      });
    }

    const user = result.rows[0];

    // Check subscription expiry
    const now = new Date();
    const end = new Date(user.subscription_end);
    const expireTs = Math.floor(end.getTime() / 1000);

    if (now >= end) {
      return new NextResponse(format === "json" ? "[]" : Buffer.from("").toString("base64"), {
        status: 200,
        headers: {
          ...subHeaders(format === "json"),
          "subscription-userinfo": `upload=0; download=0; total=0; expire=${expireTs}`,
        },
      });
    }

    // Check user has an active Xray UUID
    if (!user.xray_uuid) {
      return new NextResponse(format === "json" ? "[]" : Buffer.from("").toString("base64"), {
        status: 200,
        headers: subHeaders(format === "json"),
      });
    }

    const commonHeaders = {
      "subscription-userinfo": `upload=0; download=0; total=0; expire=${expireTs}`,
      "profile-title": "Atlas Secure",
      "profile-update-interval": "3",
      "Support-Url": "https://t.me/Atlas_SupportSecurity",
    };

    // JSON format — full Xray configs with routing (for Happ)
    if (format === "json") {
      const configs = buildXrayJsonConfigs(user.xray_uuid);
      return new NextResponse(JSON.stringify(configs), {
        status: 200,
        headers: {
          ...subHeaders(true),
          ...commonHeaders,
        },
      });
    }

    // Plain text format — VLESS URIs (for V2RayTun and others)
    const uris = buildAllServerUris(user.xray_uuid);
    const body = Buffer.from(uris.join("\n")).toString("base64");

    return new NextResponse(body, {
      status: 200,
      headers: {
        ...subHeaders(false),
        ...commonHeaders,
        "profile-title": "base64:" + Buffer.from("Atlas Secure").toString("base64"),
        "profile-update-interval": "12",
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
function subHeaders(json = false): Record<string, string> {
  return {
    "Content-Type": json ? "application/json; charset=utf-8" : "text/plain; charset=utf-8",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Content-Disposition": "inline",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "X-Robots-Tag": "noindex",
  };
}
