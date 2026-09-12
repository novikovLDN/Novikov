import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  void request;
  // Security headers for every route. (The legacy Xray /api/sub/* CORS
  // branch is gone together with the route — subscriptions are served
  // by the Remnawave panel on its own domain.)
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
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
