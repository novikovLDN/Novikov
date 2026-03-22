"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FeatureCard from "@/components/FeatureCard";

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.success) {
        setStep("code");
        setCountdown(60);
        setTimeout(() => codeInputRefs.current[0]?.focus(), 100);
      } else {
        setError(data.error || "Ошибка отправки кода");
      }
    } catch {
      setError("Ошибка сети. Попробуйте позже.");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    const fullCode = newCode.join("");
    if (fullCode.length === 6) {
      handleCodeSubmit(fullCode);
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length > 0) {
      const newCode = [...code];
      for (let i = 0; i < 6; i++) {
        newCode[i] = pasted[i] || "";
      }
      setCode(newCode);
      if (pasted.length === 6) {
        handleCodeSubmit(pasted);
      } else {
        codeInputRefs.current[pasted.length]?.focus();
      }
    }
  };

  const handleCodeSubmit = async (fullCode?: string) => {
    const codeStr = fullCode || code.join("");
    if (codeStr.length !== 6 || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: codeStr }),
      });
      const data = await res.json();

      if (data.success) {
        router.push("/dashboard");
      } else {
        setError(data.error || "Неверный код");
        setCode(["", "", "", "", "", ""]);
        codeInputRefs.current[0]?.focus();
      }
    } catch {
      setError("Ошибка сети. Попробуйте позже.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0 || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setCountdown(60);
        setCode(["", "", "", "", "", ""]);
        codeInputRefs.current[0]?.focus();
      } else {
        setError(data.error || "Ошибка отправки");
      }
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 px-4 max-w-lg mx-auto w-full">
        {step === "email" ? (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold mt-6 mb-1">Введи почту</h1>
            <p className="text-muted mb-6">Чтобы войти или зарегистрироваться</p>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                className="w-full h-14 px-4 rounded-2xl bg-card border border-border text-foreground placeholder-muted focus:outline-none focus:border-primary transition-colors text-lg"
                autoFocus
                autoComplete="email"
              />

              {error && (
                <p className="text-danger text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={!email || loading}
                className="w-full h-14 rounded-2xl bg-foreground text-background font-semibold text-lg hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Отправка...
                  </span>
                ) : (
                  "Далее"
                )}
              </button>
            </form>

            <button className="w-full h-14 rounded-2xl border border-primary text-primary font-semibold mt-4 hover:bg-primary/10 transition-colors flex items-center justify-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
              </svg>
              Войти через Telegram
            </button>

            <div className="mt-8 space-y-3">
              <FeatureCard
                icon={
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18M9 21V9" />
                  </svg>
                }
                title="Бесплатный тестовый период 3 дня"
                description="Оцени стабильность и скорость"
                className="animate-fade-in-delay-1"
              />
              <FeatureCard
                icon={
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                }
                title="Безлимитное количество устройств"
                description="Подключай телефон, ПК, TV и планшет"
                className="animate-fade-in-delay-2"
              />
              <FeatureCard
                icon={
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                }
                title="Подписка от 138 ₽ в месяц"
                description="Без ограничений по трафику и скорости"
                className="animate-fade-in-delay-3"
              />
              <FeatureCard
                icon={
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                }
                title="Простое подключение за 1 минуту"
                description="Никаких сложных настроек"
                className="animate-fade-in-delay-4"
              />
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            <button
              onClick={() => {
                setStep("email");
                setError(null);
                setCode(["", "", "", "", "", ""]);
              }}
              className="flex items-center gap-1 text-muted hover:text-foreground transition-colors mb-6 mt-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              <span className="text-sm">Назад</span>
            </button>

            <h1 className="text-2xl font-bold mb-1">Введи код</h1>
            <p className="text-muted mb-2">
              Отправили код на <span className="text-foreground">{email}</span>
            </p>
            <p className="text-muted text-sm mb-6">Проверь папку «Спам», если не видишь письмо</p>

            <div className="flex gap-2 justify-center mb-4" onPaste={handleCodePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { codeInputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold bg-card border border-border rounded-xl focus:outline-none focus:border-primary transition-colors"
                />
              ))}
            </div>

            {error && (
              <p className="text-danger text-sm text-center mb-4">{error}</p>
            )}

            <button
              onClick={() => handleCodeSubmit()}
              disabled={code.join("").length !== 6 || loading}
              className="w-full h-14 rounded-2xl bg-foreground text-background font-semibold text-lg hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all mb-4"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Проверка...
                </span>
              ) : (
                "Подтвердить"
              )}
            </button>

            <div className="text-center">
              {countdown > 0 ? (
                <p className="text-muted text-sm">
                  Отправить код повторно через {countdown} сек
                </p>
              ) : (
                <button
                  onClick={handleResendCode}
                  className="text-primary text-sm hover:underline"
                >
                  Отправить код повторно
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
