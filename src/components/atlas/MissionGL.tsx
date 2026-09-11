"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { mountStage } from "./gl/stage";
import type { MissionLive } from "./gl/mission";

/**
 * Раздел 07 «Миссия и компания» — «хаос → порядок → свобода»: облако
 * частиц-людей по мере прокрутки собирается в сферу-сеть, по связям
 * бежит свет; на уходе раздела сеть мягко раскрывается.
 *
 * ПРОКРУТКА. Компонент сам читает прогресс своего раздела —
 * ближайшего предка `[data-sheet]`: 0, когда раздел входит снизу, 1,
 * когда ушёл вверх. Сцена сглаживает его по времени.
 *
 * ЗАПАСНОЙ РЕЖИМ. reduced-motion и ?static=1 — конечный собранный
 * кадр (без цикла). Экономия трафика и нет WebGL/WebGPU —
 * `data-mode="poster"`: заглушку рисует CSS (`--poster`, если передан,
 * и переменные `--mission-x/-y/-r`).
 */
type Props = {
  className?: string;
  /** Картинка для режима без трёхмерной сцены (экономия трафика, нет GPU). */
  poster?: string;
  /** Центр сферы в долях холста. */
  center?: [number, number];
  /** Диаметр собранной сферы в долях короткой стороны холста. */
  size?: number;
  /** Телефон: меньше частиц, облако компактнее. По умолчанию — по ширине окна ≤ 720px. */
  compact?: boolean;
};

/** Доля собранной сферы в описанной сфере сцены (1 / 1,12). */
const SPHERE = 1 / 1.12;

export default function MissionGL({ className, poster, center = [0.5, 0.5], size = 0.72, compact }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const cvs = useRef<HTMLCanvasElement>(null);
  const live = useRef<MissionLive>({ progress: 0 });
  const [cx, cy] = center;

  // Прогресс раздела. Чтение геометрии — по событию прокрутки, не
  // каждый кадр; сцена сама сглаживает скачки.
  useEffect(() => {
    const h = host.current;
    if (!h) return;
    const sheet = (h.closest("[data-sheet]") as HTMLElement | null) ?? h;
    const read = () => {
      const r = sheet.getBoundingClientRect();
      const vh = window.innerHeight;
      live.current.progress = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
    };
    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    return () => {
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
  }, []);

  useEffect(() => {
    const h = host.current;
    const c = cvs.current;
    if (!h || !c) return;
    const small = compact ?? matchMedia("(max-width: 720px)").matches;
    const liveRef = live.current;
    return mountStage(h, c, {
      scene: () => import("./gl/mission").then((m) => m.makeMission(liveRef, small)),
      // Постер — только для режима без GPU; при reduced-motion рисуется
      // конечный кадр сцены.
      hasPoster: false,
      budget: small ? 25_000 : 60_000,
      place: (w, hh) => ({ cx, cy, r: (Math.min(w, hh) * size) / 2 }),
    });
  }, [cx, cy, size, compact]);

  const vars = {
    "--mission-x": `${cx * 100}%`,
    "--mission-y": `${cy * 100}%`,
    "--mission-r": `${(size * SPHERE * 100).toFixed(1)}%`,
    ...(poster ? { "--poster": `url("${poster}")` } : null),
  } as CSSProperties;

  return (
    <div ref={host} className={className} data-mission="" style={vars} aria-hidden>
      <canvas ref={cvs} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
}
