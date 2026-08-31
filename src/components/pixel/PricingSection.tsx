"use client";

import { useState } from "react";
import PeriodSelector from "./PeriodSelector";
import PlanCard from "./PlanCard";
import SectionHeading from "./SectionHeading";
import type { Period } from "@/lib/plans";

/**
 * Витрина тарифов на главной.
 *
 * Здесь только два периода — год и месяц: на главной посетитель ещё
 * выбирает продукт, а не срок, и четыре варианта на этом шаге лишь
 * замедляют решение. Полная сетка периодов и таблица сравнения живут
 * на /pricing.
 */
const HOME_PERIODS = [12, 1] as const satisfies readonly Period[];

export default function PricingSection() {
  const [period, setPeriod] = useState<Period>(12);

  return (
    <section className="px-section" aria-labelledby="pricing-title">
      <div className="px-shell">
        <SectionHeading
          eyebrow="Тарифы"
          title={["Простые тарифы —", "без сюрпризов"]}
          titleId="pricing-title"
          index="05"
          action={{ label: "Сравнение по месяцам", href: "/pricing" }}
        />

        <div className="px-reveal -mt-6 mb-10 sm:mb-12">
          <PeriodSelector periods={HOME_PERIODS} value={period} onChange={setPeriod} />
        </div>

        <div className="px-stagger grid md:grid-cols-2 gap-4">
          <PlanCard plan="basic" period={period} />
          <PlanCard plan="plus" period={period} featured />
        </div>
      </div>
    </section>
  );
}
