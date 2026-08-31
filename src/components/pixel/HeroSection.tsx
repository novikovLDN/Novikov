"use client";

import Link from "next/link";
import CubeCluster from "./CubeCluster";
import Icon from "./Icon";
import { AnimatedNumber } from "./motion";

/**
 * Первый экран — редакционная композиция.
 *
 * Заголовок больше не строка внутри колонки: он занимает всю ширину
 * экрана и задаёт композицию страницы. Вторая строка смещена вправо —
 * намеренный слом сетки, который читается как приём только потому, что
 * вся остальная страница выровнена строго (research/06.md §3).
 *
 * ЧТО ЭТО ЗА ПРОДУКТ — главный вопрос, на который экран обязан
 * ответить. Раньше он говорил «интернет без просадок»: это про
 * качество, но не про категорию, и посетитель не понимал, что покупает.
 * Теперь функция названа прямо в первых двух строках после заголовка:
 * открывает заблокированные сайты, меняет страну, шифрует трафик.
 * Слово «VPN» при этом не используется — таково правило публичной
 * части (research/concept.md, принцип «два языка продукта»).
 *
 * Кластер кубиков ушёл из-под заголовка вниз, за карточку продукта:
 * на первом экране одновременно крупный шрифт и крупная графика
 * дерутся за внимание, и проигрывают оба.
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
        {/* Типографический блок — вне контейнера, во всю ширину. */}
        <div className="px-hero-type">
          <p className="px-status px-reveal">
            <span className="px-status-dot" aria-hidden />
            <span className="px-eyebrow">Ускоритель интернета · сеть работает штатно</span>
          </p>

          <h1 id="hero-title" className="px-display px-reveal">
            <span className="px-display-a">Открывает</span>
            <span className="px-display-b">интернет</span>
          </h1>
        </div>

        <div className="px-hero-grid">
          <div className="px-hero-copy px-reveal">
            <p className="px-hero-lede">
              Заблокированные сайты и сервисы открываются снова. Страна
              меняется в одно касание, трафик шифруется, скорость не падает.
            </p>

            <div className="px-cta mt-8">
              <Link href={primaryHref} className="px-btn px-btn-xl px-btn-primary px-btn-block group">
                Начать бесплатно
                <Icon
                  name="arrow-right"
                  size={18}
                  className="transition-transform duration-200 ease-out group-hover:translate-x-1"
                />
              </Link>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <Link href="/pricing" className="px-btn px-btn-md px-btn-secondary">Тарифы</Link>
                <Link href="/auth" className="px-btn px-btn-md px-btn-secondary">Войти</Link>
              </div>
            </div>

            <ul className="px-friction mt-6">
              {["Три дня бесплатно", "Без карты", "Отмена в один клик"].map((t) => (
                <li key={t}>
                  <Icon name="check" size={13} className="px-accent" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Кластер наезжает на типографический блок — намеренное
              наложение вместо аккуратной колонки рядом. */}
          <div className="px-hero-art px-reveal" aria-hidden>
            <CubeCluster />
          </div>
        </div>
      </div>

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
