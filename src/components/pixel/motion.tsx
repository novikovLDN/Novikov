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

/**
 * Параллакс на прокрутке.
 *
 * Элемент едет по вертикали медленнее страницы, пока находится в
 * кадре. Смещение считается от центра вьюпорта, поэтому в середине
 * экрана оно нулевое — объект не «уползает» с исходной позиции, а
 * дышит вокруг неё.
 *
 * Один общий rAF на подписчика, пассивный слушатель, запись только в
 * transform: слой не вызывает пересчёт раскладки. При
 * prefers-reduced-motion хук не подписывается вовсе.
 */
export function useParallax<T extends HTMLElement>(strength = 0.06) {
  const ref = useRef<T>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;

    let ticking = false;
    let visible = false;

    const read = () => {
      ticking = false;
      if (!visible) return;
      const r = el.getBoundingClientRect();
      const center = r.top + r.height / 2 - window.innerHeight / 2;
      el.style.transform = `translate3d(0, ${(-center * strength).toFixed(2)}px, 0)`;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(read);
    };

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false;
        if (visible) onScroll();
      },
      { rootMargin: "120px 0px" }
    );
    io.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      el.style.transform = "";
    };
  }, [strength, reduced]);

  return ref;
}

/**
 * Полоса прочтения страницы под шапкой.
 *
 * Единственный элемент, который движется всегда, — поэтому он обязан
 * быть самым дешёвым: одна запись в scaleX внутри rAF, никакой
 * реакции React на каждый кадр прокрутки.
 */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let ticking = false;
    const read = () => {
      ticking = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      el.style.transform = `scaleX(${p.toFixed(4)})`;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="px-progress" aria-hidden>
      <div ref={ref} className="px-progress-bar" />
    </div>
  );
}

/**
 * Факт попадания элемента в кадр — для эффектов, которые нельзя
 * выразить одним классом на родителе (шкалы, отсчёты, холсты).
 * Срабатывает один раз и отписывается.
 */
export function useInView<T extends HTMLElement>(threshold = 0.3) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setInView(true);
        io.disconnect();
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return [ref, inView] as const;
}
