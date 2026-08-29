"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import ServerStatusCard from "@/components/ServerStatusCard";
import ThemeToggleButton from "@/components/ThemeToggleButton";
import PushToggleButton from "@/components/PushToggleButton";
import type { SubscriptionData } from "@/types";

/**
 * Dashboard — v5 mobile-first restructure.
 *
 * Design brief:
 *   - Mobile is the primary target: everything cascades top-to-bottom
 *     in the order of importance for a phone user (subscription →
 *     key → actions → balance → referral → trust widgets → settings).
 *   - Server status + Telegram-linked confirmation moved OUT of the
 *     top of the page (they were decoration for a phone user, not
 *     signal). Server status becomes a bottom "always alive" widget;
 *     linked-Telegram collapses to a tiny confirmation strip and only
 *     shows the full CTA card when NOT linked.
 *   - Balance is a full-width horizontal strip on mobile (with big
 *     tabular-num digits), an inline sidebar block on lg+.
 *   - Utility buttons (About / Admin / Logout) grouped as one row on
 *     desktop so they don't take four separate stripes at the base.
 */
export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedRef, setCopiedRef] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [unlinkStep, setUnlinkStep] = useState(0);
  const [unlinking, setUnlinking] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [resyncing, setResyncing] = useState(false);
  const [resyncStatus, setResyncStatus] = useState<null | { kind: "ok" | "error"; text: string }>(null);

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

  const handleForceResync = async () => {
    if (resyncing) return;
    setResyncing(true);
    setResyncStatus(null);
    try {
      const res = await fetch("/api/user/force-resync", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        const applied = json.data.paymentsApplied || 0;
        let text: string;
        if (applied > 0) {
          text =
            applied === 1
              ? "Оплата подхвачена — подписка активирована."
              : `Подхвачено оплат: ${applied}. Подписка активирована.`;
        } else if (json.data.changed) {
          text = "Подписка обновлена — данные пересчитаны по последней оплате.";
        } else if (json.data.panelAction === "patched" || json.data.panelAction === "created" || json.data.panelAction === "adopted") {
          text = "Проверка завершена — данные и панель актуальны.";
        } else {
          text = "Проверка завершена — данные актуальны.";
        }
        setResyncStatus({ kind: "ok", text });
        await fetchSubscription();
      } else {
        setResyncStatus({ kind: "error", text: json.error || "Не удалось обновить." });
      }
    } catch {
      setResyncStatus({ kind: "error", text: "Ошибка сети." });
    } finally {
      setResyncing(false);
      setTimeout(() => setResyncStatus(null), 7000);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-v2 min-h-dvh flex flex-col">
        <DashboardTopBar unreadCount={0} onNotifications={() => {}} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <LoadingSpinner size="lg" />
            <p className="font-mts-wide text-black/50 text-sm">Загрузка…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isExpired = data.isExpired;

  return (
    <>
      <div className="dashboard-v2 min-h-dvh flex flex-col">
        <DashboardTopBar
          unreadCount={unreadCount}
          onNotifications={() => setShowNotifications((prev) => !prev)}
        />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-14 sm:pb-16">
          <div className="max-w-[1240px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 lg:items-start gap-3 sm:gap-4 lg:gap-5">

              {/* ═══ Hero — subscription status ═══ */}
              <div className="dv2-rise lg:col-span-8">
                <SubscriptionHero
                  isExpired={isExpired}
                  subscriptionPlan={data.subscriptionPlan || "trial"}
                  subscriptionEnd={data.subscriptionEnd}
                  daysLeft={data.daysLeft}
                  hoursLeft={data.hoursLeft}
                  minutesLeft={data.minutesLeft}
                  isTrial={(data.subscriptionPlan || "trial") === "trial"}
                />
              </div>

              {/* ═══ Quick actions — 3-up on mobile, sidebar on lg+ ═══ */}
              <div className="dv2-rise dv2-rise-1 lg:col-span-4">
                <QuickActionsRow
                  cashbackPercent={data.cashbackPercent}
                  paidReferrals={data.paidReferrals}
                  unread={unreadCount}
                  onNotifications={() => setShowNotifications(true)}
                />
              </div>

              {/* ═══ Key — connect / open in app ═══ */}
              {!isExpired && data.subscriptionUrl && (
                <div className="dv2-rise dv2-rise-2 lg:col-span-8">
                  <SubscriptionCard
                    subscriptionUrl={data.subscriptionUrl}
                    happCryptoLink={data.happCryptoLink ?? null}
                    subscriptionEnd={data.subscriptionEnd}
                    isTrial={data.subscriptionPlan === "trial"}
                    publicId={null}
                  />
                </div>
              )}

              {/* ═══ Balance strip ═══ */}
              <div className="dv2-rise dv2-rise-3 dv2-card p-5 sm:p-6 lg:col-span-4 lg:self-stretch flex sm:flex-col items-center sm:items-start justify-between sm:justify-center gap-4 sm:gap-0">
                <div className="flex-1 sm:flex-none">
                  <div className="dv2-eyebrow mb-2 sm:mb-3">Баланс</div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mts-wide text-[32px] sm:text-[40px] lg:text-[48px] font-bold tracking-tight leading-none text-black tabular-nums">
                      {data.balance.toLocaleString("ru-RU", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="font-mts-wide text-lg text-black/45">₽</span>
                  </div>
                </div>
                <p className="hidden sm:flex font-mts-wide text-[12px] text-black/45 mt-4 items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  Пополнение — через Telegram-бот
                </p>
                <span className="sm:hidden font-mts-wide text-[10px] text-black/40 tracking-[0.1em] uppercase">
                  {data.balance > 0 ? "Активен" : "Пусто"}
                </span>
              </div>

              {/* ═══ Force-resync — the "починить подписку" escape hatch ═══
                   Small helper strip. If a user's local date and panel
                   date ever get out of sync (e.g. legacy ghost-date
                   residue), one tap here re-runs the full repair +
                   panel PATCH and returns the outcome. */}
              <div className="dv2-rise dv2-rise-4 dv2-card p-4 sm:p-5 lg:col-span-12 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-mts-wide text-[13px] font-medium text-black leading-tight">Проверить и обновить подписку</div>
                  <div className="font-mts-wide text-[11px] text-black/50 mt-0.5 leading-snug">
                    {resyncStatus
                      ? resyncStatus.text
                      : "Подхватит зависшие оплаты, пересчитает срок, обновит ключ в панели."}
                  </div>
                </div>
                <button
                  onClick={handleForceResync}
                  disabled={resyncing}
                  className={`font-mts-wide shrink-0 h-10 px-4 rounded-xl text-[13px] font-medium transition-all active:scale-[0.985] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                    resyncStatus?.kind === "ok"
                      ? "bg-[#22C55E]/12 border border-[#22C55E]/30 text-[#22C55E]"
                      : resyncStatus?.kind === "error"
                      ? "bg-[#EF4444]/12 border border-[#EF4444]/30 text-[#EF4444]"
                      : "bg-black text-white hover:bg-neutral-800"
                  }`}
                >
                  {resyncing ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-spin" style={{ animationDuration: "1.2s" }}>
                        <path d="M21 12a9 9 0 11-6.219-8.56" />
                      </svg>
                      Обновляем…
                    </>
                  ) : resyncStatus?.kind === "ok" ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Готово
                    </>
                  ) : resyncStatus?.kind === "error" ? (
                    <>Повторить</>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 11-3.51-7.11L21 8M21 3v5h-5" />
                      </svg>
                      Обновить
                    </>
                  )}
                </button>
              </div>

              {/* ═══ Referral programme ═══ */}
              <div className="dv2-rise dv2-rise-4 lg:col-span-12">
                <ReferralSection
                  referralCode={data.referralCode}
                  cashbackPercent={data.cashbackPercent}
                  loyaltyTier={data.loyaltyTier}
                  referrals={data.referrals}
                  paidReferrals={data.paidReferrals}
                  copiedRef={copiedRef}
                  onCopy={(url) => copyToClipboard(url)}
                />
              </div>

              {/* ═══ Telegram — full CTA if NOT linked, quiet chip if linked ═══ */}
              {!data.telegramLinked ? (
                <div className="dv2-rise dv2-rise-5 dv2-card p-5 sm:p-6 lg:col-span-8 lg:col-start-3">
                  <div className="flex items-start gap-3.5 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#2AABEE]/12 border border-[#2AABEE]/25 flex items-center justify-center shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#2AABEE">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="dv2-eyebrow mb-1">Telegram-бот</div>
                      <h3 className="font-mts-wide text-[15px] font-medium text-black leading-tight">Atlas Secure Bot</h3>
                      <p className="font-mts-wide text-[12px] text-black/50 mt-1 leading-snug">
                        Управление подпиской с любого устройства
                      </p>
                    </div>
                  </div>

                  <a
                    href={`https://t.me/atlas_suppbot?start=${data.telegramLinkToken || ""}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mts-wide w-full h-12 rounded-2xl bg-[#2AABEE] text-white font-medium text-[14px] hover:bg-[#2AABEE]/90 transition-all active:scale-[0.985] flex items-center justify-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                    </svg>
                    Привязать Telegram
                  </a>
                </div>
              ) : (
                <div className="dv2-rise dv2-rise-5 dv2-card p-4 sm:p-5 lg:col-span-8 lg:col-start-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#22C55E]/12 border border-[#22C55E]/30 flex items-center justify-center shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mts-wide text-[13px] font-medium text-black leading-tight">Telegram привязан</div>
                    <div className="font-mts-wide text-[11px] text-black/50 mt-0.5">Подписка синхронизирована с ботом</div>
                  </div>
                  {unlinkStep === 0 ? (
                    <button
                      onClick={() => setUnlinkStep(1)}
                      className="font-mts-wide shrink-0 h-8 px-3 text-[11px] text-black/45 hover:text-black/80 transition-colors"
                    >
                      Отвязать
                    </button>
                  ) : unlinkStep === 1 ? (
                    <div className="shrink-0 flex gap-1.5">
                      <button
                        onClick={() => setUnlinkStep(0)}
                        className="font-mts-wide h-8 px-3 rounded-lg text-[11px] font-medium border border-black/[0.10] text-black/70 hover:bg-black/[0.04]"
                      >
                        Отмена
                      </button>
                      <button
                        onClick={handleUnlinkTelegram}
                        disabled={unlinking}
                        className="font-mts-wide h-8 px-3 rounded-lg text-[11px] font-medium bg-[#EF4444] text-white disabled:opacity-50"
                      >
                        {unlinking ? "..." : "Отвязать"}
                      </button>
                    </div>
                  ) : null}
                </div>
              )}

              {/* ═══ Server status — quiet "alive" widget at the bottom ═══ */}
              <div className="dv2-rise dv2-rise-5 lg:col-span-12">
                <ServerStatusCard />
              </div>

              {/* ═══ Settings row — Theme · Push · Advanced ═══ */}
              <div className="dv2-rise dv2-rise-6 grid grid-cols-1 sm:grid-cols-3 gap-2.5 lg:col-span-12 lg:self-start">
                <ThemeToggleButton />
                <PushToggleButton />
                <SettingsCard />
              </div>

              {/* ═══ Utility row — About · Admin · Logout ═══ */}
              <div className="dv2-rise dv2-rise-6 lg:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                <button
                  onClick={() => router.push("/about")}
                  className="font-mts-wide h-[52px] rounded-2xl bg-white border border-black/[0.06] text-black/85 font-medium text-[13px] hover:border-black/[0.14] transition-all active:scale-[0.985] flex items-center justify-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 17V11M12 7h.01" />
                  </svg>
                  О компании
                </button>

                {data.isAdmin && (
                  <button
                    onClick={() => router.push("/admin")}
                    className="font-mts-wide h-[52px] rounded-2xl bg-[#5E6AD2]/10 border border-[#5E6AD2]/30 text-[#5E6AD2] font-medium text-[13px] hover:bg-[#5E6AD2]/15 transition-all active:scale-[0.985] flex items-center justify-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                    Админ-панель
                  </button>
                )}

                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className={`font-mts-wide h-[52px] rounded-2xl bg-white border border-black/[0.06] text-black/60 font-medium text-[13px] hover:bg-[#EF4444]/8 hover:border-[#EF4444]/30 hover:text-[#EF4444] transition-all active:scale-[0.985] flex items-center justify-center gap-2 ${!data.isAdmin ? "sm:col-span-1" : ""}`}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Выйти
                </button>
              </div>
            </div>
          </div>

          {/* Logout confirm modal */}
          {showLogoutConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => !loggingOut && setShowLogoutConfirm(false)}>
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
              <div
                className="relative bg-white border border-black/[0.06] rounded-2xl sm:rounded-3xl p-5 sm:p-7 w-full max-w-sm animate-scale-in"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#EF4444]/12 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  </div>
                </div>

                <h3 className="font-mts-wide text-base sm:text-lg font-bold text-center mb-2 text-black">Выйти из аккаунта?</h3>
                <p className="font-mts-wide text-black/55 text-xs sm:text-sm text-center mb-6 leading-relaxed">
                  Для повторного входа потребуется подтверждение по email.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    disabled={loggingOut}
                    className="font-mts-wide flex-1 h-11 sm:h-12 rounded-xl font-medium text-sm sm:text-base bg-black/[0.04] border border-black/[0.08] text-black hover:bg-black/[0.06] transition-all active:scale-[0.985] disabled:opacity-40"
                  >
                    Нет
                  </button>
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="font-mts-wide flex-1 h-11 sm:h-12 rounded-xl font-medium text-sm sm:text-base bg-[#EF4444] text-white hover:bg-[#EF4444]/90 transition-all active:scale-[0.985] disabled:opacity-40 flex items-center justify-center gap-2"
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
        </main>

        <WelcomeToast telegramLinkToken={data?.telegramLinkToken} subscriptionEnd={data?.subscriptionEnd} />
        <TelegramLinkBanner telegramLinked={data?.telegramLinked ?? false} telegramLinkToken={data?.telegramLinkToken} />
        <PasskeyPrompt />
      </div>
      <NotificationsModal open={showNotifications} onClose={() => setShowNotifications(false)} onUnreadCountChange={setUnreadCount} />
    </>
  );
}

/**
 * Dashboard top bar — mirrors the landing/about pattern so the
 * dashboard breathes visually the same as the rest of the site.
 */
function DashboardTopBar({
  unreadCount,
  onNotifications,
}: {
  unreadCount: number;
  onNotifications: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 sm:px-8 pt-4 sm:pt-6 pb-1 sm:pb-2">
      <Link href="/dashboard" className="flex items-center gap-2">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M5 5 L1 1 M5 5 L5 1 M5 5 L1 5" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M19 5 L23 1 M19 5 L19 1 M19 5 L23 5" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 19 L1 23 M5 19 L5 23 M5 19 L1 19" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M19 19 L23 23 M19 19 L19 23 M19 19 L23 19" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="font-mts-wide text-[13px] tracking-[0.16em] uppercase text-black/85">atlas.secure</span>
      </Link>

      <div className="flex items-center gap-2">
        <nav className="hidden md:flex items-center gap-6 font-mts-wide text-[14px] text-black/60 mr-2">
          <Link href="/pricing"  className="hover:text-black transition-colors">Тарифы</Link>
          <Link href="/devices"  className="hover:text-black transition-colors">Устройства</Link>
          <Link href="/support"  className="hover:text-black transition-colors">Поддержка</Link>
        </nav>
        <button
          onClick={onNotifications}
          className="relative w-10 h-10 rounded-xl bg-white border border-black/[0.08] flex items-center justify-center hover:border-black/[0.16] transition-colors active:scale-[0.95]"
          aria-label="Уведомления"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-[#EF4444] rounded-full flex items-center justify-center px-1">
              <span className="font-mts-wide text-[10px] font-bold text-white leading-none">{unreadCount > 9 ? "9+" : unreadCount}</span>
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
