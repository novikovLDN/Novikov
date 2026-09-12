"use client";

import { useEffect } from "react";
import { registerScroller } from "@/components/brand/scroll-top";
import "@/app/smooth-scroll.css";

/**
 * Мягкая прокрутка колесом на всех страницах корпуса (владелец,
 * 12.09.2026: «прокрутку намного мягче по сайту»).
 *
 * Lenis двигает саму страницу (window.scrollTo на каждом кадре), поэтому
 * всё, что считает шкала прокрутки — view()/scroll() в CSS, закреплённые
 * сцены, холсты GlobeGL / MissionGL / LaptopScrub, — получает уже
 * сглаженную позицию и едет плавно без собственной доводки.
 *
 * Только колесо и тачпад: на сенсорном экране остаётся родная инерция
 * системы (syncTouch выключен) — подменять её хуже, чем оставить.
 * reduced-motion и ?static=1 — родная прокрутка, библиотека не грузится.
 *
 * Вложенные прокручиваемые области (меню, шторка уведомлений, окна)
 * прокручиваются сами: `prevent` отдаёт им колесо.
 */
const NESTED = ".a-index-panel, .ov-dialog-body, .ak-sheet-body, [data-lenis-prevent]";

export default function SmoothScroll() {
  useEffect(() => {
    const root = document.documentElement;
    if (root.hasAttribute("data-static") || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let destroy: (() => void) | null = null;
    let cancelled = false;

    import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;
      const lenis = new Lenis({
        autoRaf: true,
        // Доводка по экспоненте: страница догоняет колесо за ~0,6 с и
        // мягко встаёт, без рывка на каждом щелчке колеса.
        lerp: 0.085,
        wheelMultiplier: 0.9,
        anchors: { offset: -72 },
        stopInertiaOnNavigate: true,
        prevent: (node) => !!node.closest?.(NESTED),
      });
      registerScroller((y) => lenis.scrollTo(y, { immediate: true }));
      destroy = () => {
        registerScroller(null);
        lenis.destroy();
      };
    });

    return () => {
      cancelled = true;
      destroy?.();
    };
  }, []);

  return null;
}
