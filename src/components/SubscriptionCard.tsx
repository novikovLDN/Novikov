"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

interface SubscriptionCardProps {
  subscriptionUrl: string | null;
  happCryptoLink: string | null;
  subscriptionEnd: string;
  isTrial: boolean;
}

/**
 * Resolve the deep link that opens Happ with the user's subscription
 * pre-filled. Preference order:
 *   1. happ://crypto/<encrypted>  — encrypted by Remnawave panel, hides
 *      the plain URL from the user. This is what /api/system/encrypt-
 *      happ-crypto-link returns.
 *   2. happ://add/<base64url(url)> — Happ's plain-import scheme,
 *      always works if subscriptionUrl is known.
 */
function happDeepLink(subscriptionUrl: string, happCryptoLink: string | null): string {
  if (happCryptoLink) return happCryptoLink;
  const b64 = typeof window !== "undefined"
    ? btoa(subscriptionUrl).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
    : Buffer.from(subscriptionUrl).toString("base64url");
  return `happ://add/${b64}`;
}

export default function SubscriptionCard({ subscriptionUrl, happCryptoLink, subscriptionEnd, isTrial }: SubscriptionCardProps) {
  const [copied, setCopied] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  if (!subscriptionUrl) {
    return (
      <div className="bg-card border border-border/50 rounded-2xl sm:rounded-3xl p-4 sm:p-5">
        <h3 className="font-semibold text-sm sm:text-base mb-2">Ваша подписка</h3>
        <p className="text-muted text-xs sm:text-sm">
          Подписка готовится. Обновите страницу через несколько секунд.
        </p>
      </div>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(subscriptionUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setShowFallback(true);
    }
  };

  const openHapp = () => {
    const link = happDeepLink(subscriptionUrl, happCryptoLink);
    // window.location.href is the most reliable way to trigger the OS
    // deep-link handler on both iOS Safari and Android Chrome.
    window.location.href = link;
  };

  const endDate = new Date(subscriptionEnd);
  const dateLabel = endDate.toLocaleString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="bg-card border border-border/50 rounded-2xl sm:rounded-3xl p-4 sm:p-5 animate-fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm sm:text-base">Ваша подписка</h3>
        <span className="text-[10px] sm:text-xs bg-primary-light text-primary px-2 py-0.5 rounded-full font-medium">
          {isTrial ? "Пробный период" : "Активна"}
        </span>
      </div>

      <p className="text-muted text-xs sm:text-sm mb-4">
        {isTrial ? "Пробный период до" : "Действует до"} <span className="text-foreground font-medium">{dateLabel}</span>
      </p>

      {/* QR */}
      <div className="bg-white rounded-2xl p-4 mb-4 flex items-center justify-center">
        <QRCodeSVG
          value={subscriptionUrl}
          size={220}
          level="M"
          marginSize={2}
          className="w-full h-auto max-w-[220px]"
        />
      </div>

      <p className="text-muted text-[11px] sm:text-xs text-center mb-4 leading-snug">
        Отсканируйте QR в приложении Happ или нажмите кнопку ниже — подписка добавится автоматически.
      </p>

      {/* Action buttons */}
      <div className="space-y-2">
        <button
          onClick={openHapp}
          className="w-full h-12 rounded-xl bg-primary text-white font-semibold text-sm flex items-center justify-center gap-2 btn-press transition-all hover:bg-primary-hover"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
          </svg>
          Открыть в Happ
        </button>

        <button
          onClick={handleCopy}
          className="w-full h-12 rounded-xl bg-card-hover border border-border text-foreground font-medium text-sm flex items-center justify-center gap-2 btn-press transition-all hover:bg-card-active"
        >
          {copied ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span className="text-success">Скопировано</span>
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              Скопировать ссылку
            </>
          )}
        </button>
      </div>

      {showFallback && (
        <div className="mt-3 p-3 bg-card-hover border border-border rounded-xl">
          <p className="text-[11px] text-muted mb-2">Скопируйте ссылку вручную:</p>
          <code className="block text-[10px] font-mono break-all text-foreground/80 bg-background p-2 rounded">
            {subscriptionUrl}
          </code>
        </div>
      )}

      {/* App store links */}
      <div className="mt-4 pt-4 border-t border-border/30">
        <p className="text-muted text-[11px] mb-2">Нет приложения Happ?</p>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <a href="https://apps.apple.com/app/happ-proxy-utility/id6504287215" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">App Store</a>
          <a href="https://play.google.com/store/apps/details?id=com.happproxy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Play</a>
        </div>
      </div>
    </div>
  );
}
