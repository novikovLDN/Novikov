"use client";

import { useState, useRef, useEffect, useActionState } from "react";
import { useRouter } from "next/navigation";
import FeatureCard from "@/components/FeatureCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import PasswordInput from "@/components/PasswordInput";
import { startAuthentication } from "@simplewebauthn/browser";
import { sendCodeAction, verifyCodeAction } from "./actions";
import BrandMark from "@/components/pixel/BrandMark";

type AuthStep =
  | "email"
  | "code"
  | "set-password"
  | "login"
  | "reset-email"
  | "reset-code"
  | "reset-password"
  | "reset-success";

interface AuthPageProps {
  initialStep: "email" | "code";
  initialEmail: string;
  referralCode?: string;
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-link -ml-1 gap-1.5 mb-6 sm:mb-8"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      <span className="text-sm font-medium">Назад</span>
    </button>
  );
}

function ErrorMessage({ error }: { error: string }) {
  return (
    <p className="text-[#FF6B6B] text-xs sm:text-sm flex items-center gap-1.5 animate-fade-in">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {error}
    </p>
  );
}

function generateDeviceFingerprint(): string {
  const parts: string[] = [];
  parts.push(navigator.userAgent);
  parts.push(navigator.language);
  parts.push(String(screen.width) + "x" + String(screen.height));
  parts.push(String(screen.colorDepth));
  parts.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
  parts.push(String(navigator.hardwareConcurrency || 0));
  parts.push(String((navigator as unknown as { deviceMemory?: number }).deviceMemory || 0));
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillText("Atlas", 2, 2);
      parts.push(canvas.toDataURL().slice(-50));
    }
  } catch { /* ignore */ }
  // Simple hash
  const str = parts.join("|");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

