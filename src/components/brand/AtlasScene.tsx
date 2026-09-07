"use client";

import { useRef } from "react";
import { gsap, useGSAP, usePrefersReducedMotion } from "./motion";
import { CITY_COUNT, COUNTRY_COUNT, LOCATIONS, plural } from "@/lib/locations";
import ScrambleLabel from "./ScrambleLabel";
import { typo } from "@/lib/typo";

/**
 * АТЛАС — горизонтальная лента стран.
 *
 * Пока читатель прокручивает страницу вниз, лента едет вбок: страны
 * проходят мимо, как перрон за окном. Приём взят не ради приёма — у
 * списка из девятнадцати позиций нет иерархии, и вертикальный столбец
 * заставлял бы читать его целиком. Ленту можно просто проводить
 * глазами.
 *
 * Задержка нарисована полосой, а не только числом: разницу между 12 и
 * 160 миллисекундами глазу видно, а цифрам — нужно верить.
 *
 * Без скрипта и при prefers-reduced-motion лента остаётся обычной
 * горизонтальной прокруткой с прилипанием — жестом, а не сценой.
 *
 * Все данные — src/lib/locations.ts. Города и задержки помечены там
 * как оценки, требующие подтверждения эксплуатацией.
 */
const MAX_LATENCY = Math.max(...LOCATIONS.map((l) => l.latencyMs));

export default function AtlasScene() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      const node = root.current;
      const rail = track.current;
      if (!node || !rail || reduced) return;
      if (!window.matchMedia("(min-width: 760px)").matches) return; // на телефоне лента листается пальцем

      const distance = () => rail.scrollWidth - window.innerWidth + 80;

      const tween = gsap.to(rail, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: node,
          start: "top top",
          end: () => "+=" + distance(),
          pin: true,
          scrub: 0.7,
          invalidateOnRefresh: true,
        },
      });

      return () => { tween.scrollTrigger?.kill(); tween.kill(); };
    },
    { scope: root, dependencies: [reduced] },
  );

  return (
    <section ref={root} className="b-section b-paper b-live b-atlas" aria-labelledby="atlas-title">
      <div className="b-shell b-atlas-head b-enter">
        <ScrambleLabel text="Атлас" />
        <h2 id="atlas-title" className="b-lg">
          {/* Число и его форма считаются вместе: «22 городов» — то, что
              получается, если склонение зашить руками под сегодняшнее
              значение. Эта же ошибка уже была на прошлой версии. */}
          {COUNTRY_COUNT} {plural(COUNTRY_COUNT, ["страна", "страны", "стран"])},{" "}
          <br />
          {CITY_COUNT} {plural(CITY_COUNT, ["город", "города", "городов"])}
        </h2>
        <p className="b-body">
          {typo("Точку выбираете вы. Ближайшая отвечает за двенадцать миллисекунд, самая дальняя — за сто шестьдесят.")}
        </p>
      </div>

      <ul ref={track} className="b-atlas-track">
        {LOCATIONS.map((l) => (
          <li key={l.code} className="b-atlas-card">
            <span className="b-atlas-code b-num">{l.code}</span>
            <span className="b-atlas-country">{l.country}</span>
            <span className="b-atlas-cities">{l.cities.join(" · ")}</span>
            <span className="b-atlas-lat">
              <span className="b-num b-atlas-ms">{l.latencyMs}</span>
              <span className="b-label">мс</span>
            </span>
            <span
              className="b-atlas-bar"
              style={{ ["--w" as string]: `${Math.round((l.latencyMs / MAX_LATENCY) * 100)}%` }}
              aria-hidden
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
