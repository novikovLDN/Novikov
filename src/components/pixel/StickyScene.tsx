"use client";

import { useEffect, useRef, useState } from "react";
import Icon, { type IconName } from "./Icon";
import { useReducedMotion } from "./motion";

/**
 * Залипающая сцена: экран стоит на месте, пока читатель проходит её
 * высоту, а содержимое сменяется шаг за шагом.
 *
 * Это не перехват прокрутки: колесо и жест работают ровно так, как их
 * отпустил пользователь, полоса прокрутки идёт равномерно, а держит
 * кадр `position: sticky`. Скриптом считается только прогресс.
 *
 * Скорость смены задаётся высотой сцены (`stepVh` — сколько высот
 * экрана приходится на один шаг). Сто процентов оказалось мало:
 * шаг проскакивал раньше, чем читатель успевал дочитать строку,
 * поэтому по умолчанию на шаг отводится полтора экрана.
 *
 * Прогресс внутри шага раздаётся переменной `--s` (0…1): по ней
 * растёт полоса в счётчике и «печатается» схема шага.
 */
export interface SceneStep {
  n: string;
  title: string;
  body: string;
  /** Короткая схема шага — печатается по ходу его показа. */
  hint: string;
  icon: IconName;
}

export default function StickyScene({
  caption,
  steps,
  stepVh = 150,
}: {
  caption: string;
  steps: SceneStep[];
  stepVh?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || reduced) return;

    let frame = 0;
    const read = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      // Полный ход сцены — её высота минус экран: столько читатель
      // прокручивает, пока картинка стоит на месте.
      const total = Math.max(1, r.height - window.innerHeight);
      const p = Math.min(0.999, Math.max(0, -r.top / total));
      const index = Math.min(steps.length - 1, Math.floor(p * steps.length));
      const inner = p * steps.length - index;

      el.style.setProperty("--s", inner.toFixed(4));
      setActive((prev) => (prev === index ? prev : index));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(read); };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduced, steps.length]);

  return (
    <div
      ref={wrapRef}
      className="px-steps-scene"
      style={{ height: `${steps.length * stepVh}vh` }}
    >
      <div className="px-steps-stick">
        <div className="px-shell w-full">
          <div className="px-steps-stage">
            <p className="px-steps-caption">
              {caption}
              <span>
                шаг {active + 1} из {steps.length}
              </span>
            </p>

            {/* Счётчик: пройденные шаги закрашены, текущий заполняется
                по ходу самого шага. */}
            <div className="px-steps-rail" aria-hidden>
              {steps.map((s, i) => (
                <span
                  key={s.n}
                  className={`px-steps-tick${i === active ? " px-steps-tick-on" : ""}${
                    i < active ? " px-steps-tick-done" : ""
                  }`}
                >
                  <b>{s.n}</b>
                  <i />
                </span>
              ))}
            </div>

            <ol className="px-steps-list">
              {steps.map((s, i) => (
                <li
                  key={s.n}
                  className={`px-steps-item${i === active ? " px-steps-item-on" : ""}`}
                  aria-current={i === active ? "step" : undefined}
                >
                  <span className="px-steps-icon" aria-hidden>
                    <Icon name={s.icon} size={22} />
                  </span>

                  <h3 className="px-steps-title">{s.title}</h3>
                  <p className="px-steps-body">{s.body}</p>

                  <span className="px-steps-hint" aria-hidden>
                    <span className="px-steps-hint-text">{s.hint}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
