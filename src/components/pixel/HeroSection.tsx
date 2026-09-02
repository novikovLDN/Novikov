"use client";

import Link from "next/link";
import HeroStage from "./HeroStage";
import Icon from "./Icon";
import { MiniCubes } from "./CubeCluster";
import { AnimatedNumber, useParallax } from "./motion";
import { Magnetic, PixelTrail, useGridTorch, useMouseLayer, usePixelBurst, useScrollScene } from "./effects";
import ParticleHeading from "./ParticleHeading";
import { useEffect, useState } from "react";
import { DEVICE_LIMIT, PLAN_SPEED } from "@/lib/plans";
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
  const torchRef = useGridTorch<HTMLElement>();
  const sceneRef = useScrollScene<HTMLElement>();
  const stageRef = useMouseLayer<HTMLDivElement>(16);
  const burstRef = usePixelBurst<HTMLAnchorElement>();

  /* Высота строки из точек зависит от ширины экрана: на телефоне тот
     же кегль просто не помещается, а точки в мелком кегле
     складываются в шум вместо букв. */
  const [lineH, setLineH] = useState(200);
  useEffect(() => {
    const pick = () => {
      const w = window.innerWidth;
      /* Потолок высоты холста на все три строки сразу. Кегль внутри
         общий и упирается в длину самой длинной строки, поэтому
         разбивка на три коротких строки поднимает его почти вдвое
         против двух длинных — заголовок становится крупным без
         увеличения колонки. */
      setLineH(w < 480 ? 210 : w < 768 ? 260 : w < 1280 ? 290 : 320);
    };
    pick();
    window.addEventListener("resize", pick, { passive: true });
    return () => window.removeEventListener("resize", pick);
  }, []);

  return (
    <section
      ref={(node) => {
        // Две роли на одной секции: фонарик по сетке и прогресс
        // прокрутки. Обе пишут переменные в один и тот же элемент.
        torchRef.current = node;
        sceneRef.current = node;
      }}
      className="px-hero"
      aria-labelledby="hero-title"
    >
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
              {/* Метка состояния вынесена в вертикальную колонку слева:
                  типовая горизонтальная строка над заголовком — первое,
                  что делает первый экран похожим на все остальные. */}
              <p className="px-hero-vertical px-reveal">
                <span className="px-status-dot" aria-hidden />
                <span className="px-eyebrow flex items-center gap-2">
                  <MiniCubes />
                  Ускоритель интернета · сеть работает штатно
                </span>
              </p>

              {/* Заголовок набран точками той же сетки, что и фон:
                  строки собираются из разлетевшихся частиц, дышат в
                  покое и расступаются под курсором. Настоящий текст
                  лежит внутри ParticleHeading для скринридера и
                  поиска, холст помечен aria-hidden. */}
              <h1 id="hero-title" className="px-hero-title px-hero-dots px-reveal mt-6">
                <ParticleHeading
                  text={["Открывает", "интернет", "без просадок"]}
                  accentLine={2}
                  offsets={[0, 0.14, 0.06]}
                  height={lineH}
                  align="left"
                  idle
                />
              </h1>

              <p className="px-lede px-reveal mt-6">
                Заблокированные сайты и сервисы открываются снова. Страна
                меняется в одно касание, трафик шифруется, скорость не падает.
              </p>

              {/* Зона действия.
                  Было: оранжевая плита во всю колонку, под ней два
                  равновеликих серых прямоугольника. Три блока одного
                  веса — читателю приходилось выбирать из трёх равных
                  вариантов там, где выбор один.
                  Стало: одно действие кнопкой, вход — обычной
                  ссылкой рядом (это возврат, а не покупка), цена
                  вынесена подписью под кнопку, где она и нужна. */}
              <div className="px-hero-cta px-reveal mt-9">
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

              <p className="px-hero-price px-reveal">
                Три дня бесплатно, без карты. Дальше —{" "}
                <Link href="/pricing" className="px-hero-price-link">
                  от 199 ₽ в месяц
                </Link>
                .
              </p>

              <ul className="px-friction px-reveal mt-5">
                {["Отмена в один клик", `${DEVICE_LIMIT} устройств`, `${COUNTRY_COUNT} стран`].map((t) => (
                  <li key={t}>
                    <Icon name="check" size={13} className="px-accent" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-5 px-reveal px-hero-stage">
              <div ref={artRef}>
                <div ref={stageRef} className="px-hero-stage-layer">
                  <HeroStage />
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
