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
 * Класс переменной стоит на <html> в корневом layout (13.09.2026):
 * гарнитурой набраны не только страницы `.a`, но и нижние карточки
 * (cookie, установка, быстрый вход), которые живут в layout вне `.a`.
 * Раньше они качали тот же файл второй раз — через сырой @font-face
 * "MTS Wide" в globals.css. Сам токен корпуса `--a-wide` по-прежнему
 * объявлен в `.a` (atlas.css) и читает `--font-atlas-wide` с корня.
 * Оба начертания предзагружаются: Bold — заголовок первого экрана,
 * Medium — основной текст.
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
