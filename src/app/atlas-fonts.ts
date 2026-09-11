import localFont from "next/font/local";

/**
 * Гарнитура «Атласа» — MTS Wide (лицензия владельца, CSTM Fonts).
 *
 * Решение владельца 10.09.2026: «шрифт меняй на MTS» — одна гарнитура
 * на весь корпус. Literata и Sofia Sans с переведённых страниц ушли;
 * заодно шрифты похудели с ~640 КБ (вариативная Literata с курсивом и
 * осью оптического размера) до двух файлов по 31 КБ.
 *
 * Bold — заголовок первого экрана; Medium — всё остальное. Курсива у
 * гарнитуры нет, синтетический наклон запрещён (`font-synthesis:
 * none` в atlas.css): выделение делается цветом и начертанием.
 *
 * Отдельным модулем, а не в fonts.ts: next/font предзагружает шрифт
 * на тех маршрутах, которые его импортируют. Переменная объявлена на
 * обёртке страницы, поэтому токен гарнитуры живёт в `.a`, а не на
 * `:root` (урок CLAUDE.md, «Мост к чернильной системе»).
 */
export const atlasWide = localFont({
  src: [
    { path: "../../public/fonts/MTSWide-Medium.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/MTSWide-Bold.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-atlas-wide",
  fallback: ["Arial", "sans-serif"],
});
