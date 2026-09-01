"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "./motion";

/**
 * Бегущая строка локаций.
 *
 * Редакционный приём: движение, которое одновременно несёт содержание
 * — реальные города и задержки, а не абстрактный «слова для движения»
 * (research/06.md §5). Условия, без которых приём становится дешёвым:
 *
 *   - скорость низкая и не зависит от длины состава: время прохода
 *     считается от числа элементов (~12с на каждый), иначе лента из
 *     девятнадцати локаций едет вчетверо быстрее, чем из четырёх;
 *   - содержимое продублировано дважды подряд для бесшовной петли,
 *     а не резко перезапускается;
 *   - лента реагирует на прокрутку: пока страница едет, строка
 *     ускоряется и слегка тянется в сторону движения, а затем
 *     возвращается к своему шагу. Это тот же приём инерции, что у
 *     наградных промо-сайтов, но на одном элементе и без библиотеки:
 *     скорость пишется в CSS-переменную внутри rAF;
 *   - останавливается по prefers-reduced-motion — CSS-медиа делает
 *     это без единой строчки JS;
 *   - `aria-hidden`: это витрина уже показанных данных, а не новый
 *     источник содержания — список ниже остаётся тем, что читает
 *     вспомогательная технология.
 */
interface Location {
  code: string;
  city: string;
  latency: string;
}

export default function LocationMarquee({ locations }: { locations: Location[] }) {
  // Дублируем состав дважды: при 100%-сдвиге первой копии вторая
  // встаёт вплотную, и петля не даёт видимого шва.
  const track = [...locations, ...locations];
  const duration = `${Math.max(24, locations.length * 12)}s`;
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = trackRef.current;
    if (!el || reduced) return;

    let frame = 0;
    let last = window.scrollY;
    let boost = 0;

    const tick = () => {
      const now = window.scrollY;
      const delta = now - last;
      last = now;
      // Скорость прокрутки подмешивается и затухает: лента тянется за
      // движением страницы и сама возвращается к своему темпу.
      boost = boost * 0.88 + delta * 0.35;
      const clamped = Math.max(-40, Math.min(40, boost));
      el.style.setProperty("--px-marquee-skew", `${(clamped * 0.06).toFixed(2)}deg`);
      el.style.setProperty("--px-marquee-shift", `${clamped.toFixed(1)}px`);
      frame = Math.abs(clamped) > 0.2 ? requestAnimationFrame(tick) : 0;
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(tick); };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduced]);

  return (
    <div className="px-marquee" aria-hidden="true">
      <div
        ref={trackRef}
        className="px-marquee-track"
        style={{ ["--px-marquee-dur" as string]: duration }}
      >
        {track.map((l, i) => (
          <span key={`${l.code}-${i}`} className="px-marquee-item">
            <span className="px-marquee-code">{l.code}</span>
            {l.city}
            <span className="px-marquee-dot" />
            {l.latency}
          </span>
        ))}
      </div>
    </div>
  );
}
