"use client";

import SectionHeading from "./SectionHeading";
import { AnimatedNumber } from "./motion";

/**
 * Блок 6 — локации.
 *
 * Было: четыре карточки, в каждой таблица из трёх метрик кеглем
 * 10–11px. Двенадцать мелких значений создавали шум и не читались на
 * телефоне.
 *
 * Стало: непрерывный список с волосяными разделителями плюс одна
 * сводная метрическая полоса под ним. Данные те же, но воздуха больше,
 * а кегль поднят до читаемого (принцип 3).
 *
 * ВНИМАНИЕ (осталось от прошлой версии и по-прежнему верно):
 * количество серверов, полоса и задержки — консервативные оценки на
 * момент написания. Их нужно заменить фактическими значениями, как
 * только эксплуатация подтвердит окончательный список.
 *
 * Флагов-эмодзи здесь нет намеренно: они по-разному рисуются в разных
 * ОС и читаются как украшение. Двухбуквенная монограмма + полное
 * название страны однозначны на любом устройстве.
 */
interface Location {
  code: string;
  country: string;
  city: string;
  servers: number;
  bandwidth: string;
  latency: string;
}

const LOCATIONS: Location[] = [
  { code: "DE", country: "Германия", city: "Frankfurt", servers: 12, bandwidth: "200 Гбит/с", latency: "24 мс" },
  { code: "NL", country: "Нидерланды", city: "Amsterdam", servers: 8, bandwidth: "100 Гбит/с", latency: "32 мс" },
  { code: "AT", country: "Австрия", city: "Vienna", servers: 6, bandwidth: "100 Гбит/с", latency: "38 мс" },
  { code: "US", country: "США", city: "New York", servers: 4, bandwidth: "100 Гбит/с", latency: "120 мс" },
];

const TOTAL_SERVERS = LOCATIONS.reduce((sum, l) => sum + l.servers, 0);

/** Числовые сводки отсчитываются, текстовые выводятся как есть. */
const SUMMARY: Array<{ value: number | string; label: string; suffix?: string }> = [
  { value: LOCATIONS.length, label: "локации" },
  { value: TOTAL_SERVERS, label: "серверов" },
  { value: 200, suffix: " Гбит/с", label: "магистраль" },
  { value: "Tier 3–4", label: "дата-центры" },
];

export default function LocationsSection() {
  return (
    <section className="ls-section" aria-labelledby="locations-title">
      <div className="ls-shell">
        <SectionHeading
          eyebrow="Инфраструктура"
          title={["Серверы в четырёх странах,", "остальные — по запросу"]}
          titleId="locations-title"
          action={{ label: "Об инфраструктуре", href: "/infrastructure" }}
        />

        <p className="ls-lede ls-reveal -mt-6 mb-12 sm:mb-14">
          Партнёрские дата-центры уровня Tier-3 и Tier-4. Клиент сам выбирает
          ближайший маршрут, а нужную локацию можно закрепить вручную.
        </p>

        <ul className="ls-stagger">
          {LOCATIONS.map((l) => (
            <li key={l.city} className="ls-loc ls-reveal group">
              <span className="ls-loc-mono" aria-hidden>{l.code}</span>

              <div className="min-w-0">
                <h3 className="text-[20px] sm:text-[24px] font-bold leading-tight tracking-[-0.025em] truncate">
                  {l.city}
                </h3>
                <p className="ls-ink-4 mt-1 text-[13px]">{l.country}</p>
              </div>

              <dl className="ls-loc-figures">
                <Figure label="Серверов" value={<AnimatedNumber value={l.servers} />} />
                <Figure label="Магистраль" value={l.bandwidth} />
                <Figure label="Задержка" value={`${l.latency} из Москвы`} />
              </dl>
            </li>
          ))}
        </ul>

        <div className="ls-metrics ls-metrics-light ls-reveal mt-14 sm:mt-16">
          {SUMMARY.map((m) => (
            <div key={m.label} className="ls-metric">
              <div className="ls-metric-value">
                {typeof m.value === "number" ? (
                  <AnimatedNumber value={m.value} suffix={m.suffix} />
                ) : (
                  m.value
                )}
              </div>
              <div className="ls-metric-label">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Figure({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="ls-figure-label">{label}</dt>
      <dd className="ls-figure-value">{value}</dd>
    </div>
  );
}
