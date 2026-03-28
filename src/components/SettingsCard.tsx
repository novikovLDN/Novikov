"use client";

import { useEffect, useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import LoadingSpinner from "./LoadingSpinner";

export default function SettingsCard() {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);

  const [hasPasskey, setHasPasskey] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyStatus, setPasskeyStatus] = useState<"" | "success" | "error">("");

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    checkPushStatus();
    checkPasskeyStatus();
  }, [open]);

  // ─── Push Notifications ───────────────────────────────────────

  const checkPushStatus = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushSupported(false);
      return;
    }
    setPushSupported(true);

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setPushEnabled(!!sub);
    } catch {
      setPushEnabled(false);
    }
  };

  const togglePush = async () => {
    setPushLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;

      if (pushEnabled) {
        // Unsubscribe
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await fetch("/api/push/subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
          await sub.unsubscribe();
        }
        setPushEnabled(false);
      } else {
        // Subscribe
        const res = await fetch("/api/push/vapid-key");
        const data = await res.json();
        if (!data.success || !data.data.publicKey) return;

        const urlBase64ToUint8Array = (b: string) => {
          const p = "=".repeat((4 - (b.length % 4)) % 4);
          const raw = atob((b + p).replace(/-/g, "+").replace(/_/g, "/"));
          const arr = new Uint8Array(raw.length);
          for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
          return arr;
        };

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(data.data.publicKey),
        });

        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: sub.toJSON() }),
        });
        setPushEnabled(true);
      }
    } catch {
      // Permission denied or error
    } finally {
      setPushLoading(false);
    }
  };

  // ─── Passkey ──────────────────────────────────────────────────

  const checkPasskeyStatus = async () => {
    try {
      const res = await fetch("/api/auth/passkey/check");
      const data = await res.json();
      setHasPasskey(data.success && data.data.hasPasskey);
    } catch {
      setHasPasskey(false);
    }
  };

  const handleSetupPasskey = async () => {
    setPasskeyLoading(true);
    setPasskeyStatus("");
    try {
      const optRes = await fetch("/api/auth/passkey/register");
      const optData = await optRes.json();
      if (!optData.success) throw new Error();

      const credential = await startRegistration({ optionsJSON: optData.data });

      const verRes = await fetch("/api/auth/passkey/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credential),
      });
      const verData = await verRes.json();

      if (verData.success) {
        setPasskeyStatus("success");
        setHasPasskey(true);
        setTimeout(() => setPasskeyStatus(""), 3000);
      } else {
        setPasskeyStatus("error");
      }
    } catch (err) {
      if ((err as Error).name !== "NotAllowedError") {
        setPasskeyStatus("error");
      }
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleRemovePasskey = async () => {
    setPasskeyLoading(true);
    try {
      const res = await fetch("/api/auth/passkey/delete", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setHasPasskey(false);
      }
    } catch {
      // silent
    } finally {
      setPasskeyLoading(false);
    }
  };

  return (
    <div className="animate-fade-in-up animate-delay-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full h-11 sm:h-12 rounded-2xl bg-card border border-border/50 text-foreground font-medium text-sm sm:text-base hover:bg-card-hover transition-all btn-press flex items-center justify-center gap-2"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
        Настройки
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-out ${open ? "max-h-[400px] opacity-100 mt-2.5" : "max-h-0 opacity-0 mt-0"}`}>
        <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-5 space-y-4">

          {/* Push Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">Уведомления</p>
                <p className="text-[11px] text-muted">{pushSupported ? (pushEnabled ? "Включены" : "Выключены") : "Не поддерживается"}</p>
              </div>
            </div>

            {pushSupported && (
              <button
                onClick={togglePush}
                disabled={pushLoading}
                className={`relative w-12 h-7 rounded-full transition-colors duration-300 shrink-0 ${
                  pushEnabled ? "bg-primary" : "bg-border"
                } ${pushLoading ? "opacity-50" : ""}`}
              >
                <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform duration-300 ${
                  pushEnabled ? "translate-x-5.5" : "translate-x-0.5"
                }`} />
              </button>
            )}
          </div>

          <div className="h-px bg-border/50" />

          {/* Passkey */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 10a3 3 0 100-6 3 3 0 000 6z" />
                  <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">Быстрый вход</p>
                <p className="text-[11px] text-muted">
                  {passkeyStatus === "success" ? "Настроен!" : hasPasskey ? "Face ID / Touch ID" : "Не настроен"}
                </p>
              </div>
            </div>

            {passkeyLoading ? (
              <LoadingSpinner size="sm" className="text-primary" />
            ) : hasPasskey ? (
              <button
                onClick={handleRemovePasskey}
                className="text-xs text-muted hover:text-danger transition-colors px-3 py-1.5 rounded-lg hover:bg-danger/10"
              >
                Отвязать
              </button>
            ) : (
              <button
                onClick={handleSetupPasskey}
                className="text-xs text-primary font-medium px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                Настроить
              </button>
            )}
          </div>

          {passkeyStatus === "error" && (
            <p className="text-danger text-xs">Не удалось. Попробуйте позже.</p>
          )}
        </div>
      </div>
    </div>
  );
}
