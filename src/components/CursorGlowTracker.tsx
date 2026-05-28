"use client";

import { useEffect, useRef } from "react";

/**
 * Attach a pointermove tracker to every .dv2-card on the page so the
 * cursor-glow CSS pseudo-element follows the mouse. Pure passive — uses
 * CSS custom properties (--mx, --my) so layout never changes.
 *
 * Render once at the top of any page (e.g. dashboard). The hook
 * delegates from a single document-level listener so it stays cheap
 * regardless of card count.
 */
export default function CursorGlowTracker() {
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (rafId.current !== null) return;
      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        const target = e.target as HTMLElement | null;
        if (!target) return;
        const card = target.closest<HTMLElement>(".dv2-card");
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const mx = ((e.clientX - rect.left) / rect.width) * 100;
        const my = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty("--mx", `${mx}%`);
        card.style.setProperty("--my", `${my}%`);
      });
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return null;
}
