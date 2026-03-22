import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atlas Secure — Безопасный VPN",
  description:
    "Быстрый и надежный VPN-сервис. Безлимитный трафик, все устройства, простое подключение за 1 минуту.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}
