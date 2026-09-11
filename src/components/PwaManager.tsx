"use client";

import { useEffect, useState } from "react";
import { requestOverlay, releaseOverlay, whenConsentSettled, whenEngaged, snoozed, snooze } from "@/lib/overlay-queue";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const SNOOZE_KEY = "pwa-install-dismissed";

/**
 * Сервис-воркер и предложение установки (Chrome, Edge, Android).
 *
 * ИСПРАВЛЕНО 11.09.2026:
 *   · Подписка на push больше не запрашивается у каждого посетителя
 *     при загрузке страницы. Браузер запрещает спрашивать разрешение
 *     без жеста пользователя и пишет ошибку в консоль; подписка — дело
 *     кнопки в кабинете (SettingsCard, PushToggleButton). Здесь осталась
 *     только тихая синхронизация уже выданной подписки.
 *   · Карточка установки встаёт в общую очередь (`overlay-queue.ts`):
 *     после согласия на cookie, со второго визита, после 30 с на
 *     странице или прокрутки половины документа. Отказ — пауза 7 дней.
 */
export default function PwaManager() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    syncExistingPush();

    let cancelSlot = () => {};
    let cancelConsent = () => {};
    let cancelEngaged = () => {};

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      if (snoozed(SNOOZE_KEY, 7)) return;
      cancelConsent = whenConsentSettled(() => {
        cancelEngaged = whenEngaged(() => {
          cancelSlot = requestOverlay("install", () => setShow(true));
        });
      });
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      cancelConsent();
      cancelEngaged();
      cancelSlot();
    };
  }, []);

  const close = () => {
    setShow(false);
    releaseOverlay("install");
  };

  const install = async () => {
    if (!prompt) return close();
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome !== "accepted") snooze(SNOOZE_KEY);
    setPrompt(null);
    close();
  };

  const dismiss = () => {
    snooze(SNOOZE_KEY);
    close();
  };

  if (!show) return null;

  return (
    <div className="ov-card" role="dialog" aria-labelledby="pwa-install-title">
      <div className="ov-row">
        <span className="ov-mark" aria-hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </span>
        <div className="ov-copy">
          <p id="pwa-install-title" className="ov-title">Atlas на главном экране</p>
          <p className="ov-note">Открывается одним касанием, как обычное приложение.</p>
        </div>
        <button type="button" onClick={dismiss} className="ov-x" aria-label="Закрыть">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="ov-actions">
        <button type="button" onClick={install} className="ov-btn ov-btn-primary">Установить</button>
        <button type="button" onClick={dismiss} className="ov-btn ov-btn-text">Не сейчас</button>
      </div>
    </div>
  );
}

/**
 * Если человек уже включил уведомления в кабинете, подписка могла
 * потеряться на сервере — отправляем её заново. Разрешение не
 * запрашивается: без выданного разрешения функция ничего не делает.
 */
async function syncExistingPush() {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (!existing) return;
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: existing.toJSON() }),
    });
  } catch {
    // Нет поддержки или сети — не критично.
  }
}
