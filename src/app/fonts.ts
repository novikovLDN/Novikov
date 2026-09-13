import { Sofia_Sans } from "next/font/google";

/**
 * Sofia Sans — остаток прежней системы, только для двух служебных
 * элементов корневого layout: ссылки «К содержимому» (`.b-skip`) и
 * подписи кнопки «наверх» (`.b-top-label`). Вся остальная страница
 * набрана MTS Wide (`atlas-fonts.ts`).
 *
 * Почему не MTS Wide и здесь: подпись «НАВЕРХ» в MTS Wide занимает
 * 59px и не встаёт в кнопку 48px, в Sofia Sans — 45px.
 *
 * `preload: false` — шрифт не предзагружается и не стоит в очереди
 * первой отрисовки. Файл приезжает только тогда, когда один из двух
 * элементов действительно показан (правила — `globals.css`): до этого
 * им назначен системный шрифт, и браузер Sofia Sans не запрашивает.
 * Узкое начертание (Sofia Sans Condensed) из системы убрано вовсе —
 * им набирались страницы «Гратикула», которых больше нет.
 */
export const brand = Sofia_Sans({
  subsets: ["cyrillic", "latin"],
  display: "swap",
  variable: "--font-brand",
  preload: false,
});
