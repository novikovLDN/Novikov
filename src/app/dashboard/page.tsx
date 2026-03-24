"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageContainer from "@/components/PageContainer";
import LoadingSpinner from "@/components/LoadingSpinner";
import type { SubscriptionData } from "@/types";

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenError, setRegenError] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const fetchSubscription = useCallback(async () => {
    try {
      const res = await fetch("/api/user/subscription");
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      } else {
        router.push("/");
      }
    } catch {
      router.push("/");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const copyToClipboard = async (text: string, type: "key" | "ref") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "key") {
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2500);
      } else {
        setCopiedRef(true);
        setTimeout(() => setCopiedRef(false), 2500);
      }
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
  };

  const handleRegenerateKey = async () => {
    setRegenerating(true);
    setRegenError("");
    try {
      const res = await fetch("/api/vpn/generate-key", { method: "POST" });
      const result = await res.json();
      if (result.success) {
        setData((prev) => prev ? { ...prev, vpnKey: result.data.vpnKey, xrayUuid: result.data.xrayUuid } : prev);
        setShowRegenConfirm(false);
      } else {
        setRegenError(result.error || "Не удалось обновить ключ");
      }
    } catch {
      setRegenError("Ошибка сервера. Попробуйте позже.");
    } finally {
      setRegenerating(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    router.push("/");
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ─── Loading State ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-dvh flex flex-col">
        <Header showMenu />
        <PageContainer className="flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <LoadingSpinner size="lg" className="text-primary" />
            <p className="text-muted text-sm">Загрузка...</p>
          </div>
        </PageContainer>
      </div>
    );
  }

  if (!data) return null;

  const isExpired = data.isExpired;
  const isExpiring = !isExpired && data.daysLeft <= 1;

  return (
    <div className="min-h-dvh flex flex-col">
      <Header showMenu />

      <PageContainer className="space-y-3 sm:space-y-4">
        {/* ═══ Subscription Status ═══ */}
        <div className="bg-card border border-border/50 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-center animate-fade-in-up">
          <p className="text-muted text-sm sm:text-base mb-3">Дней подписки осталось:</p>

          <p
            className={`text-6xl sm:text-7xl font-extrabold mb-1 tabular-nums ${
              isExpired ? "text-danger" : isExpiring ? "text-warning" : "gradient-text"
            }`}
          >
            {data.daysLeft}
          </p>

          <p className="text-muted text-xs sm:text-sm mb-6 sm:mb-8">
            Заканчивается: {formatDate(data.subscriptionEnd)}
          </p>

          <div className="space-y-2.5 sm:space-y-3">
            <button
              onClick={() => router.push("/pricing")}
              className="w-full h-12 sm:h-14 rounded-2xl bg-foreground text-background font-semibold text-sm sm:text-lg hover:bg-foreground/90 transition-all btn-press"
            >
              {isExpired ? "Купить подписку" : "Продлить подписку"}
            </button>

            <button
              onClick={() => router.push("/devices")}
              className="w-full h-12 sm:h-14 rounded-2xl bg-card-hover border border-border text-foreground font-semibold text-sm sm:text-base hover:bg-card-active transition-all btn-press"
            >
              Подключить устройство
            </button>
          </div>
        </div>

        {/* ═══ Key ═══ */}
        <div className="bg-card border border-border/50 rounded-2xl sm:rounded-3xl p-4 sm:p-5 animate-fade-in-up animate-delay-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm sm:text-base">Ваш ключ доступа</h3>
            <span className="text-[10px] sm:text-xs bg-primary-light text-primary px-2 py-0.5 rounded-full font-medium">
              VLESS
            </span>
          </div>

          {isExpired ? (
            <div className="bg-danger/10 border border-danger/20 rounded-xl p-4 text-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-danger font-semibold text-sm sm:text-base mb-1">Подписка истекла</p>
              <p className="text-muted text-xs sm:text-sm">Ключ деактивирован. Продлите подписку для восстановления доступа.</p>
            </div>
          ) : (
            <>
              <div className="bg-background rounded-xl p-3 sm:p-3.5 mb-3 overflow-x-auto">
                <p className="text-xs sm:text-sm text-muted font-mono break-all leading-relaxed select-all">
                  {data.vpnKey}
                </p>
              </div>

              <button
                onClick={() => data.vpnKey && copyToClipboard(data.vpnKey, "key")}
                className={`w-full h-11 sm:h-12 rounded-xl font-medium text-sm sm:text-base transition-all btn-press flex items-center justify-center gap-2 ${
                  copiedKey
                    ? "bg-success/20 text-success border border-success/30"
                    : "bg-primary text-white hover:bg-primary-hover"
                }`}
              >
                {copiedKey ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Скопировано!
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                    Скопировать ключ
                  </>
                )}
              </button>

              <button
                onClick={() => setShowRegenConfirm(true)}
                className="w-full h-11 sm:h-12 rounded-xl font-medium text-sm sm:text-base transition-all btn-press flex items-center justify-center gap-2 bg-card-hover border border-border text-foreground hover:bg-card-active mt-2.5"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                Обновить ключ
              </button>
            </>
          )}
        </div>

        {/* ═══ Regen Confirm Modal ═══ */}
        {showRegenConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => { if (!regenerating) { setShowRegenConfirm(false); setRegenError(""); } }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
              className="relative bg-card border border-border/50 rounded-2xl sm:rounded-3xl p-5 sm:p-7 w-full max-w-sm animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-warning/15 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-center mb-2">Обновить ключ?</h3>
              <p className="text-muted text-xs sm:text-sm text-center mb-6 leading-relaxed">
                Это приведёт к деактивации текущего ключа и созданию нового. Вам нужно будет заново настроить подключение на всех устройствах.
              </p>

              {regenError && (
                <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 mb-4">
                  <p className="text-danger text-xs sm:text-sm text-center">{regenError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowRegenConfirm(false); setRegenError(""); }}
                  disabled={regenerating}
                  className="flex-1 h-11 sm:h-12 rounded-xl font-medium text-sm sm:text-base bg-card-hover border border-border text-foreground hover:bg-card-active transition-all btn-press disabled:opacity-40"
                >
                  Назад
                </button>
                <button
                  onClick={handleRegenerateKey}
                  disabled={regenerating}
                  className="flex-1 h-11 sm:h-12 rounded-xl font-medium text-sm sm:text-base bg-warning text-black hover:bg-warning/90 transition-all btn-press disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {regenerating ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Обновляем...
                    </>
                  ) : (
                    "Подтвердить"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Referral Program ═══ */}
        <div className="bg-card border border-border/50 rounded-2xl sm:rounded-3xl p-4 sm:p-5 animate-fade-in-up animate-delay-2">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-warning-light flex items-center justify-center shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6" />
                <polyline points="12 15 12 3" />
                <path d="M4 8l4-4 4 4" />
                <path d="M12 8l4-4 4 4" />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm sm:text-base leading-tight">
                Получи +7 дней за каждого друга
              </h3>
              <p className="text-xs sm:text-sm text-muted mt-1 leading-snug">
                Поделись ссылкой — когда друг оплатит подписку, тебе начислятся +7 дней
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted mb-4 bg-background rounded-xl px-3 sm:px-4 py-2.5 sm:py-3">
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted/60">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
              <span>Всего рефералов: <b className="text-foreground">{data.referrals}</b></span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted/60">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Оплатили: <b className="text-foreground">{data.paidReferrals}</b></span>
            </div>
          </div>

          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={() =>
                copyToClipboard(`${window.location.origin}?ref=${data.referralCode}`, "ref")
              }
              className="flex-1 h-11 sm:h-12 rounded-xl bg-foreground text-background font-medium text-sm sm:text-base hover:bg-foreground/90 transition-all btn-press flex items-center justify-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              Поделиться
            </button>
            <button
              onClick={() =>
                copyToClipboard(`${window.location.origin}?ref=${data.referralCode}`, "ref")
              }
              className={`flex-1 h-11 sm:h-12 rounded-xl font-medium text-sm sm:text-base transition-all btn-press flex items-center justify-center gap-2 ${
                copiedRef
                  ? "bg-success/20 text-success border border-success/30"
                  : "bg-card-hover border border-border hover:bg-card-active"
              }`}
            >
              {copiedRef ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Скопировано!
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                  Скопировать
                </>
              )}
            </button>
          </div>
        </div>

        {/* ═══ Telegram Bot ═══ */}
        <div className="bg-card border border-border/50 rounded-2xl sm:rounded-3xl p-4 sm:p-5 animate-fade-in-up animate-delay-3">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-telegram/15 flex items-center justify-center shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#2AABEE">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm sm:text-base leading-tight">
                Telegram-бот Atlas Secure
              </h3>
              <p className="text-xs sm:text-sm text-muted mt-1 leading-snug">
                Перейдите в Телеграм бот для основной подписки, чтобы получить обход и лучшую скорость
              </p>
            </div>
          </div>

          {data.telegramLinked ? (
            <div className="flex items-center gap-2 bg-success-light rounded-xl px-4 py-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-sm text-success font-medium">Telegram привязан</span>
            </div>
          ) : (
            <a
              href={`https://t.me/atlassecure_bot?start=${data.telegramLinkToken || ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-11 sm:h-12 rounded-xl bg-telegram text-white font-medium text-sm sm:text-base hover:bg-telegram-hover transition-all btn-press flex items-center justify-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
              </svg>
              Перейти в Telegram
            </a>
          )}
        </div>

        {/* ═══ Logout ═══ */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full h-11 sm:h-12 rounded-2xl bg-card border border-border/50 text-muted font-medium text-sm sm:text-base hover:bg-card-hover hover:text-danger transition-all btn-press flex items-center justify-center gap-2 animate-fade-in-up animate-delay-4"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Выйти из аккаунта
        </button>

        {/* ═══ Logout Confirm Modal ═══ */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => !loggingOut && setShowLogoutConfirm(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
              className="relative bg-card border border-border/50 rounded-2xl sm:rounded-3xl p-5 sm:p-7 w-full max-w-sm animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-danger/15 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </div>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-center mb-2">Выйти из аккаунта?</h3>
              <p className="text-muted text-xs sm:text-sm text-center mb-6 leading-relaxed">
                Вы уверены, что хотите выйти из аккаунта? Для повторного входа потребуется подтверждение по email.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  disabled={loggingOut}
                  className="flex-1 h-11 sm:h-12 rounded-xl font-medium text-sm sm:text-base bg-card-hover border border-border text-foreground hover:bg-card-active transition-all btn-press disabled:opacity-40"
                >
                  Нет
                </button>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex-1 h-11 sm:h-12 rounded-xl font-medium text-sm sm:text-base bg-danger text-white hover:bg-danger-hover transition-all btn-press disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {loggingOut ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Выход...
                    </>
                  ) : (
                    "Выйти"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </PageContainer>

      <Footer />
    </div>
  );
}
