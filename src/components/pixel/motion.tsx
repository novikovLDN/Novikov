"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Motion-слой системы.
 *
 * Ни одной внешней библиотеки: IntersectionObserver и
 * requestAnimationFrame. Сайт продаёт скорость соединения — он не имеет
 * права тащить мегабайт ради анимаций.
 *
 * Общие правила: анимируются только transform и opacity; слушатели
 * пассивные; prefers-reduced-motion упрощает слой, а не ломает его.
 */

/** Пользователь просил меньше движения. Значение следит за настройкой. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return reduced;
}

/**
 * Появление блоков при скролле — один раз, без отмотки назад.
 *
 * Наблюдатель, а не CSS scroll-timeline: таймлайн отматывает анимацию
 * при обратной прокрутке, а по требованию блок должен появиться
 * единожды и остаться.
 *
 * Класс px-js ставится на <html> только здесь. Пока его нет, .px-reveal
 * остаётся видимым — то есть отказ скрипта не может оставить страницу
 * пустой. Прятать контент разрешено лишь после того, как механизм
 * показа доказал свою работоспособность.
 */
export function useReveal() {
  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const targets = Array.from(document.querySelectorAll<HTMLElement>(".px-reveal"));
    if (targets.length === 0) return;

    root.classList.add("px-js");

    if (reduced) {
      targets.forEach((t) => t.classList.add("px-in"));
      return () => root.classList.remove("px-js");
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("px-in");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
    );

    targets.forEach((t) => observer.observe(t));

    // Страховка: всё, что по любой причине не получило px-in за 3 с
    // после загрузки и уже находится в кадре, показывается принудительно.
    const safety = setTimeout(() => {
      targets.forEach((t) => {
        const r = t.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) t.classList.add("px-in");
      });
    }, 3000);

    return () => {
      observer.disconnect();
      clearTimeout(safety);
      root.classList.remove("px-js");
    };
  }, []);
}

/**
 * Отсчёт числа.
 *
 * Два сценария, и различать их важно:
 *   - первое появление в кадре — отсчёт от `from`, эффект «прибор
 *     запускается»;
 *   - смена значения у уже показанного числа (переключение периода
 *     тарифа) — переход от прежнего значения к новому. Отсчёт от нуля
 *     здесь читался бы как ошибка и на кадр показывал бы старую цену.
 *
 * `from` не всегда ноль: показатель качества, на секунду показывающий
 * «0,00 % аптайм», — плохой микромомент на странице, которая продаёт
 * надёжность. Для задержки, наоборот, задаётся верхняя граница, и
 * число убывает — жест читается как «пинг падает».
 */
export function AnimatedNumber({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1200,
  from = 0,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  from?: number;
}) {
  const format = (n: number) =>
    `${prefix}${n.toLocaleString("ru-RU", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}${suffix}`;

  const final = format(value);
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  // Начальное состояние — конечное значение: если скрипт не выполнится,
  // посетитель увидит настоящее число, а не ноль.
  const [text, setText] = useState(final);
  const shown = useRef(value);
  const seen = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduced) {
      shown.current = value;
      setText(format(value));
      return;
    }

    let frame = 0;

    const animate = (start: number) => {
      let t0 = 0;
      const step = (now: number) => {
        if (!t0) t0 = now;
        const t = Math.min(1, (now - t0) / duration);
        const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        const current = start + (value - start) * eased;
        shown.current = current;
        setText(format(current));
        if (t < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };

    if (seen.current) {
      animate(shown.current);
      return () => { if (frame) cancelAnimationFrame(frame); };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        observer.disconnect();
        seen.current = true;
        animate(from);
      },
      { threshold: 0.4 }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, decimals, prefix, suffix, duration, from, reduced]);

  return (
    <span className="px-counter">
      {/* Призрачная копия конечного значения держит ширину: без неё
          отсчёт «99,98» от нуля дёргал бы соседние ячейки. */}
      <span className="px-counter-ghost" aria-hidden>{final}</span>
      <span ref={ref} className="px-counter-live">{text}</span>
    </span>
  );
}
