"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "./motion";

interface Particle {
  /** Индекс строки — нужен, чтобы красить строку целиком. */
  line: number;
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
  /** Строка или несколько строк. Многострочный вариант обязателен для
   *  заголовка в несколько строк: два отдельных холста подбирают
   *  кегль каждый под свою длину, и строки выходят разного размера. */
  text: string | string[];
  className?: string;
  /** Высота холста в CSS-пикселях — под неё подбирается кегль. */
  height?: number;
  /** Основной тон точек. Акцентная строка — не больше одной в кадре. */
  tone?: "ink" | "accent";
  /** Медленная волна по точкам в покое: надпись «дышит», а не стоит
   *  мёртвой сеткой. */
  idle?: boolean;
  /** Выравнивание строки в холсте. */
  align?: "center" | "left";
  /** Индекс строки, которая целиком набрана акцентом. */
  accentLine?: number;
  /** Сдвиг строк по горизонтали в долях ширины: 0 — по левому краю,
   *  0.14 — на четырнадцать процентов правее. Ступенчатая раскладка
   *  ломает ровный левый край, из-за которого заголовок читается как
   *  обычный блок текста. */
  offsets?: number[];
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
export default function ParticleHeading({
  text,
  className,
  height = 120,
  tone = "ink",
  idle = false,
  align = "center",
  accentLine,
  offsets,
}: ParticleHeadingProps) {
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
    const root = getComputedStyle(document.documentElement);
    const accentColor = root.getPropertyValue("--px-accent").trim() || "#FF6B45";
    const inkColor = styles.color || "#14140F";
    // Акцентная строка целиком коралловая, а вкрапления в ней —
    // наоборот, чернильные: мотив тот же, полярность обратная.
    const ink = tone === "accent" ? accentColor : inkColor;
    const accent = tone === "accent" ? inkColor : accentColor;
    /* Семейство берётся вычисленным: в ctx.font нельзя подставить
       var(--font-mts-wide) — парсер шрифта не знает CSS-переменных и
       молча откатывается на 10px sans-serif. */
    const family = styles.fontFamily || "sans-serif";
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let disposed = false;

    const sample = () => {
      if (disposed) return;
      const width = Math.max(1, Math.floor(wrap.clientWidth));

      /* Offscreen служит дважды: сначала линейкой для подбора кегля,
         потом трафаретом, с которого считываются точки. Размеры ему
         задаются между этими шагами — установка width/height
         сбрасывает контекст, поэтому шрифт назначается заново. */
      const off = document.createElement("canvas");
      const octx = off.getContext("2d", { willReadFrequently: true });
      if (!octx) return;

      const lines = Array.isArray(text) ? text : [text];
      const gap = 1.02; // межстрочный шаг в долях кегля

      // Кегль общий для всех строк: два отдельных холста подбирали бы
      // его каждый под свою длину, и строки вышли бы разного размера.
      const shift = (i: number) => offsets?.[i] ?? 0;
      let fontSize = Math.round((height / lines.length) * 0.86);
      const widest = () => {
        octx.font = `700 ${fontSize}px ${family}`;
        // Сдвинутая строка занимает ширину вместе со своим отступом,
        // иначе она вылезет за холст и обрежется.
        return Math.max(...lines.map((l, i) => octx.measureText(l).width + shift(i) * width));
      };
      while ((widest() > width * 0.98 || fontSize * gap * lines.length > height) && fontSize > 8) {
        fontSize -= 1;
      }

      /* Холст ужимается до фактической высоты набора. `height` —
         это потолок, а не размер: на широкой колонке кегль упирается
         в длину строки, и разница между потолком и набором осталась
         бы пустой полосой под заголовком. */
      const contentH = Math.ceil(fontSize * gap * lines.length + fontSize * 0.34);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(contentH * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${contentH}px`;
      wrap.style.height = `${contentH}px`;

      off.width = width;
      off.height = contentH;
      octx.textBaseline = "middle";
      octx.textAlign = "left";
      octx.font = `700 ${fontSize}px ${family}`;
      octx.fillStyle = "#000";

      /* Шаг сетки пропорционален кеглю. Фиксированный шаг работал,
         пока надпись была средней: на крупном заголовке точки при
         шаге в пять пикселей сливаются в сплошную букву и весь приём
         пропадает, на мелком — рассыпаются в шум. */
      const step = Math.max(3, Math.min(9, Math.round(fontSize / 12)));
      /* Точка — доля шага, а не разность: на мелком кегле разность в
         полтора пикселя оставляла от буквы редкий пунктир, а на
         крупном, наоборот, съедала воздух между точками. */
      const dot = Math.max(2, step * 0.72);

      const lineStep = fontSize * gap;
      const blockH = lineStep * lines.length;
      const top = (contentH - blockH) / 2;
      // Базовые линии строк: по ним частица узнаёт свою строку и,
      // значит, свой цвет.
      const bounds = lines.map((_, i) => top + lineStep * i + lineStep / 2);

      lines.forEach((line, i) => {
        const w = octx.measureText(line).width;
        octx.fillText(line, (align === "left" ? 0 : (width - w) / 2) + shift(i) * width, bounds[i]);
      });

      const data = octx.getImageData(0, 0, width, contentH).data;
      const next: Particle[] = [];
      for (let y = 0; y < contentH; y += step) {
        for (let x = 0; x < width; x += step) {
          if (data[(y * width + x) * 4 + 3] <= 128) continue;
          const angle = Math.random() * Math.PI * 2;
          const dist = 40 + Math.random() * 90;
          let line = 0;
          let best = Infinity;
          bounds.forEach((b, i) => {
            const d = Math.abs(b - y);
            if (d < best) { best = d; line = i; }
          });
          next.push({
            line,
            homeX: x,
            homeY: y,
            x: x + Math.cos(angle) * dist,
            y: y + Math.sin(angle) * dist,
            vx: 0,
            vy: 0,
            size: dot,
            alpha: 0,
            // Каждая шестая точка — вкрапление другого тона: мотив
            // бренда, а не равномерная масса.
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
          // Дыхание: медленная волна вдоль строки. Смещение меньше
          // шага сетки, поэтому буквы не расплываются.
          const wave = idle ? Math.sin(elapsed / 620 + p.homeX / 46) * 0.9 : 0;
          const dx = p.x - mouse.current.x;
          const dy = p.y - mouse.current.y;
          const d = Math.hypot(dx, dy);
          const under = d < erase;

          let ax = (p.homeX - p.x) * 0.08;
          let ay = (p.homeY + wave - p.y) * 0.08;
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
        // Акцентная строка целиком коралловая, в ней вкрапления
        // чернильные — и наоборот.
        const lineIsAccent = accentLine === p.line;
        const base = lineIsAccent ? accentColor : ink;
        const speck = lineIsAccent ? inkColor : accent;
        const want = p.accent ? speck : base;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    Array.isArray(text) ? text.join("|") : text,
    height,
    reduced,
    tone,
    idle,
    align,
    accentLine,
    offsets?.join("|"),
  ]);

  return (
    /* Высоту ставит сам компонент после подбора кегля; `height`
       участвует только как потолок. */
    <div ref={wrapRef} className={className} style={{ minHeight: 1 }}>
      <canvas ref={canvasRef} aria-hidden style={{ display: "block" }} />
      <span className="sr-only">{Array.isArray(text) ? text.join(" ") : text}</span>
    </div>
  );
}
