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

/**
 * Листы атласа (docs/rebrand-2027/SCREEN_SCORE.md §0.1).
 *
 * Номер листа — постоянное свойство раздела, а не порядковый номер на
 * странице: «лист 11» — всегда выделенные серверы, где бы ссылка ни
 * стояла. Главная занимает листы 01–08 (её сцены), отдельные разделы —
 * с 10. Правовые страницы в атлас не входят: это не листы, а условия.
 */
export interface Sheet {
  no: string;
  title: string;
  href: string;
}

export const SITE_SHEETS: Sheet[] = [
  { no: "01", title: "Обложка", href: "/" },
  { no: "10", title: "Тарифы", href: "/pricing" },
  { no: "11", title: "Выделенные серверы", href: "/vds" },
  { no: "12", title: "Устройства", href: "/devices" },
  { no: "13", title: "Для бизнеса", href: "/business" },
  { no: "14", title: "Поддержка", href: "/support" },
  { no: "15", title: "Контакты", href: "/contact" },
  { no: "16", title: "Безопасность", href: "/security" },
  { no: "17", title: "Инфраструктура", href: "/infrastructure" },
  { no: "18", title: "О нас", href: "/about" },
];

export const LEGAL_LINKS: NavLink[] = [
  { label: "Условия", href: "/terms" },
  { label: "Приватность", href: "/privacy" },
];
