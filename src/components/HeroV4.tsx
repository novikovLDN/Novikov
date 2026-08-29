"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * Landing hero — v5.
 *
 * Redesign brief:
 *   - Kill the four scattered pills + hand-drawn bezier overlay. On
 *     phones they landed in a random order and made the first screen
 *     read as decoration instead of product.
 *   - Give the hero one gravity centre: status pill → the two-line
 *     display headline → a short lede → two CTAs → a single fact-bar
 *     grounded in real numbers (4 стран, SLA, задержка).
 *   - Everything the visitor needs to decide "open an account" sits
 *     above the fold on a 375-wide phone.
 *
 * The dark bg + rounded-bottom corners stay — the section is the one
 * dark focal surface of the landing (all other sections are light).
 * Content font is MTS Wide throughout so the hero reads as one voice
 * with the rest of the marketing surface.
 */
export default function HeroV4({
  brand = "atlas.secure",
  statusText = "Стабильный интернет 24/7",
  headlineTop = "Ускоритель",
  headlineBottom = "интернета",
  lede = "Стабильное соединение и низкий пинг на любом устройстве. Настройка за минуту, дальше работает автоматически.",
  primaryCta = "Создать аккаунт",
  primaryHref = "/auth",
  secondaryCta = "Посмотреть тарифы",
  secondaryHref = "/pricing",
  factbar = [
    { value: "4",       label: "страны" },
    { value: "99,98 %", label: "аптайм" },
    { value: "< 5 мс",  label: "в регионе" },
    { value: "6",       label: "платформ" },
  ],
  navLinks = [
    { label: "Тарифы",       href: "/pricing" },
    { label: "Безопасность", href: "/security" },
    { label: "О нас",        href: "/about" },
    { label: "Поддержка",    href: "/contact" },
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
  factbar?: Array<{ value: string; label: string }>;
  navLinks?: Array<{ label: string; href: string }>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <section className="hero-v4">
      {/* Brand + nav row */}
      <div className="flex items-center justify-between px-5 sm:px-8 pt-6 sm:pt-8">
        <div className="flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M5 5 L1 1 M5 5 L5 1 M5 5 L1 5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19 5 L23 1 M19 5 L19 1 M19 5 L23 5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 19 L1 23 M5 19 L5 23 M5 19 L1 19" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19 19 L23 23 M19 19 L19 23 M19 19 L23 19" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-mts-wide text-[13px] tracking-[0.16em] uppercase text-white/85">
            {brand}
          </span>
        </div>

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

        <button
          className="md:hidden w-11 h-11 rounded-full bg-white/10 border border-white/15 flex items-center justify-center active:scale-[0.95] transition-transform"
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
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center gap-8 font-mts-wide"
          onClick={() => setMenuOpen(false)}
        >
          <button
            className="absolute top-6 right-6 w-11 h-11 rounded-full bg-white/10 border border-white/15 flex items-center justify-center"
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

      {/* Central column — everything above the fold on a 375 phone */}
      <div className="flex-1 flex flex-col justify-center px-5 sm:px-8 pt-8 pb-12 sm:pt-14 sm:pb-16 max-w-[1120px] mx-auto w-full">
        <div className="mb-6 flex items-center gap-2">
          <span className="hero-v4-status-dot" aria-hidden />
          <span className="hero-v4-status-pill">{statusText}</span>
        </div>

        <h1 className="hero-v4-title">
          {headlineTop}
          <br />
          {headlineBottom}
        </h1>

        <p className="hero-v4-lede mt-5 sm:mt-7">{lede}</p>

        <div className="mt-7 sm:mt-9 flex flex-wrap gap-3 sm:gap-4">
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
      </div>

      {/* Factbar — grounded in real numbers, one visual anchor.
          Mobile: 2×2 grid so cells stay tappable and legible;
          sm+: horizontal 4-up row that mirrors the "one continuous
          bar" reading. */}
      <div className="px-5 sm:px-8 pb-8 sm:pb-10 max-w-[1120px] mx-auto w-full">
        <div className="hero-v4-factbar">
          {factbar.map((f) => (
            <div key={f.label} className="hero-v4-fact">
              <div className="hero-v4-fact-value">{f.value}</div>
              <div className="hero-v4-fact-label">{f.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
