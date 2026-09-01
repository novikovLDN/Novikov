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
