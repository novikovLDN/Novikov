"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * "Тарифы" — dark preview section on the landing.
 *
 * Two plans only (Basic + Plus), yearly-price-by-default with a
 * monthly toggle. Full 4-period grid + feature-comparison table
 * lives on /pricing — the card links go there.
 *
 * Prices mirror src/app/api/payments/create/route.ts::PLANS exactly.
 */

const PLANS = {
  basic: { monthly: 199, quarter: 499, half: 899, yearly: 1599 },
  plus:  { monthly: 349, quarter: 899, half: 1499, yearly: 2599 },
} as const;

function fmt(n: number): string {
  return n.toLocaleString("ru-RU");
}

export default function PricingPreviewSection() {
  const [yearly, setYearly] = useState(true);
  const basicPrice = yearly ? Math.round(PLANS.basic.yearly / 12) : PLANS.basic.monthly;
  const plusPrice = yearly ? Math.round(PLANS.plus.yearly / 12) : PLANS.plus.monthly;
  const basicSave = PLANS.basic.monthly * 12 - PLANS.basic.yearly;
  const plusSave = PLANS.plus.monthly * 12 - PLANS.plus.yearly;

  return (
    <section className="bg-black text-white px-5 sm:px-8 py-20 sm:py-28 lg:py-32">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-12 sm:mb-16">
          <div>
            <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-white/45 mb-4">
              Тарифы
            </div>
            <h2 className="font-mts-wide text-[36px] sm:text-[48px] lg:text-[64px] leading-[1.02] tracking-tight font-bold max-w-[14ch]">
              Простые тарифы —<br />без сюрпризов
            </h2>
          </div>

          {/* Yearly / monthly toggle */}
          <div className="inline-flex items-center gap-1 p-1 rounded-full border border-white/12 bg-white/[0.03] font-mts-wide text-[13px] self-start">
            <button
              onClick={() => setYearly(true)}
              className={`px-4 py-2 rounded-full transition-colors ${yearly ? "bg-white text-black" : "text-white/70 hover:text-white"}`}
            >
              На год
              <span className="ml-1.5 text-[11px] opacity-70">−17%</span>
            </button>
            <button
              onClick={() => setYearly(false)}
              className={`px-4 py-2 rounded-full transition-colors ${!yearly ? "bg-white text-black" : "text-white/70 hover:text-white"}`}
            >
              На месяц
            </button>
          </div>
        </div>

        {/* Two plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          <PlanCard
            name="Basic"
            price={basicPrice}
            yearlyTotal={yearly ? PLANS.basic.yearly : null}
            save={yearly ? basicSave : null}
            features={[
              "3 устройства одновременно",
              "3 локации серверов",
              "Стабильное соединение 24/7",
              "Автопереподключение при обрыве",
              "Приоритет обычный",
            ]}
            cta="Выбрать Basic"
            href="/auth?plan=basic"
            highlighted={false}
          />
          <PlanCard
            name="Plus"
            price={plusPrice}
            yearlyTotal={yearly ? PLANS.plus.yearly : null}
            save={yearly ? plusSave : null}
            features={[
              "10 устройств одновременно",
              "Все локации серверов",
              "Гарантированный SLA 99,98%",
              "Приоритетная поддержка от человека",
              "Персональный статический адрес",
              "Отдельная маршрутизация под игры и стриминг",
            ]}
            cta="Выбрать Plus"
            href="/auth?plan=plus"
            highlighted={true}
          />
        </div>

        {/* Fine print */}
        <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 font-mts-wide text-[13px] text-white/45">
          <span>Все цены в рублях, НДС включён.</span>
          <span className="hidden sm:inline">·</span>
          <span>Без скрытых платежей.</span>
          <span className="hidden sm:inline">·</span>
          <span>Отмена в один клик из личного кабинета.</span>
          <Link href="/pricing" className="ml-auto text-white/80 hover:text-white transition-colors inline-flex items-center gap-1">
            Сравнение и опции по месяцам
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

function PlanCard({
  name, price, yearlyTotal, save, features, cta, href, highlighted,
}: {
  name: string;
  price: number;
  yearlyTotal: number | null;
  save: number | null;
  features: string[];
  cta: string;
  href: string;
  highlighted: boolean;
}) {
  return (
    <div
      className={`relative rounded-3xl p-6 sm:p-8 lg:p-10 flex flex-col ${
        highlighted
          ? "bg-[#F97316] text-black"
          : "bg-white/[0.03] text-white border border-white/10"
      }`}
    >
      {highlighted && (
        <div className="absolute top-5 right-5 font-mts-wide text-[11px] font-bold uppercase tracking-[0.14em] text-black/70">
          популярный
        </div>
      )}

      <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase mb-6" style={{ color: highlighted ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.45)" }}>
        {name}
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span className="font-mts-wide text-[52px] sm:text-[64px] font-bold leading-none tabular-nums tracking-tight">
          {fmt(price)}
        </span>
        <span className="font-mts-wide text-[18px] font-medium" style={{ color: highlighted ? "rgba(0,0,0,0.65)" : "rgba(255,255,255,0.5)" }}>
          ₽/мес
        </span>
      </div>

      {yearlyTotal !== null ? (
        <div className="font-mts-wide text-[13px]" style={{ color: highlighted ? "rgba(0,0,0,0.65)" : "rgba(255,255,255,0.5)" }}>
          {fmt(yearlyTotal)} ₽ разово за год
          {save !== null && save > 0 && (
            <span className="ml-2 opacity-70">· экономия {fmt(save)} ₽</span>
          )}
        </div>
      ) : (
        <div className="font-mts-wide text-[13px]" style={{ color: highlighted ? "rgba(0,0,0,0.65)" : "rgba(255,255,255,0.5)" }}>
          Каждый месяц, отмена в один клик
        </div>
      )}

      <div className={`my-6 sm:my-8 h-px ${highlighted ? "bg-black/15" : "bg-white/10"}`} />

      <ul className="space-y-3 mb-8">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-3 font-mts-wide text-[14px] sm:text-[15px] leading-[1.4]" style={{ color: highlighted ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.85)" }}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-0.5 shrink-0"
              style={{ color: highlighted ? "rgba(0,0,0,0.75)" : "rgba(255,255,255,0.65)" }}
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {f}
          </li>
        ))}
      </ul>

      <Link
        href={href}
        className={`mt-auto font-mts-wide inline-flex items-center justify-center gap-2 h-12 rounded-2xl font-semibold text-[15px] transition-all active:scale-[0.98] ${
          highlighted
            ? "bg-black text-white hover:bg-neutral-800"
            : "bg-white text-black hover:bg-neutral-100"
        }`}
      >
        {cta}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}
