"use client";

import { useRouter } from "next/navigation";

interface HeaderProps {
  showBack?: boolean;
  showMenu?: boolean;
  onBack?: () => void;
}

export default function Header({ showBack, showMenu, onBack }: HeaderProps) {
  const router = useRouter();

  return (
    <header className="flex items-center justify-between px-4 py-4 max-w-lg mx-auto w-full">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={onBack || (() => router.back())}
            className="flex items-center gap-1 text-muted hover:text-foreground transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="text-sm">Назад</span>
          </button>
        )}
        {!showBack && (
          <>
            <div className="w-10 h-10 bg-foreground rounded-xl flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-background">
                <path d="M12 2L4 7V17L12 22L20 17V7L12 2Z" fill="currentColor" />
                <path d="M12 8L8 10.5V15.5L12 18L16 15.5V10.5L12 8Z" fill="#0a0a0a" />
              </svg>
            </div>
            <span className="text-lg font-semibold">Atlas Secure</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        {showMenu && (
          <>
            <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-card transition-colors relative">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
            <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-card transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </button>
            <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-card transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </>
        )}
        {!showMenu && !showBack && (
          <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-card transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </button>
        )}
      </div>
    </header>
  );
}
