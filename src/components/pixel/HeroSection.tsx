"use client";

import Link from "next/link";
import AccountPreview from "./AccountPreview";
import Icon from "./Icon";
import { MiniCubes } from "./CubeCluster";
import { AnimatedNumber, useParallax } from "./motion";
import { PLAN_SPEED } from "@/lib/plans";

/**
 * Первый экран.
 *
 * Разбор VK Cloud / Yandex Cloud / Selectel (research/07.md) сходится
 * в одном приёме: справа в герое — настоящий интерфейс продукта, а не
 * абстрактная графика. Здесь стоит та же карточка кабинета, что
 * покупатель увидит после регистрации.
 *
 * Заголовок называет функцию, а не только качество: «Открывает
 * интернет» отвечает на вопрос категории, вторая строка — на вопрос
 * качества («без просадок»). Слово «VPN» не используется — правило
 * публичной части (research/concept.md, «два языка продукта»).
 *
 * Цена появляется уже в герое («от 199 ₽/мес»), а не только на
 * /pricing — у Selectel цена входит в первый экран прямым текстом
 * (research/07.md §2).
 *
 * Экран светлый, как и всё тело сайта: тёмная плита была единственным
 * разрывом материала на странице. Глубину держат пиксельная сетка,
 * тёплое пятно акцента и элевация карточки — см. `.px-hero` в
 * globals.css.
 *
 * Показания в нижней полосе названы словами покупателя: «скорость
 * канала» вместо «магистрали», «время без сбоев» вместо «аптайма».
 * Термин, который нужно объяснять, на первом экране не работает.
 */
interface HeroSectionProps {
  primaryHref: string;
}

/** Значения подтверждены: скорость канала — src/lib/plans.ts
 *  (PLAN_SPEED), число стран — LocationsSection. Целевая доступность
 *  и задержка — заявленные эксплуатационные цели. */
const METRICS = [
  { value: PLAN_SPEED.plus, prefix: "до ", suffix: " Гбит/с", label: "скорость канала", from: 0 },
  { value: 99.98, decimals: 2, suffix: " %", label: "время без сбоев", from: 99 },
  { value: 5, prefix: "< ", suffix: " мс", label: "пинг внутри региона", from: 28 },
  { value: 4, label: "страны присутствия", from: 0 },
];

export default function HeroSection({ primaryHref }: HeroSectionProps) {
  const artRef = useParallax<HTMLDivElement>(0.045);

  return (
    <section className="px-hero" aria-labelledby="hero-title">
      <div className="px-hero-body">
        <div className="px-shell w-full">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            <div className="lg:col-span-7">
              <p className="px-status px-reveal">
                <span className="px-status-dot" aria-hidden />
                <span className="px-eyebrow flex items-center gap-2">
                  <MiniCubes />
                  Ускоритель интернета · сеть работает штатно
                </span>
              </p>

              <h1 id="hero-title" className="px-hero-title px-reveal mt-6">
                Открывает интернет
                <br />
                <span className="px-accent">без просадок</span>
              </h1>

              <p className="px-lede px-reveal mt-6">
                Заблокированные сайты и сервисы открываются снова. Страна
                меняется в одно касание, трафик шифруется, скорость не падает.
              </p>

              <div className="px-cta px-reveal mt-8">
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
                    Тарифы от 199 ₽
                  </Link>
                  <Link href="/auth" className="px-btn px-btn-md px-btn-secondary">Войти</Link>
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

            <div className="lg:col-span-5 px-reveal">
              <div ref={artRef}>
                <AccountPreview />
              </div>
            </div>
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
