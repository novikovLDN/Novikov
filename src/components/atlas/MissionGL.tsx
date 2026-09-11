"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { mountStage } from "./gl/stage";

/**
 * Сфера-сеть раздела 07 «Миссия и компания» в реальном времени —
 * замена «атома» из Blender. Мягкие узлы, тонкие нити к соседям,
 * кобальтовое стеклянное ядро; сеть дышит волной и медленно
 * вращается, по нитям изредка пробегает свет.
 *
 * Запасной режим: reduced-motion и ?static=1 — один неподвижный кадр
 * (или постер, если передан); экономия трафика и нет WebGL — постер
 * (`data-mode="poster"`, картинку задаёт CSS через `--poster`).
 */
type Props = {
  className?: string;
  /** Необязательный постер для режима без трёхмерной сцены. */
  poster?: string;
  /** Центр объекта в долях холста. */
  center?: [number, number];
  /** Диаметр объекта в долях короткой стороны холста. */
  size?: number;
};

export default function MissionGL({ className, poster, center = [0.5, 0.5], size = 0.72 }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const cvs = useRef<HTMLCanvasElement>(null);
  const [cx, cy] = center;

  useEffect(() => {
    const h = host.current;
    const c = cvs.current;
    if (!h || !c) return;
    return mountStage(h, c, {
      scene: () => import("./gl/mission").then((m) => m.buildMission),
      hasPoster: !!poster,
      budget: 60_000,
      place: (w, hh) => ({ cx, cy, r: (Math.min(w, hh) * size) / 2 }),
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
