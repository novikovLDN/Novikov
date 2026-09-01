/**
 * Тарифы — единственный источник правды.
 *
 * До этого цены были продублированы в трёх местах: обработчик оплаты,
 * секция тарифов на главной и страница /pricing. Любое расхождение
 * между ними означает, что посетитель видит на витрине одну сумму, а в
 * кассе другую — то есть худший из возможных багов на платящем экране.
 *
 * Значения ниже — рубли за весь период (не за месяц).
 */

export const PERIODS = [1, 3, 6, 12] as const;
export type Period = (typeof PERIODS)[number];
export type PlanId = "basic" | "plus";

export const PLANS: Record<PlanId, Record<Period, number>> = {
  basic: { 1: 199, 3: 499, 6: 899, 12: 1599 },
  plus: { 1: 349, 3: 899, 6: 1499, 12: 2599 },
};

export const PERIOD_LABEL: Record<Period, { full: string; short: string; accusative: string }> = {
  1: { full: "1 месяц", short: "1 мес", accusative: "месяц" },
  3: { full: "3 месяца", short: "3 мес", accusative: "три месяца" },
  6: { full: "6 месяцев", short: "6 мес", accusative: "полгода" },
  12: { full: "12 месяцев", short: "12 мес", accusative: "год" },
};

/** Цена за месяц при выбранном периоде — то, что видит покупатель крупно. */
export function pricePerMonth(plan: PlanId, period: Period): number {
  return Math.round(PLANS[plan][period] / period);
}

/** Экономия против помесячной оплаты за тот же срок. */
export function savings(plan: PlanId, period: Period): number {
  return PLANS[plan][1] * period - PLANS[plan][period];
}

/** Скидка в процентах — для подписи на переключателе периода. */
export function discountPercent(plan: PlanId, period: Period): number {
  const base = PLANS[plan][1] * period;
  if (base === 0) return 0;
  return Math.round((savings(plan, period) / base) * 100);
}

export function formatRub(n: number): string {
  return n.toLocaleString("ru-RU");
}

/**
 * Скорость канала на тарифе, Гбит/с — единственный источник этого
 * числа. Оно попадает и в первый экран, и в секцию «скорость канала»,
 * и в состав тарифа ниже: три места, которые обязаны говорить одно и
 * то же. Слово «магистраль» из публичного текста убрано — покупателю
 * оно ничего не сообщает.
 */
export const PLAN_SPEED: Record<PlanId, number> = {
  basic: 25,
  plus: 75,
};

/** Состав тарифов. Живёт рядом с ценами, чтобы витрина и касса не разъезжались. */
export const PLAN_CONTENT: Record<PlanId, { name: string; tagline: string; features: string[] }> = {
  basic: {
    name: "Basic",
    tagline: "Стабильное соединение для повседневного интернета",
    features: [
      "Канал 25 Гбит/с",
      "Надёжное шифрование",
      "Безлимит устройств",
      "Сайт доступен всегда",
    ],
  },
  plus: {
    name: "Plus",
    tagline: "Приоритетный канал для игр, стримов и созвонов",
    features: [
      "Канал 75 Гбит/с — приоритет для игр и стримов",
      "Выделенные серверы в нескольких странах",
      "Резервные каналы — доступ работает всегда",
      "Всё из Basic",
    ],
  },
};

/**
 * Проверка значений, пришедших из тела запроса.
 *
 * Обработчик оплаты индексирует тарифную таблицу тем, что прислал
 * клиент. Без явной проверки это индексация нетипизированным значением:
 * ошибка в имени тарифа тихо превращалась бы в `undefined`, а сумма
 * платежа — в NaN. Поэтому обе величины сужаются здесь, а не на месте.
 */
export function isPlanId(v: unknown): v is PlanId {
  return v === "basic" || v === "plus";
}

export function isPeriod(v: unknown): v is Period {
  return typeof v === "number" && (PERIODS as readonly number[]).includes(v);
}
