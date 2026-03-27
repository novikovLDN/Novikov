import type { Metadata, Viewport } from "next";
import "./globals.css";
import CookieConsent from "@/components/CookieConsent";
import CustomCursor from "@/components/CustomCursor";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://atlassecure.uk"),
  title: "Atlas Secure — Безопасный доступ в интернет",
  description:
    "Быстрый и надежный сервис защиты интернет-соединения. Безлимитный трафик, все устройства, простое подключение за 1 минуту. Тестовый период 24 часа бесплатно.",
  keywords: ["Atlas Secure", "безопасный интернет", "защита соединения", "приватность"],
  manifest: "/manifest.json",
  openGraph: {
    title: "Atlas Secure — Безопасный доступ в интернет",
    description: "Быстрый и надежный сервис. 24 часа бесплатно.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <div className="relative min-h-dvh flex flex-col">
          {children}
        </div>
        <CookieConsent />
        <CustomCursor />
      </body>
    </html>
  );
}
