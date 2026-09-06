"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

interface SubscriptionCardProps {
  subscriptionUrl: string | null;
  happCryptoLink: string | null;
  subscriptionEnd: string;
  isTrial: boolean;
  publicId?: string | null;
}

function happDeepLink(subscriptionUrl: string, happCryptoLink: string | null): string {
  if (happCryptoLink && happCryptoLink.startsWith("happ://")) return happCryptoLink;
  const b64 =
    typeof window !== "undefined" ? btoa(subscriptionUrl) : Buffer.from(subscriptionUrl).toString("base64");
  return `happ://add/${b64}`;
}

/**
 * SubscriptionCard — компактная версия.
 *
 * Было: две кнопки высотой 64 и 54px во всю ширину карточки, между
 * ними и подписями — воздух на пол-экрана телефона. Ключ подписки —
 * рабочий инструмент: его открывают в приложении или копируют, и обе
 * операции занимают одну строку.
 *
 * Анимации здесь несут смысл, а не украшают: QR разворачивается
 * из нулевой высоты (grid-template-rows, без скачка раскладки),
 * успешное копирование отмечается галочкой с пружиной, а сама
 * карточка приподнимается под курсором.
 */
export default function SubscriptionCard({
  subscriptionUrl,
  happCryptoLink,
  publicId,
}: SubscriptionCardProps) {
  const [copied, setCopied] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [showQr, setShowQr] = useState(false);

  if (!subscriptionUrl) {
    return (
      <div className="dv2-card p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[color:var(--px-surface-2)] border border-[color:var(--px-line)] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--px-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ animationDuration: "2s" }}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="font-mts-wide text-[13px] font-medium text-[color:var(--px-text)]">Подписка готовится</div>
            <div className="font-mts-wide text-[11px] text-[color:var(--px-text-3)] mt-0.5">Обновите страницу через несколько секунд</div>
          </div>
        </div>
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
    window.location.href = link;
  };

  return (
    <section className="dv2-card dv2-elevate px-spot relative overflow-hidden">
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="dv2-eyebrow">Ключ подписки</div>
          <button
            type="button"
            onClick={() => setShowQr((v) => !v)}
            className="px-btn px-btn-sm px-btn-secondary"
            aria-expanded={showQr}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <path d="M14 14h3v3M21 14v3M14 17v4M17 21h4" />
            </svg>
            {showQr ? "Скрыть QR" : "QR-код"}
          </button>
        </div>

        {/* Разворачивается из нулевой высоты: анимируется grid-строка,
            соседние блоки не дёргаются. */}
        <div className="dv2-reveal-row" style={{ gridTemplateRows: showQr ? "1fr" : "0fr" }}>
          <div className="overflow-hidden">
            <div className="bg-white rounded-2xl border border-[color:var(--px-line)] p-4 mt-4 flex items-center justify-center">
              <QRCodeSVG value={subscriptionUrl} size={200} level="M" marginSize={2} className="w-full h-auto max-w-[200px]" />
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={openHapp} className="px-btn px-btn-sm px-btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            Открыть в приложении
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className={`px-btn px-btn-sm px-btn-secondary${copied ? " dv2-done" : ""}`}
          >
            {copied ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--px-good)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="dv2-check">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-[color:var(--px-good)]">Скопировано</span>
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                Скопировать ссылку
              </>
            )}
          </button>
        </div>

        {showFallback && (
          <div className="mt-3 p-3 rounded-xl bg-[color:var(--px-surface-2)] border border-[color:var(--px-line)]">
            <p className="font-mts-wide text-[10px] text-[color:var(--px-text-4)] mb-1.5">Скопируйте вручную:</p>
            <code className="block text-[10px] font-mono break-all text-[color:var(--px-text-2)] bg-[color:var(--px-surface)] border border-[color:var(--px-line)] p-2 rounded-lg">
              {subscriptionUrl}
            </code>
          </div>
        )}

        {publicId && (
          <div className="dv2-row">
            <span className="dv2-row-label font-mts-wide tracking-[0.12em] uppercase text-[10px]">ID</span>
            <span className="dv2-row-value font-mono tracking-wider">{publicId}</span>
          </div>
        )}

        <div className="dv2-row">
          <span className="dv2-row-label font-mts-wide">Нет приложения?</span>
          <span className="flex gap-3 font-mts-wide">
            <a
              href="https://apps.apple.com/app/happ-proxy-utility/id6504287215"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[color:var(--px-text-2)] hover:text-[color:var(--px-accent-text)] transition-colors"
            >
              App Store
            </a>
            <span className="text-[color:var(--px-text-4)]">·</span>
            <a
              href="https://play.google.com/store/apps/details?id=com.happproxy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[color:var(--px-text-2)] hover:text-[color:var(--px-accent-text)] transition-colors"
            >
              Google Play
            </a>
          </span>
        </div>
      </div>
    </section>
  );
}
