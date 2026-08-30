"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Кластер кубиков — фирменный мотив всей системы.
 *
 * Фигура задаётся строковой картой: единицей отмечены занятые ячейки
 * сетки. Такой формат читается глазом прямо в коде, поэтому силуэт
 * можно править, не пересчитывая координаты руками.
 *
 * Как это живёт:
 *   - каждые 1.5–3 с один-три кубика перескакивают в соседнюю ячейку;
 *   - шаг строго по сетке, поэтому кубики всегда стоят в её ячейках;
 *   - кубик не уходит дальше одной ячейки от своего дома — силуэт
 *     фигуры остаётся узнаваемым, кластер не расползается;
 *   - занятые ячейки отслеживаются, поэтому кубики не наезжают;
 *   - при перескоке кубик иногда меняет оттенок на кирпичный и обратно;
 *   - два-три кубика дышат в собственном медленном ритме.
 *
 * Инженерные ограничения:
 *   - меняются только --c/--r и класс тона; перемещение и пульсация
 *     рисуются CSS на transform/opacity, без единого layout-свойства;
 *   - начальная раскладка и тона детерминированы: случайность на
 *     первом рендере разошлась бы между сервером и клиентом и дала
 *     ошибку гидрации;
 *   - при prefers-reduced-motion цикл не запускается вовсе.
 */

/** Восходящая диагональная волна — «ускорение». 22 кубика. */
const DEFAULT_SHAPE = [
  "......XX",
  ".....XXX",
  "....XXX.",
  "...XXX..",
  "..XXX...",
  ".XXX....",
  "XXX.....",
  "XX......",
];

type Tone = "accent" | "brick" | "brick2";

interface Cube {
  id: number;
  /** текущая ячейка */
  c: number;
  r: number;
  /** домашняя ячейка — от неё считается допустимый радиус блуждания */
  hc: number;
  hr: number;
  tone: Tone;
  /** прозрачность: лёгкий разброс не даёт фигуре выглядеть плоской заливкой */
  o: number;
  breathe: boolean;
  breatheMs: number;
  breatheDelay: number;
  /** задержка перехода — из неё складывается стаггер группового перескока */
  delay: number;
}

const DIRS: ReadonlyArray<readonly [number, number]> = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
];

/** Детерминированный псевдослучайный ряд: одинаков на сервере и клиенте. */
function seeded(n: number): number {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function buildCubes(shape: string[]): Cube[] {
  const cubes: Cube[] = [];
  let id = 0;
  shape.forEach((row, r) => {
    row.split("").forEach((ch, c) => {
      if (ch !== "X") return;
      const s = seeded(id + 1);
      // Кирпичные кубики разрежены по фигуре, а не собраны в углу:
      // они дают глубину, но не читаются как второе пятно.
      const tone: Tone = s > 0.82 ? "brick" : s > 0.72 ? "brick2" : "accent";
      const breathe = id % 7 === 3;
      cubes.push({
        id,
        c, r, hc: c, hr: r,
        tone,
        o: 0.74 + seeded(id + 41) * 0.26,
        breathe,
        breatheMs: 3600 + Math.round(seeded(id + 13) * 1600),
        breatheDelay: Math.round(seeded(id + 29) * 2000),
        delay: 0,
      });
      id += 1;
    });
  });
  return cubes;
}

export default function CubeCluster({
  shape = DEFAULT_SHAPE,
  className,
  /** Кубики перекрашиваются в статусный зелёный — состояние «подключено». */
  connected = false,
}: {
  shape?: string[];
  className?: string;
  connected?: boolean;
}) {
  const initial = useMemo(() => buildCubes(shape), [shape]);
  const [cubes, setCubes] = useState<Cube[]>(initial);

  const cols = shape[0]?.length ?? 0;
  const rows = shape.length;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      setCubes((prev) => {
        const occupied = new Set(prev.map((q) => `${q.c},${q.r}`));
        const next = prev.map((q) => ({ ...q, delay: 0 }));

        // Один-три кубика за такт: одиночное движение читается как
        // случайность, четыре и больше — как перестроение всей фигуры.
        const moving = 1 + Math.floor(Math.random() * 3);
        const order = next.map((_, i) => i).sort(() => Math.random() - 0.5);

        let moved = 0;
        for (const idx of order) {
          if (moved >= moving) break;
          const cube = next[idx];

          const candidates = DIRS
            .map(([dc, dr]) => ({ c: cube.c + dc, r: cube.r + dr }))
            .filter((p) => p.c >= 0 && p.r >= 0 && p.c < cols && p.r < rows)
            // Не дальше одной ячейки от дома — иначе фигура расползётся.
            .filter((p) => Math.abs(p.c - cube.hc) <= 1 && Math.abs(p.r - cube.hr) <= 1)
            .filter((p) => !occupied.has(`${p.c},${p.r}`));

          if (candidates.length === 0) continue;

          const target = candidates[Math.floor(Math.random() * candidates.length)];
          occupied.delete(`${cube.c},${cube.r}`);
          occupied.add(`${target.c},${target.r}`);
          cube.c = target.c;
          cube.r = target.r;
          cube.delay = moved * 90;

          if (Math.random() < 0.22) {
            cube.tone = cube.tone === "accent" ? "brick" : "accent";
          }
          moved += 1;
        }

        return next;
      });

      timer = setTimeout(tick, 1500 + Math.random() * 1500);
    };

    timer = setTimeout(tick, 900);
    return () => clearTimeout(timer);
  }, [cols, rows]);

  return (
    <div
      className={`px-cluster${className ? ` ${className}` : ""}`}
      style={{ ["--px-cols" as string]: cols, ["--px-rows" as string]: rows }}
      aria-hidden="true"
    >
      {cubes.map((cube) => (
        <span
          key={cube.id}
          className={[
            "px-cube",
            connected ? "px-cube-good" : cube.tone === "brick" ? "px-cube-brick" : cube.tone === "brick2" ? "px-cube-brick-2" : "",
            cube.breathe ? "px-cube-breathe" : "",
          ].filter(Boolean).join(" ")}
          style={{
            ["--c" as string]: cube.c,
            ["--r" as string]: cube.r,
            ["--o" as string]: cube.o.toFixed(2),
            ["--px-breathe" as string]: `${cube.breatheMs}ms`,
            ["--px-breathe-delay" as string]: `${cube.breatheDelay}ms`,
            transitionDelay: `${cube.delay}ms`,
          }}
        >
          <span className="px-cube-face" />
        </span>
      ))}
    </div>
  );
}

/**
 * Мини-кластер: четыре кубика 2×2. Тот же язык в малой дозе — буллет
 * списка, разделитель, метка пустого состояния.
 */
export function MiniCubes({ className }: { className?: string }) {
  return (
    <span className={`px-mini${className ? ` ${className}` : ""}`} aria-hidden="true">
      <span /><span /><span /><span />
    </span>
  );
}
