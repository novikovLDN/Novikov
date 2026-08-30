"use client";

import { PERIOD_LABEL, discountPercent, type Period } from "@/lib/plans";

/**
 * Переключатель периода оплаты.
 *
 * Один компонент на главную (два варианта) и /pricing (четыре).
 * Число сегментов уходит в CSS-переменную, из которой считается ширина
 * бегунка, поэтому раскладка не зашита в разметку.
 *
 * Колонки равной ширины — обязательное условие: иначе подпись со
 * скидкой у годового варианта сдвигала бы соседний сегмент при каждом
 * переключении, и контрол дрожал бы под пальцем.
 */
export default function PeriodSelector({
  periods,
  value,
  onChange,
  showDiscount = true,
}: {
  periods: readonly Period[];
  value: Period;
  onChange: (p: Period) => void;
  showDiscount?: boolean;
}) {
  const index = Math.max(0, periods.indexOf(value));

  return (
    <div
      className="ls-segment"
      role="group"
      aria-label="Период оплаты"
      style={{
        ["--ls-seg" as string]: index,
        ["--ls-seg-count" as string]: periods.length,
      }}
    >
      {periods.map((p) => {
        const off = discountPercent("basic", p);
        return (
          <button
            key={p}
            type="button"
            className="ls-segment-btn"
            aria-pressed={p === value}
            onClick={() => onChange(p)}
          >
            <span className="sm:hidden">{PERIOD_LABEL[p].short}</span>
            <span className="hidden sm:inline">{PERIOD_LABEL[p].full}</span>
            {showDiscount && off > 0 && (
              <span className="ls-num opacity-60 hidden sm:inline">−{off} %</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
