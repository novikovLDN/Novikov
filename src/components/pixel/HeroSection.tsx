"use client";

import Link from "next/link";
import CubeCluster from "./CubeCluster";
import Icon from "./Icon";
import { AnimatedNumber } from "./motion";

/**
 * Первый экран.
 *
 * Композиция: слева очень крупный заголовок, короткий подзаголовок и
 * блок действий — широкая акцентная панель сверху и две тёмные под ней
 * в ряд. Справа — живой кластер кубиков, стоящий в ячейках той же
 * фоновой сетки, что и вся страница.
 *
 * Метрики встроены в нижнюю полосу героя, а не вынесены отдельной
 * секцией. Так первый экран читается как показание прибора: обещание
 * сверху, подтверждающие числа под ним, всё в одном кадре. Отдельная
 * секция метрик заставляла пролистывать ради того же самого и
 * разрывала связку «утверждение — доказательство».
 *
 * Числа сверены с кодом: платформы — src/app/devices/page.tsx,
 * локации — LocationsSection. `from` задаёт стартовую точку отсчёта:
 * аптайм не должен на секунду показать «0 %», а задержка, наоборот,
 * убывает с большего значения — жест читается как «пинг падает».
 */
interface HeroSectionProps {
  primaryHref: string;
}

const METRICS = [
  { value: 200, suffix: " Гбит/с", label: "магистраль", from: 0 },
  { value: 99.98, decimals: 2, suffix: " %", label: "целевой аптайм", from: 99 },
  { value: 5, prefix: "< ", suffix: " мс", label: "задержка в регионе", from: 28 },
  { value: 4, label: "страны присутствия", from: 0 },
];

export default function HeroSection({ primaryHref }: HeroSectionProps) {
  return (
    <section className="px-hero" aria-labelledby="hero-title">
      <div className="px-hero-body">
        <div className="px-shell grid lg:grid-cols-12 gap-14 lg:gap-10 items-center w-full">
          <div className="lg:col-span-7">
            <p className="px-status px-reveal">
              <span className="px-status-dot" aria-hidden />
              <span className="px-eyebrow">Сеть работает штатно</span>
            </p>

            <h1 id="hero-title" className="px-h1 px-reveal mt-6">
              Интернет
              <br />
              без просадок
            </h1>

            <p className="px-lede px-reveal mt-6">
              Игры, созвоны и стриминг без фризов — сразу на всех устройствах.
              Подключение занимает полминуты.
            </p>

            <div className="px-cta px-reveal mt-9">
              <Link href={primaryHref} className="px-btn px-btn-xl px-btn-primary px-btn-block group">
                Начать бесплатно
                <Icon
                  name="arrow-right"
                  size={18}
                  className="transition-transform duration-200 ease-out group-hover:translate-x-1"
                />
              </Link>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <Link href="/pricing" className="px-btn px-btn-md px-btn-secondary">
                  Тарифы
                </Link>
                <Link href="/auth" className="px-btn px-btn-md px-btn-secondary">
                  Войти
                </Link>
              </div>
            </div>

            <ul className="px-friction px-reveal mt-6">
              {["Три дня бесплатно", "Без карты", "Отмена в один клик"].map((t) => (
                <li key={t}>
                  <Icon name="check" size={13} className="px-accent" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-5 flex justify-center lg:justify-end px-reveal">
            <CubeCluster />
          </div>
        </div>
      </div>

      {/* Нижняя полоса героя — показания сети. */}
      <div className="px-hero-rail">
        <div className="px-shell">
          <dl className="px-rail-metrics">
            {METRICS.map((m) => (
              <div key={m.label} className="px-rail-metric">
                <dt className="px-rail-metric-label">{m.label}</dt>
                <dd className="px-rail-metric-value px-num">
                  <AnimatedNumber
                    value={m.value}
                    decimals={m.decimals}
                    prefix={m.prefix}
                    suffix={m.suffix}
                    from={m.from}
                  />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
