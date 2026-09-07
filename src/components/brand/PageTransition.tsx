"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePrefersReducedMotion } from "./motion";

/**
 * Переходы между страницами и предзагрузка маршрутов.
 *
 * ПОЧЕМУ РУКАМИ, А НЕ ФЛАГОМ. `experimental.viewTransition` в этой
 * сборке Next инертен: проверено подменой document.startViewTransition —
 * при клике по ссылке он не вызывается ни разу. Правило
 * `@view-transition { navigation: auto }` относится к межстраничным
 * переходам браузера и на клиентскую навигацию App Router не влияет.
 *
 * ФАЗА ПЕРЕХВАТА обязательна: обработчик next/link висит на корне
 * приложения, то есть внутри документа, и на всплытии срабатывает
 * раньше — зовёт preventDefault и уводит навигацию мимо перехода.
 *
 * СКОЛЬКО ДЕРЖАТЬ КАДР. Переход замораживает страницу на время своего
 * колбэка: пока он не разрешится, человек видит снимок старого экрана
 * и ничего больше. Поэтому кадр держится не «пока маршрут доедет», а
 * не дольше HOLD_MS. Не успел — переход отпускается, и дальше работает
 * обычная отрисовка с полосой загрузки. Замороженный экран без единого
 * признака жизни хуже, чем переход без анимации: он читается как
 * зависание.
 *
 * ПРЕДЗАГРУЗКА. Тяжёлые маршруты (вход — тысяча строк логики вместе с
 * passkey) начинают грузиться при наведении и при касании, до клика.
 * Это самый дешёвый способ убрать ожидание: к моменту нажатия код
 * обычно уже на месте.
 */
const HOLD_MS = 220;
/** Полоса показывается не сразу: на быстрой навигации мигание хуже
 *  отсутствия индикатора. */
const BAR_DELAY_MS = 180;

export default function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const resolveRef = useRef<(() => void) | null>(null);
  const prefetched = useRef(new Set<string>());
  const [loading, setLoading] = useState(false);
  const barTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduced = usePrefersReducedMotion();

  /** Маршрут отрисован: отпускаем и переход, и полосу. */
  useEffect(() => {
    if (barTimer.current) { clearTimeout(barTimer.current); barTimer.current = null; }
    setLoading(false);
    if (!resolveRef.current) return;
    const done = resolveRef.current;
    resolveRef.current = null;
    // Кадр на укладку: без него браузер снимает «после» до того, как
    // новая страница встала на место, и переход мигает пустотой.
    requestAnimationFrame(() => requestAnimationFrame(done));
  }, [pathname]);

  /** Внутренняя ссылка, по которой мы берём навигацию на себя. */
  const targetOf = useCallback((el: EventTarget | null): URL | null => {
    // Цель события — не всегда элемент: при перехвате на документе
    // сюда приходит и сам документ, у которого нет closest.
    if (!(el instanceof Element)) return null;
    const link = el.closest("a");
    if (!link) return null;
    if (link.target && link.target !== "_self") return null;
    if (link.hasAttribute("download")) return null;
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#")) return null;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin) return null;
    if (url.pathname === location.pathname && url.hash) return null;
    if (url.pathname === location.pathname && url.search === location.search) return null;
    return url;
  }, []);

  /* ─── Предзагрузка до клика ─────────────────────────────────── */
  useEffect(() => {
    const warm = (e: Event) => {
      const url = targetOf(e.target);
      if (!url) return;
      const key = url.pathname + url.search;
      if (prefetched.current.has(key)) return;
      prefetched.current.add(key);
      try { router.prefetch(key); } catch { /* маршрут мог исчезнуть */ }
    };
    document.addEventListener("pointerenter", warm, { capture: true });
    document.addEventListener("touchstart", warm, { capture: true, passive: true });
    return () => {
      document.removeEventListener("pointerenter", warm, { capture: true });
      document.removeEventListener("touchstart", warm, { capture: true });
    };
  }, [router, targetOf]);

  /* ─── Перехват клика ────────────────────────────────────────── */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const url = targetOf(e.target);
      if (!url) return;

      const to = url.pathname + url.search + url.hash;
      e.preventDefault();
      // Обработчик next/link не должен получить это событие: иначе
      // навигация уйдёт вторым путём, мимо перехода.
      e.stopPropagation();

      // Полоса загрузки нужна в любом режиме, в том числе при
      // пониженной анимации: это индикатор состояния, а не украшение.
      barTimer.current = setTimeout(() => setLoading(true), BAR_DELAY_MS);

      const go = () => router.push(to);
      if (reduced || !document.startViewTransition) { go(); return; }

      document.startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            resolveRef.current = resolve;
            go();
            setTimeout(() => {
              if (resolveRef.current === resolve) {
                resolveRef.current = null;
                resolve();
              }
            }, HOLD_MS);
          }),
      );
    };

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [router, reduced, targetOf]);

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
