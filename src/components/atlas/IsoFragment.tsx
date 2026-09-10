import { CLOSEST } from "@/lib/locations";
import { project } from "@/lib/world-map";
import { BAND_COUNT } from "@/lib/isochrones";

/**
 * Кусок карты внутри строки первого экрана (A7, решение 9: Paul
 * Kalkbrenner, The Watch). Объект первого экрана рождается из набора,
 * а не стоит рядом с ним.
 *
 * Вырезка вокруг ближайшего сервера: ступени времени ответа и суша —
 * те же фигуры, что на листе карты (`AtlasDefs`). Высота — строчная
 * буква, ширина — три кегля.
 */
const W = 120;
const H = 40;

export default function IsoFragment() {
  const c = project(CLOSEST.lat, CLOSEST.lon);
  const levels = Array.from({ length: BAND_COUNT }, (_, i) => BAND_COUNT - i);
  return (
    <svg
      className="a-frag"
      viewBox={`${Math.round(c.x - W / 2)} ${Math.round(c.y - H / 2)} ${W} ${H}`}
      aria-hidden
      focusable="false"
    >
      <g className="a-frag-bands">
        {levels.map((l) => (
          <use
            key={l}
            href={`#a-band-${l}`}
            className="a-frag-band a-idle"
            data-level={l}
            style={{ ["--l" as string]: l }}
          />
        ))}
      </g>
      <use href="#a-land-all" className="a-frag-land" />
      <rect x={c.x - 2} y={c.y - 2} width="4" height="4" className="a-frag-dot" />
    </svg>
  );
}
