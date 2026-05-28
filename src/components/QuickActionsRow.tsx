"use client";

import { useRouter } from "next/navigation";

interface QuickActionsRowProps {
  cashbackPercent: number;
  paidReferrals: number;
  unread: number;
  onNotifications: () => void;
}

/**
 * Three compact glass cards below the hero:
 *   - Devices (route /devices)
 *   - Notifications (opens modal)
 *   - Referrals (jumps to referral section)
 */
export default function QuickActionsRow({
  cashbackPercent,
  paidReferrals,
  unread,
  onNotifications,
}: QuickActionsRowProps) {
  const router = useRouter();

  const actions = [
    {
      key: "devices",
      label: "Устройства",
      hint: "Настройка подключений",
      onClick: () => router.push("/devices"),
      icon: <path d="M4 6h16v10H4zM2 20h20M9 16v4M15 16v4" />,
    },
    {
      key: "notifications",
      label: "Уведомления",
      hint: unread > 0 ? `${unread} новых` : "Все прочитано",
      onClick: onNotifications,
      badge: unread > 0 ? unread : undefined,
      icon: <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" />,
    },
    {
      key: "referrals",
      label: `Кешбэк ${cashbackPercent}%`,
      hint: paidReferrals > 0 ? `Приглашено: ${paidReferrals}` : "Пригласить друга",
      onClick: () => {
        const el = document.getElementById("referral-section");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      },
      icon: <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {actions.map((a) => (
        <button
          key={a.key}
          onClick={a.onClick}
          className="group relative flex flex-col items-start text-left rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] backdrop-blur p-3 sm:p-4 transition-all active:scale-[0.98] overflow-hidden"
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="h-9 w-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/70 group-hover:text-white group-hover:border-white/[0.12] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                {a.icon}
              </svg>
            </div>
            {a.badge !== undefined && (
              <span className="text-[10px] font-medium px-1.5 h-[18px] flex items-center rounded-full bg-[#5E6AD2] text-white tabular-nums">
                {a.badge > 99 ? "99+" : a.badge}
              </span>
            )}
          </div>
          <div className="text-[12px] sm:text-[13px] font-medium text-white/90 leading-tight">
            {a.label}
          </div>
          <div className="text-[10px] sm:text-[11px] text-white/40 mt-0.5 leading-tight truncate w-full">
            {a.hint}
          </div>
        </button>
      ))}
    </div>
  );
}
