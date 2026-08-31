"use client";

import { useEffect, useState } from "react";

/**
 * Push-notifications toggle pulled out of the Settings panel into a
 * top-level dashboard tile. Mirrors the logic in SettingsCard's
 * checkPushStatus / togglePush — kept here as its own component so
 * the user can flip subscription on/off without expanding settings.
 *
 * Renders nothing if the runtime doesn't support Web Push.
 */
export default function PushToggleButton() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setSupported(false);
      return;
    }
    setSupported(true);
    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setEnabled(!!sub);
      } catch {
        setEnabled(false);
      }
    })();
  }, []);

  const toggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      if (enabled) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await fetch("/api/push/subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
          await sub.unsubscribe();
        }
        setEnabled(false);
      } else {
        const res = await fetch("/api/push/vapid-key");
        const data = await res.json();
        if (!data.success || !data.data.publicKey) return;
        const urlB64 = (b: string) => {
          const p = "=".repeat((4 - (b.length % 4)) % 4);
          const raw = atob((b + p).replace(/-/g, "+").replace(/_/g, "/"));
          const a = new Uint8Array(raw.length);
          for (let i = 0; i < raw.length; i++) a[i] = raw.charCodeAt(i);
          return a;
        };
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64(data.data.publicKey),
        });
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: sub.toJSON() }),
        });
        setEnabled(true);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  if (!supported) {
    return (
      <div className="dv2-card h-[52px] w-full rounded-2xl px-4 flex items-center justify-between gap-3 opacity-50 cursor-not-allowed">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white/60 shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </div>
          <div className="text-[13px] font-medium text-white/55 truncate">Push не поддерживается</div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="dv2-card h-[52px] w-full rounded-2xl px-4 flex items-center justify-between gap-3 transition-all active:scale-[0.985] disabled:opacity-60"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-8 w-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white/80 shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
        </div>
        <div className="text-[13px] font-medium text-white/90 truncate">Push-уведомления</div>
      </div>
      <div
        className={`relative w-10 h-6 rounded-full transition-colors duration-300 shrink-0 ${
          enabled ? "bg-[color:var(--px-accent)]" : "bg-white/[0.10]"
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
            enabled ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </div>
    </button>
  );
}
