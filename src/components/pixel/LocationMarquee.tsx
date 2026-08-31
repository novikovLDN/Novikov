"use client";

/**
 * Бегущая строка локаций.
 *
 * Редакционный приём: движение, которое одновременно несёт содержание
 * — реальные города и задержки, а не абстрактный «слова для движения»
 * (research/06.md §5). Условия, без которых приём становится дешёвым:
 *
 *   - скорость низкая, полный проход ~48с — иначе строка мельтешит;
 *   - содержимое продублировано дважды подряд для бесшовной петли,
 *     а не резко перезапускается;
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

  return (
    <div className="px-marquee" aria-hidden="true">
      <div className="px-marquee-track">
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
