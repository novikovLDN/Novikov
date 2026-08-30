"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";

/**
 * Липкая шапка лендинга — принцип 6 (research/concept.md).
 *
 * Зачем: до редизайна навигация жила внутри героя и уезжала вместе с
 * ним, поэтому после первого экрана у посетителя не оставалось ни одной
 * точки входа в регистрацию до самого низа. На длинном лендинге это
 * главный структурный провал конверсии (research/03.md §6).
 *
 * Два состояния одной шапки — поэтому навигация существует в единственном
 * экземпляре и не дублируется внутри героя:
 *   - над героем: прозрачная, светлый текст, CTA хайрлайном;
 *   - ниже героя: стеклянная светлая, тёмный текст, CTA заливкой.
 *
 * Акцентный оранжевый в шапке не используется намеренно: на первом
 * экране он уже занят главной кнопкой героя (принцип 4 — один акцент
 * в кадре).
 *
 * Замер позиции идёт в rAF, слушатель пассивный — скролл не дёргается
 * даже на слабом Android.
 */
interface SiteHeaderProps {
  primaryHref: string;
}

const NAV = [
  { label: "Тарифы", href: "/pricing" },
  { label: "Устройства", href: "/devices" },
  { label: "Безопасность", href: "/security" },
  { label: "Поддержка", href: "/support" },
];

export default function SiteHeader({ primaryHref }: SiteHeaderProps) {
  const [solid, setSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const ticking = useRef(false);

  useEffect(() => {
    const read = () => {
      ticking.current = false;
      setSolid(window.scrollY > window.innerHeight * 0.7);
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

  // Меню открыто — фон под ним не скроллится.
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [menuOpen]);

  // Esc закрывает меню: без этого из него нет выхода с клавиатуры.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <>
      <header className={`ls-header${solid ? " ls-header-solid" : ""}`}>
        <div className="ls-shell flex items-center justify-between gap-4">
          <Link
            href="/"
            className="ls-tap ls-tap-brand gap-2 shrink-0 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-current focus-visible:outline-offset-4"
            aria-label="Atlas Secure — на главную"
          >
            <BrandMark />
            <span className="ls-wordmark text-[13px] tracking-[0.16em] uppercase font-medium">
              atlas.secure
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-7" aria-label="Основная навигация">
            {NAV.map((l) => (
              <Link key={l.href} href={l.href} className="ls-navlink">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 shrink-0">
            <Link
              href={primaryHref}
              className={`as-btn as-btn-compact ${solid ? "as-btn-solid" : "as-btn-dark"}`}
            >
              <span className="ls-cta-full">Начать бесплатно</span>
              <span className="ls-cta-short">Начать</span>
            </Link>
            <button
              type="button"
              className="lg:hidden w-11 h-11 -mr-2.5 flex items-center justify-center rounded-full active:scale-95 transition-transform duration-100"
              onClick={() => setMenuOpen(true)}
              aria-label="Открыть меню"
              aria-expanded={menuOpen}
            >
              <Icon name="menu" size={20} />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div
          className="fixed inset-0 z-[70] ls-focal flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Меню"
        >
          <div className="ls-shell flex items-center justify-between h-[var(--ls-header-h)] shrink-0">
            <span className="text-[13px] tracking-[0.16em] uppercase text-white/85 font-medium">
              atlas.secure
            </span>
            <button
              type="button"
              className="w-11 h-11 -mr-2.5 flex items-center justify-center rounded-full text-white active:scale-95 transition-transform duration-100"
              onClick={() => setMenuOpen(false)}
              aria-label="Закрыть меню"
              autoFocus
            >
              <Icon name="close" size={20} />
            </button>
          </div>

          <nav className="ls-shell flex-1 flex flex-col justify-center min-h-0 overflow-y-auto" aria-label="Меню">
            {NAV.map((l, i) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="ls-enter py-4 text-white text-[clamp(26px,7.5vw,40px)] font-bold leading-[1.1] tracking-[-0.03em] border-b border-white/10"
                style={{ ["--ls-i" as string]: i }}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="ls-shell pb-[max(28px,env(safe-area-inset-bottom))] pt-6 shrink-0">
            <Link
              href={primaryHref}
              onClick={() => setMenuOpen(false)}
              className="as-btn as-btn-primary as-btn-accent as-btn-block"
            >
              Начать бесплатно
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

/** Марка Atlas — четыре угловые скобки. Общая для шапки, меню и футера. */
export function BrandMark({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M5 5 1 1M5 5V1M5 5H1" />
      <path d="M19 5l4-4M19 5V1M19 5h4" />
      <path d="M5 19l-4 4M5 19v4M5 19H1" />
      <path d="M19 19l4 4M19 19v4M19 19h4" />
    </svg>
  );
}
