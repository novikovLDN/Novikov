import type { NextConfig } from "next";

/**
 * Домены, с которых разрешены server actions (вход по коду).
 *
 * Next сверяет заголовок Origin с x-forwarded-host / host и при
 * расхождении отклоняет действие («Invalid Server Actions request»,
 * код E80) — страница падает в «This page couldn't load». За прокси
 * Railway и на своих доменах эти заголовки расходятся, поэтому
 * перечисляем свои домены явно. Дополнительные — через
 * SERVER_ACTIONS_ALLOWED_ORIGINS (хосты через запятую).
 */
const hostOf = (url?: string) => {
  try {
    return url ? new URL(url).host : undefined;
  } catch {
    return undefined;
  }
};

const allowedOrigins = [
  "atlassecure.uk",
  "*.atlassecure.uk",
  "atlassecure.ru",
  "*.atlassecure.ru",
  "*.up.railway.app",
  hostOf(process.env.NEXT_PUBLIC_SITE_URL),
  hostOf(process.env.NEXT_PUBLIC_APP_URL),
  process.env.RAILWAY_PUBLIC_DOMAIN,
  ...(process.env.SERVER_ACTIONS_ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()),
].filter((s): s is string => !!s);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  experimental: {
    serverActions: { allowedOrigins },
  },
  async rewrites() {
    return [
      {
        source: "/favicon.ico",
        destination: "/icon",
      },
    ];
  },
};

export default nextConfig;
