"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { mountStage, type StageApi } from "./gl/stage";
import type { OrbLive, OrbState, OrbTheme } from "./gl/orb";
// Появление по [data-mode] и CSS-сфера для запасного режима.
import "@/app/orb-atlas.css";

/**
 * «Ядро связи» для рабочих экранов — стеклянная кобальтовая сфера,
 * три наклонные орбиты с бегущими пакетами. Одна сцена на страницу.
 *
 * `state` меняется без пересборки сцены: параметры плавно тянутся к
 * новому состоянию (~0,8 с). `theme` пересобирает сцену (материалы
 * другие) — это смена экрана, а не событие.
 *
 * Запасной режим: reduced-motion и ?static=1 — один неподвижный кадр;
 * экономия трафика и нет WebGL/WebGPU — `data-mode="poster"`, сфера
 * рисуется CSS-градиентом по `--orb-x`, `--orb-y`, `--orb-r`
 * (правило — в общем CSS, см. отчёт к задаче).
 */
type Props = {
  className?: string;
  /** dark — тёмные и кобальтовые плиты, light — белая бумага. */
  theme?: OrbTheme;
  /** active — подписка работает, idle — ожидание, off — истекла. */
  state?: OrbState;
  /** Диаметр объекта с орбитами в долях короткой стороны холста. */
  size?: number;
  /** Центр объекта в долях холста. */
  center?: [number, number];
};

/** Доля радиуса стекла в описанной сфере сцены (0,62 / 1,3). */
const GLASS = 0.62 / 1.3;

export default function OrbGL({ className, theme = "light", state = "active", size = 0.8, center = [0.5, 0.5] }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const cvs = useRef<HTMLCanvasElement>(null);
  const live = useRef<OrbLive>({ state });
  const api = useRef<StageApi | null>(null);
  const [cx, cy] = center;

  useEffect(() => {
    live.current.state = state;
    api.current?.redraw();
  }, [state]);

  useEffect(() => {
    const h = host.current;
    const c = cvs.current;
    if (!h || !c) return;
    const liveState = live.current;
    const off = mountStage(h, c, {
      scene: () => import("./gl/orb").then((m) => m.makeOrb(theme, liveState)),
      hasPoster: false,
      budget: 30_000,
      place: (w, hh) => ({ cx, cy, r: (Math.min(w, hh) * size) / 2 }),
      bind: (a) => {
        api.current = a;
      },
    });
    return () => {
      api.current = null;
      off();
    };
  }, [theme, cx, cy, size]);

  const vars = {
    "--orb-x": `${cx * 100}%`,
    "--orb-y": `${cy * 100}%`,
    "--orb-r": `${(size * GLASS * 100).toFixed(1)}%`,
  } as CSSProperties;

  return (
    <div ref={host} className={className} data-orb="" data-theme={theme} data-state={state} style={vars} aria-hidden>
      <canvas ref={cvs} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
}
