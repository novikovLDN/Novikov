"use client";

import { useEffect, useRef, type CSSProperties } from "react";

/**
 * 06 — ноутбук открывается по прокрутке (владелец, 11.09.2026: «хочу,
 * чтобы при прокрутке открывался MacBook»).
 *
 * Кадры из Blender (сцена «AtlasLaptop», public/media/laptop/f00…f59.webp)
 * перелистываются прокруткой, как на сайтах Apple. Прогресс: если раздел
 * с [data-scrub] закреплён (выше полутора окон) — прокрутка раздела; иначе
 * (телефон) — проход ноутбука через окно.
 *
 * СТОИМОСТЬ. Кадры грузятся за полтора экрана до блока и декодируются
 * заранее (img.decode), холст перерисовывается только при смене кадра и
 * только в rAF. Пока кадры едут, под холстом лежит постер. reduced-motion,
 * экономия трафика и ?static=1 — только постер (открытый ноутбук).
 */
const N = 60;
const frameSrc = (k: number) => `/media/laptop/f${String(k).padStart(2, "0")}.webp`;
const POSTER = "/media/laptop/poster.jpg";

export default function LaptopScrub({ className }: { className: string }) {
  const box = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = box.current;
    const canvas = cv.current;
    if (!host || !canvas) return;
    const root = document.documentElement;
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    const still =
      root.hasAttribute("data-static") ||
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      nav.connection?.saveData === true;
    const ctx = canvas.getContext("2d");
    if (still || !ctx) {
      host.setAttribute("data-mode", "poster");
      return;
    }

    const frames: (HTMLImageElement | undefined)[] = new Array(N);
    const pin = host.closest<HTMLElement>("[data-scrub]");
    let started = false;
    let drawn = -1;
    let raf = 0;

    const progress = () => {
      const vh = window.innerHeight;
      if (pin && pin.offsetHeight > vh * 1.5) {
        const r = pin.getBoundingClientRect();
        return -r.top / Math.max(1, r.height - vh);
      }
      const r = host.getBoundingClientRect();
      return (vh * 0.9 - r.top) / (vh * 0.65);
    };
    // Ближайший уже загруженный кадр — чтобы на медленной сети не было дыр.
    const nearest = (k: number) => {
      for (let d = 0; d < N; d++) {
        if (frames[k - d]) return k - d;
        if (frames[k + d]) return k + d;
      }
      return -1;
    };
    const draw = () => {
      raf = 0;
      const p = Math.min(1, Math.max(0, progress()));
      const k = nearest(Math.round(p * (N - 1)));
      if (k < 0 || k === drawn) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(frames[k] as HTMLImageElement, 0, 0, canvas.width, canvas.height);
      drawn = k;
      if (!host.hasAttribute("data-mode")) host.setAttribute("data-mode", "scrub");
    };
    const tick = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };
    const size = () => {
      const r = host.getBoundingClientRect();
      const d = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(r.width * d));
      canvas.height = Math.max(1, Math.round(r.height * d));
      drawn = -1;
      tick();
    };
    const load = () => {
      if (started) return;
      started = true;
      // Первый и последний кадры — вперёд: есть что показать сразу.
      const order = [0, N - 1, ...Array.from({ length: N - 2 }, (_, i) => i + 1)];
      for (const k of order) {
        const img = new Image();
        img.decoding = "async";
        img.src = frameSrc(k);
        img
          .decode()
          .then(() => {
            frames[k] = img;
            drawn = -1;
            tick();
          })
          .catch(() => {});
      }
    };

    const io = new IntersectionObserver(([e]) => e.isIntersecting && load(), { rootMargin: "150% 0px" });
    io.observe(host);
    const ro = new ResizeObserver(size);
    ro.observe(host);
    window.addEventListener("scroll", tick, { passive: true });
    size();

    return () => {
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", tick);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={box} className={className} style={{ "--poster": `url("${POSTER}")` } as CSSProperties} aria-hidden>
      <canvas ref={cv} />
    </div>
  );
}
