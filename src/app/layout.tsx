import type { Metadata, Viewport } from "next";
import "./globals.css";
import CookieConsent from "@/components/CookieConsent";
import CustomCursor from "@/components/CustomCursor";
import PwaManager from "@/components/PwaManager";
import IosInstallBanner from "@/components/IosInstallBanner";
import ThemeProvider from "@/components/ThemeProvider";
import ThemePickerModal from "@/components/ThemePickerModal";
import { I18nProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://atlassecure.uk"),
  title: "Atlas Secure — ускоритель интернета",
  description:
    "Atlas Secure — ускоритель интернета. Стабильное соединение и низкий пинг на любом устройстве. Магистральная маршрутизация до 200 Гбит/с, SLA 99,98%. Настройка за минуту, дальше работает автоматически.",
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
    // Описание расходилось и с позиционированием, и с числами на сайте
    // (75 Гбит/с против 200, 99.9 против 99,98) и состояло из
    // англоязычных штампов. Приведено к тому, что мы говорим на
    // публичных страницах.
    title: "Atlas Secure — ускоритель интернета",
    description:
      "Игры, созвоны и стриминг без фризов — сразу на всех устройствах. Магистраль до 200 Гбит/с, целевая доступность 99,98%. Подключение за минуту.",
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
    <html lang="ru" className="dark" suppressHydrationWarning>
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
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="light"){document.documentElement.classList.remove("dark");document.documentElement.classList.add("light")}}catch(e){}})()` }} />
        <I18nProvider>
          <ThemeProvider>
            <div className="relative min-h-dvh flex flex-col">
              {children}
            </div>
            <CookieConsent />
            <CustomCursor />
            <PwaManager />
            <IosInstallBanner />
            <ThemePickerModal />
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
