"use client";

import { useEffect, useState } from "react";
import Icon from "./Icon";
import { LOCATIONS } from "@/lib/locations";
import { DEVICE_LIMIT } from "@/lib/plans";
import { useReducedMotion } from "./motion";
import { useTilt } from "./effects";

/**
 * Правый блок первого экрана — живая сцена соединения.
 *
 * Раньше здесь стояла статичная карточка кабинета: честная, но
 * плоская, и в ней ничего не происходило. Сцена показывает то же
 * самое — что соединение работает, — но действием: между устройством
 * и выходным сервером идут пакеты, страна периодически меняется, а
 * задержка пересчитывается вместе с ней.
 *
 * Объём набирается слоями, а не тенью: за карточкой стоят два
 * смещённых плана (пиксельная решётка и подложка), вся стопка
 * наклоняется за курсором и медленно качается. Слои двигаются с
 * разной амплитудой — отсюда ощущение глубины.
 *
 * Ни одной библиотеки: пакеты — это восемь span-ов с CSS-анимацией,
 * график — набор столбиков, смена города — обычный интервал. При
 * prefers-reduced-motion остаётся статичная сцена без движения.
 */
const ROUTE = LOCATIONS.slice(0, 5);
const BARS = [32, 41, 36, 48, 44, 39, 52, 46, 58, 51, 44, 62, 55, 49, 68, 60, 53, 74, 66, 58];

export default function HeroStage() {
  const tiltRef = useTilt<HTMLDivElement>(6);
  const reduced = useReducedMotion();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % ROUTE.length), 3600);
    return () => clearInterval(id);
  }, [reduced]);

  const spot = ROUTE[idx];

  return (
    <div className="px-stage px-tilt-scene">
      {/* Задние планы: решётка и подложка. Они и создают объём —
          каждый смещён и качается своей амплитудой. */}
      <span className="px-stage-grid" aria-hidden />
      <span className="px-stage-back" aria-hidden />

      <div ref={tiltRef} className="px-stage-card px-tilt px-spot">
        <div className="px-stage-head">
          <span className="px-stage-status">
            <span className="px-status-dot" aria-hidden />
            Соединение активно
          </span>
          <span className="px-tag">Plus</span>
        </div>

        {/* Маршрут: устройство → выходной сервер, между ними идут
            пакеты. Это единственная анимация сцены, которая
            рассказывает содержание, а не просто движется. */}
        <div className="px-stage-route" aria-hidden>
          <span className="px-stage-node">
            <Icon name="macos" size={16} />
          </span>

          <span className="px-stage-wire">
            {Array.from({ length: 8 }, (_, i) => (
              <span key={i} className="px-stage-packet" style={{ animationDelay: `${i * 0.28}s` }} />
            ))}
          </span>

          <span className="px-stage-node px-stage-node-server">
            <Icon name="globe" size={16} />
          </span>
        </div>

        <p className="px-stage-route-label" aria-live="polite">
          Ваше устройство → <span className="px-stage-city">{spot.cities[0]}</span>
        </p>

        <div className="px-stage-figures">
          <div>
            <p className="px-rail-metric-label">Задержка</p>
            <p className="px-stage-latency px-num">
              {spot.latencyMs}
              <span className="px-stage-unit">мс</span>
            </p>
          </div>
          <div>
            <p className="px-rail-metric-label">Страна</p>
            <p className="px-stage-country">{spot.country}</p>
          </div>
          <div>
            <p className="px-rail-metric-label">Устройства</p>
            <p className="px-stage-country">до {DEVICE_LIMIT}</p>
          </div>
        </div>

        <div className="px-stage-chart" aria-hidden>
          {BARS.map((h, i) => (
            <span key={i} style={{ ["--h" as string]: `${h}%`, ["--i" as string]: i }} />
          ))}
        </div>

        <p className="px-stage-foot">Так выглядит соединение после регистрации</p>
      </div>
    </div>
  );
}
