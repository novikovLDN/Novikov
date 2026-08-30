"use client";

import { useId, useState } from "react";

/**
 * Аккордеон вопросов.
 *
 * Раскрытие сделано через grid-template-rows 0fr → 1fr: это
 * единственный способ анимировать «высоту по контенту» без замера
 * высоты в JS и без скачка при изменении ширины окна.
 *
 * Разметка кнопка + region со связкой aria-controls/aria-expanded —
 * чтобы аккордеон работал с клавиатуры и озвучивался как раскрывающийся
 * список, а не как набор бессвязных кнопок.
 */
export interface FaqItem {
  q: string;
  a: string;
}

export default function Faq({ items, defaultOpen = 0 }: { items: FaqItem[]; defaultOpen?: number | null }) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  const uid = useId();

  return (
    <div className="ls-faq">
      {items.map((item, i) => {
        const isOpen = open === i;
        const panelId = `${uid}-panel-${i}`;
        const buttonId = `${uid}-button-${i}`;
        return (
          <div key={item.q} className="ls-faq-item">
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
                className="ls-faq-trigger group"
              >
                <span className="ls-faq-question">{item.q}</span>
                <span className={`ls-faq-sign${isOpen ? " ls-faq-sign-open" : ""}`} aria-hidden>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className="ls-faq-panel"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <p className="ls-body pb-7 pr-12">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
