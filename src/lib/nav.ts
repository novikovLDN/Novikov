/**
 * Структура сайта — единственный источник.
 *
 * ПОЧЕМУ ОТДЕЛЬНЫМ МОДУЛЕМ. Пока идёт перерисовка, шапка и футер живут
 * в двух видах: новые на переведённых страницах, прежние на ещё не
 * переведённых. Два набора ссылок в двух компонентах — это второй
 * источник правды о структуре сайта: раздел появляется в одном месте
 * и не появляется в другом, и обнаруживается это через месяц.
 *
 * Оформление может быть разным сколько угодно долго. Состав — нет.
 * Оба вида шапки и футера читают отсюда, и когда прежние удалятся,
 * файл останется на месте.
 */

export interface NavLink {
  label: string;
  href: string;
  /** Одна строка для выпадающего списка продуктов. */
  note?: string;
}

/** Продукты — то, что продаётся. Показываются в шапке с пояснением. */
export const PRODUCTS: NavLink[] = [
  {
    label: "Ускоритель",
    href: "/pricing",
    note: "Два тарифа, 19 стран, до 14 устройств на подписке",
  },
  {
    label: "Выделенные серверы",
    href: "/vds",
    note: "Четыре ступени по ширине канала, от $300 в месяц",
  },
];

/** Верхняя навигация, кроме продуктов и входа. */
export const HEADER_LINKS: NavLink[] = [
  { label: "Устройства", href: "/devices" },
  { label: "Для бизнеса", href: "/business" },
  { label: "Поддержка", href: "/support" },
];

export interface NavColumn {
  title: string;
  links: NavLink[];
}

export const FOOTER_COLUMNS: NavColumn[] = [
  {
    title: "Продукт",
    links: [
      { label: "Тарифы", href: "/pricing" },
      { label: "Выделенные серверы", href: "/vds" },
      { label: "Устройства", href: "/devices" },
    ],
  },
  {
    title: "Компания",
    links: [
      { label: "О нас", href: "/about" },
      { label: "Инфраструктура", href: "/infrastructure" },
      { label: "Безопасность", href: "/security" },
    ],
  },
  {
    title: "Помощь",
    links: [
      { label: "Поддержка", href: "/support" },
      { label: "Контакты", href: "/contact" },
      { label: "Для бизнеса", href: "/business" },
    ],
  },
  {
    title: "Правовое",
    links: [
      { label: "Условия", href: "/terms" },
      { label: "Приватность", href: "/privacy" },
    ],
  },
];

/** Год основания. Требует подтверждения — COMPLIANCE-CHECK.md. */
export const FOUNDED = 2016;
