"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import HeroStage from "./HeroStage";
import Icon from "./Icon";
import ParticleHeading from "./ParticleHeading";
import { AnimatedNumber, useParallax } from "./motion";
import {
  Magnetic,
  PixelTrail,
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
 * Задача кадра — не рассказать, а открыть. Поэтому здесь ровно
 * четыре вещи: заголовок во всю ширину, одна строка смысла, одно
 * действие и приборная полоса внизу. Всё остальное — лид на три
 * строки, второй и третий призывы, список из трёх обещаний — уехало
 * ниже по странице, где у читателя уже есть вопрос, на который это
 * отвечает.
 *
 * Заголовок набран точками той же сетки, что и фон: строки
 * собираются из разлетевшихся частиц, дышат в покое и расступаются
 * под курсором. Он занимает всю ширину контейнера, а не семь колонок
 * из двенадцати — в этом и есть масштаб.
 *
 * Сцена соединения ушла из соседней колонки вниз, к полосе
 * показаний: пока читатель смотрит на заголовок, справа не должно
 * быть второго центра внимания.
 *
 * Вход кадра — одна волна: сетка проявляется, заголовок собирается,
 * действие и полоса въезжают снизу. Каждый слой со своей задержкой
 * (`--px-delay`), движение только по transform и opacity.
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

  /* Потолок высоты холста заголовка. Кегль внутри общий и упирается
     в длину самой длинной строки, поэтому на широком экране
     заголовок берёт всю ширину контейнера. */
  const [lineH, setLineH] = useState(360);
  useEffect(() => {
    const pick = () => {
      const w = window.innerWidth;
      /* Потолок подобран так, чтобы весь кадр — заголовок, действие,
         сцена и полоса показаний — помещался в один экран: ради
         крупного заголовка выталкивать показания за край нельзя. */
      const byHeight = Math.round(window.innerHeight * 0.3);
      setLineH(Math.min(byHeight, w < 480 ? 190 : w < 768 ? 240 : w < 1280 ? 280 : 320));
    };
    pick();
    window.addEventListener("resize", pick, { passive: true });
    return () => window.removeEventListener("resize", pick);
  }, []);

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
          <p className="px-hero-vertical px-hero-in" style={{ ["--px-delay" as string]: "80ms" }}>
            <span className="px-status-dot" aria-hidden />
            <span className="px-eyebrow">Ускоритель интернета · сеть работает штатно</span>
          </p>

          <h1
            id="hero-title"
            className="px-hero-title px-hero-dots px-hero-in"
            style={{ ["--px-delay" as string]: "160ms" }}
          >
            <ParticleHeading
              text={["Открывает", "интернет", "без просадок"]}
              accentLine={2}
              offsets={[0, 0.16, 0.07]}
              height={lineH}
              align="left"
              idle
            />
          </h1>

          <div className="px-hero-floor">
            <div className="px-hero-act px-hero-in" style={{ ["--px-delay" as string]: "320ms" }}>
              <p className="px-hero-claim">
                Заблокированные сайты открываются снова — на всех устройствах сразу.
              </p>

              <div className="px-hero-cta">
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

              <p className="px-hero-price">
                Три дня бесплатно, без карты. Дальше{" "}
                <Link href="/pricing" className="px-hero-price-link">
                  от 199 ₽ в месяц
                </Link>
                .
              </p>
            </div>

            <div className="px-hero-stage px-hero-in" style={{ ["--px-delay" as string]: "420ms" }}>
              <div ref={artRef}>
                <div ref={stageRef} className="px-hero-stage-layer">
                  <HeroStage />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-hero-rail px-hero-in" style={{ ["--px-delay" as string]: "520ms" }}>
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
