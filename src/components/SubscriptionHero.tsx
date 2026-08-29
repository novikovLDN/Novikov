"use client";

import { useRouter } from "next/navigation";

interface SubscriptionHeroProps {
  isExpired: boolean;
  subscriptionPlan: string;
  subscriptionEnd: string;
  daysLeft: number;
  hoursLeft: number;
  minutesLeft: number;
  isTrial: boolean;
}

/**
 * Russian-aware pluralization.
 */
function plural(n: number, one: string, few: string, many: string): string {
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

function humanRemaining(totalDays: number, hoursLeft: number): string {
  if (totalDays <= 0) {
    if (hoursLeft > 0) return `${hoursLeft} ${plural(hoursLeft, "час", "часа", "часов")}`;
    return "менее часа";
  }
  const years = Math.floor(totalDays / 365);
  if (years >= 1) {
    const months = Math.floor((totalDays - years * 365) / 30);
    const yLabel = `${years} ${plural(years, "год", "года", "лет")}`;
    if (months === 0) return yLabel;
    return `${yLabel} ${months} ${plural(months, "месяц", "месяца", "месяцев")}`;
  }
  const months = Math.floor(totalDays / 30);
  if (months >= 1) {
    const days = totalDays - months * 30;
    const mLabel = `${months} ${plural(months, "месяц", "месяца", "месяцев")}`;
    if (days === 0) return mLabel;
    return `${mLabel} ${days} ${plural(days, "день", "дня", "дней")}`;
  }
  return `${totalDays} ${plural(totalDays, "день", "дня", "дней")}`;
}

/**
 * SubscriptionHero — v5.
 *
 * Redesign brief:
 *   - Drop the animated radial-gradient backdrops + dot grid mask.
 *     They read as noise on mobile and don't survive well against a
 *     light shell.
 *   - Hierarchy on phone (top-to-bottom, what the user actually
 *     needs): plan chip → date → time / remaining → two big CTAs.
 *   - The "perks strip" (Трафик / Порт / Шифрование) moved out;
 *     hero speaks about ONE thing — how long the subscription still
 *     runs and how to connect. Perks belong on the pricing page.
 *   - Both CTAs are 56 px tall on mobile so the whole card acts like
 *     one clear "next action" — Connect wins by weight (orange fill,
 *     bigger), Extend is a hairline ghost that stacks below it on
 *     phones and sits beside it on desktop.
 */
export default function SubscriptionHero({
  isExpired,
  subscriptionPlan,
  subscriptionEnd,
  daysLeft,
  hoursLeft,
  isTrial,
}: SubscriptionHeroProps) {
  const router = useRouter();

  const isExpiring = !isExpired && daysLeft < 3;

  const statusColor = isExpired
    ? "#EF4444"
    : isExpiring
    ? "#F59E0B"
    : "#22C55E";

  const statusLabel = isExpired
    ? "Не активна"
    : isExpiring
    ? "Скоро истечёт"
    : isTrial
    ? "Пробный период"
    : "Активна";

  const planLabel = isExpired
    ? "Подписка"
    : isTrial
    ? "Trial · 24 часа"
    : subscriptionPlan === "plus"
    ? "Plus"
    : subscriptionPlan === "basic"
    ? "Basic"
    : "Подписка";

  const endDate = new Date(subscriptionEnd);
  const endDateLabel = endDate.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const endTimeLabel = endDate.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <section className="dv2-dark dv2-elevate relative overflow-hidden rounded-[24px] sm:rounded-[28px] border border-white/[0.06] bg-[#0F0F12]">
      <div className="relative p-5 sm:p-7 lg:p-8">
        {/* Row 1 — plan chip · status chip. Tightly kerned so both
            chips read as one strip of metadata rather than two
            unrelated labels. */}
        <div className="flex items-center gap-2 flex-wrap mb-6 sm:mb-8">
          <span className="font-mts-wide inline-flex items-center px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-white text-[11px] tracking-[0.06em] font-medium">
            {planLabel}
          </span>
          <span
            className="font-mts-wide inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium"
            style={{
              background: `${statusColor}18`,
              border: `1px solid ${statusColor}40`,
              color: statusColor,
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}` }}
            />
            {statusLabel}
          </span>
        </div>

        {/* Row 2 — the focal fact: WHEN it ends. */}
        {isExpired ? (
          <div className="mb-6 sm:mb-8">
            <div className="font-mts-wide text-[10px] tracking-[0.16em] uppercase text-white/40 mb-2">
              Истекла
            </div>
            <div className="font-mts-wide text-[34px] sm:text-[42px] lg:text-[52px] font-bold tracking-tight leading-[1.02] text-white">
              Подписка<br /><span className="text-white/45">не активна</span>
            </div>
          </div>
        ) : (
          <div className="mb-6 sm:mb-8">
            <div className="font-mts-wide text-[10px] tracking-[0.16em] uppercase text-white/40 mb-2">
              Действует до
            </div>
            <div className="font-mts-wide text-[34px] sm:text-[42px] lg:text-[52px] font-bold tracking-tight leading-[1.02] text-white">
              {endDateLabel}
            </div>
            <div className="font-mts-wide text-[13px] text-white/50 mt-3 tabular-nums">
              {endTimeLabel} · осталось {humanRemaining(daysLeft, hoursLeft)}
            </div>
          </div>
        )}

        {/* Row 3 — CTAs. Both full-width on mobile so they read as one
            clear action stack; from sm+ they sit side by side with
            Connect (primary/orange) flexing and Extend (dark ghost)
            at fixed 180 px. Sizes come from the design-system tokens:
            56 px primary, 48 px secondary. */}
        <div className="flex flex-col sm:flex-row gap-3">
          {!isExpired ? (
            <>
              <button
                type="button"
                onClick={() => router.push("/devices")}
                className="as-btn as-btn-primary as-btn-accent as-btn-block group flex-1"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                Подключить
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => router.push("/subscribe")}
                className="as-btn as-btn-primary as-btn-dark as-btn-block sm:w-[180px] sm:flex-none"
              >
                Продлить
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => router.push("/subscribe")}
              className="as-btn as-btn-primary as-btn-accent as-btn-block group flex-1"
            >
              Купить подписку
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
