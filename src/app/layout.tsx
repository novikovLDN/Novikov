import type { Metadata, Viewport } from "next";
import "./globals.css";
import CookieConsent from "@/components/CookieConsent";
import CustomCursor from "@/components/CustomCursor";
import { SpotlightLayer } from "@/components/pixel/effects";
import PwaManager from "@/components/PwaManager";
import IosInstallBanner from "@/components/IosInstallBanner";
import { I18nProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://atlassecure.uk"),
  title: "Atlas Secure — ускоритель интернета",
  description:
    "Atlas Secure — ускоритель интернета. Стабильное соединение и низкий пинг на любом устройстве. Канал 25 Гбит/с на тарифе Basic и 75 Гбит/с на Plus, целевая доступность 99,98%. Настройка за минуту, дальше работает автоматически.",
  keywords: ["Atlas Secure", "ускоритель интернета", "стабильный интернет", "низкий пинг", "быстрый интернет", "интернет для игр", "стриминг без просадок"],
  icons: {
    icon: [
      { url: "/icon", type: "image/png", sizes: "32x32" },
      { url: "/icon-192", type: "image/png", sizes: "192x192" },
      { url: "/icon-512", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-icon",
    shortcut: "/icon",
  },
  manifest: "/manifest.json",
  openGraph: {
    // Описание обязано повторять числа страниц, а не жить своей
    // жизнью: скорость канала — 25 Гбит/с на Basic и 75 на Plus
    // (src/lib/plans.ts, PLAN_SPEED), доступность — 99,98%.
    title: "Atlas Secure — ускоритель интернета",
    description:
      "Игры, созвоны и стриминг без фризов — сразу на всех устройствах. Канал до 75 Гбит/с, целевая доступность 99,98%. Подключение за минуту.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  // Цвет системной панели браузера. Тёмное значение осталось от
  // прежнего корпуса: на светлом сайте оно давало чёрную полосу над
  // белой страницей.
  themeColor: "#F6F5F2",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Readex Pro и Share Tech Mono удалены: единственные правила,
            которые их использовали (.hero-title / .hero-readex и
            --pl-mono), были мёртвыми. Это два render-blocking запроса
            за шрифтами, которые не рисовали ни одного пиксела.
            Inter остаётся — это фолбэк основного текста (--font-sans).
            Фирменный MTS Wide грузится локально из /public/fonts. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <I18nProvider>
          <div className="relative min-h-dvh flex flex-col">
            {children}
          </div>
          <CookieConsent />
          <CustomCursor />
          {/* Подсветка за курсором для всех карточек с .px-spot —
              один слушатель на документ вместо ref в каждой. */}
          <SpotlightLayer />
          <PwaManager />
          <IosInstallBanner />
        </I18nProvider>
      </body>
    </html>
  );
}
