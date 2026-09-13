import { NextRequest, NextResponse } from "next/server";

const isProd = process.env.NODE_ENV === "production";

/**
 * Content Security Policy.
 *
 * script-src keeps 'unsafe-inline': the App Router streams its payload
 * through inline <script> tags, and the only alternative — a per-request
 * nonce — would force every page to render dynamically. 'unsafe-eval' is
 * needed only by the dev server (React Refresh / source maps); the
 * production build does not use eval, so it is dropped there.
 */
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self' https://api.yookassa.ru",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ") + ";";

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
  // The legacy XSS auditor is itself exploitable; modern guidance is to turn it off.
  response.headers.set("X-XSS-Protection", "0");
  // Permissions policy — disable unnecessary browser features
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()");
  // No cross-origin window may keep a handle on ours (tab-nabbing, XS-leaks).
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  // HTTPS only (production). Subdomains are not included on purpose: not
  // every *.qodev.dev host is known to serve HTTPS.
  if (isProd) response.headers.set("Strict-Transport-Security", "max-age=31536000");
  // Content Security Policy
  response.headers.set("Content-Security-Policy", CSP);

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
