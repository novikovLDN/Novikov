"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * "Тарифы" — light section, real Basic + Plus preview.
 *
 * Basic renders as a white card outlined against the off-white body;
 * Plus keeps the orange accent so it visibly draws the eye. Full 4-
 * period grid + comparison table lives on /pricing.
 *
 * Prices mirror src/app/api/payments/create/route.ts::PLANS exactly.
 * Feature copy mirrors the in-app subscribe flow (Дашборд →
 * Оформить подписку) — see screenshots the user shared.
 */

const PLANS = {
  basic: { monthly: 199, quarter: 499, half: 899, yearly: 1599 },
  plus:  { monthly: 349, quarter: 899, half: 1499, yearly: 2599 },
} as const;

function fmt(n: number): string { return n.toLocaleString("ru-RU"); }

export default function PricingPreviewSection() {
  const [yearly, setYearly] = useState(true);
  const basicPrice = yearly ? Math.round(PLANS.basic.yearly / 12) : PLANS.basic.monthly;
  const plusPrice  = yearly ? Math.round(PLANS.plus.yearly / 12)  : PLANS.plus.monthly;
  const basicSave  = PLANS.basic.monthly * 12 - PLANS.basic.yearly;
  const plusSave   = PLANS.plus.monthly  * 12 - PLANS.plus.yearly;

  return (
    <section className="bg-[#f5f5f0] text-[#111] px-5 sm:px-8 py-20 sm:py-28 lg:py-32">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-12 sm:mb-16">
          <div>
            <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-black/45 mb-4">
              Тарифы
            </div>
            <h2 className="font-mts-wide text-[36px] sm:text-[48px] lg:text-[64px] leading-[1.02] tracking-tight font-bold max-w-[14ch]">
              Простые тарифы —<br />без сюрпризов
            </h2>
          </div>

          <div className="inline-flex items-center gap-1 p-1 rounded-full border border-black/12 bg-white font-mts-wide text-[13px] self-start">
            <button
              onClick={() => setYearly(true)}
              className={`px-4 py-2 rounded-full transition-colors ${yearly ? "bg-black text-white" : "text-black/70 hover:text-black"}`}
            >
              На год
              <span className="ml-1.5 text-[11px] opacity-70">−17%</span>
            </button>
            <button
              onClick={() => setYearly(false)}
              className={`px-4 py-2 rounded-full transition-colors ${!yearly ? "bg-black text-white" : "text-black/70 hover:text-black"}`}
            >
              На месяц
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          <PlanCard
            name="Basic"
            tagline="Стабильное соединение для повседневного использования"
            price={basicPrice}
            yearlyTotal={yearly ? PLANS.basic.yearly : null}
            save={yearly ? basicSave : null}
            features={[
              "Стабильная скорость",
              "Надёжное шифрование",
              "Безлимит устройств",
              "Всегда доступен сайт",
            ]}
            cta="Выбрать Basic"
            href="/auth?plan=basic"
            highlighted={false}
          />
          <PlanCard
            name="Plus"
            tagline="Всегда на связи — даже когда другие сервисы не работают"
            price={plusPrice}
            yearlyTotal={yearly ? PLANS.plus.yearly : null}
            save={yearly ? plusSave : null}
            features={[
              "Приоритетная скорость для стримов и игр",
              "Всегда доступен",
              "Выделенные серверы в нескольких странах",
              "Резервные каналы — доступ работает всегда",
            ]}
            cta="Выбрать Plus"
            href="/auth?plan=plus"
            highlighted={true}
          />
        </div>

        <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 font-mts-wide text-[13px] text-black/50">
          <span>Все цены в рублях, НДС включён.</span>
          <span className="hidden sm:inline">·</span>
          <span>Без скрытых платежей.</span>
          <span className="hidden sm:inline">·</span>
          <span>Отмена в один клик из личного кабинета.</span>
          <Link href="/pricing" className="sm:ml-auto text-black hover:text-black/70 transition-colors inline-flex items-center gap-1">
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
  name, tagline, price, yearlyTotal, save, features, cta, href, highlighted,
}: {
  name: string;
  tagline: string;
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
          : "bg-white text-black border border-black/[0.06]"
      }`}
    >
      {highlighted && (
        <div className="absolute top-5 right-5 font-mts-wide text-[11px] font-bold uppercase tracking-[0.14em] text-black/70">
          популярный
        </div>
      )}

      <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase mb-2" style={{ color: highlighted ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.45)" }}>
        {name}
      </div>
      <p className="font-mts-wide text-[14px] leading-[1.4] mb-6" style={{ color: highlighted ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.6)" }}>
        {tagline}
      </p>

      <div className="flex items-baseline gap-2 mb-2">
        <span className="font-mts-wide text-[52px] sm:text-[64px] font-bold leading-none tabular-nums tracking-tight">
          {fmt(price)}
        </span>
        <span className="font-mts-wide text-[18px] font-medium" style={{ color: highlighted ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0.5)" }}>
          ₽/мес
        </span>
      </div>

      {yearlyTotal !== null ? (
        <div className="font-mts-wide text-[13px]" style={{ color: highlighted ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0.5)" }}>
          {fmt(yearlyTotal)} ₽ разово за год
          {save !== null && save > 0 && (
            <span className="ml-2 opacity-70">· экономия {fmt(save)} ₽</span>
          )}
        </div>
      ) : (
        <div className="font-mts-wide text-[13px]" style={{ color: highlighted ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0.5)" }}>
          Каждый месяц, отмена в один клик
        </div>
      )}

      <div className={`my-6 sm:my-8 h-px ${highlighted ? "bg-black/15" : "bg-black/[0.08]"}`} />

      <ul className="space-y-3 mb-8">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-3 font-mts-wide text-[14px] sm:text-[15px] leading-[1.4]" style={{ color: highlighted ? "rgba(0,0,0,0.85)" : "rgba(0,0,0,0.8)" }}>
            <svg
              width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
              className="mt-0.5 shrink-0"
              style={{ color: highlighted ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.55)" }}
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
            : "bg-black text-white hover:bg-neutral-800"
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
