"use client";

import { useEffect, useRef, useState } from "react";
import Icon, { type IconName } from "./Icon";
import SectionHeading from "./SectionHeading";

/**
 * Как это работает — sticky-сцена, а не ряд из трёх карточек.
 *
 * Блок закрепляется во вьюпорте, пока прокручивается его собственная
 * высокая полоса; активный шаг переключается по тому, какая треть
 * полосы сейчас в центре экрана. Три шага — последовательные и должны
 * быть прочитаны по порядку, поэтому ряд, который можно пролистать по
 * диагонали одним взглядом, был неверной формой для этого содержания
 * (research/06.md §4).
 *
 * На узком экране (нет курсора-скролла «по шагам» и мало места для
 * sticky-сцены) — обычная последовательность с номерами, читается
 * сверху вниз естественно.
 *
 * Наблюдатель, а не scroll-timeline: переключение шага должно быть
 * дискретным (0/1/2), а не непрерывной анимацией.
 */
const STEPS: Array<{ n: string; title: string; body: string; icon: IconName }> = [
  {
    n: "01",
    title: "Регистрация",
    body: "Введите почту — придёт код для входа. Без пароля и анкеты, около 30 секунд.",
    icon: "clock",
  },
  {
    n: "02",
    title: "Тариф",
    body: "Первые 3 дня бесплатно. Дальше Basic для повседневного интернета или Plus для игр и стримов.",
    icon: "bolt",
  },
  {
    n: "03",
    title: "Подключение",
    body: "В личном кабинете — QR-код и кнопка «Открыть в Happ». Дальше соединение поднимается само.",
    icon: "shield",
  },
];

export default function HowItWorksSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const panels = Array.from(track.querySelectorAll<HTMLElement>("[data-step]"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(Number(entry.target.getAttribute("data-step")));
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    panels.forEach((p) => observer.observe(p));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="px-section" aria-labelledby="how-title">
      <div className="px-shell">
        <SectionHeading
          eyebrow="Как это работает"
          title={["От почты до подключения —", "одна минута"]}
          titleId="how-title"
          index="04"
        />
      </div>

      {/* Sticky-сцена: скролл-высота задаётся числом шагов, само
          содержимое закреплено и меняется дискретно. */}
      <div ref={trackRef} className="px-scene" aria-hidden="true" style={{ ["--px-steps" as string]: STEPS.length }}>
        {STEPS.map((s, i) => (
          <div key={s.n} data-step={i} className="px-scene-trigger" aria-hidden />
        ))}

        <div className="px-scene-sticky">
          <div className="px-shell w-full">
            <div className="px-scene-stage">
              <div className="px-scene-index" aria-hidden>
                <span className="px-num">{STEPS[active].n}</span>
                <span className="px-scene-of">/ 0{STEPS.length}</span>
              </div>

              <div className="px-scene-dots">
                {STEPS.map((s, i) => (
                  <span key={s.n} className={`px-scene-dot${i === active ? " px-scene-dot-active" : ""}`} />
                ))}
              </div>

              <div className="px-scene-panel">
                <span className="px-benefit-icon" aria-hidden>
                  <Icon name={STEPS[active].icon} size={22} />
                </span>
                <h3 className="px-h2 mt-6">{STEPS[active].title}</h3>
                <p className="px-lede mt-4">{STEPS[active].body}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Та же последовательность текстом — снимает зависимость от
          JS/IntersectionObserver и служит развёрнутой альтернативой
          для скринридера и печати. */}
      <div className="px-shell">
        <ol className="px-steps-plain" aria-label="Шаги подключения">
          {STEPS.map((s) => (
            <li key={s.n}>
              <span className="px-num px-accent">{s.n}</span>
              <div>
                <h4 className="text-[15px] font-bold">{s.title}</h4>
                <p className="px-body mt-1">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
