"use client";

import { useEffect, useState } from "react";
import { whenConsentSettled } from "@/lib/overlay-queue";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaManager() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Subscribe to push notifications
    subscribeToPush();

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      // Показываем не сразу и только после того, как посетитель
      // разобрался с обязательным согласием на cookie: иначе две
      // карточки рисуются в одной точке внизу экрана.
      whenConsentSettled(() => {
        setTimeout(() => {
          const dismissedAt = localStorage.getItem("pwa-install-dismissed");
          const expired = !dismissedAt || (Date.now() - Number(dismissedAt)) > 24 * 60 * 60 * 1000;
          if (expired) {
            setShowInstall(true);
          }
        }, 5000);
      });
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const subscribeToPush = async () => {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

      const registration = await navigator.serviceWorker.ready;

      // Check if already subscribed
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        // Send to server in case it was lost
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: existing.toJSON() }),
        });
        return;
      }

      // Get VAPID key
      const res = await fetch("/api/push/vapid-key");
      const data = await res.json();
      if (!data.success || !data.data.publicKey) return;

      // Convert VAPID key
      const urlBase64ToUint8Array = (base64String: string) => {
        const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
        const rawData = atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
        return outputArray;
      };

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.data.publicKey),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });
    } catch {
      // Push not supported or denied — that's fine
    }
  };

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setShowInstall(false);
    }
    setInstallPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstall(false);
    setDismissed(true);
    // Remember dismissal with timestamp — will show again after 24h
    localStorage.setItem("pwa-install-dismissed", String(Date.now()));
  };

  if (!showInstall || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto animate-fade-in-up">
      <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-xl shadow-black/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Установить приложение</p>
            <p className="text-muted text-xs mt-0.5">Добавьте Atlas Secure на главный экран для быстрого доступа и push-уведомлений</p>
          </div>
          <button
            onClick={handleDismiss}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-card-hover transition-colors shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <button
          onClick={handleInstall}
          className="w-full h-10 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary-hover transition-all btn-press mt-3 flex items-center justify-center gap-2"
        >
          Установить
        </button>
      </div>
    </div>
  );
}
