"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "./motion";

interface Particle {
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  /** Текущая непрозрачность и её цель: под курсором точка гаснет. */
  alpha: number;
  accent: boolean;
  delay: number;
  born: number;
}

interface ParticleHeadingProps {
  text: string;
  className?: string;
  /** Высота холста в CSS-пикселях — под неё подбирается кегль. */
  height?: number;
}

/**
 * Заголовок, набранный точками вместо шрифта, — фирменный пиксельный
 * мотив, доведённый до текста.
 *
 * Курсор работает как ластик: точки под ним разлетаются и гаснут,
 * буква на мгновение исчезает, а как только курсор ушёл — точки
 * пружинят на место и проявляются обратно. При первом появлении в
 * кадре надпись «дописывается» слева направо.
 *
 * Canvas, а не DOM: полторы-две тысячи независимо анимируемых узлов;
 * CSS-переход на каждом убил бы кадровую частоту.
 *
 * Настоящий текст остаётся в разметке — холст помечен aria-hidden,
 * рядом лежит та же строка для скринридера и поиска.
 */
export default function ParticleHeading({ text, className, height = 120 }: ParticleHeadingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const particles = useRef<Particle[]>([]);
  const mouse = useRef({ x: -9999, y: -9999 });
  const raf = useRef(0);
  const startTime = useRef(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const styles = getComputedStyle(wrap);
    const ink = styles.color || "#14140F";
    const accent =
      getComputedStyle(document.documentElement).getPropertyValue("--px-accent").trim() || "#FF6B45";
    /* Семейство берётся вычисленным: в ctx.font нельзя подставить
       var(--font-mts-wide) — парсер шрифта не знает CSS-переменных и
       молча откатывается на 10px sans-serif. */
    const family = styles.fontFamily || "sans-serif";
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let disposed = false;

    const sample = () => {
      if (disposed) return;
      const width = Math.max(1, Math.floor(wrap.clientWidth));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const off = document.createElement("canvas");
      off.width = width;
      off.height = height;
      const octx = off.getContext("2d", { willReadFrequently: true });
      if (!octx) return;

      let fontSize = Math.round(height * 0.82);
      octx.textBaseline = "middle";
      octx.textAlign = "left";
      const measure = () => {
        octx.font = `700 ${fontSize}px ${family}`;
        return octx.measureText(text).width;
      };
      while (measure() > width * 0.96 && fontSize > 8) fontSize -= 1;

      /* Шаг сетки точек считается от итогового кегля, а не от высоты
         холста: на узком экране длинное слово ужимается, и точки
         прежнего шага складываются в кашу вместо букв. Пять пикселей
         на крупном кегле, три — на мелком. */
      const step = fontSize >= 72 ? 5 : fontSize >= 44 ? 4 : 3;
      /* Точка меньше шага — между точками остаётся воздух, иначе это
         снова сплошная буква. Но не вдвое меньше: на мелком шаге
         тонкая точка даёт полую, выцветшую надпись. */
      const dot = Math.max(1.8, step - 1.4);

      octx.fillStyle = "#000";
      octx.font = `700 ${fontSize}px ${family}`;
      const textWidth = octx.measureText(text).width;
      octx.fillText(text, (width - textWidth) / 2, height / 2);

      const data = octx.getImageData(0, 0, width, height).data;
      const next: Particle[] = [];
      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          if (data[(y * width + x) * 4 + 3] <= 128) continue;
          const angle = Math.random() * Math.PI * 2;
          const dist = 40 + Math.random() * 90;
          next.push({
            homeX: x,
            homeY: y,
            x: x + Math.cos(angle) * dist,
            y: y + Math.sin(angle) * dist,
            vx: 0,
            vy: 0,
            size: dot,
            alpha: 0,
            // Каждая шестая точка — акцентная: мотив бренда, а не
            // равномерная серая масса.
            accent: Math.random() < 0.17,
            delay: (x / width) * 620,
            born: -1,
          });
        }
      }
      particles.current = next;
      startTime.current = 0;
    };

    // Шрифт может доехать позже первого кадра: измерять по фолбэку —
    // значит нарисовать надпись другой ширины, чем увидит читатель.
    if (document.fonts?.ready) {
      document.fonts.ready.then(sample).catch(() => sample());
    }
    sample();

    let resizeT: ReturnType<typeof setTimeout>;
    let lastWidth = wrap.clientWidth;
    const onResize = () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(() => {
        // Появление адресной строки на мобильных меняет высоту, а не
        // ширину: пересчитывать точки на это событие незачем.
        if (wrap.clientWidth === lastWidth) return;
        lastWidth = wrap.clientWidth;
        sample();
      }, 160);
    };
    window.addEventListener("resize", onResize);

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onLeave = () => { mouse.current = { x: -9999, y: -9999 }; };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    let visible = false;
    const io = new IntersectionObserver(
      (entries) => { visible = entries[0]?.isIntersecting ?? false; },
      { threshold: 0.1 }
    );
    io.observe(wrap);

    // Радиус ластика и сила разлёта. Радиус заметно больше кегля:
    // курсор должен стирать слово, а не отдельную точку.
    const erase = 74;
    const push = 3.4;

    const draw = (t: number) => {
      raf.current = requestAnimationFrame(draw);
      if (!visible) return;
      if (!startTime.current) startTime.current = t;
      const elapsed = t - startTime.current;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let color = "";
      for (const p of particles.current) {
        if (p.born < 0) {
          if (elapsed < p.delay) continue;
          p.born = elapsed;
        }

        if (reduced) {
          p.x = p.homeX;
          p.y = p.homeY;
          p.alpha = 1;
        } else {
          const dx = p.x - mouse.current.x;
          const dy = p.y - mouse.current.y;
          const d = Math.hypot(dx, dy);
          const under = d < erase;

          let ax = (p.homeX - p.x) * 0.08;
          let ay = (p.homeY - p.y) * 0.08;
          if (under && d > 0.01) {
            const f = (1 - d / erase) * push;
            ax += (dx / d) * f;
            ay += (dy / d) * f;
          }
          p.vx = (p.vx + ax) * 0.87;
          p.vy = (p.vy + ay) * 0.87;
          p.x += p.vx;
          p.y += p.vy;

          // Гаснет быстро, возвращается мягко: исчезновение должно
          // успевать за курсором, проявление — не мигать.
          const target = under ? Math.max(0, d / erase - 0.15) : 1;
          p.alpha += (target - p.alpha) * (target < p.alpha ? 0.35 : 0.08);
        }

        if (p.alpha < 0.02) continue;
        const want = p.accent ? accent : ink;
        if (want !== color) {
          color = want;
          ctx.fillStyle = want;
        }
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      ctx.globalAlpha = 1;
    };

    raf.current = requestAnimationFrame(draw);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      io.disconnect();
      clearTimeout(resizeT);
    };
  }, [text, height, reduced]);

  return (
    <div ref={wrapRef} className={className} style={{ height }}>
      <canvas ref={canvasRef} aria-hidden style={{ display: "block" }} />
      <span className="sr-only">{text}</span>
    </div>
  );
}
