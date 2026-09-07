"use client";

import Link from "next/link";
import { useState } from "react";
import { PERIODS, PERIOD_LABEL, PLANS, PLAN_SPEED, discountPercent, formatRub, pricePerMonth, type Period, type PlanId } from "@/lib/plans";
import { TRIAL_DAYS } from "@/lib/brand-facts";

/**
 * ЦЕНА — как объект, а не как таблица.
 *
 * Сравнительной таблицы с галочками здесь нет намеренно: тарифов
 * два, и разница между ними одна — ширина канала. Таблица на две
 * колонки существует, чтобы выглядеть как таблица.
 *
 * Вместо неё — само число в дисплейном кегле и переключатель срока
 * рядом. Цифра меняется при переключении, и видно, как она падает:
 * это и есть аргумент за длинный период.
 *
 * Все суммы — src/lib/plans.ts, тот же файл читает касса. Писать
 * цену руками в разметке запрещено.
 */
const PLAN_META: Record<PlanId, { name: string; note: string }> = {
  basic: { name: "Basic", note: "Хватает для всего, кроме тяжёлых загрузок в четыре потока." },
  plus: { name: "Plus", note: "Втрое шире канал. Заметно на 4K и на больших файлах." },
};

export default function PriceScene() {
  const [period, setPeriod] = useState<Period>(12);

  return (
    <section className="b-section b-paper b-price" aria-labelledby="price-title">
      <div className="b-shell">
        <header className="b-price-head">
          <p className="b-label">Цена</p>
          <h2 id="price-title" className="b-lg">
            {formatRub(pricePerMonth("basic", 12))} ₽ <br />в месяц
          </h2>
          <p className="b-body">
            Столько стоит Basic, если платить за год. Помесячно —{" "}
            {formatRub(PLANS.basic[1])} ₽. {TRIAL_DAYS} дня до оплаты бесплатно, карта не нужна.
          </p>
        </header>

        <div className="b-period" role="group" aria-label="Срок оплаты">
          {PERIODS.map((p) => {
            const off = discountPercent("basic", p);
            return (
              <button
                key={p}
                type="button"
                className={`b-period-btn${p === period ? " b-period-on" : ""}`}
                aria-pressed={p === period}
                onClick={() => setPeriod(p)}
              >
                {PERIOD_LABEL[p].short}
                {off > 0 && <span className="b-period-off">−{off}%</span>}
              </button>
            );
          })}
        </div>

        <div className="b-price-grid">
          {(Object.keys(PLAN_META) as PlanId[]).map((id) => (
            <article key={id} className={`b-plan${id === "plus" ? " b-plan-hi" : ""}`}>
              <p className="b-label">{PLAN_META[id].name}</p>
              <p className="b-plan-value b-num">
                {formatRub(pricePerMonth(id, period))}
                <span className="b-plan-unit"> ₽/мес</span>
              </p>
              <p className="b-plan-total">
                {formatRub(PLANS[id][period])} ₽ за {PERIOD_LABEL[period].accusative}
              </p>
              <p className="b-plan-speed b-num">{PLAN_SPEED[id]} Гбит/с</p>
              <p className="b-body b-plan-note">{PLAN_META[id].note}</p>
              <Link href="/auth" className={`b-btn ${id === "plus" ? "b-btn-acid" : "b-btn-ghost"} b-plan-cta`}>
                Начать
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
