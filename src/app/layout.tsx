import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atlas Secure — Безопасный VPN",
  description:
    "Быстрый и надежный VPN-сервис. Безлимитный трафик, все устройства, простое подключение за 1 минуту. Тестовый период 3 дня бесплатно.",
  keywords: ["VPN", "Atlas Secure", "безопасный VPN", "быстрый VPN", "VPN Россия"],
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Atlas Secure — Безопасный VPN",
    description: "Быстрый и надежный VPN. 3 дня бесплатно.",
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
      </body>
    </html>
  );
}
