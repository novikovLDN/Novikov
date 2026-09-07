"use client";

import Link from "next/link";
import { useRef } from "react";
import KineticHeadline from "./KineticHeadline";
import AsciiWall from "./AsciiWall";
import { gsap, useGSAP, usePrefersReducedMotion } from "./motion";
import { TRIAL_DAYS } from "@/lib/brand-facts";
import { PLANS, formatRub } from "@/lib/plans";
import { typo } from "@/lib/typo";
import ScatterSkulls from "./ScatterSkulls";

/**
 * ФИНАЛ — последний кадр во весь экран.
 *
 * Корпус возвращается в чернила: страница началась закрытой,
 * открылась в середине и закрывается снова — но теперь читатель уже
 * по эту сторону.
 *
 * Магнитная кнопка — ровно одна на весь сайт. Приём заметный, и если
 * его повторить трижды, он перестаёт означать «здесь главное
 * действие».
 */
export default function OutroScene() {
  const root = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      const node = root.current;
      if (!node || reduced) return;
      if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

      const btn = node.querySelector<HTMLElement>(".b-magnet");
      if (!btn) return;

      // quickTo вместо gsap.to на каждое движение мыши: одна
      // переиспользуемая анимация вместо десятков новых в секунду.
      const x = gsap.quickTo(btn, "x", { duration: 0.4, ease: "power3.out" });
      const y = gsap.quickTo(btn, "y", { duration: 0.4, ease: "power3.out" });

      const onMove = (e: PointerEvent) => {
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const pull = Math.hypot(dx, dy) < 220 ? 0.32 : 0;
        x(dx * pull);
        y(dy * pull);
      };
      const onLeave = () => { x(0); y(0); };

      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerleave", onLeave, { passive: true });
      return () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerleave", onLeave);
      };
    },
    { scope: root, dependencies: [reduced] },
  );

  return (
    <section ref={root} className="b-outro" aria-labelledby="outro-title">
      {/* Стена из знаков, сквозь которую идёт пробой. Последний кадр
          был самым пустым на странице — теперь он самый плотный. */}
      <AsciiWall rows={16} cols={72} />
      <ScatterSkulls seed={29} count={5} />
      <span className="b-tape b-tape-acid b-outro-tape" aria-hidden>
        доступ_открыт
      </span>
      <div className="b-shell b-outro-inner">
        <KineticHeadline
          text="Проверьте сами"
          as="h2"
          id="outro-title"
          className="b-mega b-outro-title"
          weightScroll={false}
          glitch
        />
        <p className="b-lede b-outro-lede">
          {typo(`${TRIAL_DAYS} дня бесплатно. Без карты и без обещаний, которые нельзя проверить за эти три дня.`)}
        </p>
        <div className="b-outro-actions">
          <span className="b-hud">
            <Link href="/auth" className="b-btn b-btn-acid b-magnet">
              Начать
            </Link>
          </span>
          <Link href="/pricing" className="b-link b-outro-alt">
            от {formatRub(PLANS.basic[1])} ₽ в месяц
          </Link>
        </div>
      </div>
    </section>
  );
}
