"use client";

import { useMarqueeFlow } from "./effects";

/**
 * Бегущая строка локаций.
 *
 * Редакционный приём: движение, которое одновременно несёт содержание
 * — реальные города и задержки, а не абстрактный «слова для движения»
 * (research/06.md §5). Условия, без которых приём становится дешёвым:
 *
 *   - скорость задана в пикселях в секунду и не зависит от длины
 *     состава: лента из девятнадцати локаций идёт тем же шагом, что
 *     и из четырёх;
 *   - содержимое продублировано дважды подряд для бесшовной петли,
 *     а не резко перезапускается;
 *   - ход и прокрутка складываются в одну позицию (useMarqueeFlow):
 *     прокрутил страницу — лента поехала вместе с ней, остановился —
 *     продолжает свой ровный шаг. Раньше CSS-анимация и скролл писали
 *     в один transform независимо, и в движении лента дёргалась;
 *   - останавливается по prefers-reduced-motion;
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
  // Дублируем состав дважды: петля замыкается по половине дорожки.
  const track = [...locations, ...locations];
  const trackRef = useMarqueeFlow<HTMLDivElement>(46);

  return (
    <div className="px-marquee" aria-hidden="true">
      <div ref={trackRef} className="px-marquee-track">
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
