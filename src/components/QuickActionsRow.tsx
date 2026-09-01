"use client";

import { useRouter } from "next/navigation";

interface QuickActionsRowProps {
  cashbackPercent: number;
  paidReferrals: number;
  unread: number;
  onNotifications: () => void;
}

/**
 * Быстрые действия — компактный столбец.
 *
 * Было: три карточки по 88–96px в ряд, где на каждую приходилось по
 * одному слову. Три четверти площади занимал воздух, а на телефоне
 * подписи ужимались до нечитаемых огрызков.
 *
 * Стало: строки высотой 52px со стрелкой — форма, которая прямо
 * говорит «нажми и перейдёшь». Под курсором строка сдвигается, а
 * стрелка уезжает вправо: движение подсказывает направление перехода,
 * а не просто украшает.
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
    <div className="grid grid-cols-1 gap-2">
      {actions.map((a, i) => (
        <button
          key={a.key}
          onClick={a.onClick}
          className="dv2-card dv2-action group"
          style={{ ["--px-delay" as string]: `${i * 70}ms` }}
        >
          <span className="dv2-action-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              {a.icon}
            </svg>
            {a.badge !== undefined && (
              <span className="dv2-action-badge">
                <span className="font-mts-wide text-[9px] font-bold leading-none tabular-nums">
                  {a.badge > 99 ? "99+" : a.badge}
                </span>
              </span>
            )}
          </span>

          <span className="font-mts-wide text-[13px] font-medium text-[color:var(--px-text)] leading-tight flex-1 text-left">
            {a.label}
          </span>

          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="dv2-action-arrow"
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      ))}
    </div>
  );
}
