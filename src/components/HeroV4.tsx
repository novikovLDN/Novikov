"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * Landing hero, v4 — modeled on the provod.ai reference.
 *
 * Layout:
 *   - Sticky top brand row (logo left, minimal nav right)
 *   - Green "status" pill top-of-hero
 *   - Big MTS-Wide headline in 2 lines
 *   - Lede paragraph
 *   - Two CTAs (orange primary, outlined secondary)
 *   - Scattered outlined labels ("Чат", "API", "Изображения", "Видео")
 *     tied together with a hand-drawn SVG curve overlay
 *
 * Content is Atlas-Secure-branded — the layout is the reference, not
 * the copy. Font faces are already wired via /public/fonts + globals.css;
 * if the MTS Wide files aren't uploaded yet the fallback Inter stack
 * still renders the same layout cleanly.
 */
export default function HeroV4({
  brand = "atlas.secure",
  statusText = "Доступ без ограничений",
  headlineTop = "Защищённое соединение —",
  headlineBottom = "в одной подписке",
  lede = "Создайте аккаунт, выберите тариф и подключитесь на любом устройстве за минуту.",
  primaryCta = "Создать аккаунт",
  primaryHref = "/auth",
  secondaryCta = "Посмотреть тарифы",
  secondaryHref = "/pricing",
  pills = ["iPhone", "Android", "macOS", "Windows"],
  navLinks = [
    { label: "Тарифы", href: "/pricing" },
    { label: "Безопасность", href: "/security" },
    { label: "О нас", href: "/about" },
    { label: "Поддержка", href: "/contact" },
  ],
}: {
  brand?: string;
  statusText?: string;
  headlineTop?: string;
  headlineBottom?: string;
  lede?: string;
  primaryCta?: string;
  primaryHref?: string;
  secondaryCta?: string;
  secondaryHref?: string;
  pills?: string[];
  navLinks?: Array<{ label: string; href: string }>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <section className="hero-v4">
      {/* Brand + status row */}
      <div className="flex items-center justify-between px-5 sm:px-8 pt-6 sm:pt-8">
        <div className="flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M5 5 L1 1 M5 5 L5 1 M5 5 L1 5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19 5 L23 1 M19 5 L19 1 M19 5 L23 5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 19 L1 23 M5 19 L5 23 M5 19 L1 19" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19 19 L23 23 M19 19 L19 23 M19 19 L23 19" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span
            className="font-mts-wide text-[13px] tracking-[0.16em] uppercase text-white/85"
          >
            {brand}
          </span>
        </div>

        {/* Desktop nav — inline links */}
        <nav className="hidden md:flex items-center gap-6 font-mts-wide text-[14px] text-white/70">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-white transition-colors">
              {l.label}
            </Link>
          ))}
          <Link
            href={primaryHref}
            className="ml-3 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/15 transition-colors"
          >
            Войти
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden w-10 h-10 rounded-full bg-white/8 border border-white/12 flex items-center justify-center"
          onClick={() => setMenuOpen(true)}
          aria-label="Меню"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8 font-mts-wide"
          onClick={() => setMenuOpen(false)}
        >
          <button
            className="absolute top-6 right-6 w-11 h-11 rounded-full bg-white/8 border border-white/12 flex items-center justify-center"
            onClick={() => setMenuOpen(false)}
            aria-label="Закрыть"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="text-white text-2xl" onClick={() => setMenuOpen(false)}>
              {l.label}
            </Link>
          ))}
          <Link
            href={primaryHref}
            className="mt-4 px-6 py-3 rounded-full bg-white text-black text-base"
            onClick={() => setMenuOpen(false)}
          >
            Войти
          </Link>
        </div>
      )}

      {/* Copy block */}
      <div className="flex-1 flex flex-col justify-center px-5 sm:px-8 pt-10 pb-16 sm:pt-16 sm:pb-24 max-w-[1200px] mx-auto w-full">
        <div className="mb-6">
          <span className="hero-v4-status-pill">{statusText}</span>
        </div>

        <h1 className="hero-v4-title">
          {headlineTop}
          <br />
          {headlineBottom}
        </h1>

        <p className="hero-v4-lede mt-6 sm:mt-8">{lede}</p>

        <div className="mt-8 sm:mt-10 flex flex-wrap gap-3 sm:gap-4">
          <Link href={primaryHref} className="hero-v4-cta-primary">
            {primaryCta}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <Link href={secondaryHref} className="hero-v4-cta-secondary">
            {secondaryCta}
          </Link>
        </div>

        {/* Scattered pills with hand-drawn curves — reference layout */}
        <div className="relative mt-14 sm:mt-20 h-[220px] sm:h-[280px]">
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 800 300"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {/* Loose bezier lines linking the four pills */}
            <path
              d="M 110 60 Q 260 140 420 100 Q 560 60 700 170"
              stroke="rgba(255,255,255,0.14)"
              strokeWidth="1.2"
              fill="none"
            />
            <path
              d="M 130 200 Q 280 130 460 220 Q 620 300 720 240"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1.2"
              fill="none"
            />
            <path
              d="M 60 110 Q 200 260 380 170 Q 540 90 780 130"
              stroke="rgba(255,255,255,0.10)"
              strokeWidth="1.2"
              fill="none"
            />
          </svg>

          <div className="absolute left-[4%] top-[10%]"><span className="hero-v4-pill">{pills[0]}</span></div>
          <div className="absolute right-[8%] top-[30%]"><span className="hero-v4-pill">{pills[1]}</span></div>
          <div className="absolute left-[12%] bottom-[15%]"><span className="hero-v4-pill">{pills[2]}</span></div>
          <div className="absolute right-[14%] bottom-[20%]"><span className="hero-v4-pill">{pills[3]}</span></div>
        </div>
      </div>
    </section>
  );
}
