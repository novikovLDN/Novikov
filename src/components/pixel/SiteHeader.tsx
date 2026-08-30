"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import BrandMark from "./BrandMark";
import Icon from "./Icon";

/**
 * Шапка сайта.
 *
 * Логотип слева, справа — минимальное меню тонкими тёмными пилюлями.
 * Пилюля здесь отведена навигационным чипам; действия (кнопки) во всей
 * системе носят мягкий радиус 14px. Это два разных класса элементов, и
 * форма их различает намеренно.
 *
 * Акцентного оранжевого в шапке нет: на первом экране он уже занят
 * главной кнопкой героя, а правило системы — один яркий акцент в кадре.
 * «Войти» выделяется оранжевой границей, а не заливкой.
 *
 * Шапка фиксирована и после первого экрана становится непрозрачной:
 * страница длинная, и точка входа в регистрацию нужна на всём её
 * протяжении. Замер позиции идёт в rAF, слушатель пассивный.
 */
const NAV = [
  { label: "Главная", href: "/" },
  { label: "Тарифы", href: "/pricing" },
  { label: "Поддержка", href: "/support" },
];

export default function SiteHeader() {
  const [solid, setSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const ticking = useRef(false);

  useEffect(() => {
    const read = () => {
      ticking.current = false;
      setSolid(window.scrollY > 40);
    };
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <>
      <header className={`px-header${solid ? " px-header-solid" : ""}`}>
        <div className="px-shell flex items-center justify-between gap-4">
          <Link href="/" className="px-brand" aria-label="Atlas Secure — на главную">
            <BrandMark size={20} />
            <span className="px-wordmark">atlas.secure</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-2" aria-label="Основная навигация">
            {NAV.map((l) => (
              <Link key={l.href} href={l.href} className="px-chip">
                {l.label}
              </Link>
            ))}
            <Link href="/auth" className="px-chip px-chip-active">
              Войти
            </Link>
          </nav>

          <button
            type="button"
            className="px-icon-btn px-menu-toggle"
            onClick={() => setMenuOpen(true)}
            aria-label="Открыть меню"
            aria-expanded={menuOpen}
          >
            <Icon name="menu" size={20} />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="px-menu" role="dialog" aria-modal="true" aria-label="Меню">
          <div className="px-grid-bg" aria-hidden />
          <div className="px-shell flex items-center justify-between h-[var(--px-header-h)] shrink-0 relative">
            <span className="px-brand">
              <BrandMark size={20} />
              <span className="px-wordmark">atlas.secure</span>
            </span>
            <button
              type="button"
              className="px-icon-btn"
              onClick={() => setMenuOpen(false)}
              aria-label="Закрыть меню"
              autoFocus
            >
              <Icon name="close" size={20} />
            </button>
          </div>

          <nav className="px-shell flex-1 flex flex-col justify-center min-h-0 overflow-y-auto relative" aria-label="Меню">
            {NAV.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="px-menu-link"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="px-shell pb-[max(28px,env(safe-area-inset-bottom))] pt-6 shrink-0 relative flex flex-col gap-3">
            <Link href="/auth" onClick={() => setMenuOpen(false)} className="px-btn px-btn-md px-btn-primary px-btn-block">
              Создать аккаунт
            </Link>
            <Link href="/auth" onClick={() => setMenuOpen(false)} className="px-btn px-btn-md px-btn-secondary px-btn-block">
              Войти
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
