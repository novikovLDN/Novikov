"use client";

import { useEffect } from "react";

/**
 * ЛИНЗА-ИНВЕРТОР — курсор, который переворачивает материал.
 *
 * ПОЧЕМУ ИМЕННО ЭТО, А НЕ «КАСТОМНЫЙ КУРСОР». Замер восемнадцати
 * сайтов студий (research/03_AGENCY_TEARDOWN.md, вывод 6) показал:
 * `cursor: none` на теле документа не ставит НИ ОДИН из них, а у нас
 * это однажды убило курсор на всём сайте. Здесь системный курсор
 * остаётся на месте; сверху едет только слой, который ничего не
 * перехватывает.
 *
 * ПОЧЕМУ ИНВЕРСИЯ. В редакционном корпусе цвет означает «измерено», и
 * другого отклика на курсор быть не может — только переворот
 * материала. `mix-blend-mode: difference` с белой заливкой даёт
 * настоящую инверсию всего, что под ней: на бумаге кружок становится
 * чёрным, на чёрной плите — белым, а текст под ним читается в обе
 * стороны. Это тот же жест, что у кнопки и у ленты фактов, только
 * привязанный к руке.
 *
 * СТОИМОСТЬ. Один слушатель на документ, значение считает rAF, в
 * стили уходят две переменные. Ни ref в компонентах, ни состояния
 * React: перерисовки нет вовсе.
 *
 * ГДЕ НЕ РАБОТАЕТ НАМЕРЕННО. На грубом указателе (палец) линзы нет:
 * ей нечего догонять. При `prefers-reduced-motion` — тоже: слой
 * выключается целиком, а не замедляется.
 */
export default function InvertLens() {
  useEffect(() => {
    const fine = matchMedia("(pointer: fine)");
    const still = matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || still.matches) return;

    const el = document.createElement("div");
    el.className = "gh-lens";
    el.setAttribute("aria-hidden", "true");
    document.body.appendChild(el);

    let tx = innerWidth / 2;
    let ty = innerHeight / 2;
    let x = tx;
    let y = ty;
    let raf = 0;
    let on = false;

    const move = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!on) {
        // Первый кадр ставим без догона, иначе линза приезжает через
        // весь экран от места, где её оставили.
        x = tx;
        y = ty;
        on = true;
        el.dataset.on = "true";
      }
    };
    const leave = () => {
      on = false;
      el.dataset.on = "false";
    };

    const tick = () => {
      // Инерция: слой догоняет руку, а не приклеен к ней. 0.18 —
      // предел, за которым отставание читается как лаг.
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(tick);
    };

    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      el.remove();
    };
  }, []);

  return null;
}
