import type { Metadata, Viewport } from "next";
import { display, text } from "./fonts";
import "./globals.css";
import "./brand.css";
import CookieConsent from "@/components/CookieConsent";
import PwaManager from "@/components/PwaManager";
import IosInstallBanner from "@/components/IosInstallBanner";
import { I18nProvider } from "@/lib/i18n";
import SiteJsonLd from "@/components/pixel/SiteJsonLd";
import { Cursor } from "@/components/brand/motion";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://atlassecure.uk"),
  // Заголовок по умолчанию для страниц, которые не объявили свой.
  // Шаблон добавляет имя компании к заголовку раздела — иначе в
  // выдаче все страницы сайта выглядят одинаково.
  // Ребрендинг 2027: продукт называется тем, чем является. Прежний
  // заголовок («ускоритель интернета») был эвфемизмом — он заставлял
  // читателя думать, что это другой продукт.
  title: {
    default: "Atlas — VPN, который не притворяется",
    template: "%s — Atlas",
  },
  description:
    "Atlas — VPN для телефона и компьютера. Шифрует трафик, меняет страну, открывает то, что перестало открываться. 19 стран, 14 устройств на подписке, 199 ₽ в месяц. Три дня бесплатно, без карты. Историю подключений не храним.",
  keywords: [
    "Atlas VPN",
    "VPN",
    "VPN для телефона",
    "быстрый VPN",
    "VPN без логов",
    "VPN 19 стран",
    "VPN подписка",
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
    // Описание повторяет числа страниц, а не живёт своей жизнью:
    // страны — src/lib/locations.ts, устройства и цена —
    // src/lib/plans.ts, срок пробного доступа — src/lib/brand-facts.ts.
    title: "Atlas — VPN, который не притворяется",
    description:
      "Шифрует трафик, меняет страну, открывает то, что перестало открываться. 19 стран, 14 устройств, 199 ₽ в месяц. Три дня бесплатно, без карты.",
    type: "website",
    locale: "ru_RU",
    siteName: "Atlas",
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
    <html lang="ru" className={`${display.variable} ${text.variable}`} suppressHydrationWarning>
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
          {/* Курсор бренда — точка, которая стирает границу. Прежние
              CustomCursor и SpotlightLayer убраны: первый давал на
              обновлённых страницах второй курсор поверх нового, второй
              подсвечивал карточки .px-spot, которых в новой системе
              нет. Оба грузились на каждой странице сайта. */}
          <Cursor />
          <PwaManager />
          <IosInstallBanner />
        </I18nProvider>
      </body>
    </html>
  );
}
