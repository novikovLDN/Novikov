"use client";

import Link from "next/link";
import Icon from "./Icon";
import { AnimatedNumber, Spotlight } from "./motion";
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
 * Раньше это были две независимые реализации с расходящимися ценами,
 * составом и вёрсткой. Теперь и данные (src/lib/plans.ts), и подача
 * живут в одном месте: витрина не может разойтись с кассой.
 *
 * Plus выделен тёмной поверхностью, а не оранжевой заливкой. Заливка во
 * всю карточку делала акцентом всю её площадь, из-за чего кнопка внутри
 * переставала быть акцентом (research/concept.md, принцип 4).
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
    <Spotlight
      as="article"
      className={`ls-reveal ${featured ? "ls-card-dark" : "ls-card"} p-6 sm:p-8 lg:p-10 flex flex-col h-full`}
    >
      <div className="flex items-center justify-between gap-4">
        <p className="ls-eyebrow">{content.name}</p>
        {featured && (
          <span className="ls-eyebrow px-2.5 py-1 rounded-full bg-white/10 border border-white/15">
            Популярный
          </span>
        )}
      </div>

      <p className="ls-body mt-3">{content.tagline}</p>

      <div className="mt-8 flex items-baseline gap-2">
        <span className="ls-num font-bold leading-none tracking-[-0.035em] text-[clamp(44px,7vw,60px)]">
          <AnimatedNumber value={perMonth} duration={620} />
        </span>
        <span className="ls-ink-3 text-[17px] font-medium">₽/мес</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {period === 1 ? (
          <span className="ls-ink-3 text-[13px]">Каждый месяц, отмена в один клик</span>
        ) : (
          <>
            <span className="ls-num ls-ink-3 text-[13px]">
              {formatRub(total)} ₽ разово за {PERIOD_LABEL[period].accusative}
            </span>
            {save > 0 && <span className="ls-save">Экономия {formatRub(save)} ₽</span>}
          </>
        )}
      </div>

      <ul className="mt-8 space-y-3.5 flex-1">
        {content.features.map((f) => (
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
        href={target}
        className={`as-btn as-btn-primary as-btn-block group mt-9 ${featured ? "as-btn-accent" : "as-btn-solid"}`}
      >
        Выбрать {content.name}
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
