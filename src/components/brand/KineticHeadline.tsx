"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP, usePrefersReducedMotion } from "./motion";

/**
 * Кинетический заголовок.
 *
 * Два движения, и оба на вариативной оси Unbounded:
 *   1) знаки выезжают снизу по одному при появлении — строка
 *      собирается на глазах;
 *   2) вес заголовка привязан к прокрутке: пока сцена уходит вверх,
 *      буквы наливаются от 500 к 900. Это приём года (TRENDS.md §5), и
 *      он возможен только на вариативном файле.
 *
 * Ось веса меняется у ОДНОГО элемента, а не у каждого знака: смена
 * начертания вызывает пересчёт раскладки, и делать это семидесяти
 * узлам в кадре — верный способ уронить частоту кадров ради эффекта,
 * которого никто не заметит.
 *
 * Разбивка двухуровневая (слова, потом знаки): иначе браузер переносит
 * строку посреди слова. Урок оплачен прошлой версией сайта.
 *
 * Читаемость важнее эффекта. Строка целиком лежит в aria-label, а при
 * prefers-reduced-motion разбивки нет вовсе — просто текст.
 */
export default function KineticHeadline({
  text,
  className = "b-mega",
  as: Tag = "h1",
  id,
  weightScroll = true,
  reveal = "chars",
  glitch = false,
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "p";
  id?: string;
  /** Привязывать ли вес к прокрутке. На вторых заголовках выключаем:
   *  один и тот же фокус, повторённый пять раз, перестаёт читаться. */
  weightScroll?: boolean;
  /**
   * Чем заголовок появляется.
   *
   * "chars" — разбивка на знаки и выезд по одному (GSAP).
   * "css"   — подъём всей строки средствами CSS.
   *
   * Для заголовка первого экрана обязателен "css", и вот почему:
   * разбивка прячет знаки до тех пор, пока не выполнится JS. На
   * дросселированном мобильном профиле это давало задержку отрисовки
   * 4,4 с — заголовок был крупнейшим элементом кадра, и метрика LCP
   * ждала его столько же. CSS-подъём двигает только transform, не
   * трогая прозрачность: браузер рисует текст сразу, а анимация идёт
   * поверх уже нарисованного.
   */
  reveal?: "chars" | "css";
  /** Расщеплять ли канал: два клона в маджента и циане рывком
   *  расходятся раз в несколько секунд и по наведению. Ставится на
   *  главные заголовки, а не на все подряд — сбой обязан оставаться
   *  событием. */
  glitch?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      const node = ref.current;
      if (!node || reduced) return;

      if (reveal === "css") {
        // Появление ведёт CSS. Здесь остаётся только привязка веса к
        // прокрутке — она ничего не прячет.
        if (!weightScroll) return;
        const state = { wght: 500 };
        const t = gsap.to(state, {
          wght: 900,
          ease: "none",
          scrollTrigger: { trigger: node, start: "top 70%", end: "bottom top", scrub: 1 },
          onUpdate: () => {
            node.style.fontVariationSettings = `"wght" ${Math.round(state.wght)}`;
          },
        });
        return () => { t.scrollTrigger?.kill(); t.kill(); };
      }

      const split = new SplitText(node, {
        type: "words,chars",
        wordsClass: "b-word",
        charsClass: "b-char",
      });

      gsap.from(split.chars, {
        yPercent: 118,
        duration: 0.9,
        ease: "power4.out",
        stagger: { each: 0.022, from: "start" },
        scrollTrigger: { trigger: node, start: "top 88%", once: true },
      });

      let weightTween: gsap.core.Tween | undefined;
      if (weightScroll) {
        const state = { wght: 500 };
        weightTween = gsap.to(state, {
          wght: 900,
          ease: "none",
          scrollTrigger: { trigger: node, start: "top 70%", end: "bottom top", scrub: 1 },
          onUpdate: () => {
            node.style.fontVariationSettings = `"wght" ${Math.round(state.wght)}`;
          },
        });
      }

      return () => {
        weightTween?.scrollTrigger?.kill();
        weightTween?.kill();
        split.revert();
      };
    },
    { scope: ref, dependencies: [reduced, text, reveal] },
  );

  return (
    <Tag
      // @ts-expect-error — общий ref для h1/h2/p
      ref={ref}
      id={id}
      className={[className, reveal === "css" ? "b-rise" : "", glitch ? "b-glitch" : ""]
        .filter(Boolean)
        .join(" ")}
      data-text={glitch ? text : undefined}
      aria-label={text}
    >
      {text}
    </Tag>
  );
}

/** Число, которое докручивается при появлении. Барабан разрядов не
 *  используется намеренно: в кадре и так есть стена из пикселей. */
export function RollingNumber({
  value,
  decimals = 0,
  suffix = "",
  className = "",
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      const node = ref.current;
      if (!node) return;
      const format = (n: number) =>
        n.toLocaleString("ru-RU", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
      if (reduced) {
        node.textContent = format(value);
        return;
      }
      const state = { n: 0 };
      const tween = gsap.to(state, {
        n: value,
        duration: 1.2,
        ease: "power2.out",
        scrollTrigger: { trigger: node, start: "top 92%", once: true },
        onUpdate: () => { node.textContent = format(state.n); },
      });
      return () => { tween.scrollTrigger?.kill(); tween.kill(); };
    },
    { scope: ref, dependencies: [value, reduced] },
  );

  // Значение сразу лежит в разметке: без скрипта страница показывает
  // число, а не пустоту.
  return (
    <span ref={ref} className={className}>
      {value.toLocaleString("ru-RU", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix}
    </span>
  );
}

export { ScrollTrigger };
