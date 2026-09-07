"use client";

import VelocityMarquee from "./VelocityMarquee";
import { DEVICE_LIMIT, PLANS, PLAN_SPEED, formatRub } from "@/lib/plans";
import { CITY_COUNT, COUNTRY_COUNT, plural } from "@/lib/locations";
import { TRIAL_DAYS } from "@/lib/brand-facts";

/**
 * Шов между сценами: лента проверяемых чисел.
 *
 * Каждое значение приходит из кода — тарифы, локации, срок пробного
 * доступа. Лента существует не ради движения: это единственное место
 * страницы, где все обещания продукта стоят рядом и коротко, и
 * читатель может пробежать их глазами, не листая четыре секции.
 */
const FACTS = [
  `${COUNTRY_COUNT} ${plural(COUNTRY_COUNT, ["страна", "страны", "стран"])}`,
  `${CITY_COUNT} ${plural(CITY_COUNT, ["город", "города", "городов"])}`,
  `${DEVICE_LIMIT} устройств на подписке`,
  `${PLAN_SPEED.plus} Гбит/с`,
  "логов нет",
  `${TRIAL_DAYS} дня бесплатно`,
  `от ${formatRub(PLANS.basic[1])} ₽ в месяц`,
  "отмена в один клик",
];

export default function FactsBand() {
  return (
    <section className="b-band" aria-label="Что входит">
      <VelocityMarquee items={FACTS} />
    </section>
  );
}
