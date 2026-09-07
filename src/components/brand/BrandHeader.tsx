"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/**
 * Шапка.
 *
 * Логотип — не картинка, а слово, набранное дисплеем: у бренда один
 * носитель, и это типографика. Квадрат слева — та же ячейка, из
 * которой сложена стена первого экрана.
 *
 * Шапка не «прилипает с фоном»: она уезжает вверх при прокрутке вниз
 * и возвращается при прокрутке вверх. Стеклянная панель поверх
 * контента — визитная карточка дефолтного сайта 2024 года.
 */
const NAV = [
  { label: "Тарифы", href: "/pricing" },
  // Якорь, а не отдельная страница: объяснение живёт сценой на
  // главной, и заводить под него второй экран нечем.
  { label: "Как работает", href: "/#how" },
  { label: "Поддержка", href: "/support" },
];

export default function BrandHeader() {
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  const last = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const read = () => {
      ticking.current = false;
      const y = window.scrollY;
      setHidden(y > 200 && y > last.current);
      // Ниже первого экрана шапка получает собственную чернильную
      // плиту: под ней бывает и чернильная сцена, и бумажная, и
      // прозрачная шапка на бумаге просто исчезает.
      setSolid(y > 120);
      last.current = y;
    };
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(read);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`b-header${hidden ? " b-header-up" : ""}${solid ? " b-header-solid" : ""}`}>
      <div className="b-shell b-header-inner">
        <Link href="/" className="b-mark" aria-label="Atlas — на главную">
          <span className="b-mark-cell" aria-hidden />
          Atlas
        </Link>

        <nav className="b-nav" aria-label="Основная навигация">
          {NAV.map((l) => (
            <Link key={l.href} href={l.href} className="b-nav-link">
              {l.label}
            </Link>
          ))}
        </nav>

        <Link href="/auth" className="b-btn b-btn-ghost b-header-cta">
          Войти
        </Link>
      </div>
    </header>
  );
}
