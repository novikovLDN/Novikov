import { LOCATIONS, CLOSEST } from "@/lib/locations";
import { MAP_W, MAP_H, project } from "@/lib/world-map";
import { BAND_COUNT, BAND_STEP_MS, rttToKm } from "@/lib/isochrones";
import LandLight, { SunNote } from "./LandLight";

/**
 * Лист карты — присутствие честно (SCREEN_SCORE.md, лист 04).
 *
 * Слои, снизу вверх:
 *   1. Пять ступеней времени ответа — каждая своим SVG. Отдельные слои
 *      нужны ради прилива: прозрачность целого слоя анимирует
 *      компоновщик, а прозрачность пути внутри одного SVG — перерисовка
 *      всего листа на каждом кадре.
 *   2. Суша гравюрным штрихом, освещённая солнцем читателя.
 *   3. Маршрут от читателя (по умолчанию — Москва, подписано) до
 *      ближайшего сервера и подпись внешней ступени.
 *   4. Города с серверами — `<details>`: раскрываются нажатием без
 *      скрипта. Отдельных страниц под страны нет (решение владельца).
 *
 * Все данные карты продублированы таблицей под ней: для чтеца экрана и
 * для телефона, где точки сливаются.
 */

export const READER_DEFAULT = { city: "Москва", lat: 55.75, lon: 37.62 };

const pct = (v: number, of: number) => `${((v / of) * 100).toFixed(2)}%`;

export default function Chart() {
  const reader = project(READER_DEFAULT.lat, READER_DEFAULT.lon);
  const near = project(CLOSEST.lat, CLOSEST.lon);
  const outerMs = BAND_COUNT * BAND_STEP_MS;
  const labelY = project(CLOSEST.lat + rttToKm(outerMs) / 111.2, CLOSEST.lon).y;
  const levels = Array.from({ length: BAND_COUNT }, (_, i) => BAND_COUNT - i);
  const box = `0 0 ${MAP_W} ${MAP_H}`;

  return (
    <figure className="a-chart-fig">
      <div className="a-chart" style={{ aspectRatio: `${MAP_W} / ${MAP_H}` }}>
        <div className="a-chart-bands a-print">
          {levels.map((l) => (
            <svg
              key={l}
              className="a-band a-idle"
              data-level={l}
              style={{ ["--l" as string]: l }}
              viewBox={box}
              aria-hidden
              focusable="false"
            >
              <use href={`#a-band-${l}`} />
            </svg>
          ))}
        </div>

        <LandLight />

        <svg className="a-over" viewBox={box} aria-hidden focusable="false">
          <path className="a-over-route" d={`M${reader.x} ${reader.y}L${near.x} ${near.y}`} vectorEffect="non-scaling-stroke" />
          <text className="a-over-label" x={near.x} y={labelY - 1.5} textAnchor="middle">
            {outerMs} мс
          </text>
        </svg>

        {LOCATIONS.map((l) => {
          const p = project(l.lat, l.lon);
          const closest = l.code === CLOSEST.code;
          const cities = l.cities.join(", ");
          return (
            <details
              key={l.code}
              className="a-city"
              data-closest={closest ? "" : undefined}
              style={{ left: pct(p.x, MAP_W), top: pct(p.y, MAP_H) }}
            >
              <summary
                className={closest ? "a-idle" : undefined}
                data-label={l.cities[0]}
                aria-label={`${cities}, ${l.country}: ${l.latencyMs} мс, ориентировочно`}
              >
                <span />
              </summary>
              <div className="a-city-card">
                <em>{cities}</em>, {l.country}
                <br />
                <b className="a-num">{l.latencyMs}</b>&nbsp;мс от Москвы, ориентировочно
              </div>
            </details>
          );
        })}

        <span className="a-reader" style={{ left: pct(reader.x, MAP_W), top: pct(reader.y, MAP_H) }} aria-hidden>
          <i />
          <span className="a-wide">вы — Москва, по умолчанию</span>
        </span>
      </div>

      <figcaption className="a-chart-cap">
        <ol className="a-scale" aria-label="Ступени времени ответа">
          {Array.from({ length: BAND_COUNT }, (_, i) => i + 1).map((l) => (
            <li key={l}>
              <i style={{ background: `var(--a-band-${l})` }} aria-hidden />
              <span className="a-num">{l * BAND_STEP_MS}</span>&nbsp;мс
            </li>
          ))}
        </ol>
        <p>
          Ступени — нижняя граница времени ответа по расстоянию до ближайшего сервера:
          свет в оптоволокне проходит около 200&nbsp;км за миллисекунду, туда и обратно.
          Реальное время всегда больше.
        </p>
        <p>
          Равнопромежуточная проекция: чем дальше от экватора, тем шире страны. <SunNote />
        </p>
      </figcaption>
    </figure>
  );
}
