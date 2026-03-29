"use client";

import { useEffect, useState } from "react";

export default function IosInstallBanner() {
  const [show, setShow] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIos(ios);

    // Check if already running as PWA
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    if (!ios || standalone) return;

    // Show every 1 hour
    const dismissedAt = localStorage.getItem("ios-install-dismissed");
    if (dismissedAt && Date.now() - Number(dismissedAt) < 60 * 60 * 1000) return;

    // Delay appearance
    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setShow(false);
    setShowGuide(false);
    localStorage.setItem("ios-install-dismissed", String(Date.now()));
  };

  if (!isIos || isStandalone || (!show && !showGuide)) return null;

  // ─── Guide Screen ────────────────────────────────────────────
  if (showGuide) {
    return (
      <div className="fixed inset-0 z-[60] bg-background overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 glass safe-top">
          <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
            <button
              onClick={() => { setShowGuide(false); setShow(true); }}
              className="flex items-center gap-1.5 text-muted-light hover:text-foreground transition-colors btn-press py-1"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              <span className="text-sm font-medium">Назад</span>
            </button>
            <button
              onClick={handleDismiss}
              className="text-xs text-muted hover:text-foreground transition-colors px-3 py-1.5"
            >
              Закрыть
            </button>
          </div>
        </div>

        <div className="px-5 pb-10 max-w-lg mx-auto">
          {/* Title */}
          <div className="text-center mt-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="ig" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
                <path d="M50 8 L85 88 L72 88 L62 64 L38 64 L28 88 L15 88 Z M50 28 L40 56 L60 56 Z" fill="url(#ig)" />
              </svg>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mb-2">Установите Atlas Secure</h1>
            <p className="text-sm text-muted leading-relaxed">
              Добавьте приложение на домашний экран для быстрого доступа и push-уведомлений
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="animate-fade-in-up">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Нажмите кнопку «Поделиться»</p>
                  <p className="text-xs text-muted leading-relaxed">
                    В нижней панели Safari найдите иконку «Поделиться» — квадрат со стрелкой вверх
                  </p>
                </div>
              </div>
              <div className="bg-card border border-border/50 rounded-2xl p-4 flex items-center justify-center">
                <div className="flex items-center gap-3 text-muted">
                  <span className="text-xs">Найдите в панели Safari:</span>
                  <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="animate-fade-in-up animate-delay-1">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Выберите «На экран "Домой"»</p>
                  <p className="text-xs text-muted leading-relaxed">
                    Прокрутите меню вниз и нажмите «На экран "Домой"» (иконка с плюсом)
                  </p>
                </div>
              </div>
              <div className="bg-card border border-border/50 rounded-2xl p-3">
                <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl bg-background">
                  <div className="w-8 h-8 rounded-lg bg-card-hover flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">На экран «Домой»</span>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="animate-fade-in-up animate-delay-2">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">3</span>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Нажмите «Добавить»</p>
                  <p className="text-xs text-muted leading-relaxed">
                    Подтвердите добавление — нажмите «Добавить» в правом верхнем углу
                  </p>
                </div>
              </div>
              <div className="bg-card border border-border/50 rounded-2xl p-3">
                <div className="flex items-center justify-between px-2">
                  <span className="text-sm text-muted">Отменить</span>
                  <span className="text-sm font-medium">Atlas Secure</span>
                  <span className="text-sm font-semibold text-primary">Добавить</span>
                </div>
              </div>
            </div>

            {/* Step 4 - Done */}
            <div className="animate-fade-in-up animate-delay-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-success/15 flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Готово!</p>
                  <p className="text-xs text-muted leading-relaxed">
                    Atlas Secure появится на вашем домашнем экране как обычное приложение. Откройте его — оно запустится без адресной строки браузера.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom button */}
          <button
            onClick={handleDismiss}
            className="w-full h-12 rounded-2xl bg-foreground text-background font-semibold text-sm sm:text-base hover:bg-foreground/90 transition-all btn-press mt-8"
          >
            Понятно
          </button>
        </div>
      </div>
    );
  }

  // ─── Banner ──────────────────────────────────────────────────
  return (
    <div className="fixed bottom-4 left-3 right-3 z-50 max-w-md mx-auto animate-fade-in-up safe-bottom">
      <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-xl shadow-black/20">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <svg width="24" height="24" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <path d="M50 8 L85 88 L72 88 L62 64 L38 64 L28 88 L15 88 Z M50 28 L40 56 L60 56 Z" fill="url(#bg)" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Установите приложение</p>
            <p className="text-muted text-[11px] sm:text-xs mt-0.5 leading-relaxed">
              Добавьте Atlas Secure на домашний экран — быстрый доступ и push-уведомления
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-card-hover transition-colors shrink-0 -mt-0.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <button
          onClick={() => { setShow(false); setShowGuide(true); }}
          className="w-full h-10 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary-hover transition-all btn-press mt-3 flex items-center justify-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          Перейти к инструкции
        </button>
      </div>
    </div>
  );
}
