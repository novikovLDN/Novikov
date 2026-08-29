"use client";

import { useRouter } from "next/navigation";

interface QuickActionsRowProps {
  cashbackPercent: number;
  paidReferrals: number;
  unread: number;
  onNotifications: () => void;
}

/**
 * QuickActionsRow — v5.
 *
 * Redesign brief:
 *   - Bigger touch targets: 72 px min-height, icon and label
 *     centred rather than stacked with a hint. Hints were noise on
 *     phones (truncated after 8 chars) and duplicated info the
 *     label already conveyed.
 *   - Cleaner card: same white surface as the rest of the light
 *     shell, MTS Wide typography.
 *   - On lg+ the row switches to a vertical stack (sidebar column
 *     next to the hero) — layout preserved from the previous
 *     version.
 */
export default function QuickActionsRow({
  cashbackPercent,
  paidReferrals,
  unread,
  onNotifications,
}: QuickActionsRowProps) {
  const router = useRouter();

  void paidReferrals;

  const actions = [
    {
      key: "devices",
      label: "Устройства",
      onClick: () => router.push("/devices"),
      icon: <path d="M4 6h16v10H4zM2 20h20M9 16v4M15 16v4" />,
    },
    {
      key: "notifications",
      label: "Уведомления",
      onClick: onNotifications,
      badge: unread > 0 ? unread : undefined,
      icon: <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" />,
    },
    {
      key: "referrals",
      label: `Кешбэк ${cashbackPercent}%`,
      onClick: () => {
        const el = document.getElementById("referral-section");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      },
      icon: <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5 sm:gap-3 lg:grid-cols-1">
      {actions.map((a) => (
        <button
          key={a.key}
          onClick={a.onClick}
          className="dv2-card group relative h-[88px] sm:h-[96px] lg:h-auto lg:min-h-[80px] rounded-2xl p-3 sm:p-4 flex flex-col lg:flex-row items-center lg:items-center justify-center lg:justify-start gap-2 lg:gap-3 transition-all active:scale-[0.98]"
        >
          <div className="relative w-9 h-9 rounded-xl bg-black/[0.04] border border-black/[0.06] flex items-center justify-center text-black/70 group-hover:text-black shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {a.icon}
            </svg>
            {a.badge !== undefined && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-[#EF4444] rounded-full flex items-center justify-center px-1">
                <span className="font-mts-wide text-[9px] font-bold text-white leading-none tabular-nums">
                  {a.badge > 99 ? "99+" : a.badge}
                </span>
              </span>
            )}
          </div>
          <div className="font-mts-wide text-[12px] sm:text-[13px] font-medium text-black leading-tight text-center lg:text-left">
            {a.label}
          </div>
        </button>
      ))}
    </div>
  );
}
