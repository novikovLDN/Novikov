"use client";

import { useState, useRef, useEffect, useCallback, useActionState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FeatureCard from "@/components/FeatureCard";
import PageContainer from "@/components/PageContainer";
import LoadingSpinner from "@/components/LoadingSpinner";
import { sendCodeAction, verifyCodeAction } from "./actions";
import type { SendCodeState, VerifyCodeState } from "./actions";

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [shakeCode, setShakeCode] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);
  const emailRef = useRef<HTMLInputElement>(null);

  // ─── Server Action: Send Code ─────────────────────────────────
  const [sendState, sendAction, sendPending] = useActionState<SendCodeState, FormData>(
    sendCodeAction,
    { success: false }
  );

  // When send-code succeeds, switch to code step
  useEffect(() => {
    if (sendState.success && sendState.email) {
      setEmail(sendState.email);
      setStep("code");
      setCountdown(60);
      setTimeout(() => codeRefs.current[0]?.focus(), 150);
    }
  }, [sendState]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Auto-focus email on mount
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  // ─── Code Step ─────────────────────────────────────────────────

  const handleCodeSubmit = useCallback(
    async (fullCode?: string) => {
      const codeStr = fullCode || code.join("");
      if (codeStr.length !== 6 || codeLoading) return;

      setCodeLoading(true);
      setCodeError(null);

      try {
        const res = await fetch("/api/auth/verify-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase(), code: codeStr }),
        });
        const data = await res.json();

        if (data.success) {
          router.push("/dashboard");
        } else {
          setCodeError(data.error || "Неверный код");
          setShakeCode(true);
          setTimeout(() => setShakeCode(false), 500);
          setCode(["", "", "", "", "", ""]);
          setTimeout(() => codeRefs.current[0]?.focus(), 100);
        }
      } catch {
        setCodeError("Ошибка сети. Попробуйте позже.");
      } finally {
        setCodeLoading(false);
      }
    },
    [code, email, codeLoading, router]
  );

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setCodeError(null);

    if (value && index < 5) {
      codeRefs.current[index + 1]?.focus();
    }

    const fullCode = newCode.join("");
    if (fullCode.length === 6) {
      handleCodeSubmit(fullCode);
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
      const newCode = [...code];
      newCode[index - 1] = "";
      setCode(newCode);
    }
    if (e.key === "Enter") {
      handleCodeSubmit();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted.length) return;

    const newCode = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setCode(newCode);

    if (pasted.length === 6) {
      handleCodeSubmit(pasted);
    } else {
      codeRefs.current[pasted.length]?.focus();
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0 || codeLoading) return;
    setCodeLoading(true);
    setCodeError(null);

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (data.success) {
        setCountdown(60);
        setCode(["", "", "", "", "", ""]);
        codeRefs.current[0]?.focus();
      } else {
        setCodeError(data.error || "Ошибка отправки");
      }
    } catch {
      setCodeError("Ошибка сети");
    } finally {
      setCodeLoading(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────

  const emailError = sendState.error || null;

  return (
    <div className="min-h-dvh flex flex-col">
      <Header transparent={step === "email"} />

      <PageContainer>
        {step === "email" ? (
          /* ═══ Email Screen ═══ */
          <div className="animate-fade-in-up pt-2 sm:pt-6">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">Введи почту</h1>
            <p className="text-muted text-sm sm:text-base mb-6 sm:mb-8">
              Чтобы войти или зарегистрироваться
            </p>

            <form action={sendAction} className="space-y-3 sm:space-y-4">
              <div className="relative">
                <input
                  ref={emailRef}
                  name="email"
                  type="email"
                  placeholder="Email"
                  defaultValue=""
                  className={`w-full h-13 sm:h-14 px-4 rounded-2xl bg-card border text-foreground placeholder-muted focus:outline-none transition-all text-base sm:text-lg ${
                    emailError
                      ? "border-danger/50 focus:border-danger"
                      : "border-border focus:border-primary"
                  }`}
                  autoComplete="email"
                  inputMode="email"
                  enterKeyHint="go"
                  required
                />
              </div>

              {emailError && (
                <p className="text-danger text-xs sm:text-sm flex items-center gap-1.5 animate-fade-in">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {emailError}
                </p>
              )}

              <button
                type="submit"
                disabled={sendPending}
                className="w-full h-13 sm:h-14 rounded-2xl bg-foreground text-background font-semibold text-base sm:text-lg hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all btn-press"
              >
                {sendPending ? (
                  <span className="inline-flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    Отправка...
                  </span>
                ) : (
                  "Далее"
                )}
              </button>
            </form>

            <div className="relative my-5 sm:my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-3 text-muted">или</span>
              </div>
            </div>

            <button className="w-full h-13 sm:h-14 rounded-2xl border border-telegram/40 text-telegram font-semibold hover:bg-telegram/10 active:bg-telegram/15 transition-colors flex items-center justify-center gap-2.5 btn-press">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
              </svg>
              Войти через Telegram
            </button>

            {/* Features */}
            <div className="mt-8 sm:mt-10 space-y-2.5 sm:space-y-3">
              <FeatureCard
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18M9 21V9" />
                  </svg>
                }
                iconBg="bg-success-light"
                title="Бесплатный тестовый период 3 дня"
                description="Оцени стабильность и скорость"
                className="animate-fade-in-up animate-delay-1"
              />
              <FeatureCard
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                }
                iconBg="bg-accent-light"
                title="Безлимитное количество устройств"
                description="Подключай телефон, ПК, TV и планшет"
                className="animate-fade-in-up animate-delay-2"
              />
              <FeatureCard
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                }
                iconBg="bg-warning-light"
                title="Подписка от 138 ₽ в месяц"
                description="Без ограничений по трафику и скорости"
                className="animate-fade-in-up animate-delay-3"
              />
              <FeatureCard
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                }
                iconBg="bg-primary-light"
                title="Простое подключение за 1 минуту"
                description="Никаких сложных настроек"
                className="animate-fade-in-up animate-delay-4"
              />
            </div>
          </div>
        ) : (
          /* ═══ Code Verification Screen ═══ */
          <div className="animate-fade-in-up pt-2 sm:pt-4">
            <button
              onClick={() => {
                setStep("email");
                setCodeError(null);
                setCode(["", "", "", "", "", ""]);
              }}
              className="flex items-center gap-1.5 text-muted-light hover:text-foreground transition-colors mb-6 sm:mb-8 btn-press py-1"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              <span className="text-sm font-medium">Назад</span>
            </button>

            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Введи код</h1>
              <p className="text-muted text-sm sm:text-base mb-1">
                Мы отправили код на{" "}
                <span className="text-foreground font-medium break-all">{email}</span>
              </p>
              <p className="text-muted/70 text-xs sm:text-sm mb-8">
                Проверь папку «Спам», если не видишь письмо
              </p>
            </div>

            {/* Code inputs */}
            <div
              className={`flex gap-2 sm:gap-3 justify-center mb-6 ${shakeCode ? "animate-shake" : ""}`}
              onPaste={handleCodePaste}
            >
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    codeRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(i, e)}
                  aria-label={`Цифра ${i + 1}`}
                  className={`w-11 h-13 sm:w-13 sm:h-15 text-center text-xl sm:text-2xl font-bold bg-card border rounded-xl sm:rounded-2xl focus:outline-none transition-all ${
                    codeError
                      ? "border-danger/50"
                      : digit
                        ? "border-primary/60"
                        : "border-border focus:border-primary"
                  }`}
                />
              ))}
            </div>

            {codeError && (
              <p className="text-danger text-xs sm:text-sm text-center mb-4 flex items-center justify-center gap-1.5 animate-fade-in">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {codeError}
              </p>
            )}

            <button
              onClick={() => handleCodeSubmit()}
              disabled={code.join("").length !== 6 || codeLoading}
              className="w-full h-13 sm:h-14 rounded-2xl bg-foreground text-background font-semibold text-base sm:text-lg hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all btn-press mb-5"
            >
              {codeLoading ? (
                <span className="inline-flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  Проверяем...
                </span>
              ) : (
                "Подтвердить"
              )}
            </button>

            <div className="text-center">
              {countdown > 0 ? (
                <p className="text-muted text-xs sm:text-sm">
                  Отправить повторно через{" "}
                  <span className="text-foreground font-medium tabular-nums">
                    {String(Math.floor(countdown / 60)).padStart(1, "0")}:
                    {String(countdown % 60).padStart(2, "0")}
                  </span>
                </p>
              ) : (
                <button
                  onClick={handleResendCode}
                  disabled={codeLoading}
                  className="text-primary text-sm font-medium hover:text-primary-hover transition-colors"
                >
                  Отправить код повторно
                </button>
              )}
            </div>
          </div>
        )}
      </PageContainer>

      <Footer />
    </div>
  );
}
