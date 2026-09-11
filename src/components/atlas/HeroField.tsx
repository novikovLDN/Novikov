import { CLOSEST, LOCATIONS } from "@/lib/locations";
import { project } from "@/lib/world-map";
import { BAND_COUNT } from "@/lib/isochrones";

/**
 * Поле изохрон первого экрана — материал афиши между заголовком и
 * действием. Та же геометрия, что на карте (`AtlasDefs`), только
 * крупным планом вокруг ближайшего сервера: читатель с первого кадра
 * стоит внутри карты, а не смотрит на неё со стороны.
 *
 * Движение (atlas.css, раздел 6.6): прилив линий в покое, параллакс за
 * рукой (`PointerDrift` пишет --px/--py), «нырок» — приближение при
 * уходе первого экрана. Край поля растворяется маской, чтобы линии не
 * спорили с заголовком и текстом.
 */
const W = 320;
const H = 120;

export default function HeroField() {
  const c = project(CLOSEST.lat, CLOSEST.lon);
  const x0 = c.x - W * 0.42;
  const y0 = c.y - H * 0.5;
  const levels = Array.from({ length: BAND_COUNT }, (_, i) => BAND_COUNT - i);
  const dots = LOCATIONS.map((l) => ({ code: l.code, ...project(l.lat, l.lon) })).filter(
    (p) => p.x > x0 && p.x < x0 + W && p.y > y0 && p.y < y0 + H,
  );

  return (
    <div className="a-hf" aria-hidden>
      <div className="a-hf-move">
        <svg
          className="a-hf-svg"
          viewBox={`${Math.round(x0)} ${Math.round(y0)} ${W} ${H}`}
          preserveAspectRatio="xMidYMid slice"
          focusable="false"
        >
          {levels.map((l) => (
            <g key={l} className="a-hf-level a-idle" data-level={l} style={{ ["--l" as string]: l }}>
              <use href={`#a-band-${l}`} className="s" />
              <use href={`#a-band-${l}`} className="f" />
            </g>
          ))}
          <use href="#a-land-all" className="a-hf-land" />
          {dots.map((d) => (
            <rect
              key={d.code}
              x={d.x - 1.2}
              y={d.y - 1.2}
              width="2.4"
              height="2.4"
              className={d.code === CLOSEST.code ? "a-hf-dot a-hf-dot-near" : "a-hf-dot"}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
