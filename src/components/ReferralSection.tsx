"use client";

import { useState } from "react";

interface ReferralSectionProps {
  referralCode: string;
  cashbackPercent: number;
  loyaltyTier: string;
  referrals: number;
  paidReferrals: number;
  copiedRef: boolean;
  onCopy: (url: string) => void;
}

const TIERS = [
  { name: "Стартовый", percent: 10, threshold: 0 },
  { name: "Продвинутый", percent: 25, threshold: 25 },
  { name: "Партнёр", percent: 45, threshold: 50 },
];

export default function ReferralSection({
  referralCode,
  cashbackPercent,
  loyaltyTier,
  referrals,
  paidReferrals,
  copiedRef,
  onCopy,
}: ReferralSectionProps) {
  const [sharing, setSharing] = useState(false);

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}?ref=${referralCode}` : "";

  // Find the next tier the user can reach
  const currentTierIdx = TIERS.findIndex((t) => t.percent === cashbackPercent);
  const currentTier = TIERS[Math.max(0, currentTierIdx)];
  const nextTier = TIERS[currentTierIdx + 1];
  const referralsToNext = nextTier ? Math.max(0, nextTier.threshold - paidReferrals) : 0;

  // Progress within current tier
  const segStart = currentTier.threshold;
  const segEnd = nextTier ? nextTier.threshold : currentTier.threshold;
  const segProgress = nextTier
    ? Math.min(1, Math.max(0, (paidReferrals - segStart) / (segEnd - segStart)))
    : 1;

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share({
            title: "Atlas Secure",
            text: `Присоединяйся к Atlas Secure — защищённое соединение с кешбэком ${cashbackPercent}% за приглашения.`,
            url: shareUrl,
          });
        } catch {
          // user cancelled — fall back to copy
          onCopy(shareUrl);
        }
      } else {
        onCopy(shareUrl);
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <div id="referral-section" className="dv2-card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="dv2-eyebrow">Реферальная программа</div>
          <div className="text-[20px] sm:text-[22px] font-medium text-white mt-1">
            Кешбэк {cashbackPercent}% с друзей
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-mono text-white/30 tracking-wider uppercase">Уровень</div>
          <div className="text-[13px] font-medium text-white/90 mt-0.5">{loyaltyTier}</div>
        </div>
      </div>

      {/* Tier progress */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-4 mb-4">
        <div className="flex items-center justify-between text-[11px] text-white/50 mb-3">
          <span>
            Оплаченных рефералов: <span className="text-white/90 font-medium tabular-nums">{paidReferrals}</span>
          </span>
          {nextTier ? (
            <span>
              До «{nextTier.name}»: <span className="text-white/90 font-medium tabular-nums">{referralsToNext}</span>
            </span>
          ) : (
            <span className="text-[#34D399]">Максимальный уровень</span>
          )}
        </div>

        {/* Tier rail */}
        <div className="relative h-2 rounded-full bg-white/[0.04] overflow-hidden mb-3">
          {/* Filled progress up to current tier + within-segment */}
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${(currentTierIdx + segProgress) * (100 / (TIERS.length - 1 || 1))}%`,
              background: "linear-gradient(90deg, #5E6AD2 0%, #8F8FD9 100%)",
            }}
          />
          {/* Tier markers */}
          {TIERS.map((t, i) => (
            <div
              key={t.name}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border border-white/20"
              style={{
                left: `${(i / (TIERS.length - 1)) * 100}%`,
                background: i <= currentTierIdx ? "#fff" : "#0A0A0B",
              }}
            />
          ))}
        </div>

        <div className="flex justify-between text-[10px]">
          {TIERS.map((t, i) => (
            <div key={t.name} className={`text-center ${i <= currentTierIdx ? "text-white/90" : "text-white/30"}`}>
              <div className="font-medium tabular-nums">{t.percent}%</div>
              <div className="text-[9px] mt-0.5">{t.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] px-3 py-2.5">
          <div className="text-[10px] text-white/40 mb-0.5">Приглашено</div>
          <div className="text-[18px] font-light text-white tabular-nums">{referrals}</div>
        </div>
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] px-3 py-2.5">
          <div className="text-[10px] text-white/40 mb-0.5">Оплатили</div>
          <div className="text-[18px] font-light text-white tabular-nums">{paidReferrals}</div>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex gap-2">
        <button
          onClick={handleShare}
          disabled={sharing}
          className="flex-1 h-12 rounded-2xl bg-white text-black font-medium text-[14px] flex items-center justify-center gap-2 transition-all hover:bg-white/95 active:scale-[0.985] disabled:opacity-60"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          Поделиться
        </button>
        <button
          onClick={() => onCopy(shareUrl)}
          className="flex-1 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white/85 font-medium text-[13px] flex items-center justify-center gap-2 transition-all hover:bg-white/[0.07] hover:border-white/[0.12] active:scale-[0.985]"
        >
          {copiedRef ? (
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
              Скопировать
            </>
          )}
        </button>
      </div>
    </div>
  );
}
