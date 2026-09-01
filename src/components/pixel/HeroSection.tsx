"use client";

import Link from "next/link";
import AccountPreview from "./AccountPreview";
import Icon from "./Icon";
import { MiniCubes } from "./CubeCluster";
import { AnimatedNumber, useParallax } from "./motion";
import { Magnetic, PixelTrail, SplitText, useGridTorch, useTilt } from "./effects";
import { PLAN_SPEED } from "@/lib/plans";
import { COUNTRY_COUNT } from "@/lib/locations";

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

/** Значения подтверждены кодом: скорость канала — src/lib/plans.ts
 *  (PLAN_SPEED), число стран — src/lib/locations.ts (COUNTRY_COUNT).
 *  Целевая доступность и задержка — заявленные эксплуатационные
 *  цели. */
const METRICS = [
  { value: PLAN_SPEED.plus, prefix: "до ", suffix: " Гбит/с", label: "скорость канала", from: 0 },
  { value: 99.98, decimals: 2, suffix: " %", label: "время без сбоев", from: 99 },
  { value: 5, prefix: "< ", suffix: " мс", label: "пинг внутри региона", from: 28 },
  { value: COUNTRY_COUNT, label: "стран присутствия", from: 0 },
];

export default function HeroSection({ primaryHref }: HeroSectionProps) {
  const artRef = useParallax<HTMLDivElement>(0.045);
  const tiltRef = useTilt<HTMLDivElement>(4);
  const torchRef = useGridTorch<HTMLElement>();

  return (
    <section ref={torchRef} className="px-hero" aria-labelledby="hero-title">
      {/* Курсор «будит» клетку сетки под собой и рассыпает за собой
          пиксели того же шага — материал, из которого собран сайт.
          Оба слоя живут только на первом экране: постоянный шлейф по
          всей странице мешал бы читать. */}
      <span className="px-hero-torch" aria-hidden />
      <PixelTrail />

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

              {/* Заголовок набирается по буквам. Знаки помечены
                  aria-hidden, поэтому вспомогательной технологии
                  фраза отдаётся целиком через aria-label — дубля
                  текста в разметке нет. */}
              <h1
                id="hero-title"
                className="px-hero-title px-reveal mt-6"
                aria-label="Открывает интернет без просадок"
              >
                <SplitText text="Открывает интернет" />
                <br />
                <SplitText text="без просадок" className="px-accent" delay={620} />
              </h1>

              <p className="px-lede px-reveal mt-6">
                Заблокированные сайты и сервисы открываются снова. Страна
                меняется в одно касание, трафик шифруется, скорость не падает.
              </p>

              <div className="px-cta px-reveal mt-8">
                {/* Главная кнопка страницы тянется к курсору: приём
                    наградных промо-сайтов, здесь — ровно на одном
                    элементе, иначе страница начинает шевелиться вся. */}
                <Magnetic className="w-full">
                  <Link href={primaryHref} className="px-btn px-btn-xl px-btn-primary px-btn-block group">
                    Начать бесплатно
                    <Icon
                      name="arrow-right"
                      size={18}
                      className="transition-transform duration-200 ease-out group-hover:translate-x-1"
                    />
                  </Link>
                </Magnetic>
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

            <div className="lg:col-span-5 px-reveal px-tilt-scene">
              <div ref={artRef}>
                <div ref={tiltRef} className="px-tilt">
                  <AccountPreview />
                </div>
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
