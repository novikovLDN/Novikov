"use client";

import { useCallback, useRef } from "react";

/**
 * Текст, который осыпается в шум при наведении и собирается обратно.
 *
 * Приём точечный: он повешен на названия стран в атласе, где под
 * курсором и так ожидается отклик. На абзацах его быть не должно —
 * текст, рассыпающийся под курсором читателя, невозможно читать.
 *
 * Исходная строка остаётся в разметке и восстанавливается по уходу
 * курсора; при пониженной анимации не запускается вовсе.
 */
const POOL = "АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ01/\\<>*#";

export default function ScrambleOnHover({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const raf = useRef(0);

  const start = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    cancelAnimationFrame(raf.current);

    const chars = [...text];
    const began = performance.now();
    const total = 380;

    const tick = (now: number) => {
      const p = Math.min(1, (now - began) / total);
      const settled = Math.floor(p * chars.length * 1.4);
      node.textContent = chars
        .map((c, i) => (i < settled || c === " " ? c : POOL[(Math.random() * POOL.length) | 0]))
        .join("");
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else node.textContent = text;
    };
    raf.current = requestAnimationFrame(tick);
  }, [text]);

  const stop = useCallback(() => {
    cancelAnimationFrame(raf.current);
    if (ref.current) ref.current.textContent = text;
  }, [text]);

  return (
    <span ref={ref} className={className} onPointerEnter={start} onPointerLeave={stop}>
      {text}
    </span>
  );
}
