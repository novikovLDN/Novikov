"use client";

import { useState } from "react";
import { LOCATIONS, citiesLabel, latencyLabel, type Location } from "@/lib/locations";
import { WORLD_BOUNDS, aspect, landPaths, positionIn, viewBox, type Bounds } from "@/lib/world-map";
import { useInView } from "./motion";

/**
 * Карта присутствия.
 *
 * Пришла на смену списку из девятнадцати строк: список отвечал на
 * вопрос «сколько», карта — на вопрос «где», а именно его и задаёт
 * человек, выбирающий страну выхода.
 *
 * Материки набраны точками той же сетки, что и фон первого экрана
 * (src/lib/world-map.ts) — карта продолжает пиксельный мотив, а не
 * приносит на страницу чужой визуальный язык. Ни картографической
 * библиотеки, ни растровой подложки: две дорожки SVG на всю сушу —
 * обычная и подсвеченная вокруг наших точек.
 *
 * Европа — плотная гуща: восемь стран в пределах сорока градусов.
 * Врезка с увеличением здесь не помогает: сетка карты трёхградусная,
 * и в приближении Европа рассыпается в неузнаваемые квадраты. Поэтому
 * зона нажатия маркера сведена к его видимому размеру, наведённый
 * маркер поднимается над соседями, а полный доступ ко всем странам
 * даёт легенда под картой — она подсвечивает точку на карте.
 *
 * Маркеры — элементы HTML поверх холста, а не узлы SVG: так они
 * получают фокус с клавиатуры, подсказку и нормальную зону нажатия
 * без ручной возни с фокус-кольцом внутри SVG.
 */
const { base: LAND_BASE, hot: LAND_HOT } = landPaths(LOCATIONS);

interface CanvasProps {
  bounds: Bounds;
  spots: Location[];
  active: string | null;
  onActive: (code: string | null) => void;
  label: string;
}

function MapCanvas({ bounds, spots, active, onActive, label }: CanvasProps) {
  return (
    <div className="px-map-canvas" style={{ aspectRatio: String(aspect(bounds)) }}>
      <svg viewBox={viewBox(bounds)} className="px-map-svg" role="img" aria-label={label}>
        <path d={LAND_BASE} className="px-map-land" />
        <path d={LAND_HOT} className="px-map-land-hot" />
      </svg>

      {spots.map((l, i) => {
        const p = positionIn(bounds, l.lat, l.lon);
        const isActive = active === l.code;
        // У краёв холста подсказка вышла бы за карту — прижимаем её к
        // своему краю вместо центрирования по маркеру.
        const align = p.xPct < 18 ? "start" : p.xPct > 82 ? "end" : "center";
        const style = {
          left: `${p.xPct}%`,
          top: `${p.yPct}%`,
          ["--px-delay" as string]: `${i * 55}ms`,
        };

        return (
          <button
            key={l.code}
            type="button"
            className={`px-map-pin${isActive ? " px-map-pin-active" : ""}`}
            style={style}
            onMouseEnter={() => onActive(l.code)}
            onMouseLeave={() => onActive(null)}
            onFocus={() => onActive(l.code)}
            onBlur={() => onActive(null)}
            onClick={() => onActive(isActive ? null : l.code)}
            aria-label={`${l.country}, ${citiesLabel(l)}, задержка ${latencyLabel(l)}`}
          >
            <span className="px-map-dot" aria-hidden />
            <span className={`px-map-tip px-map-tip-${align}`} aria-hidden>
              <span className="px-map-tip-country">{l.country}</span>
              <span className="px-map-tip-meta">
                {citiesLabel(l)} · {latencyLabel(l)}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function PresenceMap() {
  const [ref, inView] = useInView<HTMLDivElement>(0.15);
  const [active, setActive] = useState<string | null>(null);

  return (
    <div ref={ref} className={`px-map${inView ? " px-map-in" : ""}`}>
      <MapCanvas
        bounds={WORLD_BOUNDS}
        spots={LOCATIONS}
        active={active}
        onActive={setActive}
        label={`Карта присутствия: серверы в ${LOCATIONS.length} странах`}
      />

      <ul className="px-map-legend">
        {LOCATIONS.map((l) => (
          <li key={l.code}>
            <button
              type="button"
              className={`px-map-chip${active === l.code ? " px-map-chip-active" : ""}`}
              onMouseEnter={() => setActive(l.code)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(l.code)}
              onBlur={() => setActive(null)}
            >
              <span className="px-map-chip-code" aria-hidden>{l.code}</span>
              {l.country}
              <span className="px-map-chip-latency px-num">{latencyLabel(l)}</span>
            </button>
          </li>
        ))}
      </ul>

    </div>
  );
}
