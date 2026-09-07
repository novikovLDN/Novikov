"use client";

import { useEffect } from "react";
import { usePrefersReducedMotion } from "./motion";

/**
 * ПОЛЕ ДВИЖЕНИЯ — одно место, откуда весь сайт узнаёт о своём
 * состоянии.
 *
 * Пишет две вещи в корень документа:
 *   --b-vel   скорость прокрутки, сглаженная пружиной, от −1 до 1;
 *   data-signal="lost"  короткая потеря синхронизации при простое.
 *
 * ПОЧЕМУ ОДИН ИСТОЧНИК. Каждая сцена, считающая скорость сама,
 * заводит свой слушатель и свой rAF. Здесь один цикл на страницу, и
 * любой элемент подключается к нему одной строкой CSS — без своего
 * скрипта и без своего наблюдателя.
 *
 * ПОЧЕМУ ПРУЖИНА, А НЕ ЗАТУХАНИЕ. Пружина считает движение из массы,
 * жёсткости и трения, а не из длительности: значение догоняет цель,
 * проскакивает её и возвращается — так двигаются предметы, имеющие
 * вес. Простое затухание даёт ровное скольжение без отдачи, и страница
 * от него кажется невесомой.
 *
 * ПОТЕРЯ СИГНАЛА. Если человек не трогает страницу дольше паузы,
 * сайт коротко теряет синхронизацию и тут же её возвращает. Это не
 * трюк ради трюка: продукт — про соединение, и его собственная
 * нестабильность на секунду напоминает, зачем он нужен. Срабатывает
 * не чаще раза в паузу и никогда — при пониженной анимации.
 */
const IDLE_MS = 26_000;
/** Жёсткость и трение подобраны так, чтобы отдача читалась, но не
 *  качала страницу: одно проскакивание и возврат. */
const STIFFNESS = 0.11;
const DAMPING = 0.78;

export default function MotionField() {
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const root = document.documentElement;

    let last = window.scrollY;
    let value = 0;
    let velocity = 0;
    let raf = 0;

    const frame = () => {
      raf = requestAnimationFrame(frame);
      const y = window.scrollY;
      // Цель — мгновенная скорость, нормированная по высоте окна.
      const target = Math.max(-1, Math.min(1, (y - last) / (window.innerHeight * 0.35)));
      last = y;
      // Пружина: сила тянет значение к цели, трение гасит колебание.
      velocity += (target - value) * STIFFNESS;
      velocity *= DAMPING;
      value += velocity;
      if (Math.abs(value) < 0.0005 && Math.abs(velocity) < 0.0005) value = 0;
      root.style.setProperty("--b-vel", value.toFixed(4));
    };
    raf = requestAnimationFrame(frame);

    // ─── Потеря сигнала при простое ───────────────────────────────
    let idle: ReturnType<typeof setTimeout>;
    let clear: ReturnType<typeof setTimeout>;
    const lose = () => {
      root.dataset.signal = "lost";
      clear = setTimeout(() => { delete root.dataset.signal; }, 620);
    };
    const wake = () => {
      clearTimeout(idle);
      idle = setTimeout(lose, IDLE_MS);
    };
    const events: Array<keyof WindowEventMap> = ["scroll", "pointermove", "keydown", "pointerdown"];
    events.forEach((e) => window.addEventListener(e, wake, { passive: true }));
    wake();

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(idle);
      clearTimeout(clear);
      events.forEach((e) => window.removeEventListener(e, wake));
      root.style.removeProperty("--b-vel");
      delete root.dataset.signal;
    };
  }, [reduced]);

  return null;
}
