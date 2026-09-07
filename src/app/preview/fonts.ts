import { Literata, Manrope, Oswald, JetBrains_Mono } from "next/font/google";

/**
 * Гарнитуры превью-направлений.
 *
 * Объявлены в маршруте превью, а не в корневом layout: иначе два
 * лишних семейства ехали бы на каждую страницу сайта ради страницы
 * сравнения. Оба вариативные и оба с настоящей кириллицей —
 * подтверждено в TRENDS-2.md §2.
 */
export const serif = Literata({
  subsets: ["cyrillic", "latin"],
  display: "swap",
  variable: "--pv-serif",
});

export const sans = Manrope({
  subsets: ["cyrillic", "latin"],
  display: "swap",
  variable: "--pv-sans",
});

/** Сжатый гротеск под трафаретный набор: у DedSec заголовок — это
 *  надпись на стене, а не типографика в макете. Вариативный, с
 *  кириллицей. */
export const stencil = Oswald({
  subsets: ["cyrillic", "latin"],
  display: "swap",
  variable: "--pv-stencil",
});

/** Терминальный слой: ASCII, дизеринг, показания. Кириллица есть. */
export const mono = JetBrains_Mono({
  subsets: ["cyrillic", "latin"],
  display: "swap",
  variable: "--pv-mono",
});
