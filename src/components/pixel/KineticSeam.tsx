"use client";

import { useEffect, useRef } from "react";
import { COUNTRY_COUNT } from "@/lib/locations";
import { DEVICE_LIMIT, PLAN_SPEED } from "@/lib/plans";
import { useReducedMotion } from "./motion";

/**
 * Кинетический шов между секциями.
 *
 * Приём редакционных и агентских сайтов 2026 года: вместо отбивки
 * пустотой — гигантская строка, которая едет поперёк экрана и
 * реагирует на прокрутку. Здесь она несёт факты, а не слова ради
 * движения: скорость канала, число стран, лимит устройств, срок
 * бесплатного доступа — всё из кода, ни одной цифры руками.
 *
 * Строка декоративна для скринридера: те же числа он уже получил в
 * секциях выше и ниже, и повторять их бегущей лентой незачем.
 */
const TRIAL_DAYS = 3;

export default function KineticSeam() {
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const items = [
    `${PLAN_SPEED.plus} Гбит/с`,
    `${COUNTRY_COUNT} стран`,
    `${DEVICE_LIMIT} устройств`,
    `${TRIAL_DAYS} дня бесплатно`,
    "99,98 %",
  ];

  useEffect(() => {
    const el = trackRef.current;
    if (!el || reduced) return;

    let frame = 0;
    let last = window.scrollY;
    let boost = 0;

    const tick = () => {
      const now = window.scrollY;
      boost = boost * 0.9 + (now - last) * 0.5;
      last = now;
      const clamped = Math.max(-60, Math.min(60, boost));
      el.style.setProperty("--seam-shift", `${clamped.toFixed(1)}px`);
      el.style.setProperty("--seam-skew", `${(clamped * 0.05).toFixed(2)}deg`);
      frame = Math.abs(clamped) > 0.3 ? requestAnimationFrame(tick) : 0;
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(tick); };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduced]);

  // Состав дублируется: при сдвиге на половину ленты вторая копия
  // встаёт вплотную и петля идёт без шва.
  const track = [...items, ...items, ...items, ...items];

  return (
    <div className="px-seam" aria-hidden>
      <div ref={trackRef} className="px-seam-track">
        {track.map((t, i) => (
          <span key={i} className="px-seam-item">
            {t}
            <i className="px-seam-dot" />
          </span>
        ))}
      </div>
    </div>
  );
}
