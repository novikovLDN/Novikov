"use client";

import { useEffect, useRef } from "react";

/**
 * ASCII-стена бренда.
 *
 * У DedSec визуальный язык собран из дизеринга, ASCII, пиксель-арта и
 * глитча — не из иллюстраций. Здесь это буквально: сетка знаков,
 * которая шумит, а в местах, где проходит «пробой», складывается в
 * плотный блок и гаснет. Читается как взломанный терминал, а не как
 * декоративный фон.
 *
 * Один узел, одна строка текста, перерисовка 14 раз в секунду — не 60:
 * ASCII-шум на полной частоте выглядит грязью, а стоит как полноценная
 * анимация. Вне кадра не считается вовсе.
 */
const GLYPHS = "▓▒░█▄▀■□◼◻/\\|<>*#+=-_:.";
const DENSE = "█▓▒";

export default function AsciiWall({ rows = 14, cols = 60 }: { rows?: number; cols?: number }) {
  const ref = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let last = 0;
    let t = 0;
    let visible = true;

    const draw = () => {
      const out: string[] = [];
      for (let y = 0; y < rows; y++) {
        let line = "";
        for (let x = 0; x < cols; x++) {
          // «Пробой» — диагональная волна, идущая сквозь стену.
          const wave = Math.sin((x * 0.14) + (y * 0.22) - t * 0.06);
          const hole = wave > 0.55;
          if (hole) { line += " "; continue; }
          const dense = wave > 0.2;
          const pool = dense ? DENSE : GLYPHS;
          line += pool[(Math.random() * pool.length) | 0];
        }
        out.push(line);
      }
      node.textContent = out.join("\n");
    };

    if (reduced) { draw(); return; }

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible || now - last < 70) return;
      last = now;
      t += 1;
      draw();
    };

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
    io.observe(node);
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, [rows, cols]);

  return <pre ref={ref} className="b-ascii" aria-hidden />;
}
