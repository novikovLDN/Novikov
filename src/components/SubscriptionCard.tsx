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
 * SubscriptionCard — v5.
 *
 * Redesign brief:
 *   - Dropped the animated radial gradient + dot-grid backdrop. On
 *     phones they added visual noise without carrying any signal.
 *   - Cleaner header: "Ключ подписки" eyebrow only; public-id chip
 *     moved down under the QR to keep the top of the card tidy.
 *   - Two CTAs stack vertically on mobile at 56 px each so they read
 *     as one clear "next action" pair — Open (white fill, primary)
 *     above Copy (hairline ghost).
 *   - The "no app? App Store / Google Play" strip stays but sits on
 *     its own dividing line to avoid competing with the CTAs.
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
      <div className="dv2-card p-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-black/[0.04] border border-black/[0.06] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ animationDuration: "2s" }}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="font-mts-wide text-[13px] font-medium text-black/85">Подписка готовится</div>
            <div className="font-mts-wide text-[11px] text-black/45 mt-0.5">Обновите страницу через несколько секунд</div>
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
    <section className="dv2-dark dv2-elevate relative overflow-hidden rounded-[24px] sm:rounded-[28px] border border-white/[0.06] bg-[#0F0F12]">
      <div className="relative p-5 sm:p-7">
        {/* Header — one eyebrow, one QR toggle */}
        <div className="flex items-center justify-between mb-5">
          <div className="font-mts-wide text-[10px] tracking-[0.16em] uppercase text-white/45">
            Ключ подписки
          </div>
          <button
            onClick={() => setShowQr((v) => !v)}
            className="font-mts-wide h-9 px-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/75 hover:text-white hover:border-white/[0.16] text-[12px] font-medium transition-all flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <path d="M14 14h3v3M21 14v3M14 17v4M17 21h4" />
            </svg>
            {showQr ? "Скрыть" : "QR"}
          </button>
        </div>

        {/* Collapsible QR panel */}
        <div
          className="grid transition-all duration-400 ease-out"
          style={{ gridTemplateRows: showQr ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div className="bg-white rounded-2xl p-4 mb-5 flex items-center justify-center">
              <QRCodeSVG
                value={subscriptionUrl}
                size={220}
                level="M"
                marginSize={2}
                className="w-full h-auto max-w-[220px]"
              />
            </div>
          </div>
        </div>

        {/* CTAs — primary (Open) wins by weight; Copy is a dark
            secondary living on the same focal surface. */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={openHapp}
            className="as-btn as-btn-primary as-btn-accent as-btn-block"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            Открыть в приложении
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="as-btn as-btn-secondary as-btn-dark as-btn-block"
          >
            {copied ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-[#22C55E]">Скопировано</span>
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
          <div className="mt-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            <p className="font-mts-wide text-[10px] text-white/45 mb-1.5">Скопируйте вручную:</p>
            <code className="block text-[10px] font-mono break-all text-white/75 bg-black/40 p-2 rounded-lg">
              {subscriptionUrl}
            </code>
          </div>
        )}

        {publicId && (
          <div className="mt-5 pt-5 border-t border-white/[0.08] flex items-center justify-between text-[11px]">
            <span className="font-mts-wide text-white/40 tracking-[0.12em] uppercase text-[10px]">ID</span>
            <span className="font-mono text-white/70 tracking-wider">{publicId}</span>
          </div>
        )}

        <div className="mt-5 pt-5 border-t border-white/[0.08] flex items-center justify-between text-[11px]">
          <span className="font-mts-wide text-white/45">Нет приложения?</span>
          <div className="flex gap-3 font-mts-wide">
            <a
              href="https://apps.apple.com/app/happ-proxy-utility/id6504287215"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/75 hover:text-white transition-colors"
            >
              App Store
            </a>
            <span className="text-white/20">·</span>
            <a
              href="https://play.google.com/store/apps/details?id=com.happproxy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/75 hover:text-white transition-colors"
            >
              Google Play
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
