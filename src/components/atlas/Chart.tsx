import { LOCATIONS, CLOSEST } from "@/lib/locations";
import { MAP_W, MAP_H, project } from "@/lib/world-map";
import { BAND_COUNT, BAND_STEP_MS, rttToKm } from "@/lib/isochrones";
import LandLight from "./LandLight";

/**
 * Карта серверов (главная, раздел 04).
 *
 * Слои, снизу вверх:
 *   1. Пять ступеней времени ответа — каждая своим SVG. Отдельные слои
 *      нужны ради прилива: прозрачность целого слоя анимирует
 *      компоновщик, а прозрачность пути внутри одного SVG — перерисовка
 *      всего листа на каждом кадре.
 *   2. Суша штрихом, освещённая солнцем читателя (без подписи — это
 *      оформление, а не сообщение).
 *   3. Маршрут от читателя (Москва) до ближайшего сервера.
 *   4. Города с серверами — `<details>`: раскрываются нажатием без
 *      скрипта. Отдельных страниц под страны нет (решение владельца).
 *
 * Всё, что есть на карте, продублировано таблицей под ней: для чтеца
 * экрана и для телефона, где точки сливаются.
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
  const route = `M${reader.x} ${reader.y}L${near.x} ${near.y}`;
  // Города проявляются волной от ближайшего: порядок — по отклику.
  const order = new Map([...LOCATIONS].sort((a, b) => a.latencyMs - b.latencyMs).map((l, i) => [l.code, i]));

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
              {/* Обводка, затем белая заливка поверх: пересечения колец
                  закрываются, остаётся внешний контур — изохрона. */}
              <use href={`#a-band-${l}`} className="s" />
              <use href={`#a-band-${l}`} className="f" />
            </svg>
          ))}
        </div>

        <LandLight />

        <svg className="a-over" viewBox={box} aria-hidden focusable="false">
          <path className="a-over-route" d={route} vectorEffect="non-scaling-stroke" />
          {/* Пакет бежит по маршруту до ближайшего сервера. SMIL — без
              скрипта; при reduced-motion и ?static=1 его останавливает
              MotionController (pauseAnimations). */}
          <circle className="a-packet" r="1.6">
            <animateMotion dur="2.4s" repeatCount="indefinite" path={route} />
          </circle>
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
              style={{ left: pct(p.x, MAP_W), top: pct(p.y, MAP_H), ["--i" as string]: order.get(l.code) ?? 0 }}
            >
              <summary
                className={closest ? "a-idle" : undefined}
                data-label={l.cities[0]}
                aria-label={`${cities}, ${l.country}: примерно ${l.latencyMs} мс из Москвы`}
              >
                <span />
              </summary>
              <div className="a-city-card">
                <em>{cities}</em>, {l.country}
                <br />
                примерно <b className="a-num">{l.latencyMs}</b>&nbsp;мс из Москвы
              </div>
            </details>
          );
        })}

        <span className="a-reader" style={{ left: pct(reader.x, MAP_W), top: pct(reader.y, MAP_H) }} aria-hidden>
          <i />
          <span className="a-wide">вы — {READER_DEFAULT.city}</span>
        </span>
      </div>

      <figcaption className="a-chart-cap">
        <ol className="a-scale" aria-label="Отклик ближайшего сервера">
          {Array.from({ length: BAND_COUNT }, (_, i) => i + 1).map((l) => (
            <li key={l}>
              <i data-level={l} aria-hidden />
              <span className="a-num">{l * BAND_STEP_MS}</span>&nbsp;мс
            </li>
          ))}
        </ol>
        <p>
          Каждая линия — плюс {BAND_STEP_MS}&nbsp;мс до ближайшего сервера. Это оценка по
          расстоянию, на деле отклик немного больше.
        </p>
      </figcaption>
    </figure>
  );
}
