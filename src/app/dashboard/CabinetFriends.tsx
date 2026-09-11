"use client";

import { useState, type CSSProperties } from "react";
import Icon from "@/components/pixel/Icon";

/**
 * Кабинет · приглашения. Уровни кешбэка и расчёт шкалы — из прежней
 * ReferralSection один в один. Шкала дотягивается до текущего уровня
 * при первом появлении панели в кадре; текущая точка пульсирует.
 */
const TIERS = [
  { name: "Стартовый", percent: 10, threshold: 0 },
  { name: "Продвинутый", percent: 25, threshold: 25 },
  { name: "Партнёр", percent: 45, threshold: 50 },
];

export default function CabinetFriends({
  referralCode,
  cashbackPercent,
  loyaltyTier,
  referrals,
  paidReferrals,
  copiedRef,
  onCopy,
  i,
}: {
  referralCode: string;
  cashbackPercent: number;
  loyaltyTier: string;
  referrals: number;
  paidReferrals: number;
  copiedRef: boolean;
  onCopy: (url: string) => void;
  i: number;
}) {
  const [sharing, setSharing] = useState(false);
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}?ref=${referralCode}` : "";

  const idx = Math.max(0, TIERS.findIndex((t) => t.percent === cashbackPercent));
  const current = TIERS[idx];
  const next = TIERS[idx + 1];
  const toNext = next ? Math.max(0, next.threshold - paidReferrals) : 0;
  const seg = next ? Math.min(1, Math.max(0, (paidReferrals - current.threshold) / (next.threshold - current.threshold))) : 1;
  const fill = next ? (idx + seg) / (TIERS.length - 1) : 1;

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share({
            title: "Atlas Secure",
            text: `Присоединяйся к Atlas Secure — ускоритель интернета с кешбэком ${cashbackPercent}% за приглашения.`,
            url: shareUrl,
          });
        } catch {
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
    <section
      id="referral-section"
      className="ak-card ak-friends"
      data-sheet="20"
      style={{ "--i": i } as CSSProperties}
      aria-labelledby="ak-fr-h"
    >
      <div className="ak-card-head">
        <h2 id="ak-fr-h" className="ak-eyebrow">Приглашайте друзей</h2>
        <span className="ak-plan">Уровень: {loyaltyTier}</span>
      </div>

      <p className="ak-value">
        {cashbackPercent}%<small>кешбэк с каждой оплаты друга</small>
      </p>

      <div className="ak-rail" aria-hidden>
        <i className="ak-rail-fill" style={{ "--p": fill } as CSSProperties} />
        {TIERS.map((t, k) => (
          <span
            key={t.name}
            className="ak-rail-stop"
            style={{ left: `${(k / (TIERS.length - 1)) * 100}%` }}
            data-on={k <= idx ? "" : undefined}
            data-here={k === idx ? "" : undefined}
          />
        ))}
      </div>
      <div className="ak-tiers">
        {TIERS.map((t, k) => (
          <span key={t.name} className="ak-tier" data-on={k <= idx ? "" : undefined}>
            <b>{t.percent}%</b>
            {t.name}
          </span>
        ))}
      </div>

      <div className="ak-stats">
        <div className="ak-stat">
          <span>Пригласили</span>
          <b className="a-num">{referrals}</b>
        </div>
        <div className="ak-stat">
          <span>Оплатили</span>
          <b className="a-num">{paidReferrals}</b>
        </div>
        <div className="ak-stat">
          <span>{next ? `До ${next.percent}%` : "Уровень"}</span>
          <b className="a-num">{next ? toNext : "макс."}</b>
        </div>
      </div>

      <div className="ak-actions">
        <button type="button" onClick={handleShare} disabled={sharing} className="a-btn a-btn-primary">
          <Icon name="share" size={16} />
          Поделиться
        </button>
        <button type="button" onClick={() => onCopy(shareUrl)} className="a-btn ak-btn-soft" data-state={copiedRef ? "ok" : undefined}>
          <Icon name={copiedRef ? "check" : "copy"} size={16} />
          {copiedRef ? "Скопировано" : "Скопировать ссылку"}
        </button>
      </div>
    </section>
  );
}
