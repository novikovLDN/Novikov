"use client";

import { useEffect, useState } from "react";
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

export default function SubscriptionCard({
  subscriptionUrl,
  happCryptoLink,
  publicId,
}: SubscriptionCardProps) {
  const [copied, setCopied] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  if (!subscriptionUrl) {
    return (
      <div className="rounded-[24px] border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ animationDuration: "2s" }}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-medium text-white/90">Подписка готовится</div>
            <div className="text-[11px] text-white/40 mt-0.5">Обновите страницу через несколько секунд</div>
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
    <section
      className={`dv2-glow relative overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#0F0F12] transition-all duration-700 ease-out ${
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
      style={{
        boxShadow: "0 20px 60px -20px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)",
      }}
    >
      {/* Backdrop */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute top-0 right-0 h-64 w-64 rounded-full blur-3xl opacity-30"
          style={{ background: "radial-gradient(closest-side, #5E6AD244, transparent 70%)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.7) 1px, transparent 0)",
            backgroundSize: "18px 18px",
          }}
        />
      </div>

      <div className="relative p-6 sm:p-7">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-[10px] font-medium tracking-[0.18em] uppercase text-white/40" style={{ fontFamily: "var(--pl-mono)" }}>
              Ключ подписки
            </div>
            {publicId && (
              <div className="text-[11px] font-mono text-white/30 mt-1 tracking-wider">
                {publicId}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowQr((v) => !v)}
            className="h-9 px-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/70 hover:text-white hover:border-white/[0.12] hover:bg-white/[0.07] text-[12px] font-medium transition-all flex items-center gap-1.5"
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

        {/* QR (collapsible) */}
        <div
          className="grid transition-all duration-500 ease-out"
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

        {/* CTAs */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={openHapp}
            className="group relative h-13 sm:h-14 rounded-2xl bg-white text-black font-medium text-[14px] sm:text-[15px] flex items-center justify-center gap-2 transition-all hover:bg-white/95 active:scale-[0.985]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
            </svg>
            Открыть в Happ
          </button>

          <button
            onClick={handleCopy}
            className="h-11 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white/85 font-medium text-[13px] flex items-center justify-center gap-2 transition-all hover:bg-white/[0.07] hover:border-white/[0.12] active:scale-[0.985]"
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-[#34D399]">Скопировано</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                Скопировать ссылку
              </>
            )}
          </button>
        </div>

        {showFallback && (
          <div className="mt-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <p className="text-[10px] text-white/40 mb-1.5">Скопируйте вручную:</p>
            <code className="block text-[10px] font-mono break-all text-white/70 bg-black/30 p-2 rounded-lg">
              {subscriptionUrl}
            </code>
          </div>
        )}

        {/* App store row */}
        <div className="mt-5 pt-5 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
          <span className="text-white/40">Нет приложения Happ?</span>
          <div className="flex gap-3">
            <a
              href="https://apps.apple.com/app/happ-proxy-utility/id6504287215"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-white transition-colors"
            >
              App Store
            </a>
            <span className="text-white/20">·</span>
            <a
              href="https://play.google.com/store/apps/details?id=com.happproxy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-white transition-colors"
            >
              Google Play
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
