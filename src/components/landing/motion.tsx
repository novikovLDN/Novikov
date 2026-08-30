"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

/**
 * Motion-слой лендинга — принцип 5 (research/concept.md).
 *
 * Здесь собрано всё движение страницы. Ни одной внешней библиотеки:
 * IntersectionObserver, requestAnimationFrame и CSS-переменные.
 * Сайт продаёт скорость, поэтому анимации не имеют права стоить
 * мегабайт бандла.
 *
 * Инженерные рамки, одинаковые для всех хуков ниже:
 *   - анимируются только transform / opacity / кастомные свойства;
 *   - все слушатели скролла и указателя пассивные и сведены в rAF;
 *   - эффекты, осмысленные только с мышью, не инициализируются на
 *     тач-устройствах — там они лишь жгут батарею;
 *   - prefers-reduced-motion упрощает слой, а не ломает: контент
 *     показывается сразу, числа выводятся конечным значением.
 */

/** Пользователь просил меньше движения. Значение следит за сменой настройки. */
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

/** Указатель точный (мышь/трекпад), а не палец. */
function useFinePointer(): boolean {
  const [fine, setFine] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => setFine(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return fine;
}

/**
 * Один общий rAF-цикл на всю страницу.
 *
 * Каждый параллакс-элемент со своим слушателем скролла — это N чтений
 * layout за кадр и гарантированные пропуски кадров на слабом железе.
 * Здесь подписчики складываются в один набор и обходятся за один тик.
 */
type ScrollFn = (scrollY: number, viewportH: number) => void;

const scrollSubscribers = new Set<ScrollFn>();
let scrollFrame = 0;

function runScrollSubscribers() {
  scrollFrame = 0;
  const y = window.scrollY;
  const h = window.innerHeight;
  scrollSubscribers.forEach((fn) => fn(y, h));
}

function scheduleScrollRun() {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(runScrollSubscribers);
}

function subscribeToScroll(fn: ScrollFn): () => void {
  if (scrollSubscribers.size === 0) {
    window.addEventListener("scroll", scheduleScrollRun, { passive: true });
    window.addEventListener("resize", scheduleScrollRun, { passive: true });
  }
  scrollSubscribers.add(fn);
  scheduleScrollRun();

  return () => {
    scrollSubscribers.delete(fn);
    if (scrollSubscribers.size === 0) {
      window.removeEventListener("scroll", scheduleScrollRun);
      window.removeEventListener("resize", scheduleScrollRun);
      if (scrollFrame) {
        cancelAnimationFrame(scrollFrame);
        scrollFrame = 0;
      }
    }
  };
}

/**
 * Параллакс: элемент смещается по вертикали медленнее прокрутки.
 *
 * `strength` — доля от пройденного пути. 0.06 даёт едва заметный дрейф,
 * 0.18 — отчётливую глубину. Смещение пишется в CSS-переменную, а не в
 * style.transform напрямую: так элемент может одновременно участвовать
 * в CSS-анимации появления, не конфликтуя с ней за свойство transform.
 */
export function useParallax<T extends HTMLElement>(strength = 0.08) {
  const ref = useRef<T>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;

    let last = Number.NaN;

    const update = (scrollY: number, viewportH: number) => {
      const rect = el.getBoundingClientRect();
      // Прогресс -1…1: элемент идёт снизу вверх через вьюпорт.
      const centre = rect.top + rect.height / 2;
      const progress = (centre - viewportH / 2) / viewportH;
      const offset = Math.round(progress * viewportH * strength * -1);
      if (offset === last) return;
      last = offset;
      el.style.setProperty("--ls-parallax", `${offset}px`);
    };

    const unsubscribe = subscribeToScroll(update);
    return () => {
      unsubscribe();
      el.style.removeProperty("--ls-parallax");
    };
  }, [strength, reduced]);

  return ref;
}

/**
 * Прогресс прохождения секции: 0 — верх секции достиг низа экрана,
 * 1 — низ секции ушёл за верх. Пишется в --ls-progress и используется
 * для прорисовки направляющих и sticky-эффектов чистым CSS.
 */
export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduced) {
      el.style.setProperty("--ls-progress", "1");
      return;
    }

    let last = Number.NaN;

    const update = (_scrollY: number, viewportH: number) => {
      const rect = el.getBoundingClientRect();
      const span = rect.height + viewportH;
      const raw = span === 0 ? 1 : (viewportH - rect.top) / span;
      const clamped = Math.min(1, Math.max(0, raw));
      const rounded = Math.round(clamped * 100) / 100;
      if (rounded === last) return;
      last = rounded;
      el.style.setProperty("--ls-progress", String(rounded));
    };

    const unsubscribe = subscribeToScroll(update);
    return () => {
      unsubscribe();
      el.style.removeProperty("--ls-progress");
    };
  }, [reduced]);

  return ref;
}

