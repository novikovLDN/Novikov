"use client";

import { useState } from "react";
import PeriodSelector from "./PeriodSelector";
import PlanCard from "./PlanCard";
import SectionHeading from "./SectionHeading";
import type { Period } from "@/lib/plans";

/**
 * Блок 5 главной — витрина тарифов.
 *
 * Структурно это был сильнейший блок страницы: цена показана рано и
 * конкретно, как у Ramp и Wise. Здесь оставлены только два периода —
 * год и месяц: на главной посетитель ещё выбирает продукт, а не срок,
 * и четыре варианта на этом шаге лишь замедляют решение. Полная сетка
 * из четырёх периодов и таблица сравнения живут на /pricing.
 *
 * Данные и подача карточек — общие с /pricing (src/lib/plans.ts,
 * PlanCard), поэтому витрина не может разойтись с кассой.
 */
const HOME_PERIODS = [12, 1] as const satisfies readonly Period[];

export default function PricingSection() {
  const [period, setPeriod] = useState<Period>(12);

  return (
    <section className="ls-section" aria-labelledby="pricing-title">
      <div className="ls-shell">
        <SectionHeading
          eyebrow="Тарифы"
          title={["Простые тарифы —", "без сюрпризов"]}
          titleId="pricing-title"
          action={{ label: "Сравнение по месяцам", href: "/pricing" }}
        />

        <div className="ls-reveal -mt-6 mb-10 sm:mb-12">
          <PeriodSelector periods={HOME_PERIODS} value={period} onChange={setPeriod} />
        </div>

        <div className="ls-stagger grid md:grid-cols-2 gap-4 lg:gap-5">
          <PlanCard plan="basic" period={period} />
          <PlanCard plan="plus" period={period} featured />
        </div>
      </div>
    </section>
  );
}
