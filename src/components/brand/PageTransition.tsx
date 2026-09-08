"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Полоса загрузки страницы.
 *
 * ПОЧЕМУ ЗДЕСЬ БОЛЬШЕ НЕТ НИ ПЕРЕХВАТА КЛИКА, НИ VIEW TRANSITIONS.
 * Компонент забирал навигацию себе: гасил событие до next/link,
 * звал router.push внутри document.startViewTransition и держал
 * кадр замороженным. Замер на собранном приложении показал, во что
 * это обходилось:
 *
 *   / → /support кликом через перехватчик   3619 мс
 *   тот же переход мимо перехватчика         530 мс
 *   / → /pricing                            3260 мс
 *   /support → /pricing (перехватчик тот же) 57 мс
 *
 * Профиль во время перехода — 2,86 с простоя из 2,96 с и ноль
 * сетевых запросов: маршрут уже был предзагружен, страница просто
 * стояла. Дороже всего это стоило именно тяжёлым сценам бренда, то
 * есть первому экрану — единственному, который видят все.
 *
 * Навигацию ведёт next/link. Он же сам предзагружает маршрут — своя
 * предзагрузка по наведению была дублем, а её слушатель
 * pointerenter с перехватом на документе получал по событию на
 * каждый элемент входимой цепочки предков.
 *
 * За компонентом осталось одно: показать, что переход идёт, если он
 * не уложился в BAR_DELAY_MS. Клик слушается пассивно и ничего не
 * отменяет.
 */

/** Полоса показывается не сразу: на быстрой навигации мигание хуже
 *  отсутствия индикатора. */
const BAR_DELAY_MS = 180;

export default function PageTransition() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const barTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = useCallback(() => {
    if (barTimer.current) { clearTimeout(barTimer.current); barTimer.current = null; }
    setLoading(false);
  }, []);

  /** Маршрут отрисован — полосу убираем. */
  useEffect(() => { stop(); }, [pathname, stop]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const el = e.target;
      // Цель события — не всегда элемент: при слушателе на документе
      // сюда приходит и сам документ, у которого нет closest.
      if (!(el instanceof Element)) return;
      const link = el.closest("a");
      if (!link) return;
      if (link.target && link.target !== "_self") return;
      if (link.hasAttribute("download")) return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname) return;

      if (barTimer.current) clearTimeout(barTimer.current);
      barTimer.current = setTimeout(() => setLoading(true), BAR_DELAY_MS);
    };

    // Пассивно и без перехвата: обработчик next/link обязан получить
    // это событие первым и целым.
    document.addEventListener("click", onClick, { passive: true });
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => () => { if (barTimer.current) clearTimeout(barTimer.current); }, []);

  return (
    <div
      className={`b-navbar${loading ? " b-navbar-on" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={loading ? "Загружается страница" : ""}
    >
      <span className="b-navbar-fill" aria-hidden />
    </div>
  );
}