/**
 * Прожектор под курсором.
 *
 * Позиция указателя пишется в --ls-mx/--ls-my, а рисует градиент уже
 * CSS. Наведение/уход гасятся через --ls-glow, чтобы пятно не
 * выключалось резко.
 */
export function Spotlight({
  children,
  className,
  as: Tag = "div",
  style,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "li" | "section";
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);
  const fine = useFinePointer();
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || !fine || reduced) return;

    let frame = 0;
    let px = 0;
    let py = 0;

    const write = () => {
      frame = 0;
      el.style.setProperty("--ls-mx", `${px}%`);
      el.style.setProperty("--ls-my", `${py}%`);
    };

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      px = ((e.clientX - rect.left) / rect.width) * 100;
      py = ((e.clientY - rect.top) / rect.height) * 100;
      if (!frame) frame = requestAnimationFrame(write);
    };
    const onEnter = () => el.style.setProperty("--ls-glow", "1");
    const onLeave = () => el.style.setProperty("--ls-glow", "0");

    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerenter", onEnter, { passive: true });
    el.addEventListener("pointerleave", onLeave, { passive: true });

    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [fine, reduced]);

  return (
    // @ts-expect-error — Tag сужен до конкретных тегов выше, ref совместим.
    <Tag ref={ref} className={className} style={style} data-spotlight={fine ? "on" : undefined}>
      {children}
    </Tag>
  );
}

/**
 * Отсчёт числа.
 *
 * Два разных сценария, и различать их важно:
 *   - первое появление в кадре — отсчёт от нуля, эффект «прибор
 *     запускается»;
 *   - смена значения уже показанного числа (переключение периода
 *     тарифа) — переход от прежнего значения к новому. Отсчёт от нуля
 *     здесь читался бы как ошибка, а не как анимация, и на кадр
 *     показывал бы старую цену.
 *
 * Числа — сам аргумент продукта, поэтому их движение несёт смысл.
 * Ширина зарезервирована призрачной копией конечного значения, так что
 * отсчёт не двигает соседей.
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
  /**
   * Значение, с которого идёт первый отсчёт.
   *
   * Ноль подходит для счётных величин («4 страны»), но не для
   * показателей качества: аптайм, на секунду показывающий «0,00 %», —
   * плохой микромомент на странице, которая продаёт надёжность.
   * Для таких величин задаётся правдоподобная нижняя граница, а для
   * задержки — наоборот, верхняя: число уменьшается до целевого, и
   * жест читается как «пинг падает».
   */
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
  // Стартуем с конечного значения: если скрипт не выполнится, посетитель
  // всё равно увидит настоящее число, а не ноль.
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

    const animate = (from: number) => {
      let start = 0;
      const tick = (now: number) => {
        if (!start) start = now;
        const t = Math.min(1, (now - start) / duration);
        // easeOutExpo — быстрый разгон, длинное успокоение: та же логика,
        // что у основной кривой появления.
        const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        const current = from + (value - from) * eased;
        shown.current = current;
        setText(format(current));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    // Значение сменилось у уже показанного числа — идём от текущего.
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
    // format стабилен по составу зависимостей ниже.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, decimals, prefix, suffix, duration, from, reduced]);

  return (
    <span ref={ref} className="ls-counter">
      {/* Призрачная копия конечного значения держит ширину: без неё
          отсчёт «99,98» от нуля дёргал бы соседние ячейки. */}
      <span className="ls-counter-ghost" aria-hidden>{final}</span>
      <span className="ls-counter-live">{text}</span>
    </span>
  );
}

/**
 * Резервный reveal для браузеров без scroll-driven анимаций.
 *
 * Основной путь — CSS `animation-timeline: view()`. Там, где его нет
 * (в первую очередь Safari старых версий), этот хук навешивает класс
 * по IntersectionObserver, и каскад появления работает одинаково.
 * Базовое состояние в CSS остаётся видимым, поэтому даже полный отказ
 * обоих механизмов не прячет контент.
 */
export function useRevealFallback() {
  useEffect(() => {
    if (typeof CSS !== "undefined" && CSS.supports("animation-timeline: view()")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const targets = Array.from(document.querySelectorAll<HTMLElement>(".ls-reveal"));
    if (targets.length === 0) return;

    document.documentElement.classList.add("ls-js-reveal");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("ls-revealed");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    targets.forEach((t) => observer.observe(t));
    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("ls-js-reveal");
    };
  }, []);
}
