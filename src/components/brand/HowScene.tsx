"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP, usePrefersReducedMotion } from "./motion";
import { TRIAL_DAYS } from "@/lib/brand-facts";
import { DEVICE_LIMIT } from "@/lib/plans";
import ScrambleLabel from "./ScrambleLabel";

/**
 * КАК ЭТО РАБОТАЕТ — залипающая сцена из трёх шагов.
 *
 * Слева нумерованный столбец, справа кадр, который держится на месте,
 * пока читатель проходит высоту сцены. Номера здесь не украшение:
 * это настоящая последовательность, и порядок несёт информацию,
 * которая читателю нужна.
 *
 * Скорость задаётся высотой сцены, а не таймером: полтора экрана на
 * шаг. При одном экране шаг проскакивает раньше, чем строка дочитана.
 */
const STEPS = [
  {
    n: "01",
    t: "Почта и код",
    d: "Ни имени, ни телефона, ни карты. Вводите адрес, получаете шестизначный код, входите. Тридцать секунд.",
    m: "30 сек",
    mLabel: "на регистрацию",
  },
  {
    n: "02",
    t: "Ключ и приложение",
    d: `Кабинет выдаёт ключ и QR-код. Приложение бесплатное и есть на всех платформах — до ${DEVICE_LIMIT} устройств на одной подписке.`,
    m: String(DEVICE_LIMIT),
    mLabel: "устройств",
  },
  {
    n: "03",
    t: "Включили — работает",
    d: `Дальше соединение поднимается само при запуске. ${TRIAL_DAYS} дня бесплатно, потом обычная подписка. Отмена в один клик.`,
    m: `${TRIAL_DAYS} дня`,
    mLabel: "бесплатно",
  },
];

export default function HowScene() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      const node = root.current;
      if (!node || reduced) return;

      const st = gsap.timeline({
        scrollTrigger: {
          trigger: node,
          start: "top top",
          end: "+=" + window.innerHeight * 1.5 * STEPS.length,
          pin: ".b-how-stick",
          scrub: true,
          onUpdate: (self) => {
            const i = Math.min(STEPS.length - 1, Math.floor(self.progress * STEPS.length));
            setActive(i);
          },
        },
      });

      return () => { st.scrollTrigger?.kill(); st.kill(); };
    },
    { scope: root, dependencies: [reduced] },
  );

  return (
    <section ref={root} id="how" className="b-section b-paper b-how" aria-labelledby="how-title">
      <div className="b-how-stick">
        <div className="b-shell b-how-inner">
          <header className="b-how-head b-enter">
            <ScrambleLabel text="Как это работает" />
            <h2 id="how-title" className="b-lg">
              Три шага, <br />и ни одного лишнего
            </h2>
          </header>

          <ol className="b-how-list">
            {STEPS.map((s, i) => (
              <li
                key={s.n}
                className={`b-how-item${i === active ? " b-how-item-on" : ""}`}
                aria-current={i === active ? "step" : undefined}
              >
                <span className="b-how-n b-num">{s.n}</span>
                <div>
                  <h3 className="b-md b-how-t">{s.t}</h3>
                  <p className="b-body b-how-d">{s.d}</p>
                </div>
                <span className="b-how-m">
                  <span className="b-num b-how-m-value">{s.m}</span>
                  <span className="b-label">{s.mLabel}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
