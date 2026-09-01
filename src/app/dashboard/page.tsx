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
import PushToggleButton from "@/components/PushToggleButton";
import { RollingNumber } from "@/components/pixel/effects";
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
              {/* Баланс. Раньше карточка тянулась на всю высоту соседней
                  колонки ради одной строки цифр — пустоты было больше,
                  чем данных. Сумма набирается барабаном разрядов:
                  движение читается как «счёт», а не как декорация. */}
              <div className="dv2-rise dv2-rise-3 dv2-card px-spot p-4 sm:p-5 lg:col-span-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="dv2-eyebrow mb-2">Баланс</div>
                  <div className="flex items-baseline gap-1.5">
                    <RollingNumber
                      value={data.balance}
                      decimals={2}
                      className="font-mts-wide text-[26px] sm:text-[30px] font-bold tracking-tight leading-none text-[color:var(--px-text)] tabular-nums"
                    />
                    <span className="font-mts-wide text-[15px] text-[color:var(--px-text-3)]">₽</span>
                  </div>
                  <p className="font-mts-wide text-[11.5px] text-[color:var(--px-text-4)] mt-2">
                    Пополнение — через Telegram-бот
                  </p>
                </div>
              </div>

              {/* ═══ Force-resync — the "починить подписку" escape hatch ═══
                   Small helper strip. If a user's local date and panel
                   date ever get out of sync (e.g. legacy ghost-date
                   residue), one tap here re-runs the full repair +
                   panel PATCH and returns the outcome. */}
              <div className="dv2-rise dv2-rise-4 dv2-card px-spot p-3.5 sm:p-4 lg:col-span-12 flex items-center gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-mts-wide text-[13.5px] sm:text-[14px] font-semibold text-[color:var(--px-text)] leading-tight">
                    Проверить подписку
                  </div>
                  <div className="font-mts-wide text-[12px] text-[color:var(--px-text-3)] mt-0.5 leading-[1.45]">
                    {resyncStatus
                      ? resyncStatus.text
                      : "Подхватит зависшие оплаты и обновит ключ."}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleForceResync}
                  disabled={resyncing}
                  className={`px-btn px-btn-sm shrink-0 ${
                    resyncStatus?.kind === "ok"
                      ? "px-btn-good"
                      : resyncStatus?.kind === "error"
                      ? "px-btn-danger"
                      : "px-btn-secondary"
                  }`}
                >
                  {resyncing ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-spin" style={{ animationDuration: "1.2s" }}>
                        <path d="M21 12a9 9 0 11-6.219-8.56" />
                      </svg>
                      <span className="hidden sm:inline">Обновляем…</span>
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
                    <div className="w-10 h-10 rounded-xl bg-[color:var(--px-accent-dim)] border border-[color:var(--px-line)] flex items-center justify-center shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
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
                    className="px-btn px-btn-sm px-btn-secondary"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                    </svg>
                    Привязать Telegram
                  </a>
                </div>
              ) : (
                <div className="dv2-rise dv2-rise-5 dv2-card p-4 sm:p-5 lg:col-span-8 lg:col-start-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[color:var(--px-good)]/12 border border-[color:var(--px-good)]/30 flex items-center justify-center shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--px-good)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mts-wide text-[13px] font-medium text-black leading-tight">Telegram привязан</div>
                    <div className="font-mts-wide text-[11px] text-black/50 mt-0.5">Подписка синхронизирована с ботом</div>
                  </div>
                  {unlinkStep === 0 ? (
                    <button
                      type="button"
                      onClick={() => setUnlinkStep(1)}
                      className="px-btn px-btn-sm px-btn-secondary shrink-0"
                    >
                      Отвязать
                    </button>
                  ) : unlinkStep === 1 ? (
                    <div className="shrink-0 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setUnlinkStep(0)}
                        className="px-btn px-btn-sm px-btn-secondary"
                      >
                        Отмена
                      </button>
                      <button
                        type="button"
                        onClick={handleUnlinkTelegram}
                        disabled={unlinking}
                        className="px-btn px-btn-sm px-btn-danger"
                      >
                        {unlinking ? "…" : "Отвязать"}
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
                <PushToggleButton />
                <SettingsCard />
              </div>

              {/* ═══ Utility row — About · Admin · Logout ═══ */}
              <div className="dv2-rise dv2-rise-6 lg:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/about")}
                  className="px-btn px-btn-sm px-btn-secondary px-btn-block"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 17V11M12 7h.01" />
                  </svg>
                  О компании
                </button>

                {data.isAdmin && (
                  <button
                    type="button"
                    onClick={() => router.push("/admin")}
                    className="px-btn px-btn-sm px-btn-secondary px-btn-block"
                    style={{ color: "var(--px-accent)", borderColor: "rgba(var(--px-accent-rgb),0.30)" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                    Админ-панель
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="px-btn px-btn-sm px-btn-secondary px-btn-block group"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-black/55 group-hover:text-[#EF4444] transition-colors">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span className="text-black/70 group-hover:text-[#EF4444] transition-colors">Выйти</span>
                </button>
              </div>
            </div>
          </div>

          {/* Logout confirm modal */}
          {showLogoutConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => !loggingOut && setShowLogoutConfirm(false)}>
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
              <div
                className="relative bg-[color:var(--px-surface)] border border-black/[0.06] rounded-2xl sm:rounded-3xl p-5 sm:p-7 w-full max-w-sm animate-scale-in"
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
                    type="button"
                    onClick={() => setShowLogoutConfirm(false)}
                    disabled={loggingOut}
                    className="px-btn px-btn-md px-btn-secondary flex-1"
                  >
                    Нет
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="px-btn px-btn-md px-btn-danger flex-1"
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
          <path d="M5 5 L1 1 M5 5 L5 1 M5 5 L1 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M19 5 L23 1 M19 5 L19 1 M19 5 L23 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 19 L1 23 M5 19 L5 23 M5 19 L1 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M19 19 L23 23 M19 19 L19 23 M19 19 L23 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
          className="px-icon-btn relative w-11 h-11 rounded-xl flex items-center justify-center transition-colors active:scale-[0.95]"
          aria-label="Уведомления"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#EF4444] rounded-full flex items-center justify-center px-1 border-2 border-[#101010]">
              <span className="font-mts-wide text-[10px] font-bold leading-none tabular-nums" style={{ color: "#fff" }}>{unreadCount > 9 ? "9+" : unreadCount}</span>
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
