"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import ScrambleLabel from "./ScrambleLabel";
import { gsap, useGSAP, usePrefersReducedMotion } from "./motion";
import { useEnterGlitch } from "./useEnterGlitch";
import { typo } from "@/lib/typo";
import ScatterSkulls from "./ScatterSkulls";
import {
  PERIODS,
  PERIOD_LABEL,
  PLANS,
  PLAN_SPEED,
  discountPercent,
  formatRub,
  pricePerMonth,
  savings,
  type Period,
} from "@/lib/plans";
import { TRIAL_DAYS } from "@/lib/brand-facts";

/**
 * ЦЕНА — как объект, а не как таблица.
 *
 * Что было и почему переделано: здесь стояли две плиты тарифов с
 * переключателем срока — ровно то же самое, что на /pricing. Два
 * одинаковых блока цен на одном сайте не дают читателю ничего:
 * главная обязана назвать цену, а не заменить собой страницу цен.
 *
 * Стало: одно число во весь кадр. Срок переключается шкалой рядом, и
 * число перетекает между значениями — видно, как оно падает от месяца
 * к году. Это и есть аргумент за длинный период, и он показан, а не
 * рассказан. Сравнение тарифов живёт там, где ему место, — на
 * странице тарифов.
 *
 * Все суммы — src/lib/plans.ts, тот же файл читает касса.
 */
export default function PriceScene() {
  const [period, setPeriod] = useState<Period>(12);
  const numRef = useRef<HTMLSpanElement>(null);
  const glitchRef = useEnterGlitch<HTMLDivElement>();
  const shown = useRef(pricePerMonth("basic", 12));
  const reduced = usePrefersReducedMotion();

  const value = pricePerMonth("basic", period);
  const save = savings("basic", period);

  // Число не подменяется, а перетекает: разница между 199 и 133
  // читается как движение, а не как смена подписи.
  useGSAP(
    () => {
      const node = numRef.current;
      if (!node) return;
      if (reduced) {
        node.textContent = formatRub(value);
        shown.current = value;
        return;
      }
      const state = { n: shown.current };
      const t = gsap.to(state, {
        n: value,
        duration: 0.7,
        ease: "power3.out",
        onUpdate: () => { node.textContent = formatRub(Math.round(state.n)); },
        onComplete: () => { shown.current = value; },
      });
      return () => t.kill();
    },
    { dependencies: [value, reduced] },
  );

  return (
    <section className="b-section b-paper b-live b-price" aria-labelledby="price-title">
      <ScatterSkulls seed={23} count={4} />
      <div className="b-shell">
        <ScrambleLabel text="Цена" />

        <h2 id="price-title" className="b-sr">Сколько стоит</h2>

        <div ref={glitchRef} className="b-price-object">
          <p className="b-price-figure b-num" aria-hidden>
            {/* Значение продублировано в тексте ниже — диктору не нужно
                читать перетекающие цифры. */}
            <span ref={numRef}>{formatRub(value)}</span>
            <span className="b-price-unit">₽/мес</span>
          </p>

          <p className="b-sr">
            {formatRub(value)} рублей в месяц при оплате за {PERIOD_LABEL[period].accusative}
          </p>

          <div className="b-price-side">
            <div className="b-scale" role="group" aria-label="Срок оплаты">
              {PERIODS.map((p) => {
                const off = discountPercent("basic", p);
                return (
                  <button
                    key={p}
                    type="button"
                    className={`b-scale-btn${p === period ? " b-scale-on" : ""}`}
                    aria-pressed={p === period}
                    onClick={() => setPeriod(p)}
                  >
                    <span className="b-scale-label">{PERIOD_LABEL[p].short}</span>
                    <span className="b-scale-off">{off > 0 ? `−${off}%` : " "}</span>
                  </button>
                );
              })}
            </div>

            <p className="b-body b-price-note">
              {typo(
                save > 0
                  ? `Тариф Basic, ${formatRub(PLANS.basic[period])} ₽ за ${PERIOD_LABEL[period].accusative} — на ${formatRub(save)} ₽ меньше, чем платить помесячно.`
                  : `Тариф Basic, ${formatRub(PLANS.basic[period])} ₽ за ${PERIOD_LABEL[period].accusative}. Дальше — как удобно.`,
              )}
            </p>
            <p className="b-body b-price-note">
              {typo(
                `Есть Plus за ${formatRub(pricePerMonth("plus", period))} ₽: канал ${PLAN_SPEED.plus} вместо ${PLAN_SPEED.basic} Гбит/с. Больше разницы между ними нет.`,
              )}
            </p>

            <div className="b-price-actions">
              <Link href="/auth" className="b-btn b-btn-acid">
                {TRIAL_DAYS} дня бесплатно
              </Link>
              <Link href="/pricing" className="b-link b-price-alt">
                Сравнить тарифы
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
