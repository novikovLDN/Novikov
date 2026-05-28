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

  // Countdown decomposition — bigger units first
  const totalMonths = Math.floor(daysLeft / 30);
  const showYears = totalMonths >= 12;
  const showMonths = totalMonths > 0 && totalMonths < 12;
  const showDays = daysLeft >= 1;
  const showHours = daysLeft < 30; // hide hours when months are shown to keep clean

  return (
    <section
      className={`dv2-glow relative overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#0F0F12] transition-all duration-700 ease-out ${
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
      style={{
        boxShadow: "0 30px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)",
      }}
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

        {/* Countdown */}
        <div className="mb-2">
          {isExpired ? (
            <div className="text-[56px] sm:text-[88px] font-light tracking-tight leading-none text-white/30 tabular-nums">
              0
            </div>
          ) : (
            <div className="flex items-baseline gap-3 flex-wrap">
              {showYears && (
                <>
                  <span className="text-[56px] sm:text-[88px] font-light tracking-tight leading-none text-white tabular-nums">
                    {Math.floor(totalMonths / 12)}
                  </span>
                  <span className="text-base sm:text-lg text-white/40 -ml-1">г</span>
                </>
              )}
              {(showMonths || showYears) && totalMonths % 12 > 0 && (
                <>
                  <span className="text-[40px] sm:text-[56px] font-light tracking-tight leading-none text-white/90 tabular-nums">
                    {totalMonths % 12}
                  </span>
                  <span className="text-sm sm:text-base text-white/40 -ml-1">мес</span>
                </>
              )}
              {showDays && !showYears && (
                <>
                  <span className="text-[56px] sm:text-[88px] font-light tracking-tight leading-none text-white tabular-nums">
                    {daysLeft >= 30 ? daysLeft % 30 : daysLeft}
                  </span>
                  <span className="text-base sm:text-lg text-white/40 -ml-1">дн</span>
                </>
              )}
              {showHours && (
                <>
                  <span className="text-[40px] sm:text-[56px] font-light tracking-tight leading-none text-white/90 tabular-nums">
                    {hoursLeft}
                  </span>
                  <span className="text-sm sm:text-base text-white/40 -ml-1">ч</span>
                </>
              )}
              {daysLeft < 1 && (
                <>
                  <span className="text-[40px] sm:text-[56px] font-light tracking-tight leading-none text-white/90 tabular-nums">
                    {minutesLeft}
                  </span>
                  <span className="text-sm sm:text-base text-white/40 -ml-1">мин</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mb-8 sm:mb-10">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-white/40"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <span className="text-[13px] text-white/50">
            {isExpired ? "Истекла " : "Действует до "}
            <span className="text-white/80 font-medium">
              {endDateLabel}
            </span>
            <span className="text-white/40 ml-1">· {endTimeLabel}</span>
          </span>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          {!isExpired ? (
            <>
              <button
                onClick={() => router.push("/devices")}
                className="group relative flex-1 h-14 rounded-2xl bg-white text-black font-medium text-[15px] flex items-center justify-center gap-2 overflow-hidden transition-all hover:bg-white/95 active:scale-[0.985]"
              >
                <span
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background:
                      "linear-gradient(120deg, transparent 30%, rgba(94,106,210,0.15) 50%, transparent 70%)",
                  }}
                />
                <span className="relative">Подключить VPN</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="relative transition-transform group-hover:translate-x-0.5"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => router.push("/subscribe")}
                className="h-14 sm:w-[180px] rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white/85 font-medium text-[14px] flex items-center justify-center gap-2 transition-all hover:bg-white/[0.07] hover:border-white/[0.12] active:scale-[0.985]"
              >
                Продлить
              </button>
            </>
          ) : (
            <button
              onClick={() => router.push("/subscribe")}
              className="group relative flex-1 h-14 rounded-2xl bg-white text-black font-medium text-[15px] flex items-center justify-center gap-2 overflow-hidden transition-all hover:bg-white/95 active:scale-[0.985]"
            >
              <span className="relative">Купить подписку</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="relative transition-transform group-hover:translate-x-0.5"
              >
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
