"use client";

import { useEffect, useState } from "react";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import LoadingSpinner from "./LoadingSpinner";

interface PasskeyPromptProps {
  /** Show setup prompt immediately after registration */
  forceShow?: boolean;
}

export default function PasskeyPrompt({ forceShow }: PasskeyPromptProps) {
  const [show, setShow] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (forceShow) {
      setShow(true);
      return;
    }

    // Check if user has passkey, if not — show banner every 24h
    checkAndPrompt();
  }, [forceShow]);

  const checkAndPrompt = async () => {
    try {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) return;

      const dismissedAt = localStorage.getItem("passkey-prompt-dismissed");
      if (dismissedAt && Date.now() - Number(dismissedAt) < 24 * 60 * 60 * 1000) return;

      const res = await fetch("/api/auth/passkey/check");
      const data = await res.json();
      if (data.success && !data.data.hasPasskey) {
        setTimeout(() => setShow(true), 3000);
      }
    } catch {
      // silent
    }
  };

  const handleSetup = async () => {
    setRegistering(true);
    setError("");
    try {
      // Get registration options from server
      const optRes = await fetch("/api/auth/passkey/register");
      const optData = await optRes.json();
      if (!optData.success) throw new Error(optData.error);

      // Start WebAuthn registration (browser prompt)
      const credential = await startRegistration({ optionsJSON: optData.data });

      // Verify with server
      const verRes = await fetch("/api/auth/passkey/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credential),
      });
      const verData = await verRes.json();

      if (verData.success) {
        setSuccess(true);
        localStorage.removeItem("passkey-prompt-dismissed");
        setTimeout(() => setShow(false), 2000);
      } else {
        setError(verData.error || "Не удалось создать ключ");
      }
    } catch (err) {
      if ((err as Error).name === "NotAllowedError") {
        setError("Вы отменили создание ключа");
      } else {
        setError("Ошибка. Попробуйте позже.");
      }
    } finally {
      setRegistering(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("passkey-prompt-dismissed", String(Date.now()));
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto animate-fade-in-up">
      <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-xl shadow-black/20">
        {success ? (
          <div className="flex items-center gap-3 py-1">
            <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2AC153" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="font-semibold text-sm text-success">Быстрый вход настроен!</p>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF7350" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Быстрый вход</p>
                <p className="text-muted text-xs mt-0.5">Входите по Face ID, Touch ID или отпечатку пальца — без пароля и кодов</p>
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

            {error && (
              <p className="text-danger text-xs mt-2">{error}</p>
            )}

            <button
              onClick={handleSetup}
              disabled={registering}
              className="w-full h-10 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary-hover transition-all btn-press mt-3 flex items-center justify-center gap-2"
            >
              {registering ? (
                <><LoadingSpinner size="sm" /> Настройка...</>
              ) : (
                "Настроить быстрый вход"
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
