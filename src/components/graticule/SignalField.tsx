"use client";

import { useEffect, useRef } from "react";

/**
 * ПОЛЕ СИГНАЛА — материал первого экрана.
 *
 * ПОЧЕМУ ПОТРЕБОВАЛОСЬ. Замер движения и плотности (research/
 * 05_MOTION.md) поставил диагноз, который не был виден по скриншотам:
 * у нашей страницы «покой 0,0» и «курсор 6,2» при 38–63 узлах в
 * кадре и заполнении 0,23. То есть страница СТОЯ НА МЕСТЕ не движется
 * вообще и почти не отвечает на руку, а кадр пуст на три четверти.
 * У референсов работает один из двух режимов: либо плотность без
 * движения (obys — 1201 узел, заполнение 0,73), либо движение без
 * плотности (basement — покой 195 и курсор 603, unseen — покой 467,
 * exoape — курсор 106). Мы не попадали ни в один.
 *
 * ЧТО ЭТО. Поле коротких штрихов во весь первый экран. Угол каждого
 * штриха задаётся медленной волной от времени и расстояния до
 * курсора: рука проходит по полю, и штрихи разворачиваются ей вслед,
 * как металлическая стружка над магнитом. Это не украшение и не
 * шум — это тот же язык, что у приборной полосы: поле показаний,
 * снятое с плоскости.
 *
 * ПОЧЕМУ НЕ WebGL. Тринадцать из восемнадцати студий держат canvas, и
 * одиннадцать — WebGL. Нам шейдер не нужен: штрихов около двух тысяч,
 * рисуются одним путём, и это укладывается в кадр 60 Гц без
 * компиляции шейдера, без библиотеки и без единого килобайта
 * зависимостей.
 *
 * ЧЕСТНОСТЬ. Поле ничего не измеряет и не притворяется прибором:
 * измерения живут в приборной полосе цифрами. Это материал кадра,
 * и назван он материалом.
 *
 * СТОИМОСТЬ. Один холст, один rAF, один слушатель указателя на
 * документ. Цикл встаёт, когда вкладка скрыта или первый экран ушёл
 * из кадра. При `prefers-reduced-motion` поле рисуется ОДИН раз и
 * замирает: содержание кадра не зависит от движения.
 */
export default function SignalField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    const box = cv?.parentElement;
    if (!cv || !box) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const still = matchMedia("(prefers-reduced-motion: reduce)");

    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let t = 0;
    let visible = true;

    // Курсор в координатах холста. Пока руки не было — далеко за краем,
    // чтобы поле стояло ровным.
    let mx = -9999;
    let my = -9999;
    let cx = mx;
    let cy = my;

    let ink = "#000000";

    const STEP = 18;   // шаг решётки
    const LEN = 11;    // длина штриха
    const REACH = 260; // радиус, на котором рука ещё разворачивает штрихи

    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
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

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = "round";
      ctx.strokeStyle = ink;

      for (let y = STEP * 0.5; y < h; y += STEP) {
        for (let x = STEP * 0.5; x < w; x += STEP) {
          // Медленная волна: две синусоиды с разным периодом дают поле,
          // которое не повторяется на глаз, но считается за два
          // умножения на штрих.
          let a =
            Math.sin(x * 0.0062 + t * 0.00042) * 1.7 +
            Math.cos(y * 0.0071 - t * 0.00031) * 1.7;

          const dx = x - cx;
          const dy = y - cy;
          const d2 = dx * dx + dy * dy;
          let k = 0;
          if (d2 < REACH * REACH) {
            const d = Math.sqrt(d2) || 1;
            // Ближе к руке — сильнее разворот по касательной к окружности.
            k = 1 - d / REACH;
            a = Math.atan2(dy, dx) + Math.PI / 2;
          }

          const len = LEN * (1 + k * 1.5);
          const c = Math.cos(a) * len * 0.5;
          const s = Math.sin(a) * len * 0.5;

          ctx.globalAlpha = 0.22 + k * 0.6;
          ctx.lineWidth = 1 + k * 0.8;
          ctx.beginPath();
          ctx.moveTo(x - c, y - s);
          ctx.lineTo(x + c, y + s);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    };

    const tick = (now: number) => {
      t = now;
      // Рука догоняется с инерцией: поле отвечает мягко, а не дёргается.
      cx += (mx - cx) * 0.12;
      cy += (my - cy) * 0.12;
      draw();
      raf = requestAnimationFrame(tick);
    };

    const move = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
    };

    const start = () => {
      if (raf || still.matches || document.hidden || !visible) return;
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
    document.addEventListener("pointermove", move, { passive: true });
    const ro = new ResizeObserver(resize);
    ro.observe(box);

    resize();
    start();

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      document.removeEventListener("pointermove", move);
    };
  }, []);

  return <canvas ref={ref} className="gh-field" aria-hidden />;
}
