"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP, usePrefersReducedMotion } from "./motion";
import { TRIAL_DAYS } from "@/lib/brand-facts";
import { DEVICE_LIMIT } from "@/lib/plans";
import ScrambleLabel from "./ScrambleLabel";
import Terminal, { type TerminalLine } from "./Terminal";
import { useEnterGlitch } from "./useEnterGlitch";
import { typo } from "@/lib/typo";

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
 *
 * ЧТО ПОКАЗЫВАЕТ, ЧТО ПРОКРУТКА ИДЁТ. Кадр здесь стоит на месте, и
 * без обратной связи это читается как зависшая страница: человек
 * крутит, а картинка та же. Раньше единственным признаком движения
 * была смена цвета активного шага — событие дискретное, три раза за
 * всю сцену.
 *
 * Теперь прогресс отдаётся в CSS двумя переменными и рисуется
 * правилами: `--how-p` — доля пройденной сцены (полоса под
 * заголовком), `--how-sp` — доля внутри текущего шага (тонкая линия
 * под активной строкой, она наполняется непрерывно). Активный шаг при
 * этом крупнее соседних: масштаб — `transform`, поэтому список не
 * перевёрстывается и кадр не дёргается.
 *
 * Переменные пишутся прямо в стиль узла из колбэка ScrollTrigger, а
 * не через состояние React: перерисовывать дерево на каждый кадр
 * прокрутки ради двух чисел — самый дорогой способ их доставить.
 * setActive остаётся, но срабатывает трижды за сцену, на смене шага.
 */
/** Машинный взгляд на тот же шаг. Числа — из кода, а не из головы. */
const TERM: TerminalLine[][] = [
  [
    { kind: "cmd", text: "atlas signup --email" },
    { kind: "out", text: "код отправлен · срок 10 минут" },
    { kind: "out", text: "вход выполнен за 30 секунд" },
  ],
  [
    { kind: "cmd", text: "atlas key --show" },
    { kind: "out", text: "ключ и QR-код готовы" },
    { kind: "out", text: `устройств в подписке: ${DEVICE_LIMIT}` },
  ],
  [
    { kind: "cmd", text: "atlas up" },
    { kind: "out", text: "соединение поднято" },
    { kind: "out", text: `пробный доступ: ${TRIAL_DAYS} дня` },
  ],
];

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
  const glitchRef = useEnterGlitch<HTMLElement>();
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      const node = root.current;
      if (!node || reduced) return;

      // Класс ставит сам скрипт: масштаб и полосы прогресса имеют
      // смысл только когда есть кому их двигать. Без скрипта и при
      // пониженной анимации сцена остаётся обычным списком.
      node.classList.add("b-how-scrub");

      const st = gsap.timeline({
        scrollTrigger: {
          trigger: node,
          start: "top top",
          end: "+=" + window.innerHeight * 1.5 * STEPS.length,
          pin: ".b-how-stick",
          scrub: 1.1,
          onUpdate: (self) => {
            const p = self.progress;
            const raw = p * STEPS.length;
            const i = Math.min(STEPS.length - 1, Math.floor(raw));
            node.style.setProperty("--how-p", String(p));
            node.style.setProperty("--how-sp", String(Math.min(1, raw - i)));
            setActive(i);
          },
        },
      });

      return () => {
        st.scrollTrigger?.kill();
        st.kill();
        node.classList.remove("b-how-scrub");
        node.style.removeProperty("--how-p");
        node.style.removeProperty("--how-sp");
      };
    },
    { scope: root, dependencies: [reduced] },
  );

  return (
    <section
      ref={(n) => {
        root.current = n;
        glitchRef.current = n;
      }}
      id="how"
      className="b-section b-paper b-live b-how" aria-labelledby="how-title">
      <div className="b-how-stick">
        <div className="b-shell b-how-inner">
          <header className="b-how-head b-enter">
            <ScrambleLabel text="Как это работает" />
            {/* Ручного переноса нет: в узкой колонке он складывался с
                естественным и давал пять строк. Строки выравнивает
                браузер (text-wrap: balance у .b-lg-заголовков колонки). */}
            <h2 id="how-title" className="b-lg b-glitch" data-text="ТРИ ШАГА, И НИ ОДНОГО ЛИШНЕГО">
              {typo("Три шага, и ни одного лишнего")}
            </h2>
            {/* Машинный взгляд на активный шаг. Содержательное
                объяснение остаётся абзацем справа: терминал ничего не
                заменяет, он показывает то же самое со стороны
                системы. */}
            <Terminal lines={TERM[active]} step={active} />
            {/* Полоса прочтения сцены. Это не декор: пока кадр стоит,
                она единственная отвечает на вопрос «я вообще куда-то
                двигаюсь». Из дерева доступности убрана — то же самое
                уже сказано словами: aria-current на активном шаге. */}
            <div className="b-how-rail" aria-hidden>
              <span className="b-how-rail-fill" />
            </div>
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
                  <h3 className="b-md b-how-t">{typo(s.t)}</h3>
                  <p className="b-body b-how-d">{typo(s.d)}</p>
                </div>
                <span className="b-how-m">
                  <span className="b-num b-how-m-value">{s.m}</span>
                  <span className="b-label">{s.mLabel}</span>
                </span>
                {/* Наполняется всё время, пока читатель проходит свой
                    шаг: непрерывное движение там, где кадр стоит. */}
                <span className="b-how-tick" aria-hidden />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
