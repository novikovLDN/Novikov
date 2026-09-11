"use client";

import { useEffect, useRef } from "react";

/**
 * Фон первого экрана — анимация объёмных форм, отрендеренная в Blender.
 *
 * Запрос владельца 11.09.2026: «прям 3D объёмные элементы по типу Yandex
 * Tech, плавно, красиво и технологично». Кобальтовое кольцо-канал,
 * сквозь которое пролетают металлические капсулы, керамические и
 * стеклянная сферы, ступенчатая шайба. Петля 8 с без шва; исходник —
 * Blender, сцена «AtlasObjects» (прежний рельеф — сцена «AtlasRelief»).
 *
 * На телефоне кадр 16:9 вписан полосой между заголовком и лидом
 * (atlas.css, @media max-width 720px), чтобы не ложиться под текст.
 *
 * Жизнь сохранена: видео идёт за рукой (PointerDrift пишет --px/--py на
 * .a-cover) и «ныряет» при уходе первого экрана (atlas.css, 6.6).
 *
 * СТОИМОСТЬ.
 *   · Видео не грузится, пока не отрисован первый кадр страницы и не
 *     наступило свободное время; до этого на месте плоское поле
 *     изохрон (HeroField). Появляется плавно, когда может играть, —
 *     поэтому не становится элементом LCP.
 *   · Играет только в кадре и во видимой вкладке.
 *   · reduced-motion, режим экономии трафика и ?static=1 — видео нет,
 *     остаётся неподвижный постер той же композиции.
 */
const SRC_WEBM = "/media/hero-objects.webm";
const SRC_MP4 = "/media/hero-objects.mp4";
export const POSTER = "/media/hero-objects.jpg";

export default function HeroReel() {
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
    let inView = true;
    const play = () => {
      if (inView && !document.hidden) v.play().catch(() => {});
    };
    const load = () => {
      if (loaded) return;
      loaded = true;
      v.src = v.canPlayType('video/webm; codecs="vp9"') ? SRC_WEBM : SRC_MP4;
      v.load();
    };
    const onReady = () => {
      host.setAttribute("data-mode", "video");
      play();
    };
    v.addEventListener("canplay", onReady, { once: true });

    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      if (inView) {
        load();
        play();
      } else {
        v.pause();
      }
    });
    io.observe(host);
    const onVis = () => (document.hidden ? v.pause() : play());
    document.addEventListener("visibilitychange", onVis);

    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const idle = w.requestIdleCallback ? w.requestIdleCallback(load, { timeout: 1500 }) : window.setTimeout(load, 600);

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      v.removeEventListener("canplay", onReady);
      const wc = window as Window & { cancelIdleCallback?: (id: number) => void };
      if (wc.cancelIdleCallback) wc.cancelIdleCallback(idle as number);
      else window.clearTimeout(idle as number);
      v.pause();
    };
  }, []);

  return (
    <div ref={box} className="a-reel" aria-hidden>
      <div className="a-reel-move">
        <video ref={vid} className="a-reel-video" muted loop playsInline preload="none" />
      </div>
    </div>
  );
}
