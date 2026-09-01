"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "atlas_tg_link_dismissed";
const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

interface TelegramLinkBannerProps {
  telegramLinked: boolean;
  telegramLinkToken?: string | null;
}

export default function TelegramLinkBanner({ telegramLinked, telegramLinkToken }: TelegramLinkBannerProps) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (telegramLinked) return;

    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (dismissed) {
        const elapsed = Date.now() - parseInt(dismissed, 10);
        if (elapsed < COOLDOWN_MS) {
          // Schedule show after remaining cooldown
          const remaining = COOLDOWN_MS - elapsed;
          const timer = setTimeout(() => setVisible(true), remaining);
          return () => clearTimeout(timer);
        }
      }
      // Show after short delay for smooth entrance
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    } catch {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [telegramLinked]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      setClosing(false);
      try {
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
      } catch { /* silent */ }
    }, 300);
  };

  if (telegramLinked || !visible) return null;

  return (
    <div className={`fixed top-3 sm:top-4 left-3 right-3 sm:left-auto sm:right-4 z-50 sm:max-w-sm transition-all duration-300 ${
      closing ? "opacity-0 -translate-y-4" : "opacity-100 translate-y-0 animate-slide-down"
    }`}>
      <div className="relative bg-[color:var(--px-surface)] border border-[color:var(--px-line)] rounded-2xl  overflow-hidden">
        <div className="p-4 sm:p-5">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/[0.04] flex items-center justify-center text-black/45 hover:text-black/80 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Content */}
          <div className="flex items-start gap-3 pr-6">
            <div className="w-10 h-10 rounded-xl bg-[color:var(--px-accent-dim)] flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="font-mts-wide font-bold text-sm sm:text-base leading-tight text-black">
                Привяжите Telegram
              </h3>
              <p className="font-mts-wide text-xs sm:text-sm text-black/55 mt-1 leading-relaxed">
                Синхронизация подписки, баланс и управление — всё в боте
              </p>
            </div>
          </div>

          {/* Button */}
          <a
            href={`https://t.me/atlas_suppbot${telegramLinkToken ? `?start=${telegramLinkToken}` : ""}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClose}
            className="font-mts-wide mt-3 w-full h-10 sm:h-11 rounded-xl bg-[color:var(--px-accent)] text-[color:var(--px-accent-ink)] font-medium text-sm hover:bg-[color:var(--px-accent-hi)] transition-all active:scale-[0.985] flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
            </svg>
            Привязать Telegram
          </a>
        </div>
      </div>
    </div>
  );
}
