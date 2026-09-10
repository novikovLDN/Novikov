import { Literata } from "next/font/google";
import localFont from "next/font/local";

/**
 * Гарнитуры «Атласа» (docs/rebrand-2027/CONCEPTS.md, «Шрифты — решение»).
 *
 * Отдельным модулем, а не в fonts.ts: next/font предзагружает шрифт
 * на тех маршрутах, которые его импортируют. Пока корпус переводится
 * постранично, Literata и MTS Wide едут только на переведённые
 * страницы, а не на весь сайт.
 *
 * Literata — вариативная антиква с оптическим размером (opsz 7–72,
 * wght 200–900), кириллица проверена. Дисплей — opsz 72 wght 300
 * строчными; курсив — места и подписи; табличные цифры — числа.
 *
 * MTS Wide Medium — лицензия владельца (CSTM Fonts). Только аппарат
 * атласа малым кеглем: номер листа, подписи легенды, меню на рамке.
 * Крупным Bold он узнаётся как фирменный шрифт оператора связи — и
 * тянет сайт обратно в стилистику категории.
 *
 * Переменные объявляются на обёртке страницы, поэтому токены гарнитур
 * живут в `.a`, а не на `:root`: значение, объявленное ниже по дереву,
 * корень не видит (урок CLAUDE.md, «Мост к чернильной системе»).
 */
export const atlasSerif = Literata({
  subsets: ["cyrillic", "latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font-atlas-serif",
});

/* Решение владельца 10.09.2026: «шрифт MTS Wide» — главная гарнитура
   корпуса, а не только аппарат атласа. Bold — заголовок первого
   экрана, Medium — заголовки листов, меню, кнопки, подписи. Длинный
   текст и формы остаются на Sofia Sans: широким гротеском абзац
   читается хуже. */
export const atlasWide = localFont({
  src: [
    { path: "../../public/fonts/MTSWide-Medium.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/MTSWide-Bold.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-atlas-wide",
  fallback: ["Arial", "sans-serif"],
});
