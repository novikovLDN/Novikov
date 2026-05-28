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
import TelegramLinkBanner from "@/components/TelegramLinkBanner";
import SubscriptionCard from "@/components/SubscriptionCard";
import SubscriptionHero from "@/components/SubscriptionHero";
import QuickActionsRow from "@/components/QuickActionsRow";
import ReferralSection from "@/components/ReferralSection";
import CursorGlowTracker from "@/components/CursorGlowTracker";
import type { SubscriptionData } from "@/types";

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedRef, setCopiedRef] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [unlinkStep, setUnlinkStep] = useState(0); // 0=hidden, 1=first confirm, 2=final confirm
  const [unlinking, setUnlinking] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchSubscription = useCallback(async () => {
    try {
      const res = await fetch("/api/user/subscription");
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      } else {
        router.push("/auth");
      }
    } catch {
      router.push("/auth");
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

  const handleUnlinkTelegram = async () => {
    setUnlinking(true);
    try {
      const res = await fetch("/api/user/telegram-unlink", { method: "POST" });
      const result = await res.json();
      if (result.success) {
        setData((prev) => prev ? {
          ...prev,
          telegramLinked: false,
          telegramLinkToken: result.data.telegramLinkToken,
        } : prev);
        setUnlinkStep(0);
      }
    } catch {
      // silent
    } finally {
      setUnlinking(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    router.push("/auth");
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
    <div className="dashboard-v2 min-h-dvh flex flex-col">
      <CursorGlowTracker />
      <Header showMenu onNotifications={() => setShowNotifications((prev) => !prev)} unreadCount={unreadCount} />

      <PageContainer className="space-y-4 sm:space-y-5 pt-2 sm:pt-3">
        {/* ═══ Subscription Hero ═══ */}
        <SubscriptionHero
          isExpired={isExpired}
          subscriptionPlan={data.subscriptionPlan || "trial"}
          subscriptionEnd={data.subscriptionEnd}
          daysLeft={data.daysLeft}
          hoursLeft={data.hoursLeft}
          minutesLeft={data.minutesLeft}
          isTrial={(data.subscriptionPlan || "trial") === "trial"}
        />

        {/* ═══ Quick actions ═══ */}
        <QuickActionsRow
          cashbackPercent={data.cashbackPercent}
          paidReferrals={data.paidReferrals}
          unread={unreadCount}
          onNotifications={() => setShowNotifications(true)}
        />

        {/* ═══ Subscription key (Remnawave) ═══ */}
        {!isExpired && data.subscriptionUrl && (
          <SubscriptionCard
            subscriptionUrl={data.subscriptionUrl}
            happCryptoLink={data.happCryptoLink ?? null}
            subscriptionEnd={data.subscriptionEnd}
            isTrial={data.subscriptionPlan === "trial"}
            publicId={null}
          />
        )}

        {/* ═══ Balance ═══ */}
        <div className="dv2-card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="dv2-eyebrow">Баланс</div>
            <span className="text-[10px] font-mono text-white/30 tracking-wider">
              {data.balance > 0 ? "ACTIVE" : "EMPTY"}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-[40px] sm:text-[48px] font-light tracking-tight leading-none text-white tabular-nums">
              {data.balance.toLocaleString("ru-RU", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-lg text-white/40">₽</span>
          </div>
          <p className="text-[12px] text-white/40 mt-3 flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            Пополнение и оплата — через Telegram-бот
          </p>
        </div>

        {/* ═══ Referral Program ═══ */}
        <ReferralSection
          referralCode={data.referralCode}
          cashbackPercent={data.cashbackPercent}
          loyaltyTier={data.loyaltyTier}
          referrals={data.referrals}
          paidReferrals={data.paidReferrals}
          copiedRef={copiedRef}
          onCopy={(url) => copyToClipboard(url)}
        />

        {/* ═══ Telegram Bot ═══ */}
        <div className="dv2-card p-5 sm:p-6">
          <div className="flex items-start gap-3.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#2AABEE]/15 border border-[#2AABEE]/20 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#2AABEE">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <div className="dv2-eyebrow mb-1">Telegram-бот</div>
              <h3 className="text-[15px] font-medium text-white leading-tight">Atlas Secure Bot</h3>
              <p className="text-[12px] text-white/40 mt-1 leading-snug">
                {data.telegramLinked
                  ? "Подписка синхронизирована с ботом"
                  : "Управление подпиской с любого устройства"}
              </p>
            </div>
            {data.telegramLinked && (
              <span className="relative h-2 w-2 rounded-full bg-[#34D399] shrink-0 mt-1.5" style={{ boxShadow: "0 0 8px #34D399" }} />
            )}
          </div>

          {data.telegramLinked ? (
            <div className="space-y-2">
              {unlinkStep === 0 && (
                <button
                  onClick={() => setUnlinkStep(1)}
                  className="w-full h-9 text-[11px] text-white/40 hover:text-white/70 transition-colors"
                >
                  Отвязать Telegram
                </button>
              )}
              {unlinkStep === 1 && (
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-3">
                  <p className="text-[12px] text-white/70 mb-3 text-center">
                    Синхронизация с ботом будет остановлена. Продолжить?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setUnlinkStep(0)}
                      className="flex-1 h-9 rounded-lg text-[12px] font-medium border border-white/[0.08] text-white/85 hover:bg-white/[0.05] transition-all"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={() => setUnlinkStep(2)}
                      className="flex-1 h-9 rounded-lg text-[12px] font-medium bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/20 transition-all"
                    >
                      Отвязать
                    </button>
                  </div>
                </div>
              )}
              {unlinkStep === 2 && (
                <div className="rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 p-3">
                  <p className="text-[12px] text-[#EF4444] mb-3 text-center font-medium">
                    Подтвердите отвязку Telegram
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setUnlinkStep(0)}
                      disabled={unlinking}
                      className="flex-1 h-9 rounded-lg text-[12px] font-medium border border-white/[0.08] text-white/85 hover:bg-white/[0.05] transition-all disabled:opacity-50"
                    >
                      Оставить
                    </button>
                    <button
                      onClick={handleUnlinkTelegram}
                      disabled={unlinking}
                      className="flex-1 h-9 rounded-lg text-[12px] font-medium bg-[#EF4444] text-white hover:bg-[#EF4444]/90 transition-all disabled:opacity-50"
                    >
                      {unlinking ? "..." : "Подтвердить"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <a
              href={`https://t.me/atlassecure_bot?start=${data.telegramLinkToken || ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-12 rounded-2xl bg-[#2AABEE] text-white font-medium text-[14px] hover:bg-[#2AABEE]/90 transition-all active:scale-[0.985] flex items-center justify-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
              </svg>
              Привязать Telegram
            </a>
          )}
        </div>

        {/* ═══ Settings + About + Admin ═══ */}
        <div className="grid grid-cols-2 gap-2.5">
          <SettingsCard />
          <button
            onClick={() => router.push("/about")}
            className="h-[52px] rounded-2xl bg-white/[0.02] border border-white/[0.06] text-white/85 font-medium text-[13px] hover:bg-white/[0.04] hover:border-white/[0.1] backdrop-blur transition-all active:scale-[0.985] flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 17V11M12 7h.01" />
            </svg>
            О нас
          </button>
        </div>

        {data.isAdmin && (
          <button
            onClick={() => router.push("/admin")}
            className="w-full h-12 rounded-2xl bg-[#5E6AD2]/10 border border-[#5E6AD2]/30 text-[#8F8FD9] font-medium text-[13px] hover:bg-[#5E6AD2]/15 transition-all active:scale-[0.985] flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            Админ-панель
          </button>
        )}

        {/* ═══ Logout ═══ */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full h-12 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-white/50 font-medium text-[13px] hover:bg-[#EF4444]/8 hover:border-[#EF4444]/30 hover:text-[#EF4444] backdrop-blur transition-all active:scale-[0.985] flex items-center justify-center gap-2"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
      <TelegramLinkBanner telegramLinked={data?.telegramLinked ?? false} telegramLinkToken={data?.telegramLinkToken} />
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
