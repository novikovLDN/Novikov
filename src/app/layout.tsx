import type { Metadata, Viewport } from "next";
import "./globals.css";
import CookieConsent from "@/components/CookieConsent";
import CustomCursor from "@/components/CustomCursor";
import { SpotlightLayer } from "@/components/pixel/effects";
import PwaManager from "@/components/PwaManager";
import IosInstallBanner from "@/components/IosInstallBanner";
import { I18nProvider } from "@/lib/i18n";
import SiteJsonLd from "@/components/pixel/SiteJsonLd";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://atlassecure.uk"),
  // Заголовок по умолчанию для страниц, которые не объявили свой.
  // Шаблон добавляет имя компании к заголовку раздела — иначе в
  // выдаче все страницы сайта выглядят одинаково.
  title: {
    default: "Atlas Secure — ускоритель интернета и серверы",
    template: "%s — Atlas Secure",
  },
  description:
    "Atlas Secure — ускоритель интернета и серверная инфраструктура. Частным лицам: стабильное соединение и низкий пинг на любом устройстве, канал 25 Гбит/с на тарифе Basic и 75 Гбит/с на Plus. Компаниям: подключения для сотрудников, виртуальные и выделенные машины по договору.",
  keywords: [
    "Atlas Secure",
    "ускоритель интернета",
    "стабильный интернет",
    "низкий пинг",
    "интернет для игр",
    "стриминг без просадок",
    "серверы для бизнеса",
    "виртуальный сервер",
    "выделенный сервер",
    "подключение для сотрудников",
  ],
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
    title: "Atlas Secure — ускоритель интернета и серверы",
    description:
      "Игры, созвоны и стриминг без фризов — сразу на всех устройствах. Канал до 75 Гбит/с, целевая доступность 99,98%. Компаниям — подключения и машины по договору.",
    type: "website",
    locale: "ru_RU",
    siteName: "Atlas Secure",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Масштабирование пальцами не запрещаем. Запрет стоял ради того,
  // чтобы Safari не увеличивал страницу при фокусе на поле ввода, —
  // но это лечится кеглем поля в 16px (.px-input), а не отключением
  // зума. Отключённый зум — прямое нарушение WCAG 1.4.4 и провал
  // аудита meta-viewport в Lighthouse.
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
        {/* Фирменный шрифт лежит у нас же (/public/fonts) и объявлен
            через @font-face в globals.css. Предзагрузка нужна потому,
            что MTS Wide набран весь текст первого экрана: без неё
            браузер рисует страницу запасным шрифтом и переверстывает
            её, когда фирменный доезжает. На /infrastructure это давало
            сдвиг макета 0,23 — заголовок в 80px меняет высоту при
            подмене шрифта. */}
        <link
          rel="preload"
          href="/fonts/MTSWide-Medium.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/MTSWide-Bold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        {/* Структурированные данные всего сайта: организация, её
            принадлежность группе и сам сайт. Один источник на проект —
            иначе поиск получает несколько расходящихся карточек одной
            компании. */}
        <SiteJsonLd />
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
