"use client";

import { useRef } from "react";
import { gsap, useGSAP, usePrefersReducedMotion } from "./motion";

/**
 * МАНИФЕСТ — переворот страницы из чернил в бумагу.
 *
 * Кадр держится, пока читатель проходит высоту сцены, и три строки
 * сменяют друг друга. На последней корпус переворачивается: чернила
 * уходят, приходит бумага. Это единственный переход такого рода на
 * сайте, и он совпадает со смыслом: до — закрыто, после — открыто.
 *
 * Это не перехват прокрутки. Кадр держит ScrollTrigger.pin, колесо и
 * жест работают как обычно, скрипт лишь считает прогресс.
 *
 * ТЕКСТ. Три варианта первой строки, выбран первый:
 *   1. «Половина интернета теперь за стеной» — говорит о читателе, а
 *      не о нас, и не требует ни одного термина.
 *   2. «Интернет разделили на две части» — точнее, но пассивно.
 *   3. «Доступ стал роскошью» — красиво и пусто.
 *
 * При prefers-reduced-motion сцена не прикрепляется и не сменяет
 * строки: три утверждения стоят одно под другим и читаются подряд.
 */
const LINES = [
  "Половина интернета теперь за стеной",
  "Стену поставили не вы",
  "И разбирать её вам не нужно",
];

export default function ManifestoScene() {
  const root = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      const node = root.current;
      if (!node || reduced) return;

      const lines = gsap.utils.toArray<HTMLElement>(".b-manifest-line", node);
      gsap.set(lines, { autoAlpha: 0, yPercent: 40 });
      gsap.set(lines[0], { autoAlpha: 1, yPercent: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: node,
          start: "top top",
          end: "+=" + window.innerHeight * 2.4,
          pin: true,
          scrub: 0.8,
        },
      });

      lines.forEach((line, i) => {
        if (i === 0) return;
        // Входящая строка начинается вместе с уходящей и короче её:
        // при отставании в кадре появлялся момент, когда не видно ни
        // одной строки — экран просто пустел.
        tl.to(lines[i - 1], { autoAlpha: 0, yPercent: -40, duration: 0.55 }, i - 1 + 0.4)
          .to(line, { autoAlpha: 1, yPercent: 0, duration: 0.45 }, "<");
      });

      // Переворот корпуса — на последней строке, не раньше: смысл и
      // цвет обязаны меняться одновременно.
      tl.to(node, { backgroundColor: "var(--paper)", color: "var(--on-paper)", duration: 0.8 }, ">-0.2")
        .add(() => node.classList.add("b-paper"), "<0.4");

      return () => { tl.scrollTrigger?.kill(); tl.kill(); };
    },
    { scope: root, dependencies: [reduced] },
  );

  return (
    <section ref={root} className="b-manifest" aria-labelledby="manifest-title">
      <h2 id="manifest-title" className="b-sr">Зачем это нужно</h2>
      <div className="b-shell b-manifest-stage">
        {LINES.map((line, i) => (
          <p key={line} className="b-manifest-line b-xl" data-i={i}>
            {line}
          </p>
        ))}
      </div>
    </section>
  );
}
