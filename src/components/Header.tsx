"use client";

import { useRouter } from "next/navigation";

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

  return (
    <header
      className={`sticky top-0 z-50 w-full safe-top ${
        transparent ? "" : "glass border-b border-border/50"
      }`}
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
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-foreground rounded-xl flex items-center justify-center shadow-lg shadow-white/5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-background sm:w-6 sm:h-6">
                  <path d="M12 2L4 7V17L12 22L20 17V7L12 2Z" fill="currentColor" />
                  <path d="M12 8L8 10.5V15.5L12 18L16 15.5V10.5L12 8Z" fill="#0a0a0a" />
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
