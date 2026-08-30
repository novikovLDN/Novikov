"use client";

import Link from "next/link";
import Icon from "./Icon";
import { AnimatedNumber } from "./motion";
import {
  PERIOD_LABEL,
  PLANS,
  PLAN_CONTENT,
  formatRub,
  pricePerMonth,
  savings,
  type Period,
  type PlanId,
} from "@/lib/plans";

/**
 * Карточка тарифа — одна на главную и на /pricing.
 *
 * Данные приходят из src/lib/plans.ts, того же модуля, которым
 * пользуется обработчик оплаты: витрина не может разойтись с кассой.
 *
 * Выделение Plus сделано акцентной рамкой и акцентной кнопкой, а не
 * заливкой всей карточки. Заливка делала акцентом всю её площадь, и
 * кнопка внутри переставала быть акцентом.
 */
export default function PlanCard({
  plan,
  period,
  featured = false,
  href,
}: {
  plan: PlanId;
  period: Period;
  featured?: boolean;
  href?: string;
}) {
  const content = PLAN_CONTENT[plan];
  const perMonth = pricePerMonth(plan, period);
  const total = PLANS[plan][period];
  const save = savings(plan, period);
  const target = href ?? `/auth?plan=${plan}&period=${period}`;

  return (
    <article className={`px-card px-reveal p-6 sm:p-8 lg:p-10 flex flex-col h-full${featured ? " px-card-accent" : ""}`}>
      <div className="flex items-center justify-between gap-4">
        <p className="px-eyebrow">{content.name}</p>
        {featured && <span className="px-tag">Популярный</span>}
      </div>

      <p className="px-body mt-3">{content.tagline}</p>

      <div className="mt-8 flex items-baseline gap-2">
        <span className="px-num font-bold leading-none tracking-[-0.035em] text-[clamp(42px,6vw,58px)]">
          <AnimatedNumber value={perMonth} duration={620} />
        </span>
        <span className="px-text-3 text-[17px] font-medium">₽/мес</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {period === 1 ? (
          <span className="px-caption">Каждый месяц, отмена в один клик</span>
        ) : (
          <>
            <span className="px-caption px-num">
              {formatRub(total)} ₽ разово за {PERIOD_LABEL[period].accusative}
            </span>
            {save > 0 && <span className="px-save px-num">Экономия {formatRub(save)} ₽</span>}
          </>
        )}
      </div>

      <ul className="mt-8 space-y-3.5 flex-1">
        {content.features.map((f) => (
          <li key={f} className="flex items-start gap-3 text-[14px] sm:text-[15px] leading-[1.45] px-text-2">
            <Icon name="check" size={16} className={`mt-1 shrink-0 ${featured ? "px-accent" : "px-text-4"}`} />
            {f}
          </li>
        ))}
      </ul>

      <Link
        href={target}
        className={`px-btn px-btn-md px-btn-block group mt-9 ${featured ? "px-btn-primary" : "px-btn-secondary"}`}
      >
        Выбрать {content.name}
        <Icon
          name="arrow-right"
          size={16}
          className="transition-transform duration-200 ease-out group-hover:translate-x-0.5"
        />
      </Link>

      <p className="px-caption mt-4 text-center">
        3 дня бесплатно · НДС включён · без скрытых платежей
      </p>
    </article>
  );
}
