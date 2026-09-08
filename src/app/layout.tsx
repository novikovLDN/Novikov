import type { Metadata, Viewport } from "next";
import { display, text, mono } from "./fonts";
import "./globals.css";
import "./brand.css";
import CookieConsent from "@/components/CookieConsent";
import PwaManager from "@/components/PwaManager";
import IosInstallBanner from "@/components/IosInstallBanner";
import { I18nProvider } from "@/lib/i18n";
import SiteJsonLd from "@/components/pixel/SiteJsonLd";
import { Cursor } from "@/components/brand/Cursor";
import PageTransition from "@/components/brand/PageTransition";
import BackToTop from "@/components/brand/BackToTop";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://atlassecure.uk"),
  // Заголовок по умолчанию для страниц, которые не объявили свой.
  // Шаблон добавляет имя компании к заголовку раздела — иначе в
  // выдаче все страницы сайта выглядят одинаково.
  // Ребрендинг 2027: продукт называется тем, чем является. Прежний
  // заголовок («ускоритель интернета») был эвфемизмом — он заставлял
  // читателя думать, что это другой продукт.
  title: {
    default: "Atlas — ускоритель интернета и выделенные серверы",
    template: "%s — Atlas",
  },
  description:
    "Atlas — ускоритель интернета: VPS для телефона и компьютера и выделенные серверы. Шифрует трафик, меняет страну и открывает то, что перестало открываться. 19 стран, 14 устройств на подписке, 199 ₽ в месяц. Три дня бесплатно, без карты.",
  // Аббревиатура на витрине — VPS. Решение владельца от 8 сентября
  // 2026: тексты остаются написанными про то же самое, меняется
  // только слово. Риск зафиксирован в docs/QUESTIONS.md №3: VPS —
  // общепринятое имя виртуального сервера, а выделенные серверы мы
  // тут же и продаём.
  keywords: [
    "Atlas VPS",
    "VPS",
    "VPS для телефона",
    "быстрый VPS",
    "VPS без логов",
    "VPS 19 стран",
    "VPS подписка",
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
    title: "Atlas — ускоритель интернета и выделенные серверы",
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

/**
 * Предзагрузки MTS Wide в <head> больше нет — как и самого <head>.
 *
 * После ребрендинга 2027 первый экран набран Oswald, а внутри
 * `.px-page`, `.dashboard-v2` и `.auth-shell` brand.css подменяет
 * `--font-mts-wide` на `--display`: фирменной гарнитурой не набрана
 * ни одна страница. Два файла по 30 КБ при этом выкачивались на
 * каждом открытии экрана и соревновались за канал с теми шрифтами,
 * которыми страница действительно набрана (проверено: в
 * `document.fonts` MTS Wide не значится ни на одной странице).
 * `@font-face` остался на месте — если разметка где-то ещё попросит
 * MTS Wide, шрифт приедет по требованию.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={`${display.variable} ${text.variable} ${mono.variable}`} suppressHydrationWarning>
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
          {/* Зерно поверх всего сайта: у плоских заливок появляется
              материал. Слой не перехватывает указатель. */}
          <div className="b-grain" aria-hidden />
          <Cursor />
          {/* Возврат к первому экрану: страница высокая, а закреплённые
              сцены забирают по несколько экранов прокрутки каждая. */}
          <BackToTop />
          {/* Смена страницы как монтажная склейка. */}
          <PageTransition />
          <PwaManager />
          <IosInstallBanner />
        </I18nProvider>
      </body>
    </html>
  );
}
