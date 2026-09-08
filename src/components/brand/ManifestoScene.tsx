"use client";

import { useRef } from "react";
import { gsap, useGSAP, usePrefersReducedMotion } from "./motion";
import ScatterSkulls from "./ScatterSkulls";

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
 * ТЕКСТ. Три такта: что человек видит → в чём он не виноват → что
 * с этим сделать. Прежняя редакция шла через метафору («половина
 * интернета за стеной», «стену поставили не вы», «разбирать её вам
 * не нужно»): образ приходилось расшифровывать, а на последней
 * строке — в самой сильной точке сцены, где корпус переворачивается
 * из чернил в бумагу, — не было сказано ни что делать, ни как
 * называется продукт. Сцена заканчивалась отрицанием.
 *
 * Теперь первая строка называет наблюдаемый факт словами читателя,
 * вторая снимает подозрение с его оборудования и провайдера, а
 * третья совпадает с переворотом корпуса и даёт действие: «Включите
 * Atlas — и они откроются». Терминов по-прежнему нет ни одного.
 *
 * При prefers-reduced-motion сцена не прикрепляется и не сменяет
 * строки: три утверждения стоят одно под другим и читаются подряд.
 */
const LINES = [
  "Сайты и приложения перестали открываться",
  "Ваш интернет тут ни при чём",
  "Включите Atlas — и они откроются",
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
          scrub: 1.25,
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
      <ScatterSkulls seed={7} count={3} />
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
