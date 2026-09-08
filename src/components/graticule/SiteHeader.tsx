"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { PRODUCTS, HEADER_LINKS } from "@/lib/nav";

/**
 * Шапка системы «Гратикул».
 *
 * Состав ссылок берётся из `src/lib/nav.ts` — того же модуля, который
 * читает прежняя шапка. Пока идёт перерисовка, оформление у них
 * разное, а структура обязана быть одна: иначе раздел появляется на
 * одних страницах и пропадает на других.
 *
 * ПОВЕДЕНИЕ ПРИ ПРОКРУТКЕ. Уезжает вверх при движении вниз и
 * возвращается при движении вверх — читателю не нужна навигация,
 * пока он читает, и нужна сразу, как только он передумал. Порог и
 * направление считает пассивный слушатель через rAF и пишет в
 * data-атрибуты: перерисовывать дерево React на каждом кадре
 * прокрутки ради двух логических значений незачем.
 *
 * ПРОДУКТЫ РАСКРЫВАЮТСЯ СПИСКОМ С ПОЯСНЕНИЕМ. «Ускоритель» и
 * «Выделенные серверы» без строки объяснения различаются только
 * длиной слова. Раскрытие — на CSS, по наведению и по фокусу с
 * клавиатуры; ноль JS и ноль библиотек позиционирования.
 */
export default function SiteHeader() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let ticking = false;
    let last = 0;

    const read = () => {
      ticking = false;
      const y = window.scrollY;
      node.dataset.hidden = y > 180 && y > last ? "true" : "false";
      node.dataset.lifted = y > 24 ? "true" : "false";
      last = y;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header ref={ref} className="gx-header" data-hidden="false" data-lifted="false">
      <div className="g-field gx-header-inner">
        <Link href="/" className="gx-mark" aria-label="Atlas Secure — на главную">
          <span className="gx-mark-cell" aria-hidden />
          Atlas
        </Link>

        <nav className="gx-nav" aria-label="Основная навигация">
          <div className="gx-products">
            <Link href="/pricing" className="gx-link" aria-haspopup="true">
              Продукты
            </Link>
            <div className="gx-products-panel">
              {PRODUCTS.map((p) => (
                <Link key={p.href} href={p.href} className="gx-product">
                  <b>{p.label}</b>
                  <span>{p.note}</span>
                </Link>
              ))}
            </div>
          </div>

          {HEADER_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="gx-link">
              {l.label}
            </Link>
          ))}
        </nav>

        <Link href="/auth" className="gh-btn gh-btn-quiet gx-cta">
          Войти
        </Link>
      </div>
    </header>
  );
}
