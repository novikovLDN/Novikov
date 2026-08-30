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
 * скидкой у длинного периода сдвигала бы соседний сегмент, и контрол
 * дрожал бы под пальцем.
 *
 * Бегунок не акцентный: оранжевый на экране уже занят кнопкой выбора
 * тарифа.
 */
export default function PeriodSelector({
  periods,
  value,
  onChange,
}: {
  periods: readonly Period[];
  value: Period;
  onChange: (p: Period) => void;
}) {
  const index = Math.max(0, periods.indexOf(value));

  return (
    <div
      className="px-segment"
      role="group"
      aria-label="Период оплаты"
      style={{
        ["--px-seg" as string]: index,
        ["--px-seg-count" as string]: periods.length,
      }}
    >
      {periods.map((p) => {
        const off = discountPercent("basic", p);
        return (
          <button
            key={p}
            type="button"
            className="px-segment-btn"
            aria-pressed={p === value}
            onClick={() => onChange(p)}
          >
            <span className="sm:hidden">{PERIOD_LABEL[p].short}</span>
            <span className="hidden sm:inline">{PERIOD_LABEL[p].full}</span>
            {off > 0 && <span className="px-num px-accent hidden sm:inline">−{off} %</span>}
          </button>
        );
      })}
    </div>
  );
}
