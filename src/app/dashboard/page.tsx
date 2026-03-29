"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageContainer from "@/components/PageContainer";
import LoadingSpinner from "@/components/LoadingSpinner";
import NotificationsModal from "@/components/NotificationsModal";
import WelcomeToast from "@/components/WelcomeToast";
import PasskeyPrompt from "@/components/PasskeyPrompt";
import SettingsCard from "@/components/SettingsCard";
import type { SubscriptionData } from "@/types";

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedRef, setCopiedRef] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2500);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2500);
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
        <Header showMenu onNotifications={() => setShowNotifications((prev) => !prev)} unreadCount={unreadCount} />
        <PageContainer className="flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <LoadingSpinner size="lg" className="text-primary" />
            <p className="text-muted text-sm">Загрузка...</p>
          </div>
        </PageContainer>
        <NotificationsModal open={showNotifications} onClose={() => setShowNotifications(false)} onUnreadCountChange={setUnreadCount} />
      </div>
    );
  }

  if (!data) return null;

  const isExpired = data.isExpired;
  const isExpiring = !isExpired && data.daysLeft <= 1;

  return (
    <div className="min-h-dvh flex flex-col">
      <Header showMenu onNotifications={() => setShowNotifications((prev) => !prev)} unreadCount={unreadCount} />

      <PageContainer className="space-y-3 sm:space-y-4">
        {/* ═══ Subscription Status ═══ */}
        <div className="bg-card border border-border/50 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-center animate-fade-in-up">
          {/* Plan Badge */}
          <PlanBadge plan={data.subscriptionPlan} isExpired={isExpired} />

          <p className="text-muted text-sm sm:text-base mb-3">Подписка осталось:</p>

          {isExpired ? (
            <p className="text-6xl sm:text-7xl font-extrabold mb-1 tabular-nums text-danger">0</p>
          ) : data.daysLeft >= 1 ? (
            <div className="flex items-baseline justify-center gap-2 mb-1">
              <p className={`text-6xl sm:text-7xl font-extrabold tabular-nums ${isExpiring ? "text-warning" : "gradient-text"}`}>
                {data.daysLeft}
              </p>
              <span className={`text-lg sm:text-xl font-semibold ${isExpiring ? "text-warning/70" : "text-muted"}`}>
                дн
              </span>
              <p className={`text-4xl sm:text-5xl font-extrabold tabular-nums ${isExpiring ? "text-warning" : "gradient-text"}`}>
                {data.hoursLeft}
              </p>
              <span className={`text-lg sm:text-xl font-semibold ${isExpiring ? "text-warning/70" : "text-muted"}`}>
                ч
              </span>
            </div>
          ) : (
            <div className="flex items-baseline justify-center gap-2 mb-1">
              <p className="text-6xl sm:text-7xl font-extrabold tabular-nums text-warning">
                {data.hoursLeft}
              </p>
              <span className="text-lg sm:text-xl font-semibold text-warning/70">ч</span>
              <p className="text-4xl sm:text-5xl font-extrabold tabular-nums text-warning">
                {data.minutesLeft}
              </p>
              <span className="text-lg sm:text-xl font-semibold text-warning/70">мин</span>
            </div>
          )}

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
            <h3 className="font-semibold text-sm sm:text-base">Ваша подписка</h3>
            <span className="text-[10px] sm:text-xs bg-primary-light text-primary px-2 py-0.5 rounded-full font-medium">
              Подписка
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
              <p className="text-muted text-xs sm:text-sm">Ссылка деактивирована. Продлите подписку для восстановления доступа.</p>
            </div>
          ) : (
            <>
              <button
                onClick={() => router.push("/devices")}
                className="w-full h-11 sm:h-12 rounded-xl font-medium text-sm sm:text-base transition-all btn-press flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary-hover"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
                Подключиться
              </button>
            </>
          )}

          <a
            href="https://t.me/Atlas_SupportSecurity"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-11 sm:h-12 rounded-xl font-medium text-sm sm:text-base transition-all btn-press flex items-center justify-center gap-2 border border-border bg-card hover:bg-card-hover mt-2.5"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Поддержка
          </a>
        </div>

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
                copyToClipboard(`${window.location.origin}?ref=${data.referralCode}`)
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
                copyToClipboard(`${window.location.origin}?ref=${data.referralCode}`)
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
                {data.telegramLinked
                  ? "Telegram привязан. Подписка синхронизирована."
                  : "Привяжите Telegram для синхронизации подписки."
                }
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
              Привязать Telegram
            </a>
          )}
        </div>

        {/* ═══ Settings + About ═══ */}
        <div className="grid grid-cols-2 gap-2.5 animate-fade-in-up animate-delay-4">
          <SettingsCard />
          <button
            onClick={() => router.push("/about")}
            className="h-11 sm:h-12 rounded-2xl bg-card border border-border/50 text-foreground font-medium text-sm sm:text-base hover:bg-card-hover transition-all btn-press flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 7.5v0m0 9V11" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="7.5" r="0.5" fill="currentColor" />
            </svg>
            О нас
          </button>
        </div>

        {/* ═══ Admin ═══ */}
        {data.isAdmin && (
          <button
            onClick={() => router.push("/admin")}
            className="w-full h-11 sm:h-12 rounded-2xl bg-card border border-primary/30 text-primary font-medium text-sm sm:text-base hover:bg-primary/10 transition-all btn-press flex items-center justify-center gap-2 animate-fade-in-up animate-delay-4"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            Админ-панель
          </button>
        )}

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

      <NotificationsModal open={showNotifications} onClose={() => setShowNotifications(false)} onUnreadCountChange={setUnreadCount} />
      <WelcomeToast telegramLinkToken={data?.telegramLinkToken} subscriptionEnd={data?.subscriptionEnd} />
      <PasskeyPrompt />
    </div>
  );
}

// ─── Plan Badge ────────────────────────────────────────────────

function PlanBadge({ plan, isExpired }: { plan?: string; isExpired: boolean }) {
  const key = isExpired ? "expired" : (plan || "trial");

  const config: Record<string, { label: string; icon: React.ReactNode }> = {
    trial: {
      label: "Пробный период",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    basic: {
      label: "Basic",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z" />
        </svg>
      ),
    },
    plus: {
      label: "Plus",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
    expired: {
      label: "Подписка истекла",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      ),
    },
  };

  const { label, icon } = config[key] || config.trial;

  return (
    <div className="flex justify-center mb-4">
      <div className={`plan-badge-wrap plan-badge-${key}-wrap`}>
        <div
          className={`plan-badge-${key} h-9 sm:h-10 px-5 sm:px-6 rounded-full text-white font-semibold text-xs sm:text-sm shadow-lg flex items-center gap-2 transition-transform btn-press relative z-[1]`}
        >
          {icon}
          {label}
        </div>
      </div>
    </div>
  );
}
