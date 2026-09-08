"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { usePrefersReducedMotion } from "./reduced-motion";
import { registerScroller } from "./scroll-top";

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
    let lenis: { raf: (t: number) => void; destroy: () => void; scrollTo: (t: number, o?: { immediate?: boolean }) => void } | null = null;
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
      // Кнопка возврата к первому экрану спрашивает способ
      // перемещения здесь: нативный scrollTo Lenis перебивает на
      // следующем же кадре.
      registerScroller((y) => instance.scrollTo(y, { immediate: true }));
      update = (time: number) => instance.raf(time * 1000);
      gsap.ticker.add(update);
      gsap.ticker.lagSmoothing(0);
    });

    return () => {
      cancelled = true;
      registerScroller(null);
      if (update) gsap.ticker.remove(update);
      gsap.ticker.lagSmoothing(500, 33);
      lenis?.destroy();
      started.current = false;
    };
  }, [reduced]);

  return null;
}

/* Хук пониженной анимации и курсор вынесены в собственные модули.
   Причина не косметическая: `Cursor` стоит в корневой разметке, и
   импорт из этого файла тянул GSAP вместе с ScrollTrigger и SplitText
   в общий чанк — то есть на каждую страницу сайта, включая кабинет,
   где ни одной gsap-анимации нет. Здесь они только переэкспортируются,
   чтобы сцены бренда продолжали брать всё движение из одного места. */
export { usePrefersReducedMotion };
export { Cursor } from "./Cursor";

