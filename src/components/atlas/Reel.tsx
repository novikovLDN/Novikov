"use client";

import { useEffect, useRef, type CSSProperties } from "react";

/**
 * Петля из Blender на странице — общий проигрыватель для первого экрана
 * (HeroReel) и глобуса стран (раздел 03).
 *
 * СТОИМОСТЬ.
 *   · Видео не грузится, пока блок далеко от кадра. У первого экрана
 *     (`eager`) — ждёт свободного времени после первой отрисовки, до
 *     этого на месте плоская заглушка. Появляется плавно, когда может
 *     играть, — поэтому не становится элементом LCP.
 *   · Играет только в кадре и во видимой вкладке.
 *   · reduced-motion, режим экономии трафика и ?static=1 — видео нет,
 *     остаётся неподвижный постер того же кадра.
 */
type Props = {
  webm: string;
  mp4: string;
  poster: string;
  className: string;
  /** Грузить в первое свободное время, не дожидаясь подхода к кадру. */
  eager?: boolean;
};

export default function Reel({ webm, mp4, poster, className, eager = false }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const vid = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const host = box.current;
    const v = vid.current;
    if (!host || !v) return;
    const root = document.documentElement;
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    const still =
      root.hasAttribute("data-static") ||
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      nav.connection?.saveData === true;

    if (still) {
      host.setAttribute("data-mode", "poster");
      return;
    }

    let loaded = false;
    let inView = false;
    const play = () => {
      if (loaded && inView && !document.hidden) v.play().catch(() => {});
    };
    const load = () => {
      if (loaded) return;
      loaded = true;
      v.src = v.canPlayType('video/webm; codecs="vp9"') ? webm : mp4;
      v.load();
    };
    const onReady = () => {
      host.setAttribute("data-mode", "video");
      play();
    };
    v.addEventListener("canplay", onReady, { once: true });

    // Подгрузка — за экран до блока; игра — только когда он в кадре.
    const near = new IntersectionObserver(([e]) => e.isIntersecting && load(), { rootMargin: "100% 0px" });
    const seen = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      if (inView) play();
      else v.pause();
    });
    near.observe(host);
    seen.observe(host);
    const onVis = () => (document.hidden ? v.pause() : play());
    document.addEventListener("visibilitychange", onVis);

    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    let idle = 0;
    if (eager) idle = w.requestIdleCallback ? w.requestIdleCallback(load, { timeout: 1500 }) : window.setTimeout(load, 600);

    return () => {
      near.disconnect();
      seen.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      v.removeEventListener("canplay", onReady);
      if (eager) {
        if (w.cancelIdleCallback) w.cancelIdleCallback(idle);
        else window.clearTimeout(idle);
      }
      v.pause();
    };
  }, [webm, mp4, eager]);

  return (
    <div ref={box} className={className} style={{ "--poster": `url("${poster}")` } as CSSProperties} aria-hidden>
      <div className="a-reel-move">
        <video ref={vid} className="a-reel-video" muted loop playsInline preload="none" />
      </div>
    </div>
  );
}
