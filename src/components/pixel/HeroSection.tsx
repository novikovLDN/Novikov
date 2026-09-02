"use client";

import Link from "next/link";
import HeroStage from "./HeroStage";
import Icon from "./Icon";
import { AnimatedNumber, useParallax } from "./motion";
import {
  Magnetic,
  PixelTrail,
  SplitText,
  useGridTorch,
  useMouseLayer,
  usePixelBurst,
  useScrollScene,
} from "./effects";
import { DEVICE_LIMIT, PLAN_SPEED } from "@/lib/plans";
import { COUNTRY_COUNT } from "@/lib/locations";

/**
 * Первый экран.
 *
 * Заголовок набирается обычным шрифтом, а не точками. Точечная
 * версия выглядела эффектно на скриншоте, но читать её приходилось
 * по буквам: главное сообщение сайта оказалось самым трудным для
 * чтения местом на экране. Эффект остался там, где он не мешает
 * пониманию, — на декоративном слове в секции безопасности.
 *
 * Оживление никуда не делось: знаки поднимаются по одному при
 * входе, курсор будит сетку и рассыпает пиксели, слои расходятся на
 * прокрутке. Но всё это работает вокруг текста, а не вместо него.
 *
 * Кадр — две колонки: слева обещание и действие, справа приборная
 * сцена. Заголовок во всю ширину с дырой посередине разваливал экран
 * на две несвязанные половины.
 */
interface HeroSectionProps {
  primaryHref: string;
}

/** Значения подтверждены кодом: скорость канала — src/lib/plans.ts,
 *  число стран — src/lib/locations.ts. Доступность и задержка —
 *  заявленные эксплуатационные цели. */
const METRICS = [
  { value: PLAN_SPEED.plus, prefix: "до ", suffix: " Гбит/с", label: "скорость канала", from: 0 },
  { value: COUNTRY_COUNT, label: "стран присутствия", from: 0 },
  { value: DEVICE_LIMIT, label: "устройств в подписке", from: 0 },
  { value: 99.98, decimals: 2, suffix: " %", label: "время без сбоев", from: 99 },
];

export default function HeroSection({ primaryHref }: HeroSectionProps) {
  const torchRef = useGridTorch<HTMLElement>();
  const sceneRef = useScrollScene<HTMLElement>();
  const stageRef = useMouseLayer<HTMLDivElement>(14);
  const artRef = useParallax<HTMLDivElement>(0.03);
  const burstRef = usePixelBurst<HTMLAnchorElement>();

  return (
    <section
      ref={(node) => {
        torchRef.current = node;
        sceneRef.current = node;
      }}
      className="px-hero"
      aria-labelledby="hero-title"
    >
      <span className="px-hero-torch" aria-hidden />
      <PixelTrail />

      <div className="px-hero-body">
        <div className="px-shell w-full">
          <div className="px-hero-grid">
            <div className="px-hero-copy">
              <p className="px-hero-vertical px-hero-in" style={{ ["--px-delay" as string]: "60ms" }}>
                <span className="px-status-dot" aria-hidden />
                <span className="px-eyebrow">Ускоритель интернета · сеть работает штатно</span>
              </p>

              {/* Знаки поднимаются по одному: текст собирается на
                  глазах, но остаётся текстом. Фраза целиком уходит в
                  aria-label — дубля строки в разметке нет. */}
              <h1
                id="hero-title"
                className="px-hero-title px-hero-in"
                style={{ ["--px-delay" as string]: "140ms" }}
                aria-label="Открывает интернет без просадок"
              >
                <SplitText text="Открывает" />
                <span className="px-hero-line-2">
                  <SplitText text="интернет" delay={260} />
                </span>
                <span className="px-hero-line-3 px-accent">
                  <SplitText text="без просадок" delay={520} />
                </span>
              </h1>

              <p className="px-hero-claim px-hero-in" style={{ ["--px-delay" as string]: "320ms" }}>
                Заблокированные сайты открываются снова — на всех устройствах сразу.
              </p>

              <div className="px-hero-cta px-hero-in" style={{ ["--px-delay" as string]: "400ms" }}>
                <Magnetic>
                  <Link
                    ref={burstRef}
                    href={primaryHref}
                    className="px-btn px-btn-lg px-btn-primary px-burst group"
                  >
                    Начать бесплатно
                    <Icon
                      name="arrow-right"
                      size={18}
                      className="transition-transform duration-200 ease-out group-hover:translate-x-1"
                    />
                  </Link>
                </Magnetic>

                <Link href="/auth" className="px-hero-signin group">
                  Войти
                  <Icon
                    name="arrow-right"
                    size={14}
                    className="transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                  />
                </Link>
              </div>

              <p className="px-hero-price px-hero-in" style={{ ["--px-delay" as string]: "470ms" }}>
                Три дня бесплатно, без карты. Дальше{" "}
                <Link href="/pricing" className="px-hero-price-link">
                  от 199 ₽ в месяц
                </Link>
                .
              </p>
            </div>

            <div className="px-hero-stage px-hero-in" style={{ ["--px-delay" as string]: "540ms" }}>
              <div ref={artRef}>
                <div ref={stageRef} className="px-hero-stage-layer">
                  <HeroStage />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-hero-rail px-hero-in" style={{ ["--px-delay" as string]: "620ms" }}>
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
