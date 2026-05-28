"use client";

import { useEffect, useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import LoadingSpinner from "./LoadingSpinner";
import { useTheme } from "./ThemeProvider";

export default function SettingsCard() {
  const { theme, setTheme } = useTheme();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);

  const [hasPasskey, setHasPasskey] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyStatus, setPasskeyStatus] = useState<"" | "success" | "error">("");
  const [confirmRemove, setConfirmRemove] = useState(false);

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    checkPushStatus();
    checkPasskeyStatus();
  }, [open]);

  const checkPushStatus = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) { setPushSupported(false); return; }
    setPushSupported(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setPushEnabled(!!sub);
    } catch { setPushEnabled(false); }
  };

  const togglePush = async () => {
    setPushLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      if (pushEnabled) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await fetch("/api/push/subscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
          await sub.unsubscribe();
        }
        setPushEnabled(false);
      } else {
        const res = await fetch("/api/push/vapid-key");
        const data = await res.json();
        if (!data.success || !data.data.publicKey) return;
        const urlB64 = (b: string) => { const p = "=".repeat((4 - (b.length % 4)) % 4); const raw = atob((b + p).replace(/-/g, "+").replace(/_/g, "/")); const a = new Uint8Array(raw.length); for (let i = 0; i < raw.length; i++) a[i] = raw.charCodeAt(i); return a; };
        const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64(data.data.publicKey) });
        await fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subscription: sub.toJSON() }) });
        setPushEnabled(true);
      }
    } catch {} finally { setPushLoading(false); }
  };

  const checkPasskeyStatus = async () => {
    try {
      const r = await fetch("/api/auth/passkey/check");
      const d = await r.json();
      setHasPasskey(d.success && d.data.hasPasskey);
    } catch { setHasPasskey(false); }
  };

  const handleSetupPasskey = async () => {
    setPasskeyLoading(true); setPasskeyStatus("");
    try {
      const o = await fetch("/api/auth/passkey/register"); const od = await o.json();
      if (!od.success) throw new Error();
      const cred = await startRegistration({ optionsJSON: od.data });
      const v = await fetch("/api/auth/passkey/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cred) });
      const vd = await v.json();
      if (vd.success) { setPasskeyStatus("success"); setHasPasskey(true); setTimeout(() => setPasskeyStatus(""), 3000); }
      else setPasskeyStatus("error");
    } catch (e) { if ((e as Error).name !== "NotAllowedError") setPasskeyStatus("error"); }
    finally { setPasskeyLoading(false); }
  };

  const handleRemovePasskey = async () => {
    setPasskeyLoading(true);
    try { const r = await fetch("/api/auth/passkey/delete", { method: "POST" }); const d = await r.json(); if (d.success) setHasPasskey(false); }
    catch {} finally { setPasskeyLoading(false); setConfirmRemove(false); }
  };

  return (
    <>
      {/* Button — matches dv2 ghost button style */}
      <button
        onClick={() => setOpen(!open)}
        className="h-[52px] w-full rounded-2xl bg-white/[0.02] border border-white/[0.06] text-white/85 font-medium text-[13px] hover:bg-white/[0.04] hover:border-white/[0.1] backdrop-blur transition-all active:scale-[0.985] flex items-center justify-center gap-2"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-2.82 1.18V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        Настройки
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`transition-transform duration-300 ml-0.5 ${open ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Expandable panel — full-width below the grid */}
      {open && (
        <div className="col-span-2">
          <div className="dv2-card p-5 space-y-4">
            {/* Theme */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 text-white/70">
                  {theme === "dark" ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="5" />
                      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-white/90">Тема</p>
                  <p className="text-[11px] text-white/40">{theme === "dark" ? "Тёмная" : "Светлая"}</p>
                </div>
              </div>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className={`relative w-11 h-6 rounded-full transition-colors duration-300 shrink-0 ${
                  theme === "light" ? "bg-[#5E6AD2]" : "bg-white/[0.1]"
                }`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                  theme === "light" ? "translate-x-[22px]" : "translate-x-0.5"
                }`} />
              </button>
            </div>

            <div className="h-px bg-white/[0.06]" />

            {/* Push */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 text-white/70">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 01-3.46 0" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-white/90">Push-уведомления</p>
                  <p className="text-[11px] text-white/40">{pushSupported ? (pushEnabled ? "Включены" : "Выключены") : "Не поддерживается"}</p>
                </div>
              </div>
              {pushSupported && (
                <button onClick={togglePush} disabled={pushLoading}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-300 shrink-0 ${pushEnabled ? "bg-[#5E6AD2]" : "bg-white/[0.1]"} ${pushLoading ? "opacity-50" : ""}`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${pushEnabled ? "translate-x-[22px]" : "translate-x-0.5"}`} />
                </button>
              )}
            </div>

            <div className="h-px bg-white/[0.06]" />

            {/* Passkey */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 text-white/70">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="11" width="16" height="10" rx="2" />
                    <path d="M8 11V7a4 4 0 018 0v4" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-white/90">Быстрый вход</p>
                  <p className="text-[11px] text-white/40">
                    {passkeyStatus === "success" ? "Настроен" : hasPasskey ? "Face ID / Touch ID" : "Не настроен"}
                  </p>
                </div>
              </div>
              {passkeyLoading ? (
                <LoadingSpinner size="sm" className="text-white/60" />
              ) : hasPasskey ? (
                confirmRemove ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => setConfirmRemove(false)} className="text-[11px] text-white/40 px-2 py-1 rounded-lg hover:bg-white/[0.05] transition-colors">Нет</button>
                    <button onClick={handleRemovePasskey} className="text-[11px] text-[#EF4444] font-medium px-2 py-1 rounded-lg bg-[#EF4444]/10 hover:bg-[#EF4444]/15 transition-colors">Отвязать</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmRemove(true)} className="text-[11px] text-white/40 hover:text-[#EF4444] transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.05]">Отвязать</button>
                )
              ) : (
                <button onClick={handleSetupPasskey} className="text-[11px] text-[#8F8FD9] font-medium px-3 py-1.5 rounded-lg bg-[#5E6AD2]/10 hover:bg-[#5E6AD2]/15 transition-colors">Настроить</button>
              )}
            </div>
            {passkeyStatus === "error" && <p className="text-[#EF4444] text-[11px]">Не удалось. Попробуйте позже.</p>}
          </div>
        </div>
      )}
    </>
  );
}
