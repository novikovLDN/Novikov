"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { usePrefersReducedMotion } from "./reduced-motion";

/**
 * Курсор.
 *
 * Не «кружок вместо стрелки» — точка света, которая стирает границу:
 * тот же жест, что в первом экране, только в масштабе интерфейса.
 * Позицию ведёт rAF и CSS-переменные, React в этом не участвует.
 *
 * Показывается только там, где есть настоящий указатель: на тачскрине
 * курсора нет, и рисовать его там нечему.
 *
 * И только там, где стоит чернильная оболочка `.b-root`. Компонент
 * висит в корневой разметке, то есть на каждой странице сайта, — но
 * в кабинете и на страницах PIXEL работает системный указатель, а
 * этот цикл rAF писал бы две переменные в скрытый элемент каждый кадр
 * и без надобности гонял пересчёт стилей.
 */
export function Cursor() {
  const reduced = usePrefersReducedMotion();
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (!document.querySelector(".b-root")) return;

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
  }, [reduced, pathname]);

  return <div ref={ref} className="b-cursor" aria-hidden />;
}
