"use client";

import { AnimatedNumber } from "./motion";

/**
 * Полоса ключевых метрик.
 *
 * Числа — сам аргумент продукта, поэтому они отсчитываются при
 * появлении. Стартовая точка у каждого своя: показатель качества,
 * на секунду показывающий «0,00 % аптайм», был бы плохим микромоментом
 * на странице, которая продаёт надёжность. Задержка, наоборот, убывает
 * с большего значения — жест читается как «пинг падает».
 *
 * Числа сверены с кодом: платформы — src/app/devices/page.tsx,
 * локации — LocationsSection.
 */
const METRICS = [
  { value: 4, label: "страны", from: 0 },
  { value: 99.98, decimals: 2, suffix: " %", label: "аптайм", from: 99 },
  { value: 5, prefix: "< ", suffix: " мс", label: "задержка в регионе", from: 28 },
  { value: 5, label: "платформ", from: 0 },
];

export default function MetricsBand() {
  return (
    <section className="px-section" aria-labelledby="metrics-title">
      <div className="px-shell">
        <h2 id="metrics-title" className="sr-only">Ключевые показатели сети</h2>
        <div className="px-metrics px-stagger">
          {METRICS.map((m) => (
            <div key={m.label} className="px-metric px-reveal">
              <div className="px-metric-value px-num">
                <AnimatedNumber
                  value={m.value}
                  decimals={m.decimals}
                  prefix={m.prefix}
                  suffix={m.suffix}
                  from={m.from}
                />
              </div>
              <div className="px-metric-label">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
