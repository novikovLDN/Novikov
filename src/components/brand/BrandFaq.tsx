"use client";

import { useState } from "react";

/**
 * Вопросы и ответы.
 *
 * Раскрытие на CSS (grid-template-rows: 0fr → 1fr), состояние — в
 * React, потому что оно нужно и для aria-expanded. Кнопка и панель
 * связаны через aria-controls, панель не выключается из дерева
 * доступности, а сворачивается высотой: так поиск по странице
 * находит ответ и в свёрнутом виде.
 *
 * Знак раскрытия — плюс, который поворачивается в минус. Шеврона нет
 * намеренно: в системе нет ни одной скруглённой формы.
 */
export interface BrandFaqItem {
  q: string;
  a: string;
}

export default function BrandFaq({ items }: { items: BrandFaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="b-faq">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className={`b-faq-item${isOpen ? " b-faq-open" : ""}`}>
            <h3>
              <button
                type="button"
                className="b-faq-q"
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${i}`}
                id={`faq-btn-${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
              >
                <span>{item.q}</span>
                <span className="b-faq-sign" aria-hidden />
              </button>
            </h3>
            <div
              className="b-faq-panel"
              id={`faq-panel-${i}`}
              role="region"
              aria-labelledby={`faq-btn-${i}`}
            >
              <div className="b-faq-panel-inner">
                <p className="b-body">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
