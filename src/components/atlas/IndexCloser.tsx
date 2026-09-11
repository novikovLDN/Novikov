"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Закрывает меню шапки на телефоне (`<details class="a-index">`).
 *
 * Сам `<details>` раскрывается без скрипта; скрипт добавляет то, чего
 * у него нет (разбор 11.09.2026, «меню отображается не совсем
 * корректно»): закрытие по Esc (фокус возвращается на кнопку), по
 * нажатию на пункт — в том числе на пункт текущей страницы, после
 * которого переход не случается, — по нажатию вне панели и при смене
 * адреса. Заодно отмечает пункт текущей страницы `aria-current`.
 */
export default function IndexCloser() {
  const path = usePathname();

  useEffect(() => {
    const menu = document.querySelector<HTMLDetailsElement>(".a-index");
    if (!menu) return;
    menu.open = false;

    menu.querySelectorAll<HTMLAnchorElement>(".a-index-panel li a").forEach((a) => {
      if (a.getAttribute("href") === path) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });

    const close = (focus: boolean) => {
      if (!menu.open) return;
      menu.open = false;
      if (focus) menu.querySelector("summary")?.focus();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true);
    };
    const onClick = (e: MouseEvent) => {
      if (!menu.open) return;
      const t = e.target as Element | null;
      if (!t) return;
      if (t.closest(".a-index-panel a")) close(false);
      else if (!menu.contains(t)) close(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [path]);

  return null;
}
