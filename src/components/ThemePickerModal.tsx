"use client";

import { useState, useEffect } from "react";
import { useTheme } from "./ThemeProvider";

export default function ThemePickerModal() {
  const { theme, setTheme } = useTheme();
  const [show, setShow] = useState(false);
  const [selected, setSelected] = useState<"dark" | "light" | "auto">("auto");

  useEffect(() => {
    const picked = localStorage.getItem("theme-picked");
    if (!picked) {
      setTimeout(() => setShow(true), 800);
    }
  }, []);

  const applySelection = () => {
    if (selected === "auto") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    } else {
      setTheme(selected);
    }
    localStorage.setItem("theme-picked", "1");
    setShow(false);
  };

  const dismiss = () => {
    localStorage.setItem("theme-picked", "1");
    setShow(false);
  };

  // Live preview on selection
  useEffect(() => {
    if (!show) return;
    if (selected === "auto") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    } else {
      setTheme(selected);
    }
  }, [selected, show, setTheme]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4" onClick={dismiss}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-card border border-border/50 rounded-2xl sm:rounded-3xl p-5 sm:p-7 w-full max-w-sm animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-card-hover transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h3 className="text-lg sm:text-xl font-bold text-center mb-1">Выберите тему</h3>
        <p className="text-muted text-xs sm:text-sm text-center mb-5">Как вам удобнее?</p>

        {/* Options */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {/* Dark */}
          <button
            onClick={() => setSelected("dark")}
            className={`rounded-xl p-3 border transition-all btn-press flex flex-col items-center gap-2 ${
              selected === "dark"
                ? "border-primary bg-primary/10"
                : "border-border hover:border-border-light"
            }`}
          >
            <div className="w-10 h-10 rounded-lg bg-[#0a0a0a] border border-[#262626] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ededed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            </div>
            <span className="text-xs font-medium">Тёмная</span>
          </button>

          {/* Light */}
          <button
            onClick={() => setSelected("light")}
            className={`rounded-xl p-3 border transition-all btn-press flex flex-col items-center gap-2 ${
              selected === "light"
                ? "border-primary bg-primary/10"
                : "border-border hover:border-border-light"
            }`}
          >
            <div className="w-10 h-10 rounded-lg bg-[#f5f5f7] border border-[#d4d4d8] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            </div>
            <span className="text-xs font-medium">Светлая</span>
          </button>

          {/* Auto */}
          <button
            onClick={() => setSelected("auto")}
            className={`rounded-xl p-3 border transition-all btn-press flex flex-col items-center gap-2 ${
              selected === "auto"
                ? "border-primary bg-primary/10"
                : "border-border hover:border-border-light"
            }`}
          >
            <div className="w-10 h-10 rounded-lg overflow-hidden flex border border-border">
              <div className="w-1/2 bg-[#0a0a0a]" />
              <div className="w-1/2 bg-[#f5f5f7]" />
            </div>
            <span className="text-xs font-medium">Авто</span>
          </button>
        </div>

        <button
          onClick={applySelection}
          className="w-full h-11 sm:h-12 rounded-xl bg-foreground text-background font-semibold text-sm sm:text-base hover:bg-foreground/90 transition-all btn-press"
        >
          Подтвердить
        </button>
      </div>
    </div>
  );
}
