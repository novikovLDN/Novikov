"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "./motion";

/**
 * Бегущая строка, которая слышит прокрутку.
 *
 * У ленты есть собственный медленный ход. Прокрутка добавляется к
 * нему: вниз — лента ускоряется, вверх — тормозит и разворачивается,
 * а на резком движении наклоняется по ходу. Приём из практики
 * Studio Freight и Locomotive; здесь он держит содержание —
 * проверяемые числа продукта, а не набор слов.
 *
 * Одна сила пишет в один transform: собственный ход и толчок от
 * прокрутки складываются в одну позицию до записи. Две CSS-анимации,
 * дерущиеся за transform, дают рывок ровно в момент прокрутки — этот
 * урок в проекте уже оплачен прошлой версией сайта.
 *
 * Содержимое дублируется дважды и сдвигается по модулю половины
 * ширины: шва не видно, узлов ровно вдвое больше необходимого.
 *
 * При prefers-reduced-motion лента не едет вовсе — строка стоит и
 * читается как обычный ряд фактов.
 */
export default function VelocityMarquee({
  items,
  baseSpeed = 34,
}: {
  items: string[];
  /** Собственный ход, px/с. */
  baseSpeed?: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const host = hostRef.current;
    const track = trackRef.current;
    if (!host || !track) return;

    let x = 0;
    let half = track.scrollWidth / 2;
    let lastScroll = window.scrollY;
    let velocity = 0;
    let last = performance.now();
    let raf = 0;
    let visible = true;

    const measure = () => { half = track.scrollWidth / 2; };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // Скорость считается ПОКАДРОВО, а не копится по событиям
      // прокрутки. При плавной прокрутке событий на кадр приходит
      // несколько, и накопление обгоняло затухание: наклон залипал на
      // максимуме и лента стояла перекошенной в покое.
      //
      // Положение прокрутки читается ДО проверки видимости. Иначе
      // lastScroll застывает, пока лента за кадром, и при возвращении
      // в кадр приходит разом вся накопленная разница — рывок на
      // ровном месте.
      const y = window.scrollY;
      const delta = y - lastScroll;
      lastScroll = y;
      velocity = velocity * 0.82 + delta * 0.55;
      if (Math.abs(velocity) < 0.05) velocity = 0;

      if (!visible || half <= 0) return;

      x -= baseSpeed * dt + velocity * 0.05;
      // Модуль по половине ширины: позиция всегда в пределах одного
      // повтора, число не растёт до потери точности.
      x = ((x % half) + half) % half - half;

      const skew = Math.max(-5, Math.min(5, velocity * 0.08));
      track.style.transform = `translate3d(${x}px, 0, 0) skewX(${skew.toFixed(2)}deg)`;
    };

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
    io.observe(host);
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    measure();

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
    };
  }, [reduced, baseSpeed]);

  // Второй проход помечен aria-hidden: диктор не должен читать
  // список дважды.
  return (
    <div ref={hostRef} className="b-marquee">
      <div ref={trackRef} className="b-marquee-track">
        {[0, 1].map((pass) => (
          <ul key={pass} className="b-marquee-row" aria-hidden={pass === 1 || undefined}>
            {items.map((item) => (
              <li key={item} className="b-marquee-item">
                <span className="b-marquee-dot" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
