import { Literata, Manrope } from "next/font/google";

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
