"use client";

import SectionHeading from "./SectionHeading";
import { useScrollProgress } from "./motion";

/**
 * Блок 4 — «Как это работает».
 *
 * Было: три одинаковые карточки сразу после трёх одинаковых карточек
 * предыдущей секции. Последовательность шагов не читалась формой —
 * только цифрами «01/02/03» в углах.
 *
 * Стало: последовательность с направляющей. Узлы соединены линией
 * (вертикальной на телефоне, горизонтальной на десктопе), поэтому
 * порядок виден до чтения текста. Форма не повторяет ни bento блока 2,
 * ни редакционный список блока 3 — три соседние секции больше не
 * выглядят как одна.
 *
 * Содержание шагов сверено с реальным флоу: код на почту
 * (src/app/api/auth/send-code), тарифы и способы оплаты
 * (src/app/api/payments/create), подключение через Happ
 * (src/app/devices/page.tsx).
 */
const STEPS = [
  {
    n: "01",
    title: "Регистрация",
    body: "Введите почту — придёт код для входа. Без пароля, без анкеты, около 30 секунд.",
  },
  {
    n: "02",
    title: "Тариф",
    body: "Первые 3 дня бесплатно. Дальше Basic для повседневного интернета или Plus для игр и стримов — картой или через СБП.",
  },
  {
    n: "03",
    title: "Подключение",
    body: "В личном кабинете — QR-код и кнопка «Открыть в Happ». Дальше соединение поднимается автоматически на каждом устройстве.",
  },
];

export default function HowItWorksSection() {
  // Прогресс секции вычерчивает линию между узлами по мере прокрутки.
  const railRef = useScrollProgress<HTMLOListElement>();

  return (
    <section className="ls-section" aria-labelledby="how-title">
      <div className="ls-shell">
        <SectionHeading
          eyebrow="Как это работает"
          title={["От почты до подключения —", "одна минута"]}
          titleId="how-title"
        />

        <ol ref={railRef} className="ls-steps ls-stagger">
          {STEPS.map((s) => (
            <li key={s.n} className="ls-step ls-reveal">
              <span className="ls-step-node ls-num" aria-hidden>
                {s.n}
              </span>
              <h3 className="ls-h3">
                <span className="sr-only">Шаг {s.n}. </span>
                {s.title}
              </h3>
              <p className="ls-body mt-3">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
