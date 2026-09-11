"use client";

import { useEffect, useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import LoadingSpinner from "./LoadingSpinner";
import { requestOverlay, releaseOverlay, whenConsentSettled, snoozed, snooze } from "@/lib/overlay-queue";

interface PasskeyPromptProps {
  /** Показать сразу после регистрации. */
  forceShow?: boolean;
}

const SNOOZE_KEY = "passkey-prompt-dismissed";

/**
 * Предложение быстрого входа (кабинет).
 *
 * ИСПРАВЛЕНО 11.09.2026: карточка встаёт в общую очередь нижних
 * карточек (`overlay-queue.ts`) и не выходит одновременно с согласием на
 * cookie или предложением установки; оформление — overlays.css вместо
 * старой тёмной темы; отказ — пауза сутки, как было.
 */
export default function PasskeyPrompt({ forceShow }: PasskeyPromptProps) {
  const [show, setShow] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelSlot = () => {};
    let cancelled = false;

    const open = () => {
      cancelSlot = requestOverlay("passkey", () => setShow(true));
    };

    if (forceShow) {
      open();
      return () => cancelSlot();
    }

    const cancelConsent = whenConsentSettled(async () => {
      try {
        if (!window.PublicKeyCredential || snoozed(SNOOZE_KEY, 1)) return;
        const res = await fetch("/api/auth/passkey/check");
        const data = await res.json();
        if (!cancelled && data.success && !data.data.hasPasskey) {
          window.setTimeout(() => !cancelled && open(), 3000);
        }
      } catch {
        // Проверка не удалась — предложение просто не покажется.
      }
    });

    return () => {
      cancelled = true;
      cancelConsent();
      cancelSlot();
    };
  }, [forceShow]);

  const close = () => {
    setShow(false);
    releaseOverlay("passkey");
  };

  const handleSetup = async () => {
    setRegistering(true);
    setError("");
    try {
      const optRes = await fetch("/api/auth/passkey/register");
      const optData = await optRes.json();
      if (!optData.success) throw new Error(optData.error);

      const credential = await startRegistration({ optionsJSON: optData.data });

      const verRes = await fetch("/api/auth/passkey/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credential),
      });
      const verData = await verRes.json();

      if (verData.success) {
        setSuccess(true);
        try {
          localStorage.removeItem(SNOOZE_KEY);
        } catch {
          // не критично
        }
        window.setTimeout(close, 2000);
      } else {
        setError("Не удалось создать ключ. Попробуйте ещё раз.");
      }
    } catch (err) {
      setError((err as Error).name === "NotAllowedError" ? "Вы отменили создание ключа." : "Не получилось. Попробуйте позже.");
    } finally {
      setRegistering(false);
    }
  };

  const dismiss = () => {
    snooze(SNOOZE_KEY);
    close();
  };

  if (!show) return null;

  return (
    <div className="ov-card" role="dialog" aria-labelledby="passkey-title" aria-live="polite">
      {success ? (
        <p id="passkey-title" className="ov-title">Быстрый вход настроен.</p>
      ) : (
        <>
          <div className="ov-row">
            <span className="ov-mark" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </span>
            <div className="ov-copy">
              <p id="passkey-title" className="ov-title">Быстрый вход</p>
              <p className="ov-note">По Face ID, Touch ID или отпечатку — без кодов из письма.</p>
            </div>
            <button type="button" onClick={dismiss} className="ov-x" aria-label="Закрыть">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && <p className="ov-error" role="alert">{error}</p>}

          <div className="ov-actions">
            <button type="button" onClick={handleSetup} disabled={registering} className="ov-btn ov-btn-primary">
              {registering ? (<><LoadingSpinner size="sm" /> Настраиваем…</>) : "Настроить"}
            </button>
            <button type="button" onClick={dismiss} className="ov-btn ov-btn-text">Не сейчас</button>
          </div>
        </>
      )}
    </div>
  );
}
