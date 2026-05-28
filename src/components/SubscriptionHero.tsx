"use client";

import { useEffect, useState } from "react";
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
 * Russian-aware pluralization: 1 год / 2-4 года / 5+ лет, with
 * special-case overrides for 11..14 (always "лет"). Returns the
 * largest meaningful chunk: years if >= 1, else months if >= 1,
 * else days, else hours.
 */
function plural(n: number, one: string, few: string, many: string): string {
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

function humanRemaining(totalDays: number): string {
  if (totalDays <= 0) return "0 дней";
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
 * Hero subscription card on the dashboard.
 *
 * Layered visual:
 *   - Soft radial gradient backdrop with subtle grid mask
 *   - Animated status orb (active / expiring / expired)
 *   - Plan name + status pill
 *   - Big "valid until" date in tabular numbers
 *   - Days countdown with crisp typography
 *   - Two primary CTAs: Connect (light, dominant) / Extend (ghost)
 *
 * No images, no third-party gradients — everything is CSS so it stays
 * sharp on retina and animates GPU-cheap.
 */
export default function SubscriptionHero({
  isExpired,
  subscriptionPlan,
  subscriptionEnd,
  daysLeft,
  hoursLeft,
  minutesLeft,
  isTrial,
}: SubscriptionHeroProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  const isExpiring = !isExpired && daysLeft < 3;

  const statusColor = isExpired
    ? "#EF4444"
    : isExpiring
    ? "#F59E0B"
    : "#34D399";

  const statusLabel = isExpired
    ? "Подписка истекла"
    : isExpiring
    ? "Скоро истечёт"
    : isTrial
    ? "Пробный период"
    : "Подписка активна";

  const planLabel = isExpired
    ? "Не активна"
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

  // hoursLeft / minutesLeft are read by humanRemaining via daysLeft;
  // the inline countdown was replaced by the focal date + remaining label.
  void hoursLeft;
  void minutesLeft;

  return (
    <section
      className={`dv2-glow dv2-elevate relative overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#0F0F12] transition-all duration-700 ease-out ${
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
    >
      {/* Animated backdrop layer */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {/* radial accent */}
        <div
          className="absolute -top-20 -left-20 h-80 w-80 rounded-full blur-3xl opacity-50"
          style={{
            background: `radial-gradient(closest-side, ${statusColor}22, transparent 70%)`,
            animation: "heroPulse 6s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full blur-3xl opacity-30"
          style={{
            background: `radial-gradient(closest-side, #5E6AD244, transparent 70%)`,
            animation: "heroPulse 7s ease-in-out infinite reverse",
          }}
        />
        {/* dot grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.7) 1px, transparent 0)",
            backgroundSize: "20px 20px",
            maskImage:
              "radial-gradient(ellipse 70% 60% at 50% 40%, #000 30%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 60% at 50% 40%, #000 30%, transparent 80%)",
          }}
        />
      </div>

      <div className="relative p-6 sm:p-8">
        {/* Top row: plan label + status pill */}
        <div className="flex items-center justify-between mb-8 sm:mb-10">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-medium tracking-[0.18em] uppercase text-white/40"
              style={{ fontFamily: "var(--pl-mono)" }}
            >
              {planLabel}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
            <span
              className="relative h-1.5 w-1.5 rounded-full"
              style={{ background: statusColor, boxShadow: `0 0 8px ${statusColor}` }}
            >
              <span
                className="absolute inset-0 rounded-full"
                style={{
                  background: statusColor,
                  animation: "heroPing 2s cubic-bezier(0, 0, 0.2, 1) infinite",
                  opacity: 0.5,
                }}
              />
            </span>
            <span className="text-[11px] font-medium text-white/80">{statusLabel}</span>
          </div>
        </div>

        {/* Focal date — the new accent */}
        {isExpired ? (
          <div className="mb-6">
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/40 mb-2">
              Истекла
            </div>
            <div className="text-[34px] sm:text-[44px] font-light tracking-tight leading-[1.05] text-white/40">
              Подписка<br /><span className="text-white/30">не активна</span>
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/40 mb-2">
              Действует до
            </div>
            <div className="text-[34px] sm:text-[44px] font-light tracking-tight leading-[1.05] text-white">
              {endDateLabel}
            </div>
            <div className="flex items-center gap-2 mt-2 text-[12px] text-white/45">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{endTimeLabel} · осталось {humanRemaining(daysLeft)}</span>
            </div>
          </div>
        )}

        {/* Subscription perks strip — only verifiable facts */}
        {!isExpired && (
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[
              { label: "Трафик", value: "Безлимит" },
              { label: "Порт", value: "до 75 Гбит/с" },
              { label: "Шифрование", value: "AES-256" },
            ].map((p) => (
              <div key={p.label} className="rounded-xl bg-white/[0.025] border border-white/[0.05] px-3 py-2.5">
                <div className="text-[9px] font-mono uppercase tracking-[0.14em] text-white/35 mb-0.5 truncate">{p.label}</div>
                <div className="text-[12px] sm:text-[13px] font-medium text-white/90 truncate">{p.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* CTAs — chunky on mobile for easy tapping, refined on desktop */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          {!isExpired ? (
            <>
              <button
                onClick={() => router.push("/devices")}
                className="group relative flex-1 h-[84px] sm:h-[60px] rounded-2xl font-semibold text-[18px] sm:text-[15px] flex items-center justify-center gap-2.5 overflow-hidden transition-all active:scale-[0.985] text-white"
                style={{
                  background: "linear-gradient(135deg, #5E6AD2 0%, #8F8FD9 100%)",
                  boxShadow: "0 12px 32px -10px rgba(94,106,210,0.60), inset 0 1px 0 rgba(255,255,255,0.20)",
                }}
              >
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: "linear-gradient(135deg, #6E7AE2 0%, #9F9FE9 100%)" }} />
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)" }} />
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="relative sm:w-[18px] sm:h-[18px]">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                <span className="relative">Подключить VPN</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="relative transition-transform group-hover:translate-x-0.5 sm:w-4 sm:h-4">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => router.push("/subscribe")}
                className="h-[64px] sm:h-[60px] sm:w-[160px] rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white/85 font-medium text-[15px] sm:text-[14px] flex items-center justify-center gap-2 transition-all hover:bg-white/[0.07] hover:border-white/[0.14] active:scale-[0.985]"
              >
                Продлить
              </button>
            </>
          ) : (
            <button
              onClick={() => router.push("/subscribe")}
              className="group relative flex-1 h-[84px] sm:h-[60px] rounded-2xl font-semibold text-[18px] sm:text-[15px] flex items-center justify-center gap-2 overflow-hidden transition-all active:scale-[0.985] text-white"
              style={{
                background: "linear-gradient(135deg, #5E6AD2 0%, #8F8FD9 100%)",
                boxShadow: "0 12px 32px -10px rgba(94,106,210,0.60), inset 0 1px 0 rgba(255,255,255,0.20)",
              }}
            >
              <span className="relative">Купить подписку</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="relative transition-transform group-hover:translate-x-0.5 sm:w-4 sm:h-4">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes heroPulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.08); opacity: 0.7; }
        }
        @keyframes heroPing {
          0% { transform: scale(1); opacity: 0.6; }
          80%, 100% { transform: scale(2.8); opacity: 0; }
        }
      `}</style>
    </section>
  );
}
