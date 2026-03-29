import type { Metadata, Viewport } from "next";
import "./globals.css";
import CookieConsent from "@/components/CookieConsent";
import CustomCursor from "@/components/CustomCursor";
import PwaManager from "@/components/PwaManager";
import IosInstallBanner from "@/components/IosInstallBanner";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://atlassecure.uk"),
  title: "Atlas Secure — Платформа безопасного доступа в интернет",
  description:
    "Atlas Secure — сервис защиты интернет-соединения корпоративного класса. Enterprise Spectrum Protection, выделенные серверы до 75 Гбит/с, шифрование военного класса. Непрерывная работа 24/7 с 99.9% аптаймом.",
  keywords: ["Atlas Secure", "безопасный интернет", "защита соединения", "приватность", "VPN", "Enterprise", "шифрование"],
  icons: {
    icon: [
      { url: "/icon", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/apple-icon",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Atlas Secure — Платформа безопасного доступа в интернет",
    description: "Enterprise Spectrum Protection. Выделенные серверы до 75 Гбит/с. Шифрование военного класса. 99.9% аптайм.",
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
        <PwaManager />
        <IosInstallBanner />
      </body>
    </html>
  );
}
