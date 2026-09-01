"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./motion";
import Icon, { type IconName } from "./Icon";
import SectionHeading from "./SectionHeading";

/**
 * Как это работает — горизонтальный степпер (disclosure-паттерн).
 *
 * Заменяет прежнюю sticky-сцену: та закрепляла блок во вьюпорте на
 * время прокрутки собственной высокой полосы (2 экрана высоты для трёх
 * шагов) и создавала долгую неподвижную зону при обычной прокрутке
 * колесом мыши или трекпадом — тем более непредсказуемую, что высота
 * сцены завязана на `100vh`, а `vh` пересчитывается по-разному в
 * разных браузерах при появлении/скрытии панелей адресной строки.
 *
 * Здесь высота ряда постоянна независимо от контента и вьюпорта:
 * переключение — по клику или фокусу заголовка, а не по позиции
 * скролла. Разметка — обычный disclosure (кнопка-заголовок раскрывает
 * соседнюю панель), а не ARIA tabs: помещать role="tabpanel" внутрь
 * role="tab" было бы невалидной вложенностью.
 *
 * При первом появлении в кадре шаги проигрываются сами — раз, по
 * порядку, с паузой в полторы секунды. Это показывает, что блок
 * интерактивен, и заодно проговаривает сценарий целиком тому, кто
 * просто прокручивает страницу. Любое действие пользователя
 * (наведение, клик, фокус) немедленно останавливает показ: дальше
 * блоком управляет он, а не таймер. Скролл при этом не
 * перехватывается — от sticky-сцены здесь отказались осознанно.
 */
const STEPS: Array<{ n: string; title: string; body: string; icon: IconName }> = [
  {
    n: "01",
    title: "Регистрация",
    body: "Введите почту — придёт код для входа. Без пароля и анкеты, около 30 секунд.",
    icon: "clock",
  },
  {
    n: "02",
    title: "Тариф",
    body: "Первые 3 дня бесплатно. Дальше Basic для повседневного интернета или Plus для игр и стримов.",
    icon: "bolt",
  },
  {
    n: "03",
    title: "Подключение",
    body: "В личном кабинете — QR-код и кнопка «Открыть в Happ». Дальше соединение поднимается само.",
    icon: "shield",
  },
];

export default function HowItWorksSection() {
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stopped = useRef(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || reduced) return;

    let timer: ReturnType<typeof setInterval> | null = null;
    const stop = () => {
      stopped.current = true;
      if (timer) { clearInterval(timer); timer = null; }
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || stopped.current || timer) return;
        io.disconnect();
        let i = 0;
        timer = setInterval(() => {
          i += 1;
          if (i >= STEPS.length) { stop(); return; }
          setActive(i);
        }, 1500);
      },
      { threshold: 0.5 }
    );
    io.observe(el);

    el.addEventListener("pointerdown", stop);
    el.addEventListener("pointerenter", stop);
    el.addEventListener("focusin", stop);

    return () => {
      io.disconnect();
      if (timer) clearInterval(timer);
      el.removeEventListener("pointerdown", stop);
      el.removeEventListener("pointerenter", stop);
      el.removeEventListener("focusin", stop);
    };
  }, [reduced]);

  return (
    <section className="px-section" aria-labelledby="how-title">
      <div className="px-shell">
        <SectionHeading
          eyebrow="Как это работает"
          title={["От почты до подключения —", "одна минута"]}
          titleId="how-title"
          index="04"
        />

        <div ref={wrapRef} className="px-stepper px-reveal">
          {STEPS.map((s, i) => {
            const isActive = i === active;
            const panelId = `step-panel-${s.n}`;
            const buttonId = `step-trigger-${s.n}`;
            return (
              <div key={s.n} className={`px-step-panel${isActive ? " px-step-panel-active" : ""}`}>
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={isActive}
                  aria-controls={panelId}
                  onClick={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  className="px-step-trigger"
                >
                  <span className="px-step-num px-num">{s.n}</span>
                  <span className="px-step-title">{s.title}</span>
                </button>

                <div id={panelId} role="region" aria-labelledby={buttonId} className="px-step-body">
                  <div>
                    <span className="px-benefit-icon mt-5" aria-hidden>
                      <Icon name={s.icon} size={20} />
                    </span>
                    <p className="px-body mt-4 max-w-[42ch]">{s.body}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
