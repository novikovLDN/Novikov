"use client";

import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: -100, y: -100 });
  const circle = useRef({ x: -100, y: -100 });
  const visible = useRef(false);
  const hovering = useRef(false);
  const raf = useRef<number>(0);

  useEffect(() => {
    // Only on desktop (no touch)
    if (typeof window === "undefined") return;
    if ("ontouchstart" in window || navigator.maxTouchPoints > 0) return;

    const dot = dotRef.current;
    const ring = circleRef.current;
    if (!dot || !ring) return;

    dot.style.opacity = "1";
    ring.style.opacity = "1";

    const onMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      if (!visible.current) {
        visible.current = true;
        dot.style.opacity = "1";
        ring.style.opacity = "1";
      }
      // Dot follows instantly
      dot.style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 4}px)`;
    };

    const onMouseLeave = () => {
      visible.current = false;
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    };

    const onMouseDown = () => {
      ring.style.transform = `translate(${circle.current.x - 20}px, ${circle.current.y - 20}px) scale(0.75)`;
    };

    const onMouseUp = () => {
      ring.style.transform = `translate(${circle.current.x - 20}px, ${circle.current.y - 20}px) scale(1)`;
    };

    // Detect hover on interactive elements
    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("a, button, [role='button'], input, textarea, select, [data-cursor-hover]")) {
        hovering.current = true;
        ring.classList.add("cursor-hover");
      }
    };

    const onMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("a, button, [role='button'], input, textarea, select, [data-cursor-hover]")) {
        hovering.current = false;
        ring.classList.remove("cursor-hover");
      }
    };

    // Animate circle with lerp (smooth follow)
    const animate = () => {
      const speed = 0.15;
      circle.current.x += (mouse.current.x - circle.current.x) * speed;
      circle.current.y += (mouse.current.y - circle.current.y) * speed;

      const scale = hovering.current ? 1.5 : 1;
      ring.style.transform = `translate(${circle.current.x - 20}px, ${circle.current.y - 20}px) scale(${scale})`;

      raf.current = requestAnimationFrame(animate);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mouseover", onMouseOver);
    document.addEventListener("mouseout", onMouseOut);

    raf.current = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseover", onMouseOver);
      document.removeEventListener("mouseout", onMouseOut);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <>
      {/* Small dot — follows cursor instantly */}
      <div
        ref={dotRef}
        className="custom-cursor-dot"
        style={{ opacity: 0 }}
      />
      {/* Circle — follows with smooth delay */}
      <div
        ref={circleRef}
        className="custom-cursor-circle"
        style={{ opacity: 0 }}
      />
    </>
  );
}
