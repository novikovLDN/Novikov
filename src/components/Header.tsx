"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface HeaderProps {
  showBack?: boolean;
  showMenu?: boolean;
  onBack?: () => void;
  transparent?: boolean;
  onNotifications?: () => void;
  onHelp?: () => void;
  unreadCount?: number;
}

export default function Header({ showBack, showMenu, onBack, transparent, onNotifications, onHelp, unreadCount = 0 }: HeaderProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 10) {
        setVisible(true);
      } else if (y > lastScrollY.current) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full safe-top transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      } ${transparent ? "" : "glass border-b border-border/50"}`}
    >
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 max-w-2xl mx-auto w-full">
        {/* Left side */}
        <div className="flex items-center gap-3 min-w-0">
          {showBack ? (
            <button
              onClick={onBack || (() => router.back())}
              className="flex items-center gap-1.5 text-muted-light hover:text-foreground transition-colors btn-press py-1"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              <span className="text-sm font-medium">Назад</span>
            </button>
          ) : (
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-3 btn-press"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center">
                <svg width="36" height="36" viewBox="0 0 100 60" fill="none" className="sm:w-10 sm:h-10">
                  <defs>
                    <linearGradient id="inf-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#c084fc" />
                      <stop offset="50%" stopColor="#a78bfa" />
                      <stop offset="100%" stopColor="#93c5fd" />
                    </linearGradient>
                    <linearGradient id="inf-shine" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#e9d5ff" stopOpacity="0.8" />
                      <stop offset="50%" stopColor="#ffffff" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#bfdbfe" stopOpacity="0.6" />
                    </linearGradient>
                    <filter id="inf-glow">
                      <feGaussianBlur stdDeviation="2" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  {/* Main infinity path */}
                  <path
                    d="M50 30 C50 15, 30 5, 18 15 C6 25, 6 40, 18 45 C30 50, 50 40, 50 30 C50 20, 70 10, 82 15 C94 20, 94 40, 82 45 C70 50, 50 45, 50 30Z"
                    stroke="url(#inf-grad)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    filter="url(#inf-glow)"
                  />
                  {/* Shine overlay */}
                  <path
                    d="M50 30 C50 15, 30 5, 18 15 C6 25, 6 40, 18 45 C30 50, 50 40, 50 30 C50 20, 70 10, 82 15 C94 20, 94 40, 82 45 C70 50, 50 45, 50 30Z"
                    stroke="url(#inf-shine)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </div>
              <span className="text-base sm:text-lg font-bold tracking-tight">Atlas Secure</span>
            </button>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {showMenu && (
            <>
              <button
                onClick={onNotifications}
                className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center hover:bg-card-hover active:bg-card-active transition-colors"
                aria-label="Уведомления"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-5 sm:h-5">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-danger rounded-full flex items-center justify-center px-1">
                    <span className="text-[10px] font-bold text-white leading-none">{unreadCount > 9 ? "9+" : unreadCount}</span>
                  </span>
                )}
              </button>
              <button
                onClick={onHelp}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center hover:bg-card-hover active:bg-card-active transition-colors"
                aria-label="Помощь"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-5 sm:h-5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </button>
            </>
          )}
          {!showMenu && !showBack && (
            <button
              onClick={onHelp}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center hover:bg-card-hover active:bg-card-active transition-colors"
              aria-label="Помощь"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-5 sm:h-5">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
