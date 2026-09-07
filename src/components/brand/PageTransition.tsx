"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePrefersReducedMotion } from "./motion";

/**
 * Переходы между страницами.
 *
 * ПОЧЕМУ РУКАМИ, А НЕ ФЛАГОМ. Конфигурация Next
 * (`experimental.viewTransition`) в этой сборке инертна: проверено
 * подменой `document.startViewTransition` — при клике по ссылке он не
 * вызывается ни разу, страница просто заменяется. Правило
 * `@view-transition { navigation: auto }` в CSS относится к
 * межстраничным переходам браузера и на клиентскую навигацию App
 * Router не действует. Поэтому переход запускается здесь.
 *
 * КАК УСТРОЕНО. Один делегированный слушатель на документ (а не
 * обёртка вокруг каждой ссылки) перехватывает клик по внутренней
 * ссылке, откладывает переход и отдаёт браузеру функцию, которая
 * разрешится, когда новый маршрут отрисуется. Момент отрисовки
 * ловится сменой pathname плюс кадр на укладку.
 *
 * ЧТО НЕ ПЕРЕХВАТЫВАЕМ: внешние адреса, новые вкладки, скачивания,
 * клики с модификаторами и средней кнопкой, якоря на текущей
 * странице. Всё это должно работать ровно так, как ожидает человек.
 *
 * Отказ не ломает навигацию: если браузер не умеет переходы или
 * человек попросил меньше движения, ссылка работает как обычная.
 * Если маршрут почему-то не сменился, переход разрешается по
 * таймауту — страница не может остаться замороженной.
 */
export default function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const resolveRef = useRef<(() => void) | null>(null);
  const reduced = usePrefersReducedMotion();

  // Новый маршрут отрисован — отпускаем переход.
  useEffect(() => {
    if (!resolveRef.current) return;
    const done = resolveRef.current;
    resolveRef.current = null;
    // Кадр на укладку: без него браузер снимает «после» до того, как
    // новая страница встала на место, и переход мигает пустотой.
    requestAnimationFrame(() => requestAnimationFrame(done));
  }, [pathname]);

  useEffect(() => {
    if (reduced) return;
    if (typeof document === "undefined" || !document.startViewTransition) return;

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const link = (e.target as HTMLElement | null)?.closest("a");
      if (!link) return;
      if (link.target && link.target !== "_self") return;
      if (link.hasAttribute("download")) return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin) return;
      // Якорь на этой же странице — не переход, а прокрутка.
      if (url.pathname === location.pathname && url.hash) return;
      if (url.pathname === location.pathname && url.search === location.search) return;

      e.preventDefault();
      // Обработчик next/link не должен получить это событие: иначе
      // навигация уйдёт мимо перехода, вторым путём.
      e.stopPropagation();
      document.startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            resolveRef.current = resolve;
            router.push(url.pathname + url.search + url.hash);
            // Страховка: маршрут мог не смениться (ошибка, редирект в
            // ту же точку). Замороженный кадр хуже отсутствия эффекта.
            setTimeout(() => {
              if (resolveRef.current === resolve) {
                resolveRef.current = null;
                resolve();
              }
            }, 1200);
          }),
      );
    };

    // Фаза перехвата обязательна. Обработчик next/link висит на
    // корне приложения, то есть ВНУТРИ документа: на всплытии он
    // срабатывает раньше, вызывает preventDefault и уводит навигацию
    // мимо перехода. Проверено — при обычном слушателе
    // document.startViewTransition не вызывался ни разу.
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [router, reduced]);

  return null;
}
