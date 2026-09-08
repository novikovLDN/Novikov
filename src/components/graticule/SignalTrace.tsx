"use client";

import { useEffect, useRef } from "react";

/**
 * ЛЕНТА ПРИБОРА — единственный холст на сайте.
 *
 * ПОЧЕМУ ХОЛСТ ВООБЩЕ ПОЯВИЛСЯ. Замер восемнадцати сайтов
 * креативных студий (research/03_AGENCY_TEARDOWN.md) дал один
 * крупный разрыв: у тринадцати из них есть `<canvas>`, у одиннадцати
 * — WebGL, а у нас не было ни одного. Кадр читался как вёрстка, а не
 * как работа студии. При этом CSS-кейфреймов у студий почти нет:
 * ощущение живого кадра там делает непрерывный цикл, а не
 * `@keyframes`.
 *
 * ПОЧЕМУ ЭТО НЕ АБСТРАКТНЫЙ ШУМ. Позиция бренда — «измерено, а не
 * заявлено». Рисовать поверх первого экрана красивую генеративную
 * рябь значило бы поставить в самый центр витрины единственный
 * элемент, который ничего не измеряет. Поэтому лента рисует реальную
 * величину: длительность кадров браузера на устройстве читателя.
 * Ровная линия — устройство успевает; провал — не успевает. Число
 * справа — кадров в секунду, посчитанное здесь и сейчас.
 *
 * СТОИМОСТЬ. Один холст, один rAF-цикл, кольцевой буфер на 240
 * значений. Цикл останавливается, когда вкладка скрыта или первый
 * экран ушёл из поля зрения, — иначе прибор жёг бы батарею всё время
 * чтения страницы. При `prefers-reduced-motion` цикл не запускается
 * совсем: рисуется один кадр по накопленным значениям и всё.
 */
export default function SignalTrace() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    const box = cv?.parentElement;
    if (!cv || !box) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const N = 240;
    const buf = new Float32Array(N).fill(16.7);
    let head = 0;
    let w = 0;
    let h = 0;
    let raf = 0;
    let last = performance.now();
    let visible = true;
    let ink = "#14181C";
    let acc = 0;
    let accN = 0;

    const still = matchMedia("(prefers-reduced-motion: reduce)");

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const r = box.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width));
      h = Math.max(1, Math.round(r.height));
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      cv.style.width = `${w}px`;
      cv.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ink = getComputedStyle(cv).color || ink;
      draw();
    };

    /** Одно деление ленты = один кадр браузера. */
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const mid = h * 0.5;
      // 16.7 мс кладём на среднюю линию, 50 мс — на нижний край полосы.
      const amp = h * 0.42;
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const v = buf[(head + i) % N];
        const dev = Math.max(-1, Math.min(1, (v - 16.7) / 33.3));
        const x = (i / (N - 1)) * w;
        const y = mid + dev * amp;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = ink;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1;
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.globalAlpha = 1;
    };

    const tick = (t: number) => {
      const dt = t - last;
      last = t;
      if (dt > 0 && dt < 500) {
        buf[head] = dt;
        head = (head + 1) % N;
        acc += dt;
        accN += 1;
      }
      if (accN >= 30) {
        const fps = Math.round(1000 / (acc / accN));
        // Показание живёт в приборной полосе, а холст — в подложке
        // кадра: это разные места разметки, и связывать их состоянием
        // React значило бы перерисовывать полосу тридцать раз в
        // секунду. Прибор пишет одно число в один узел напрямую.
        const out = document.getElementById("gh-fps");
        if (out) out.textContent = String(Math.min(fps, 240));
        acc = 0;
        accN = 0;
      }
      draw();
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (raf || still.matches || document.hidden || !visible) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible) start();
        else stop();
      },
      { threshold: 0 },
    );
    io.observe(box);

    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    const ro = new ResizeObserver(resize);
    ro.observe(box);

    resize();
    start();

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={ref} className="gh-trace" aria-hidden />;
}
