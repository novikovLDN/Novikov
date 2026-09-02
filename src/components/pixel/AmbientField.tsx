"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "./motion";

/**
 * Фоновое поле частиц по боковым полям страницы.
 *
 * Оживает не только содержимое, но и пространство за ним: пока
 * страница едет, пиксели по краям летят навстречу движению, будто
 * читатель проходит сквозь среду. Остановился — частицы продолжают
 * медленный дрейф вверх.
 *
 * Почему только по краям: в колонке с текстом любое движение
 * соперничает с чтением. Поля же обычно простаивают, и именно они
 * дают ощущение глубины, ничего не отнимая у содержания.
 *
 * Полосы считаются от фактической ширины окна: пока поле уже 56px
 * (телефоны и узкие планшеты), поле не рисуется вовсе — частицы
 * налезали бы на текст.
 *
 * Canvas и один rAF: полторы сотни квадратов в DOM обошлись бы
 * дороже, чем весь остальной motion-слой вместе взятый.
 */
const SHELL_MAX = 1200; // ширина контентной колонки, как --px-shell
const MIN_BAND = 56;

interface Dot {
  x: number;
  y: number;
  size: number;
  speed: number;
  alpha: number;
  accent: boolean;
}

export default function AmbientField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reduced) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const root = getComputedStyle(document.documentElement);
    const accent = root.getPropertyValue("--px-accent").trim() || "#FF6B45";
    const ink = "20, 20, 15";
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let w = 0;
    let h = 0;
    let band = 0;
    let dots: Dot[] = [];

    const build = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      band = Math.max(0, (w - SHELL_MAX) / 2);

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      if (band < MIN_BAND) { dots = []; return; }

      // Плотность привязана к площади полей, а не к числу «на глаз»:
      // на широком мониторе поля вдвое больше, и частиц там должно
      // быть столько же на квадратный сантиметр.
      const count = Math.round((band * h) / 9000);
      dots = Array.from({ length: Math.min(160, count) }, () => spawn(Math.random() * h));
    };

    const spawn = (y: number): Dot => {
      const right = Math.random() > 0.5;
      const inset = Math.random() * band;
      return {
        x: right ? w - inset : inset,
        y,
        size: Math.random() < 0.22 ? 3 : 2,
        speed: 6 + Math.random() * 16,
        alpha: 0.10 + Math.random() * 0.22,
        accent: Math.random() < 0.18,
      };
    };

    let last = performance.now();
    let lastScroll = window.scrollY;
    let push = 0;
    let frame = 0;

    const draw = (t: number) => {
      frame = requestAnimationFrame(draw);
      const dt = Math.min(64, t - last) / 1000;
      last = t;

      const y = window.scrollY;
      // Прокрутка вниз гонит частицы вверх — среда идёт навстречу.
      push = push * 0.9 - (y - lastScroll) * 2.6;
      lastScroll = y;

      if (!dots.length) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      for (const d of dots) {
        d.y -= (d.speed + push) * dt;
        if (d.y < -12) d.y = h + 12;
        else if (d.y > h + 12) d.y = -12;

        ctx.fillStyle = d.accent
          ? `rgba(255, 107, 69, ${d.alpha + 0.08})`
          : `rgba(${ink}, ${d.alpha})`;
        ctx.fillRect(d.x, d.y, d.size, d.size);
      }
    };

    let resizeT: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(build, 180);
    };

    build();
    frame = requestAnimationFrame(draw);
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeT);
    };
  }, [reduced]);

  return <canvas ref={canvasRef} className="px-ambient" aria-hidden />;
}
