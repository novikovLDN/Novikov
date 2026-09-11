"use client";

import { useEffect, useRef } from "react";

/**
 * Лист 00 — «Лист раскладывается» вместо прелоадера.
 *
 * Страница уже отрисована и кликабельна; поверх неё один раз за сессию
 * расходятся две линии сгиба, как у раскрываемой карты. Ни одной
 * миллисекунды ожидания: слой не перехватывает указатель, любое нажатие
 * обрывает развёртку.
 *
 * Не играется: при reduced-motion, при `?static=1`, повторно в той же
 * сессии и там, где хранилище недоступно (приватный режим, запрет
 * данных сайта) — развёртка не важнее страницы.
 */
export default function Unfold() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.documentElement.hasAttribute("data-static")) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      if (sessionStorage.getItem("a-unfold")) return;
      sessionStorage.setItem("a-unfold", "1");
    } catch {
      return;
    }

    el.setAttribute("data-play", "");
    const stop = () => el.removeAttribute("data-play");
    const t = window.setTimeout(stop, 1000);
    window.addEventListener("pointerdown", stop, { once: true });
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("pointerdown", stop);
    };
  }, []);

  return (
    <div ref={ref} className="a-unfold" aria-hidden>
      <i className="a-fold-v" />
      <i className="a-fold-h" />
    </div>
  );
}
