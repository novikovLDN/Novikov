"use client";

import { useTheme } from "./ThemeProvider";

/**
 * Standalone theme switcher button. Used as a top-level dashboard
 * tile alongside Settings + Push-notifications so the user can
 * toggle the colour scheme without opening the settings panel.
 */
export default function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="dv2-card h-[52px] w-full rounded-2xl px-4 flex items-center justify-between gap-3 transition-all active:scale-[0.985]"
      aria-label="Переключить тему"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-8 w-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white/80 shrink-0">
          {isDark ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          )}
        </div>
        <div className="text-[13px] font-medium text-white/90 truncate">
          {isDark ? "Тёмная тема" : "Светлая тема"}
        </div>
      </div>
      <div
        className={`relative w-10 h-6 rounded-full transition-colors duration-300 shrink-0 ${
          !isDark ? "bg-[#5E6AD2]" : "bg-white/[0.10]"
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
            !isDark ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </div>
    </button>
  );
}
