"use client";

import { useEffect, useRef } from "react";

/**
 * Сбой при входе секции в кадр.
 *
 * Блок один раз коротко расщепляется по каналам — как будто картинка
 * на секунду потеряла синхронизацию. Ровно один раз: повторяющийся
 * сбой при каждой прокрутке вверх-вниз превращается в мигание, от
 * которого устаёшь на третьей секции.
 *
 * Класс снимается по завершении анимации, а не по таймеру: таймер
 * рассинхронизируется с анимацией на загруженном кадре.
 */
export function useEnterGlitch<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const off = () => node.classList.remove("b-glitched");
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        node.classList.add("b-glitched");
      },
      { threshold: 0.22 },
    );
    io.observe(node);
    node.addEventListener("animationend", off);
    return () => {
      io.disconnect();
      node.removeEventListener("animationend", off);
    };
  }, []);

  return ref;
}
