"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "atlas_welcome_dismissed";
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

interface WelcomeToastProps {
  telegramLinkToken?: string | null;
  subscriptionEnd?: string | null;
}

function formatTimeLeft(subscriptionEnd: string): string {
  const end = new Date(subscriptionEnd).getTime();
  const now = Date.now();
  const diff = end - now;

  if (diff <= 0) return "0 ч";

  const totalHours = Math.floor(diff / 3600000);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = Math.floor((diff % 3600000) / 60000);

  if (days >= 1) {
    return `${days} дн ${hours} ч`;
  }
  if (totalHours >= 1) {
    return `${totalHours} ч ${minutes} мин`;
  }
  return `${minutes} мин`;
}

export default function WelcomeToast({ telegramLinkToken, subscriptionEnd }: WelcomeToastProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (dismissed) {
        const elapsed = Date.now() - parseInt(dismissed, 10);
        if (elapsed < COOLDOWN_MS) return;
      }
      setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!visible || !subscriptionEnd) return;
    setTimeLeft(formatTimeLeft(subscriptionEnd));
    const interval = setInterval(() => {
      setTimeLeft(formatTimeLeft(subscriptionEnd));
    }, 60000);
    return () => clearInterval(interval);
  }, [visible, subscriptionEnd]);

  const handleClose = () => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    } catch {
      // silent
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed top-16 right-3 sm:right-6 z-50 w-[calc(100%-1.5rem)] sm:w-auto sm:max-w-sm animate-fade-in-up">
      <div className="bg-card border border-primary/30 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
        {/* Header */}
        <div className="flex items-start gap-3 p-4 sm:p-5 pb-0">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <h3 className="font-bold text-sm sm:text-base text-foreground leading-tight">
              Осталось: {timeLeft || "..."}
            </h3>
            <p className="text-xs sm:text-sm text-muted leading-relaxed mt-1.5">
              Ваш тестовый ключ активен ещё <b className="text-foreground">{timeLeft || "..."}</b>. Для приобретения полноценной подписки перейдите в Telegram-бот.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-card-hover flex items-center justify-center text-muted hover:text-foreground transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Buttons */}
        <div className="p-4 sm:p-5 pt-3 sm:pt-4 flex flex-col gap-2">
          <a
            href={`https://t.me/atlassecure_bot${telegramLinkToken ? `?start=${telegramLinkToken}` : ""}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 sm:h-11 rounded-xl bg-telegram text-white font-medium text-sm hover:bg-telegram-hover transition-all btn-press flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
            </svg>
            Открыть Telegram-бот
          </a>
          <button
            onClick={() => { handleClose(); router.push("/devices"); }}
            className="h-10 sm:h-11 rounded-xl bg-foreground text-background font-medium text-sm hover:bg-foreground/90 transition-all btn-press flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
            Перейти к подключению ключа
          </button>
        </div>
      </div>
    </div>
  );
}
