"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "./Icon";
import SectionHeading from "./SectionHeading";
import { AnimatedNumber, Spotlight } from "./motion";

/**
 * Блок 5 — тарифы.
 *
 * Структурно это был сильнейший блок страницы: цена показана рано и
 * конкретно, как у Ramp и Wise. Правки касаются подачи:
 *
 *   1. Plus был залит оранжевым во всю карточку. Пятно акцента
 *      получалось таким большим, что главная кнопка внутри него
 *      переставала выделяться. Теперь Plus — тёмная фокальная
 *      поверхность, а оранжевый остался только на кнопке (принцип 4).
 *   2. Экономия при годовой оплате была тусклой строкой в конце. Стала
 *      отдельным чипом рядом с ценой — это главный аргумент периода.
 *   3. Переключатель периода стал сегментированным контролом с
 *      колонками равной ширины: подпись «−17%» больше не сдвигает
 *      соседний сегмент при переключении.
 *   4. Снятие возражений (отмена, НДС, скрытые платежи) поднято из
 *      подписи под секцией внутрь карточек — в момент решения.
 *
 * Цены — зеркало src/app/api/payments/create/route.ts::PLANS.
 * Расхождение здесь означает, что пользователь увидит на лендинге одну
 * сумму, а в кассе другую, поэтому значения продублированы явно, а не
 * вычисляются из «примерно таких же» чисел.
 */
const PLANS = {
  basic: { monthly: 199, yearly: 1599 },
  plus: { monthly: 349, yearly: 2599 },
} as const;

function fmt(n: number): string {
  return n.toLocaleString("ru-RU");
}

export default function PricingSection() {
  const [yearly, setYearly] = useState(true);

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
          <div
            className="ls-segment"
            role="group"
            aria-label="Период оплаты"
            style={{ ["--ls-seg" as string]: yearly ? 0 : 1 }}
          >
            <button
              type="button"
              className="ls-segment-btn"
              aria-pressed={yearly}
              onClick={() => setYearly(true)}
            >
              На год
              <span className="ls-num opacity-60">−17 %</span>
            </button>
            <button
              type="button"
              className="ls-segment-btn"
              aria-pressed={!yearly}
              onClick={() => setYearly(false)}
            >
              На месяц
            </button>
          </div>
        </div>

        <div className="ls-stagger grid md:grid-cols-2 gap-4 lg:gap-5">
          <PlanCard
            name="Basic"
            tagline="Стабильное соединение для повседневного интернета"
            monthly={PLANS.basic.monthly}
            yearlyTotal={PLANS.basic.yearly}
            yearly={yearly}
            features={[
              "Стабильная скорость",
              "Надёжное шифрование",
              "Безлимит устройств",
              "Сайт доступен всегда",
            ]}
            href="/auth?plan=basic"
            featured={false}
          />
          <PlanCard
            name="Plus"
            tagline="Приоритетный канал для игр, стримов и созвонов"
            monthly={PLANS.plus.monthly}
            yearlyTotal={PLANS.plus.yearly}
            yearly={yearly}
            features={[
              "Приоритетная скорость для игр и стримов",
              "Выделенные серверы в нескольких странах",
              "Резервные каналы — доступ работает всегда",
              "Всё из Basic",
            ]}
            href="/auth?plan=plus"
            featured
          />
        </div>
      </div>
    </section>
  );
}

interface PlanCardProps {
  name: string;
  tagline: string;
  monthly: number;
  yearlyTotal: number;
  yearly: boolean;
  features: string[];
  href: string;
  featured: boolean;
}

function PlanCard({
  name, tagline, monthly, yearlyTotal, yearly, features, href, featured,
}: PlanCardProps) {
  const perMonth = yearly ? Math.round(yearlyTotal / 12) : monthly;
  const save = monthly * 12 - yearlyTotal;

  return (
    <Spotlight
      as="article"
      className={`ls-reveal ${featured ? "ls-card-dark" : "ls-card"} p-6 sm:p-8 lg:p-10 flex flex-col h-full`}
    >
      <div className="flex items-center justify-between gap-4">
        <p className="ls-eyebrow">{name}</p>
        {featured && (
          <span className="ls-eyebrow px-2.5 py-1 rounded-full bg-white/10 border border-white/15">
            Популярный
          </span>
        )}
      </div>

      <p className="ls-body mt-3">{tagline}</p>

      <div className="mt-8 flex items-baseline gap-2">
        <span className="ls-num font-bold leading-none tracking-[-0.035em] text-[clamp(44px,7vw,60px)]">
          <AnimatedNumber value={perMonth} duration={620} />
        </span>
        <span className="ls-ink-3 text-[17px] font-medium">₽/мес</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {yearly ? (
          <>
            <span className="ls-num ls-ink-3 text-[13px]">{fmt(yearlyTotal)} ₽ разово за год</span>
            {save > 0 && <span className="ls-save">Экономия {fmt(save)} ₽</span>}
          </>
        ) : (
          <span className="ls-ink-3 text-[13px]">Каждый месяц, отмена в один клик</span>
        )}
      </div>

      <ul className="mt-8 space-y-3.5 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-3 text-[14px] sm:text-[15px] leading-[1.45]">
            <Icon
              name="check"
              size={16}
              className={`mt-1 shrink-0 ${featured ? "text-white/55" : "ls-ink-4"}`}
            />
            <span className={featured ? "text-white/85" : "ls-ink-2"}>{f}</span>
          </li>
        ))}
      </ul>

      <Link
        href={href}
        className={`as-btn as-btn-primary as-btn-block group mt-9 ${featured ? "as-btn-accent" : "as-btn-solid"}`}
      >
        Выбрать {name}
        <Icon
          name="arrow-right"
          size={16}
          className="transition-transform duration-200 ease-out group-hover:translate-x-0.5"
        />
      </Link>

      <p className={`mt-4 text-[12px] text-center ${featured ? "text-white/40" : "ls-ink-4"}`}>
        3 дня бесплатно · НДС включён · без скрытых платежей
      </p>
    </Spotlight>
  );
}
