"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { scrollToTop } from "./scroll-top";

/**
 * Возврат к первому экрану.
 *
 * Страница высокая: только «Три шага» и манифест забирают по
 * четыре-пять экранов прокрутки каждый, потому что кадр там держится,
 * пока читатель проходит сцену. Дочитав до цены, вернуться к началу
 * колесом — это десяток движений вслепую.
 *
 * ФОРМА. Квадрат у правого края, по вертикали посередине. Правый край
 * выбран не по вкусу: низ экрана уже занят — там всплывают баннер
 * установки приложения и тосты кабинета, а нижний правый угол держит
 * приветственный тост. Середина правого края свободна на всех
 * страницах.
 *
 * ПЕРЕМЕЩЕНИЕ — через `scroll-top`, а не напрямую. На главной и
 * тарифах прокруткой управляет Lenis, и нативный `window.scrollTo`
 * там не работает: библиотека возвращает страницу на своё место
 * следующим же кадром (проверено — после нажатия scrollY не
 * менялся). Модуль отдаёт способ перемещения того слоя, который
 * прокруткой сейчас управляет.
 *
 * ПОЯВЛЕНИЕ. Кнопки нет, пока читатель не ушёл ниже первого экрана:
 * на самом первом экране возвращать некуда. Порог считает пассивный
 * слушатель через rAF и пишет его в data-атрибут, а не в состояние
 * React: перерисовывать дерево на каждом кадре прокрутки ради одного
 * логического значения незачем.
 */
export default function BackToTop() {
  const ref = useRef<HTMLButtonElement>(null);
  // Порог считается заново на каждой странице: после перехода
  // прокрутка сбрасывается, и кнопка обязана исчезнуть.
  const pathname = usePathname();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let ticking = false;
    let shown = false;

    const read = () => {
      ticking = false;
      const next = window.scrollY > window.innerHeight * 0.9;
      if (next === shown) return;
      shown = next;
      node.dataset.on = next ? "true" : "false";
      // Скрытая кнопка не должна попадаться при обходе с клавиатуры.
      node.tabIndex = next ? 0 : -1;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  return (
    <button
      ref={ref}
      type="button"
      className="b-top"
      data-on="false"
      tabIndex={-1}
      aria-label="Вернуться к первому экрану"
      onClick={() => scrollToTop()}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" aria-hidden>
        <path d="M12 20V5" />
        <path d="M5 12l7-7 7 7" />
      </svg>
      <span className="b-top-label">наверх</span>
    </button>
  );
}
