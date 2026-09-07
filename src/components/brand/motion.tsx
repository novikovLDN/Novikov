"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

/**
 * Слой движения бренда.
 *
 * Плагины регистрируются один раз на уровне модуля — так требует
 * документация GSAP для React, иначе повторная регистрация на каждый
 * рендер тихо съедает кадры.
 *
 * Разделение обязанностей между CSS и библиотекой сделано осознанно
 * (TRENDS.md §8): нативные scroll-driven анимации и View Transitions
 * закрывают простые появления и переходы и считаются на композиторе,
 * а GSAP оставлен ровно там, где CSS не умеет, — scrub, pin и
 * составные таймлайны сцен.
 */
gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

/* Единая кривая и единая длительность на весь сайт. Раньше каждая
   сцена объявляла своё: где-то power4 за 0,9 с, где-то линейно за
   0,3 — движение читалось как набор разных механизмов. power2.out
   тормозит мягче, чем power4: тот выстреливает и почти мгновенно
   замирает, отчего короткие перемещения выглядят дёргаными. */
gsap.defaults({ ease: "power2.out", duration: 0.9 });

export { gsap, ScrollTrigger, SplitText, useGSAP };

/** Одно место, где спрашивают про пониженную анимацию. */
export function usePrefersReducedMotion(): boolean {
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
 * Плавная прокрутка (Lenis) в связке с тикером GSAP.
 *
 * Схема из документации Lenis: собственный rAF выключен, шаг делает
 * тикер GSAP, ScrollTrigger обновляется по событию скролла, сглаживание
 * лага у тикера отключено — иначе scrub-анимации отстают от колеса.
 *
 * При prefers-reduced-motion Lenis не поднимается вовсе: подменять
 * нативную прокрутку человеку, который просил меньше движения, —
 * ровно то, на что жалуются в первую очередь.
 */
export function SmoothScroll() {
  const reduced = usePrefersReducedMotion();
  const started = useRef(false);

  useEffect(() => {
    if (reduced || started.current) return;
    started.current = true;
    let lenis: { raf: (t: number) => void; destroy: () => void } | null = null;
    let update: ((time: number) => void) | null = null;
    let cancelled = false;

    // Загружаем библиотеку отложенно: 3 КБ, но они не нужны до первого
    // кадра и не должны стоять на пути отрисовки.
    import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;
      const instance = new Lenis({
        autoRaf: false,
        // Длиннее выкат и более пологая кривая: прокрутка догоняет
        // палец мягче, а сцены со scrub перестают дёргаться на
        // резком движении колеса.
        duration: 1.35,
        easing: (t: number) => 1 - Math.pow(1 - t, 3.2),
      });
      lenis = instance;
      instance.on("scroll", ScrollTrigger.update);
      update = (time: number) => instance.raf(time * 1000);
      gsap.ticker.add(update);
      gsap.ticker.lagSmoothing(0);
    });

    return () => {
      cancelled = true;
      if (update) gsap.ticker.remove(update);
      gsap.ticker.lagSmoothing(500, 33);
      lenis?.destroy();
      started.current = false;
    };
  }, [reduced]);

  return null;
}

/**
 * Курсор.
 *
 * Не «кружок вместо стрелки» — точка света, которая стирает границу:
 * тот же жест, что в первом экране, только в масштабе интерфейса.
 * Позицию ведёт rAF и CSS-переменные, React в этом не участвует.
 *
 * Показывается только там, где есть настоящий указатель: на тачскрине
 * курсора нет, и рисовать его там нечему.
 */
export function Cursor() {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const node = ref.current;
    if (!node) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;
    let raf = 0;
    let over = false;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      const el = e.target as HTMLElement | null;
      const hot = !!el?.closest("a, button, [data-cursor]");
      if (hot !== over) {
        over = hot;
        node.dataset.over = hot ? "true" : "false";
      }
    };

    const tick = () => {
      // Догоняющая инерция: курсор отстаёт ровно настолько, чтобы
      // читаться как объект, а не как второй указатель.
      // Инерция курсора мягче: 0,18 давали почти мгновенное
      // прилипание к указателю, и точка переставала читаться
      // как отдельный объект.
      x += (tx - x) * 0.13;
      y += (ty - y) * 0.13;
      node.style.setProperty("--x", `${x}px`);
      node.style.setProperty("--y", `${y}px`);
      raf = requestAnimationFrame(tick);
    };

    node.dataset.on = "true";
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return <div ref={ref} className="b-cursor" aria-hidden />;
}
