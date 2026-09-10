/**
 * Числа прописью для заголовков.
 *
 * Заголовок «Девятнадцать стран» раньше стоял в разметке строкой и
 * разъехался бы с `locations.ts` при первой же новой стране. Число на
 * странице обязано приходить из кода, в том числе когда оно написано
 * словами.
 *
 * Женский род: считаем страны. Диапазон 1–99 — больше на сайте не
 * встречается; за его пределами возвращаются цифры, а не ошибка.
 */

const UNITS = ["", "одна", "две", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
const TEENS = [
  "десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать",
  "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать",
];
const TENS = ["", "", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто"];

export function wordsFeminine(n: number): string {
  if (!Number.isInteger(n) || n <= 0 || n >= 100) return String(n);
  if (n < 10) return UNITS[n];
  if (n < 20) return TEENS[n - 10];
  const t = Math.floor(n / 10);
  const u = n % 10;
  return u ? `${TENS[t]} ${UNITS[u]}` : TENS[t];
}

/** Форма слова после числа: 1 страна, 2 страны, 5 стран. */
export function plural(n: number, [one, few, many]: [string, string, string]): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
