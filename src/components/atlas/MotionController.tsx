"use client";

import { useEffect } from "react";

/**
 * Один наблюдатель на документ вместо наблюдателя в каждой сцене.
 *
 *   · `data-inview` — лист в кадре. Холостой слой (`.a-idle`) вне кадра
 *     стоит на паузе: живость не должна жечь батарею за экраном.
 *   · `data-seen` — лист хоть раз входил в кадр. На нём срабатывают
 *     разовые события: подписи ложатся, второй прогон краски.
 *   · Номер и название листа в шапке меняются на месте по листу,
 *     который пересекает середину окна.
 *
 * Пишет только атрибуты и текст двух узлов; дерево React не
 * перерисовывается. При `?static=1` не делает ничего: страница остаётся
 * в конечном виде.
 */
export default function MotionController() {
  useEffect(() => {
    const root = document.documentElement;
    // SMIL (пакет на карте) не слушается CSS: останавливаем явно.
    const still = root.hasAttribute("data-static") || matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still) {
      document.querySelectorAll<SVGSVGElement>(".a svg").forEach((s) => s.pauseAnimations?.());
    }
    if (root.hasAttribute("data-static")) return;
    root.classList.add("a-js");

    const sheets = Array.from(document.querySelectorAll<HTMLElement>("[data-sheet]"));

    const view = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const el = e.target as HTMLElement;
          if (e.isIntersecting) {
            el.setAttribute("data-inview", "");
            el.setAttribute("data-seen", "");
          } else {
            el.removeAttribute("data-inview");
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );

    const no = document.querySelector<HTMLElement>("[data-sheet-no]");
    const title = document.querySelector<HTMLElement>("[data-sheet-title]");
    const label = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          if (no && el.dataset.sheet) no.textContent = el.dataset.sheet;
          if (title && el.dataset.title) title.textContent = el.dataset.title;
        }
      },
      { rootMargin: "-45% 0px -54% 0px" },
    );

    for (const s of sheets) {
      view.observe(s);
      if (s.dataset.title) label.observe(s);
    }

    return () => {
      view.disconnect();
      label.disconnect();
    };
  }, []);

  return null;
}
