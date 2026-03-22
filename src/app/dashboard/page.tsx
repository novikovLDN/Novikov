"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface SubscriptionData {
  email: string;
  daysLeft: number;
  subscriptionEnd: string;
  vpnKey: string;
  telegramLinked: boolean;
  referralCode: string;
  referrals: number;
  paidReferrals: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
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
  };

  const handleCopyReferral = async () => {
    if (!data) return;
    const link = `${window.location.origin}?ref=${data.referralCode}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyKey = async () => {
    if (!data?.vpnKey) return;
    await navigator.clipboard.writeText(data.vpnKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header showMenu />

      <main className="flex-1 px-4 max-w-lg mx-auto w-full space-y-4 pb-6">
        {/* Subscription card */}
        <div className="bg-card rounded-2xl p-6 text-center animate-fade-in">
          <p className="text-muted mb-2">Дней подписки осталось:</p>
          <p className="text-6xl font-bold mb-2">{data.daysLeft}</p>
          <p className="text-muted text-sm mb-6">
            Заканчивается: {formatDate(data.subscriptionEnd)}
          </p>

          <button className="w-full h-14 rounded-2xl bg-foreground text-background font-semibold text-lg hover:bg-foreground/90 transition-all mb-3">
            Продлить подписку
          </button>

          <button
            onClick={() => router.push("/devices")}
            className="w-full h-14 rounded-2xl bg-card-hover border border-border text-foreground font-semibold hover:bg-border transition-all"
          >
            Подключить устройство
          </button>
        </div>

        {/* VPN Key card */}
        <div className="bg-card rounded-2xl p-5 animate-fade-in-delay-1">
          <h3 className="font-semibold mb-3">Ваш VPN-ключ</h3>
          <div className="bg-background rounded-xl p-3 mb-3 break-all text-sm text-muted font-mono">
            {data.vpnKey}
          </div>
          <button
            onClick={handleCopyKey}
            className="w-full h-12 rounded-xl bg-primary text-white font-medium hover:bg-primary-hover transition-colors flex items-center justify-center gap-2"
          >
            {copiedKey ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Скопировано
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                Скопировать ключ
              </>
            )}
          </button>
        </div>

        {/* Referral card */}
        <div className="bg-card rounded-2xl p-5 animate-fade-in-delay-2">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-3xl">🎁</span>
            <div>
              <h3 className="font-semibold">Получи +20 дней к подписке за приглашение друга</h3>
              <p className="text-sm text-muted mt-1">
                Поделись ссылкой — после первой оплаты друга дни начислятся автоматически
              </p>
            </div>
          </div>

          <div className="flex gap-2 text-sm text-muted mb-4">
            <span>Всего рефералов: {data.referrals}</span>
            <span className="text-border">|</span>
            <span>Оплатили подписку: {data.paidReferrals}</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopyReferral}
              className="flex-1 h-12 rounded-xl bg-foreground text-background font-medium hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              Поделиться
            </button>
            <button
              onClick={handleCopyReferral}
              className="flex-1 h-12 rounded-xl bg-card-hover border border-border font-medium hover:bg-border transition-colors flex items-center justify-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              {copied ? "Скопировано!" : "Скопировать"}
            </button>
          </div>
        </div>

        {/* Telegram bonus */}
        <div className="bg-card rounded-2xl p-5 animate-fade-in-delay-3">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-3xl">🎁</span>
            <div>
              <h3 className="font-semibold">Получи +7 дней за привязку Telegram</h3>
              <p className="text-sm text-muted mt-1">
                Это быстрый вход в Личный кабинет через Telegram
              </p>
            </div>
          </div>

          {data.telegramLinked ? (
            <div className="flex items-center gap-2 text-success">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-sm">Telegram привязан</span>
            </div>
          ) : (
            <button className="w-full h-12 rounded-xl bg-primary text-white font-medium hover:bg-primary-hover transition-colors flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
              </svg>
              Привязать Telegram
            </button>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
