import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Subscription endpoints — publicly accessible for VPN clients
  if (pathname.startsWith("/api/sub/")) {
    const response = NextResponse.next();
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "*");

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

  // All other routes — add security headers
  const response = NextResponse.next();

  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");
  // Prevent MIME-type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");
  // Referrer policy — don't leak full URL to third parties
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // Prevent XSS in older browsers
  response.headers.set("X-XSS-Protection", "1; mode=block");
  // Permissions policy — disable unnecessary browser features
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  // Content Security Policy
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' https://api.yookassa.ru; frame-ancestors 'none';"
  );

  return response;
}

export const config = {
  matcher: [
    "/api/sub/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
