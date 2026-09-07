"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "./motion";

/**
 * Служебная метка, которая раскодируется из шума при появлении.
 *
 * Приём применён именно к меткам, а не к заголовкам: короткая строка
 * капсом читается как показание прибора, и «загрузка» ей к лицу.
 * Крупный заголовок при таком обращении превращается в мельтешение,
 * а его как раз нужно прочитать первым.
 *
 * Итоговый текст лежит в разметке с самого начала: без скрипта и при
 * пониженной анимации метка просто написана. Шум подставляется только
 * после того, как наблюдатель подтвердил, что элемент в кадре, — и
 * длится меньше секунды.
 */
const POOL = "АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ0123456789/\\<>*#";

export default function ScrambleLabel({
  text,
  className = "b-label b-label-sys",
  as: Tag = "p",
}: {
  text: string;
  className?: string;
  as?: "p" | "span" | "h2";
}) {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || reduced) return;

    let raf = 0;
    let started = false;
    const chars = [...text];

    const run = () => {
      const start = performance.now();
      const total = 520 + chars.length * 26;
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / total);
        // Знаки встают на места слева направо.
        const settled = Math.floor(p * chars.length * 1.35);
        node.textContent = chars
          .map((c, i) => {
            if (i < settled || c === " ") return c;
            return POOL[(Math.random() * POOL.length) | 0];
          })
          .join("");
        if (p < 1) raf = requestAnimationFrame(tick);
        else node.textContent = text;
      };
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || started) return;
        started = true;
        io.disconnect();
        run();
      },
      { threshold: 0.6 },
    );
    io.observe(node);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [text, reduced]);

  return (
    // @ts-expect-error — общий ref для p/span/h2
    <Tag ref={ref} className={className}>
      {text}
    </Tag>
  );
}
