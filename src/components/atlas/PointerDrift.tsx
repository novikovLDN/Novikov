"use client";

import { useEffect } from "react";

/**
 * Параллакс за рукой: пишет положение указателя (−1…1) в --px/--py на
 * элемент `target`. Сдвиг и сглаживание делает CSS (`transition` на
 * transform), поэтому здесь нет цикла — одна запись в кадр, только
 * пока рука движется.
 *
 * Не включается: на грубом указателе (палец двигает страницу, а не
 * курсор), при reduced-motion и при `?static=1`.
 */
export default function PointerDrift({ target }: { target: string }) {
  useEffect(() => {
    const el = document.querySelector<HTMLElement>(target);
    if (!el) return;
    if (document.documentElement.hasAttribute("data-static")) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!matchMedia("(pointer: fine)").matches) return;

    let raf = 0;
    let x = 0;
    let y = 0;
    const write = () => {
      raf = 0;
      el.style.setProperty("--px", x.toFixed(3));
      el.style.setProperty("--py", y.toFixed(3));
    };
    const move = (e: PointerEvent) => {
      x = (e.clientX / window.innerWidth) * 2 - 1;
      y = (e.clientY / window.innerHeight) * 2 - 1;
      if (!raf) raf = requestAnimationFrame(write);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [target]);

  return null;
}
