import { NextRequest, NextResponse } from "next/server";

/**
 * Global middleware — ensures /api/sub/* routes are NEVER blocked.
 * Vercel Deployment Protection or similar services may intercept
 * non-browser requests (V2Ray, Hiddify, Streisand) and return 401.
 * This middleware explicitly allows those routes through.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Subscription endpoints must be publicly accessible for VPN clients
  if (pathname.startsWith("/api/sub/")) {
    const response = NextResponse.next();
    // Ensure no auth challenge is returned
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "*");

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  // Only match paths that need middleware intervention
  matcher: ["/api/sub/:path*"],
};
