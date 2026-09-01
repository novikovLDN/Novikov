"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "./motion";

/**
 * Слой «живых» взаимодействий.
 *
 * Приёмы взяты из практики наградных промо-сайтов (магнитные кнопки,
 * раскодирование текста, световое пятно за курсором, наклон карточки,
 * инерция бегущей строки) и переложены на пиксельный язык системы.
 *
 * Правила слоя те же, что у motion.tsx и не обсуждаются:
 *   - пишутся только transform, opacity и CSS-переменные;
 *   - слушатели пассивные, значение считает rAF, а не рендер React;
 *   - ноль внешних библиотек;
 *   - prefers-reduced-motion выключает движение, а не содержание.
 */

/**
 * Магнитная кнопка: тянется к курсору, пока он рядом, и упруго
 * возвращается, когда он ушёл.
 *
 * Смещение ограничено восемью процентами размера — жест должен
 * читаться как «элемент живой», а не как уезжающая из-под пальца
 * мишень. На тач-устройствах не подключается вовсе.
 */
export function Magnetic({
  children,
  strength = 0.22,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const target = el.firstElementChild as HTMLElement | null;
    if (!target) return;

    let frame = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;

    const render = () => {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      target.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`;
      if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) {
        frame = requestAnimationFrame(render);
      } else {
        frame = 0;
      }
    };
    const kick = () => { if (!frame) frame = requestAnimationFrame(render); };

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const limit = Math.min(r.width, r.height) * 0.08 + 6;
      tx = Math.max(-limit, Math.min(limit, dx * strength));
      ty = Math.max(-limit, Math.min(limit, dy * strength));
      kick();
    };
    const onLeave = () => { tx = 0; ty = 0; kick(); };

    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
      target.style.transform = "";
    };
  }, [strength, reduced]);

  return (
    <span ref={ref} className={`px-magnetic${className ? ` ${className}` : ""}`}>
      {children}
    </span>
  );
}

/* Набор знаков для раскодирования: латиница, цифры и пиксельные
   символы. Кириллицы в шуме нет намеренно — иначе промежуточные
   кадры читаются как настоящие слова и отвлекают. */
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%▓▒░/\\|";

/**
 * Текст, который «раскодируется» при появлении в кадре: сначала шум,
 * затем буква за буквой встают на места слева направо.
 *
 * Настоящая строка всегда лежит в разметке (её читает поиск и
 * скринридер), меняется только визуальный слой.
 */
export function Scramble({
  text,
  className,
  speed = 34,
}: {
  text: string;
  className?: string;
  speed?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(text);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) { setShown(text); return; }

    let timer: ReturnType<typeof setInterval> | null = null;
    let step = 0;

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || timer) return;
        io.disconnect();
        timer = setInterval(() => {
          step += 1;
          const settled = Math.floor(step / 2);
          if (settled > text.length) {
            if (timer) clearInterval(timer);
            timer = null;
            setShown(text);
            return;
          }
          setShown(
            text
              .split("")
              .map((ch, i) => {
                if (i < settled || ch === " ") return ch;
                return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
              })
              .join("")
          );
        }, speed);
      },
      { threshold: 0.6 }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      if (timer) clearInterval(timer);
    };
  }, [text, speed, reduced]);

  return (
    <span ref={ref} className={className}>
      <span aria-hidden>{shown}</span>
      <span className="sr-only">{text}</span>
    </span>
  );
}

/**
 * Световое пятно за курсором — один слушатель на весь документ.
 *
 * Любая карточка с классом `.px-spot` получает подсветку в точке
 * курсора. Делегирование, а не ref в каждом компоненте: карточек на
 * странице десятки, и вешать на каждую свой слушатель означает
 * платить за одно и то же движение мыши много раз.
 *
 * Компонент ничего не рисует — пишет две переменные, остальное
 * делает CSS (`.px-spot::before`).
 */
export function SpotlightLayer() {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let frame = 0;
    let current: HTMLElement | null = null;
    let x = 0;
    let y = 0;

    const write = () => {
      frame = 0;
      if (!current) return;
      current.style.setProperty("--mx", `${x.toFixed(1)}%`);
      current.style.setProperty("--my", `${y.toFixed(1)}%`);
    };

    const clear = (el: HTMLElement | null) => {
      el?.style.removeProperty("--mx");
      el?.style.removeProperty("--my");
    };

    const onMove = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      const next = target?.closest?.(".px-spot") as HTMLElement | null;
      if (next !== current) {
        clear(current);
        current = next;
      }
      if (!current) return;
      const r = current.getBoundingClientRect();
      x = ((e.clientX - r.left) / r.width) * 100;
      y = ((e.clientY - r.top) / r.height) * 100;
      if (!frame) frame = requestAnimationFrame(write);
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
      clear(current);
    };
  }, [reduced]);

  return null;
}

/**
 * Наклон плоскости за курсором.
 *
 * Угол мелкий (до пяти градусов): карточка должна казаться
 * материальной, а не вращаться каруселью. Перспектива задаётся
 * родителем в CSS, здесь — только rotate.
 */
export function useTilt<T extends HTMLElement>(max = 5) {
  const ref = useRef<T>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let frame = 0;
    let rx = 0;
    let ry = 0;

    const write = () => {
      frame = 0;
      el.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      ry = px * max * 2;
      rx = -py * max * 2;
      if (!frame) frame = requestAnimationFrame(write);
    };
    const onLeave = () => {
      rx = 0;
      ry = 0;
      el.style.transform = "";
    };

    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [max, reduced]);

  return ref;
}

/**
 * Цифры, которые прокручиваются как барабан счётчика.
 *
 * Каждый разряд — колонка из десяти цифр, сдвигаемая по вертикали.
 * Меняется только transform колонки, поэтому смена суммы не вызывает
 * ни перерисовки текста, ни скачка ширины (разряд фиксирован).
 */
export function RollingNumber({
  value,
  decimals = 0,
  className,
}: {
  value: number;
  decimals?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const text = value.toLocaleString("ru-RU", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const [rolled, setRolled] = useState(reduced);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (reduced) { setRolled(true); return; }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        io.disconnect();
        // Барабан стартует с нуля и доезжает до своей цифры.
        requestAnimationFrame(() => setRolled(true));
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, text]);

  return (
    <span ref={ref} className={`px-roll${className ? ` ${className}` : ""}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="px-roll-line">
        {text.split("").map((ch, i) => {
          const digit = Number(ch);
          if (Number.isNaN(digit)) {
            return (
              <span key={i} className="px-roll-static">
                {ch}
              </span>
            );
          }
          return (
            <span key={i} className="px-roll-slot">
              <span
                className="px-roll-strip"
                style={{
                  transform: `translateY(${rolled ? -digit * 10 : 0}%)`,
                  transitionDelay: `${i * 55}ms`,
                }}
              >
                {"0123456789".split("").map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}

/**
 * Пиксельное проявление.
 *
 * Содержимое закрыто сеткой квадратов цвета фона; при появлении в
 * кадре квадраты гаснут волной слева направо с лёгким разбросом —
 * картинка «собирается» из пикселей. Тот же жест, что у надписи из
 * точек, только в обратную сторону.
 *
 * Оверлей чисто декоративный: содержимое под ним уже отрисовано и
 * доступно с первого кадра — скринридер и поиск видят его независимо
 * от того, отыграла анимация или нет. Без JS (или при
 * prefers-reduced-motion) сетка не рендерится вовсе.
 */
export function PixelDissolve({
  children,
  cols = 16,
  rows = 6,
  className,
}: {
  children: ReactNode;
  cols?: number;
  rows?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const [gone, setGone] = useState(false);
  const [armed, setArmed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) { setGone(true); return; }
    setArmed(true);
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        io.disconnect();
        setGone(true);
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  const cells = armed && !gone ? cols * rows : 0;

  return (
    <div ref={ref} className={`px-dissolve${className ? ` ${className}` : ""}`}>
      {children}
      {armed && (
        <div
          className={`px-dissolve-grid${gone ? " px-dissolve-out" : ""}`}
          style={{ ["--px-cols" as string]: cols, ["--px-rows" as string]: rows }}
          aria-hidden
        >
          {Array.from({ length: cells || cols * rows }, (_, i) => {
            const x = i % cols;
            const y = Math.floor(i / cols);
            // Волна идёт слева направо, разброс держит её живой, но
            // детерминированным он быть не обязан — сетка декоративна.
            const delay = x * 26 + y * 12 + (i % 5) * 18;
            return <span key={i} style={{ transitionDelay: `${delay}ms` }} />;
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Заголовок, который набирается по буквам.
 *
 * Строка разбивается на знаки, каждый поднимается из-под своей
 * базовой линии с задержкой по порядку чтения.
 *
 * Текст в разметке остаётся ровно один раз: копии для скринридера
 * здесь нет намеренно — в заголовке страницы она давала бы дубль
 * фразы в DOM и в поисковом сниппете. Знаки помечены aria-hidden, а
 * прочитать заголовок целиком вспомогательной технологии позволяет
 * aria-label на самом заголовке (см. HeroSection).
 *
 * Разбивка двухуровневая: сначала на слова, и только внутри слова —
 * на знаки. Плоский список букв браузер переносит по буквам, и
 * заголовок рвётся посреди слова («Открывает интер / нет»).
 */
export function SplitText({
  text,
  className,
  step = 34,
  delay = 0,
}: {
  text: string;
  className?: string;
  step?: number;
  delay?: number;
}) {
  const reduced = useReducedMotion();

  if (reduced) return <span className={className}>{text}</span>;

  let index = 0;
  const words = text.split(" ");

  return (
    <span className={className} aria-hidden>
      <span className="px-split">
        {words.map((word, w) => (
          <span key={w} className="px-split-word">
            {word.split("").map((ch, i) => {
              const at = index++;
              return (
                <span
                  key={i}
                  className="px-split-ch"
                  style={{ animationDelay: `${delay + at * step}ms` }}
                >
                  {ch}
                </span>
              );
            })}
            {/* Неразрывный пробел: обычный в конце inline-block
                схлопывается по правилам переноса, и слова слипаются. */}
            {w < words.length - 1 ? <span className="px-split-space">{"\u00A0"}</span> : null}
          </span>
        ))}
      </span>
    </span>
  );
}

/**
 * Пиксельный шлейф курсора.
 *
 * За указателем остаются затухающие квадраты той же сетки, что и фон
 * первого экрана: курсор словно рассыпает материал, из которого
 * собран сайт. Живёт внутри одного контейнера (первый экран), а не на
 * всём документе — постоянный шлейф по всей странице быстро надоедает
 * и мешает читать.
 *
 * Canvas, а не DOM: частиц под сотню, и каждая живёт полсекунды.
 * Рисование останавливается, когда курсор ушёл и последняя частица
 * догорела, — простаивающего rAF не остаётся.
 */
export function PixelTrail({ cell = 10 }: { cell?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host || reduced) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const accent =
      getComputedStyle(document.documentElement).getPropertyValue("--px-accent").trim() || "#FF6B45";
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = 0;
    let height = 0;
    const resize = () => {
      const r = host.getBoundingClientRect();
      width = r.width;
      height = r.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };
    resize();

    let resizeT: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(resize, 160);
    };
    window.addEventListener("resize", onResize);

    interface Dot { x: number; y: number; born: number; life: number; }
    const dots: Dot[] = [];
    let frame = 0;
    let last = { x: -1, y: -1 };

    const draw = (t: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      for (let i = dots.length - 1; i >= 0; i--) {
        const d = dots[i];
        const age = (t - d.born) / d.life;
        if (age >= 1) { dots.splice(i, 1); continue; }
        ctx.globalAlpha = (1 - age) * 0.55;
        ctx.fillStyle = accent;
        const size = cell * (1 - age * 0.4);
        ctx.fillRect(d.x, d.y, size, size);
      }
      ctx.globalAlpha = 1;

      frame = dots.length ? requestAnimationFrame(draw) : 0;
    };

    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (x < 0 || y < 0 || x > width || y > height) return;

      // Частицы кладутся по узлам сетки: шлейф остаётся пиксельным, а
      // не превращается в мазок кистью.
      const gx = Math.floor(x / cell) * cell;
      const gy = Math.floor(y / cell) * cell;
      if (gx === last.x && gy === last.y) return;
      last = { x: gx, y: gy };

      dots.push({ x: gx, y: gy, born: performance.now(), life: 520 + Math.random() * 260 });
      if (dots.length > 90) dots.shift();
      if (!frame) frame = requestAnimationFrame(draw);
    };

    host.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      host.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeT);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [cell, reduced]);

  return <canvas ref={canvasRef} className="px-trail" aria-hidden />;
}

/**
 * «Фонарик» по фоновой сетке: там, где курсор, клетка видна ярче.
 *
 * Хук пишет координаты в переменные контейнера, маску рисует CSS
 * (`.px-hero::before`). Работает на всём первом экране, поэтому
 * слушатель один и обновление идёт в rAF.
 */
export function useGridTorch<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let frame = 0;
    let x = 0;
    let y = 0;
    const write = () => {
      frame = 0;
      el.style.setProperty("--tx", `${x.toFixed(1)}px`);
      el.style.setProperty("--ty", `${y.toFixed(1)}px`);
    };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      x = e.clientX - r.left;
      y = e.clientY - r.top;
      if (!frame) frame = requestAnimationFrame(write);
    };
    const onLeave = () => {
      el.style.removeProperty("--tx");
      el.style.removeProperty("--ty");
    };

    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduced]);

  return ref;
}
