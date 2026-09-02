"use client";

import type { ReactNode } from "react";
import { useScrollScene } from "./effects";

/**
 * Обёртка секции, которая раздаёт детям прогресс собственной
 * прокрутки переменной `--p`.
 *
 * Дальше слои расходятся правилами CSS (`.px-layer …`): заголовок
 * отстаёт, содержимое подтягивается. Тот же приём, что на первом
 * экране, но применённый ко всей странице — ради него обычно тянут
 * библиотеку скролл-анимаций, здесь достаточно одного слушателя на
 * секцию.
 *
 * Обёртка не создаёт нового блока в раскладке: `display: contents`
 * оставил бы её без размеров и сломал измерение, поэтому это обычный
 * div без собственных отступов.
 */
export default function ScrollLayer({ children }: { children: ReactNode }) {
  const ref = useScrollScene<HTMLDivElement>();
  return (
    <div ref={ref} className="px-layer">
      {children}
    </div>
  );
}
