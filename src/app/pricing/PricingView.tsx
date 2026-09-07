"use client";

import Link from "next/link";
import { useState } from "react";
import BrandHeader from "@/components/brand/BrandHeader";
import BrandFooter from "@/components/brand/BrandFooter";
import BrandFaq, { type BrandFaqItem } from "@/components/brand/BrandFaq";
import KineticHeadline from "@/components/brand/KineticHeadline";
import OutroScene from "@/components/brand/OutroScene";
import { SmoothScroll } from "@/components/brand/motion";
import {
  DEVICE_LIMIT,
  PERIODS,
  PERIOD_LABEL,
  PLANS,
  PLAN_CONTENT,
  PLAN_SPEED,
  discountPercent,
  formatRub,
  pricePerMonth,
  savings,
  type Period,
  type PlanId,
} from "@/lib/plans";
import { COUNTRY_COUNT } from "@/lib/locations";
import { TRIAL_DAYS } from "@/lib/brand-facts";

/**
 * /pricing — тарифы на бренд-слое 2027.
 *
 * Страница чернильная целиком, без переворота в бумагу: переворот —
 * приём главной, и он там означает переход границы. Повторить его на
 * каждой странице значит превратить смысловой ход в оформление.
 *
 * Все суммы берутся из src/lib/plans.ts — того же файла, который
 * читает касса. Дублировать цену в разметке запрещено.
 *
 * ЗАГОЛОВОК. Три варианта, выбран первый:
 *   1. «Два тарифа» — говорит ровно то, что есть, и снимает главный
 *      страх страницы цен: что придётся разбираться.
 *   2. «Платите за скорость» — точнее по сути, но звучит как упрёк.
 *   3. «Честная цена» — слово «честная» в цене всегда читается как
 *      оправдание.
 */
const FAQ: BrandFaqItem[] = [
  {
    q: "Как быстро подключусь после оплаты?",
    a: "Сразу. Подписка активируется автоматически после подтверждения от платёжного оператора — ключ и QR-код появятся в личном кабинете, там же ссылка на приложение под ваше устройство.",
  },
  {
    q: "На каких устройствах работает?",
    a: `iPhone и iPad, Android, macOS, Windows и Android TV. Одна подписка работает на ${DEVICE_LIMIT} устройствах одновременно — их можно менять в любой момент.`,
  },
  {
    q: "Можно ли сменить тариф?",
    a: "Да, из личного кабинета. Новый тариф начинает действовать сразу, остаток по прежнему пересчитывается пропорционально.",
  },
  {
    q: "Как проходит оплата?",
    a: "Через авторизованного платёжного оператора. На оплату отводится 15 минут с момента создания платёжной сессии; после подтверждения подписка активируется автоматически.",
  },
  {
    q: "Можно ли вернуть деньги?",
    a: "Да. Возврат возможен в течение 14 дней с момента платежа, если оказание услуги прекращено по нашей вине — порядок описан в Условиях использования.",
  },
  {
    q: "Храните ли вы историю подключений?",
    a: "Нет. Ни посещённые сайты, ни DNS-запросы, ни история подключений не записываются и не хранятся. Хранить нечего — значит нечего и передать.",
  },
];

export default function PricingView() {
  const [period, setPeriod] = useState<Period>(12);

  return (
    <div className="b-root">
      <a href="#main" className="b-skip">К содержимому</a>
      <SmoothScroll />
      <div className="b-grid-lines" aria-hidden />
      <BrandHeader />

      <main id="main">
        {/* ─── Заголовок ────────────────────────────────────────── */}
        <section className="b-page-hero" aria-labelledby="pricing-title">
          <div className="b-shell">
            <p className="b-label">Тарифы</p>
            <KineticHeadline
              text="Два тарифа"
              as="h1"
              id="pricing-title"
              className="b-mega b-page-title"
              reveal="css"
            />
            <p className="b-lede b-page-lede">
              Разница между ними одна — ширина канала. Цены в рублях, НДС включён.
              Первые {TRIAL_DAYS} дня бесплатно, карта не нужна.
            </p>
          </div>
        </section>

        {/* ─── Срок и тарифы ───────────────────────────────────── */}
        <section className="b-section b-plans" aria-labelledby="plans-title">
          <div className="b-shell">
            <h2 id="plans-title" className="b-sr">Тарифные планы</h2>

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
              {(["basic", "plus"] as PlanId[]).map((id) => {
                const save = savings(id, period);
                return (
                  <article key={id} className={`b-plan${id === "plus" ? " b-plan-hi" : ""}`}>
                    <p className="b-label">{PLAN_CONTENT[id].name}</p>
                    <p className="b-plan-value b-num">
                      {formatRub(pricePerMonth(id, period))}
                      <span className="b-plan-unit"> ₽/мес</span>
                    </p>
                    <p className="b-plan-total">
                      {formatRub(PLANS[id][period])} ₽ за {PERIOD_LABEL[period].accusative}
                      {save > 0 && <> · экономия {formatRub(save)} ₽</>}
                    </p>
                    <p className="b-plan-speed b-num">{PLAN_SPEED[id]} Гбит/с</p>
                    <p className="b-body b-plan-note">{PLAN_CONTENT[id].tagline}</p>

                    <ul className="b-plan-list">
                      {PLAN_CONTENT[id].features.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>

                    <Link
                      href="/auth"
                      className={`b-btn ${id === "plus" ? "b-btn-acid" : "b-btn-ghost"} b-plan-cta`}
                    >
                      Начать бесплатно
                    </Link>
                  </article>
                );
              })}
            </div>

            <p className="b-plan-fine">
              На обоих тарифах: {COUNTRY_COUNT} стран на выбор, {DEVICE_LIMIT} устройств
              на подписке, история подключений не хранится. Отмена — в один клик из
              личного кабинета.
            </p>
          </div>
        </section>

        {/* ─── Вопросы ─────────────────────────────────────────── */}
        <section className="b-section b-faq-section" aria-labelledby="faq-title">
          <div className="b-shell">
            <p className="b-label">Вопросы</p>
            <h2 id="faq-title" className="b-lg b-faq-title">
              То, что спрашивают <br />до оплаты
            </h2>
            <BrandFaq items={FAQ} />
          </div>
        </section>
      </main>

      <OutroScene />
      <BrandFooter />
    </div>
  );
}