export default function AuthPage({ initialStep, initialEmail, referralCode }: AuthPageProps) {
  const router = useRouter();
  const [step, setStep] = useState<AuthStep>(initialStep);
  const [email, setEmail] = useState(initialEmail);
  const [deviceFingerprint, setDeviceFingerprint] = useState("");
  const [countdown, setCountdown] = useState(initialStep === "code" ? 60 : 0);
  const emailRef = useRef<HTMLInputElement>(null);
  const codeFormRef = useRef<HTMLFormElement>(null);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend loading state
  const [resendLoading, setResendLoading] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Passkey state
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyError, setPasskeyError] = useState("");

  // Set password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setPasswordError, setSetPasswordError] = useState("");
  const [setPasswordLoading, setSetPasswordLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Reset password state
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetPassword1, setResetPassword1] = useState("");
  const [resetPassword2, setResetPassword2] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetCountdown, setResetCountdown] = useState(0);
  const [showResetPassword1, setShowResetPassword1] = useState(false);
  const [showResetPassword2, setShowResetPassword2] = useState(false);
  const resetCodeRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setDeviceFingerprint(generateDeviceFingerprint());
  }, []);

  // ─── Passkey Login ──────────────────────────────────────────
  const handlePasskeyLogin = async () => {
    setPasskeyLoading(true);
    setPasskeyError("");
    try {
      const optRes = await fetch("/api/auth/passkey/login");
      const optData = await optRes.json();
      if (!optData.success) throw new Error(optData.error);

      const credential = await startAuthentication({ optionsJSON: optData.data });

      const verRes = await fetch("/api/auth/passkey/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credential),
      });
      const verData = await verRes.json();

      if (verData.success) {
        router.push("/dashboard");
      } else {
        setPasskeyError(verData.error || "Ключ не распознан");
      }
    } catch (err) {
      if ((err as Error).name === "NotAllowedError") {
        setPasskeyError("");
      } else {
        setPasskeyError("Ошибка. Попробуйте другой способ входа.");
      }
    } finally {
      setPasskeyLoading(false);
    }
  };

  // ─── Server Actions ───────────────────────────────────────────
  const [sendState, sendAction, sendPending] = useActionState(
    sendCodeAction,
    { success: false }
  );

  const [verifyState, verifyAction, verifyPending] = useActionState(
    verifyCodeAction,
    { success: false }
  );

  // When send-code succeeds or user has password
  useEffect(() => {
    if (sendState.success && sendState.email) {
      setEmail(sendState.email);
      setStep("code");
      setCountdown(60);
      setTimeout(() => codeRefs.current[0]?.focus(), 150);
    } else if (sendState.hasPassword && sendState.email) {
      setLoginEmail(sendState.email);
      setLoginPassword("");
      setLoginError("");
      setStep("login");
    }
  }, [sendState]);

  // When verify-code succeeds and needs password
  useEffect(() => {
    if (verifyState.success && verifyState.needsPassword) {
      setStep("set-password");
    }
  }, [verifyState]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Reset countdown timer
  useEffect(() => {
    if (resetCountdown <= 0) return;
    const t = setTimeout(() => setResetCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resetCountdown]);

  // Auto-focus on mount
  useEffect(() => {
    if (step === "email") {
      emailRef.current?.focus();
    } else if (step === "code") {
      codeRefs.current[0]?.focus();
    }
  }, [step]);

  // ─── Code Input Handlers ────────────────────────────────────────

  const handleCodeInput = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    e.target.value = value.slice(-1);
    if (value && index < 5) {
      codeRefs.current[index + 1]?.focus();
    }
    if (value && index === 5) {
      const allFilled = codeRefs.current.every((ref) => ref?.value);
      if (allFilled && codeFormRef.current) {
        codeFormRef.current.requestSubmit();
      }
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !e.currentTarget.value && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted.length) return;
    for (let i = 0; i < 6; i++) {
      const ref = codeRefs.current[i];
      if (ref) ref.value = pasted[i] || "";
    }
    if (pasted.length === 6 && codeFormRef.current) {
      codeFormRef.current.requestSubmit();
    } else {
      codeRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  // Same handlers for reset code inputs
  const handleResetCodeInput = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    e.target.value = value.slice(-1);
    if (value && index < 5) {
      resetCodeRefs.current[index + 1]?.focus();
    }
  };

  const handleResetCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !e.currentTarget.value && index > 0) {
      resetCodeRefs.current[index - 1]?.focus();
    }
  };

  const handleResetCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted.length) return;
    for (let i = 0; i < 6; i++) {
      const ref = resetCodeRefs.current[i];
      if (ref) ref.value = pasted[i] || "";
    }
    if (pasted.length === 6) {
      resetCodeRefs.current[5]?.focus();
    } else {
      resetCodeRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0 || resendLoading) return;
    setResendLoading(true);
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (data.success) {
        setCountdown(60);
        codeRefs.current.forEach((ref) => { if (ref) ref.value = ""; });
        codeRefs.current[0]?.focus();
      }
    } catch {
      // silent
    } finally {
      setResendLoading(false);
    }
  };

  // ─── Login Handler ────────────────────────────────────────────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail.trim().toLowerCase(), password: loginPassword }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/dashboard");
      } else {
        setLoginError(data.error || "Ошибка входа");
      }
    } catch {
      setLoginError("Ошибка сервера. Попробуйте позже.");
    } finally {
      setLoginLoading(false);
    }
  };

  // ─── Set Password Handler ─────────────────────────────────────

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetPasswordError("");

    if (newPassword.length < 6) {
      setSetPasswordError("Пароль должен содержать минимум 6 символов");
      return;
    }

    if (newPassword !== confirmPassword) {
      setSetPasswordError("Пароли не совпадают");
      return;
    }

    setSetPasswordLoading(true);

    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/dashboard");
      } else {
        setSetPasswordError(data.error || "Ошибка сохранения пароля");
      }
    } catch {
      setSetPasswordError("Ошибка сервера. Попробуйте позже.");
    } finally {
      setSetPasswordLoading(false);
    }
  };

  // ─── Reset Password Handlers ──────────────────────────────────

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    setResetLoading(true);

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (data.success) {
        setStep("reset-code");
        setResetCountdown(60);
        setTimeout(() => resetCodeRefs.current[0]?.focus(), 150);
      } else {
        setResetError(data.error || "Ошибка отправки кода");
      }
    } catch {
      setResetError("Ошибка сервера. Попробуйте позже.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = resetCodeRefs.current.map((r) => r?.value || "").join("");
    if (code.length !== 6) {
      setResetError("Введите код из 6 цифр");
      return;
    }
    setResetCode(code);
    setResetError("");
    setStep("reset-password");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");

    if (resetPassword1.length < 6) {
      setResetError("Пароль должен содержать минимум 6 символов");
      return;
    }

    if (resetPassword1 !== resetPassword2) {
      setResetError("Пароли не совпадают");
      return;
    }

    setResetLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail.trim().toLowerCase(),
          code: resetCode,
          password: resetPassword1,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStep("reset-success");
      } else {
        setResetError(data.error || "Ошибка смены пароля");
      }
    } catch {
      setResetError("Ошибка сервера. Попробуйте позже.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleResendResetCode = async () => {
    if (resetCountdown > 0) return;
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (data.success) {
        setResetCountdown(60);
        resetCodeRefs.current.forEach((ref) => { if (ref) ref.value = ""; });
        resetCodeRefs.current[0]?.focus();
      }
    } catch {
      // silent
    }
  };

  // ─── Render ──────────────────────────────────────────────────────

  const emailError = sendState.error || null;
  const codeError = verifyState.error || null;

  return (
    <div className="auth-shell">
      <div className="px-grid-bg" aria-hidden />
      <AuthTopBar />
      <div className="flex-1 flex items-start sm:items-center justify-center px-4 sm:px-6 pt-6 sm:pt-10 pb-16">
        <div className="w-full max-w-[520px]">
          <div className="auth-card">
        {step === "email" && (
          <div className="animate-fade-in-up pt-2 sm:pt-6">
            <div className="dv2-eyebrow mb-2">ВХОД ИЛИ РЕГИСТРАЦИЯ</div>
            <h1 className="font-mts-wide text-[32px] sm:text-[40px] font-bold tracking-tight leading-[1.05] text-[color:var(--px-text)] mb-2">
              Введите<br />
              <span className="text-[color:var(--px-text-3)]">почту</span>
            </h1>
            <p className="text-[13px] text-[color:var(--px-text-3)] mb-6 sm:mb-8">
              Отправим одноразовый код для подтверждения
            </p>

            <form action={sendAction} className="space-y-3 sm:space-y-4">
              {/* Pass referral code through the form */}
              {referralCode && <input type="hidden" name="ref" value={referralCode} />}

              <div className="relative">
                <input
                  ref={emailRef}
                  name="email"
                  type="email"
                  placeholder="email@example.com"
                  defaultValue={initialEmail}
                  className={`auth-input ${emailError ? "auth-input-error" : ""}`}
                  autoComplete="email"
                  inputMode="email"
                  enterKeyHint="go"
                  required
                />
              </div>

              {emailError && <ErrorMessage error={emailError} />}

              <button type="submit" disabled={sendPending} className="px-btn px-btn-md px-btn-primary px-btn-block">
                {sendPending ? (
                  <><LoadingSpinner size="sm" /> Отправка…</>
                ) : (
                  <>Далее <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg></>
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[color:var(--px-line)]" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-[10px] font-mono tracking-wider uppercase text-[color:var(--px-text-4)] bg-[color:var(--px-surface)]">или</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => { setStep("login"); setLoginError(""); }}
                className="px-btn px-btn-md px-btn-secondary px-btn-block"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                Войти по логину и паролю
              </button>

              <button
                onClick={handlePasskeyLogin}
                disabled={passkeyLoading}
                className="px-btn px-btn-md px-btn-secondary px-btn-block"
              >
                {passkeyLoading ? (
                  <><LoadingSpinner size="sm" /> Проверка…</>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 10a3 3 0 100-6 3 3 0 000 6z" />
                      <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
                    </svg>
                    Быстрый вход через Passkey
                  </>
                )}
              </button>
            </div>

            {passkeyError && (
              <p className="text-[#FF6B6B] text-xs text-center mt-2 animate-fade-in">{passkeyError}</p>
            )}

            {/* Features */}
            <div className="mt-8 sm:mt-10 space-y-2.5 sm:space-y-3">
              <FeatureCard
                icon={<svg width="22" height="22" className="text-[color:var(--px-accent)]" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" /><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" /></svg>}
                iconBg="bg-[color:var(--px-accent-dim)]"
                title="Магистраль до 200 Гбит/с"
                description="Вечерний час пик и нагрузка соседей по каналу не превращаются в фризы"
                className="animate-fade-in-up animate-delay-1"
              />
              <FeatureCard
                icon={<svg width="22" height="22" className="text-[color:var(--px-accent)]" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" /><rect x="2" y="14" width="20" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" /><circle cx="6" cy="6.5" r="1" fill="currentColor" /><circle cx="6" cy="17.5" r="1" fill="currentColor" /><line x1="10" y1="6.5" x2="18" y2="6.5" stroke="currentColor" strokeWidth="1.5" /><line x1="10" y1="17.5" x2="18" y2="17.5" stroke="currentColor" strokeWidth="1.5" /></svg>}
                iconBg="bg-[color:var(--px-accent-dim)]"
                title="Пинг меньше 5 мс"
                description="В регионе присутствия — игры и созвоны без задержки и эха"
                className="animate-fade-in-up animate-delay-2"
              />
              <FeatureCard
                icon={<svg width="22" height="22" className="text-[color:var(--px-accent)]" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" strokeWidth="1.5" /><circle cx="12" cy="12" r="1" fill="currentColor" /></svg>}
                iconBg="bg-[color:var(--px-accent-dim)]"
                title="Соединение держится"
                description="Резервные каналы и автопереключение. Целевая доступность 99,98%"
                className="animate-fade-in-up animate-delay-3"
              />
              <FeatureCard
                icon={<svg width="22" height="22" className="text-[color:var(--px-accent)]" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5" /><circle cx="12" cy="16" r="1.5" fill="currentColor" /></svg>}
                iconBg="bg-[color:var(--px-accent-dim)]"
                title="Ничего не записываем"
                description="Ни посещённых сайтов, ни DNS-запросов, ни истории подключений"
                className="animate-fade-in-up animate-delay-4"
              />
            </div>
          </div>
        )}

        {step === "code" && (
          <div className="animate-fade-in-up pt-2 sm:pt-4">
            <BackButton onClick={() => setStep("email")} />

            <div>
              <div className="dv2-eyebrow mb-2">ШАГ 2 — КОД</div>
              <h1 className="font-mts-wide text-[32px] sm:text-[40px] font-bold tracking-tight leading-[1.05] text-[color:var(--px-text)] mb-2">
                Введите<br />
                <span className="text-[color:var(--px-text-3)]">код из письма</span>
              </h1>
              <p className="text-[13px] text-[color:var(--px-text-3)] mb-1">
                Отправили на{" "}
                <span className="text-[color:var(--px-text)] font-medium break-all">{email}</span>
              </p>
              <p className="text-[11px] text-[color:var(--px-text-4)] mb-6">
                Проверьте папку «Спам», если письмо не пришло
              </p>
            </div>

            <form ref={codeFormRef} action={verifyAction}>
              <input type="hidden" name="email" value={email} />
              <input type="hidden" name="fingerprint" value={deviceFingerprint} />
              {referralCode && <input type="hidden" name="ref" value={referralCode} />}

              <div className="flex gap-1.5 xs:gap-2 sm:gap-3 justify-center mb-6 w-full max-w-xs mx-auto" onPaste={handleCodePaste}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <input
                    key={i}
                    ref={(el) => { codeRefs.current[i] = el; }}
                    name={`code-${i}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]"
                    maxLength={1}
                    required
                    autoComplete="one-time-code"
                    onChange={(e) => handleCodeInput(i, e)}
                    onKeyDown={(e) => handleCodeKeyDown(i, e)}
                    onFocus={(e) => e.target.select()}
                    aria-label={`Цифра ${i + 1}`}
                    className={`auth-code-cell ${codeError ? "auth-code-cell-error" : ""}`}
                    style={{ fontSize: "max(16px, 1.5rem)" }}
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
                type="submit"
                disabled={verifyPending}
                className="px-btn px-btn-md px-btn-primary px-btn-block mb-5"
              >
                {verifyPending ? (
                  <span className="inline-flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    Проверяем...
                  </span>
                ) : (
                  "Подтвердить"
                )}
              </button>
            </form>

            <div className="text-center">
              {countdown > 0 ? (
                <p className="text-muted text-xs sm:text-sm">
                  Отправить повторно через{" "}
                  <span className="text-foreground font-medium tabular-nums">
                    {countdown} сек
                  </span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendLoading}
                  className="px-btn px-btn-sm px-btn-secondary"
                >
                  {resendLoading ? "Отправляем..." : "Отправить код повторно"}
                </button>
              )}
            </div>
          </div>
        )}

        {step === "set-password" && (
          <div className="animate-fade-in-up pt-2 sm:pt-4">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-[color:var(--px-accent-dim)] flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[color:var(--px-accent)]">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </div>
            </div>

            <div className="text-center">
              <div className="dv2-eyebrow mb-2">ШАГ 3 — ПАРОЛЬ</div>
              <h1 className="font-mts-wide text-[32px] sm:text-[40px] font-bold tracking-tight leading-[1.05] text-[color:var(--px-text)] mb-2">
                Создайте<br /><span className="text-[color:var(--px-text-3)]">пароль</span>
              </h1>
              <p className="text-muted text-sm sm:text-base mb-8">
                Придумайте пароль для входа в личный кабинет. В дальнейшем вы сможете войти по почте и паролю.
              </p>
            </div>

            <form onSubmit={handleSetPassword} className="space-y-3 sm:space-y-4">
              <PasswordInput
                value={newPassword}
                onChange={setNewPassword}
                show={showNewPassword}
                onToggle={() => setShowNewPassword(!showNewPassword)}
                placeholder="Пароль (мин. 6 символов)"
                autoFocus
                hasError={!!setPasswordError}
              />

              <PasswordInput
                value={confirmPassword}
                onChange={setConfirmPassword}
                show={showConfirmPassword}
                onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                placeholder="Повторите пароль"
                hasError={!!setPasswordError}
              />

              {setPasswordError && <ErrorMessage error={setPasswordError} />}

              <button
                type="submit"
                disabled={setPasswordLoading}
                className="px-btn px-btn-md px-btn-primary px-btn-block"
              >
                {setPasswordLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    Сохраняем...
                  </span>
                ) : (
                  "Сохранить пароль"
                )}
              </button>
            </form>

            <button
              onClick={() => router.push("/dashboard")}
              className="px-btn px-btn-md px-btn-secondary px-btn-block mt-3"
            >
              Пропустить
            </button>
          </div>
        )}

        {step === "login" && (
          <div className="animate-fade-in-up pt-2 sm:pt-4">
            <BackButton onClick={() => setStep("email")} />

            <div className="dv2-eyebrow mb-2">ВХОД</div>
            <h1 className="font-mts-wide text-[32px] sm:text-[40px] font-bold tracking-tight leading-[1.05] text-[color:var(--px-text)] mb-2">
              С возвращением
            </h1>
            <p className="text-muted text-sm sm:text-base mb-6 sm:mb-8">
              Введите почту и пароль
            </p>

            <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Email"
                autoComplete="email"
                inputMode="email"
                autoFocus
                className={`auth-input ${loginError ? "auth-input-error" : ""}`}
                required
              />

              <PasswordInput
                value={loginPassword}
                onChange={setLoginPassword}
                show={showLoginPassword}
                onToggle={() => setShowLoginPassword(!showLoginPassword)}
                placeholder="Пароль"
                hasError={!!loginError}
              />

              {loginError && (
                <>
                  <ErrorMessage error={loginError} />
                  <button
                    type="button"
                    onClick={() => {
                      setStep("reset-email");
                      setResetEmail(loginEmail);
                      setResetError("");
                    }}
                    className="px-btn px-btn-sm px-btn-secondary"
                  >
                    Сбросить пароль
                  </button>
                </>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="px-btn px-btn-md px-btn-primary px-btn-block"
              >
                {loginLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    Входим...
                  </span>
                ) : (
                  "Войти"
                )}
              </button>
            </form>

            <div className="text-center mt-5">
              <button
                type="button"
                onClick={() => {
                  setStep("reset-email");
                  setResetEmail(loginEmail);
                  setResetError("");
                }}
                className="px-btn px-btn-sm px-btn-secondary"
              >
                Забыли пароль?
              </button>
            </div>
          </div>
        )}

        {step === "reset-email" && (
          <div className="animate-fade-in-up pt-2 sm:pt-4">
            <BackButton onClick={() => setStep("login")} />

            <div className="dv2-eyebrow mb-2">ВОССТАНОВЛЕНИЕ</div>
            <h1 className="font-mts-wide text-[32px] sm:text-[40px] font-bold tracking-tight leading-[1.05] text-[color:var(--px-text)] mb-2">
              Восстановление<br /><span className="text-[color:var(--px-text-3)]">пароля</span>
            </h1>
            <p className="text-muted text-sm sm:text-base mb-6 sm:mb-8">
              Введите почту, привязанную к аккаунту
            </p>

            <form onSubmit={handleSendResetCode} className="space-y-3 sm:space-y-4">
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Email"
                autoComplete="email"
                inputMode="email"
                autoFocus
                className={`auth-input ${resetError ? "auth-input-error" : ""}`}
                required
              />

              {resetError && <ErrorMessage error={resetError} />}

              <button
                type="submit"
                disabled={resetLoading}
                className="px-btn px-btn-md px-btn-primary px-btn-block"
              >
                {resetLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    Отправка...
                  </span>
                ) : (
                  "Получить код"
                )}
              </button>
            </form>
          </div>
        )}

        {step === "reset-code" && (
          <div className="animate-fade-in-up pt-2 sm:pt-4">
            <BackButton onClick={() => setStep("reset-email")} />

            <div className="text-center sm:text-left">
              <div className="dv2-eyebrow mb-2">КОД ИЗ ПИСЬМА</div>
              <h1 className="font-mts-wide text-[32px] sm:text-[40px] font-bold tracking-tight leading-[1.05] text-[color:var(--px-text)] mb-2">
                Введите код
              </h1>
              <p className="text-muted text-sm sm:text-base mb-1">
                Мы отправили код на{" "}
                <span className="text-foreground font-medium break-all">{resetEmail}</span>
              </p>
              <p className="text-muted/70 text-xs sm:text-sm mb-8">
                Проверь папку «Спам», если не видишь письмо
              </p>
            </div>

            <form onSubmit={handleVerifyResetCode}>
              <div className="flex gap-2 sm:gap-3 justify-center mb-6" onPaste={handleResetCodePaste}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <input
                    key={i}
                    ref={(el) => { resetCodeRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]"
                    maxLength={1}
                    required
                    autoComplete="one-time-code"
                    onChange={(e) => handleResetCodeInput(i, e)}
                    onKeyDown={(e) => handleResetCodeKeyDown(i, e)}
                    aria-label={`Цифра ${i + 1}`}
                    className={`auth-code-cell ${resetError ? "auth-code-cell-error" : ""}`}
                    style={{ fontSize: "max(16px, 1.5rem)" }}
                  />
                ))}
              </div>

              {resetError && (
                <p className="text-danger text-xs sm:text-sm text-center mb-4 flex items-center justify-center gap-1.5 animate-fade-in">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {resetError}
                </p>
              )}

              <button
                type="submit"
                className="px-btn px-btn-md px-btn-primary px-btn-block mb-5"
              >
                Подтвердить
              </button>
            </form>

            <div className="text-center">
              {resetCountdown > 0 ? (
                <p className="text-muted text-xs sm:text-sm">
                  Отправить повторно через{" "}
                  <span className="text-foreground font-medium tabular-nums">
                    {String(Math.floor(resetCountdown / 60)).padStart(1, "0")}:
                    {String(resetCountdown % 60).padStart(2, "0")}
                  </span>
                </p>
              ) : (
                <button type="button" onClick={handleResendResetCode} className="px-btn px-btn-sm px-btn-secondary">
                  Отправить код повторно
                </button>
              )}
            </div>
          </div>
        )}

        {step === "reset-password" && (
          <div className="animate-fade-in-up pt-2 sm:pt-4">
            <BackButton onClick={() => setStep("reset-code")} />

            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-[color:var(--px-accent-dim)] flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[color:var(--px-accent)]">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </div>
            </div>

            <div className="text-center">
              <div className="dv2-eyebrow mb-2">НОВЫЙ ПАРОЛЬ</div>
              <h1 className="font-mts-wide text-[32px] sm:text-[40px] font-bold tracking-tight leading-[1.05] text-[color:var(--px-text)] mb-2">
                Придумайте<br /><span className="text-[color:var(--px-text-3)]">новый пароль</span>
              </h1>
              <p className="text-muted text-sm sm:text-base mb-8">
                Придумайте новый пароль для аккаунта
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3 sm:space-y-4">
              <PasswordInput
                value={resetPassword1}
                onChange={setResetPassword1}
                show={showResetPassword1}
                onToggle={() => setShowResetPassword1(!showResetPassword1)}
                placeholder="Новый пароль (мин. 6 символов)"
                autoFocus
                hasError={!!resetError}
              />

              <PasswordInput
                value={resetPassword2}
                onChange={setResetPassword2}
                show={showResetPassword2}
                onToggle={() => setShowResetPassword2(!showResetPassword2)}
                placeholder="Повторите пароль"
                hasError={!!resetError}
              />

              {resetError && <ErrorMessage error={resetError} />}

              <button
                type="submit"
                disabled={resetLoading}
                className="px-btn px-btn-md px-btn-primary px-btn-block"
              >
                {resetLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    Сохраняем...
                  </span>
                ) : (
                  "Сохранить новый пароль"
                )}
              </button>
            </form>
          </div>
        )}

        {step === "reset-success" && (
          <div className="animate-fade-in-up pt-2 sm:pt-4">
            <div className="flex justify-center mb-6 mt-8">
              <div className="w-20 h-20 rounded-full bg-[color:var(--px-good-dim)] flex items-center justify-center animate-scale-in">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-bold mb-3">Пароль изменён</h1>
              <p className="text-muted text-sm sm:text-base mb-8">
                Ваш пароль успешно обновлён. Теперь вы можете войти в аккаунт с новым паролем.
              </p>
            </div>

            <button
              onClick={() => {
                setStep("login");
                setLoginEmail(resetEmail);
                setLoginPassword("");
                setLoginError("");
              }}
              className="px-btn px-btn-md px-btn-primary px-btn-block"
            >
              Войти в аккаунт
            </button>
          </div>
        )}
          </div>
        </div>
      </div>
      <AuthFooterBar />
    </div>
  );
}

/**
 * Шапка экрана входа.
 *
 * Намеренно минимальна: полная навигация здесь отвлекает от
 * единственного действия. Логотип возвращает на главную, вторая ссылка
 * отвечает на самый частый вопрос перед регистрацией — сколько стоит.
 */
function AuthTopBar() {
  return (
    <div className="px-shell flex items-center justify-between pt-6 sm:pt-8">
      <a href="/" className="px-brand" aria-label="Atlas Secure — на главную">
        <BrandMark size={20} />
        <span className="px-wordmark">atlas.secure</span>
      </a>
      <a href="/pricing" className="px-chip">Тарифы</a>
    </div>
  );
}

function AuthFooterBar() {
  return (
    <div className="px-shell pb-8 sm:pb-10">
      <div className="max-w-[520px] mx-auto flex flex-wrap justify-center gap-x-6">
        <a href="/terms" className="px-link text-[12px]">Условия</a>
        <a href="/privacy" className="px-link text-[12px]">Приватность</a>
        <a href="/support" className="px-link text-[12px]">Поддержка</a>
      </div>
    </div>
  );
}
