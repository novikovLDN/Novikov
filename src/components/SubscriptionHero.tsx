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
 * SubscriptionHero — компактная версия.
 *
 * Что было не так: дата кеглем 52px, под ней две кнопки высотой 64px
 * во всю ширину карточки. Первый экран кабинета занимала одна строка
 * данных и два огромных прямоугольника, а главное — сколько осталось
 * — читалось мельче, чем дата окончания.
 *
 * Что стало:
 *   - остаток срока вышел на первый план числом, дата ушла в подпись:
 *     «осталось 12 дней» — это ответ на вопрос пользователя, а
 *     «13 сентября 2026» — уточнение к нему;
 *   - полоса срока показывает остаток без чтения цифр;
 *   - действия — обычные кнопки 44px в ряд, а не плиты во всю ширину.
 *     Подключение остаётся акцентным, продление — вторичным.
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
    ? "var(--color-danger)"
    : isExpiring
    ? "var(--px-accent)"
    : "var(--px-good)";

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
    ? "Trial · 3 дня"
    : subscriptionPlan === "plus"
    ? "Plus"
    : subscriptionPlan === "basic"
    ? "Basic"
    : "Подписка";

  const endDate = new Date(subscriptionEnd);
  const endDateLabel = endDate.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const endTimeLabel = endDate.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  /* Полоса срока. Точку отсчёта не знаем — считаем от условного
     месячного цикла: тридцать дней и больше показываем как полный
     запас, дальше полоса убывает вместе с остатком. */
  const progress = isExpired ? 0 : Math.max(0.04, Math.min(1, daysLeft / 30));

  return (
    <section className="dv2-card dv2-elevate px-spot relative overflow-hidden">
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mts-wide inline-flex items-center px-2.5 py-1 rounded-full bg-[color:var(--px-surface-2)] border border-[color:var(--px-line)] text-[color:var(--px-text)] text-[11px] tracking-[0.06em] font-medium">
            {planLabel}
          </span>
          <span
            className="font-mts-wide inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
            style={{ background: `${statusColor}18`, color: statusColor }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusColor }} />
            {statusLabel}
          </span>
        </div>

        {isExpired ? (
          <div className="mt-5">
            <div className="font-mts-wide text-[26px] sm:text-[30px] font-bold tracking-tight leading-[1.1] text-[color:var(--px-text)]">
              Подписка не активна
            </div>
            <p className="font-mts-wide text-[13px] text-[color:var(--px-text-3)] mt-1.5">
              Доступ закрыт с {endDateLabel}
            </p>
          </div>
        ) : (
          <div className="mt-5">
            <div className="flex items-baseline gap-2">
              <span className="font-mts-wide text-[28px] sm:text-[34px] font-bold tracking-tight leading-none text-[color:var(--px-text)] tabular-nums">
                {humanRemaining(daysLeft, hoursLeft)}
              </span>
              <span className="font-mts-wide text-[13px] text-[color:var(--px-text-3)]">осталось</span>
            </div>

            <div className="dv2-meter mt-3.5" aria-hidden>
              <span style={{ transform: `scaleX(${progress})` }} />
            </div>

            <p className="font-mts-wide text-[12.5px] text-[color:var(--px-text-3)] mt-2.5 tabular-nums">
              до {endDateLabel}, {endTimeLabel}
            </p>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          {!isExpired ? (
            <>
              <button
                type="button"
                onClick={() => router.push("/devices")}
                className="px-btn px-btn-sm px-btn-primary group"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                Подключить устройство
              </button>
              <button
                type="button"
                onClick={() => router.push("/subscribe")}
                className="px-btn px-btn-sm px-btn-secondary"
              >
                Продлить
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => router.push("/subscribe")}
              className="px-btn px-btn-sm px-btn-primary group"
            >
              Купить подписку
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
