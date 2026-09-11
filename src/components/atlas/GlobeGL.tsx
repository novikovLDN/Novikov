"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { mountStage } from "./gl/stage";

/**
 * Глобус серверов раздела 03 в реальном времени (three.js, WebGPU с
 * уходом на WebGL 2). Замена петли Blender: видео 30 fps владелец
 * назвал резким — здесь кадр рисуется на частоте экрана, движение
 * идёт по реальному времени.
 *
 * three.js и сцена — отдельные чанки, грузятся за экран до блока.
 * Корень получает `data-mode="gl"` после первого кадра или
 * `data-mode="poster"` в запасном режиме (reduced-motion, ?static=1,
 * экономия трафика, нет WebGL) — постер задаёт CSS через `--poster`,
 * как у `Reel`.
 */
type Props = {
  className?: string;
  /** Неподвижный кадр для запасного режима, например `/media/globe2.jpg`. */
  poster?: string;
  /** Центр глобуса в долях холста на широком кадре. На узком — по центру. */
  center?: [number, number];
  /** Диаметр глобуса в долях высоты холста на широком кадре. */
  size?: number;
};

export default function GlobeGL({ className, poster, center = [0.62, 0.5], size = 0.84 }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const cvs = useRef<HTMLCanvasElement>(null);
  const [cx, cy] = center;

  useEffect(() => {
    const h = host.current;
    const c = cvs.current;
    if (!h || !c) return;
    return mountStage(h, c, {
      scene: () => import("./gl/globe").then((m) => m.buildGlobe),
      hasPoster: !!poster,
      budget: 150_000,
      place: (w, hh) =>
        w >= hh * 1.05
          ? { cx, cy, r: Math.min((hh * size) / 2, w * 0.34) }
          : { cx: 0.5, cy: 0.5, r: Math.min(w * 0.46, hh * 0.44) },
    });
  }, [poster, cx, cy, size]);

  return (
    <div
      ref={host}
      className={className}
      style={poster ? ({ "--poster": `url("${poster}")` } as CSSProperties) : undefined}
      aria-hidden
    >
      <canvas ref={cvs} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
}
