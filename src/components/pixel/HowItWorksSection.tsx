import SectionHeading from "./SectionHeading";

/**
 * Как это работает.
 *
 * Последовательность с направляющей: узлы соединены линией, поэтому
 * порядок читается формой, а не только цифрами. Узел нарисован как
 * кубик — тот же фирменный мотив, что в герое.
 *
 * Содержание сверено с реальным флоу: код на почту
 * (src/app/api/auth/send-code), тарифы и оплата
 * (src/app/api/payments/create), подключение через Happ
 * (src/app/devices/page.tsx).
 */
const STEPS = [
  {
    n: "01",
    title: "Регистрация",
    body: "Введите почту — придёт код для входа. Без пароля и анкеты, около 30 секунд.",
  },
  {
    n: "02",
    title: "Тариф",
    body: "Первые 3 дня бесплатно. Дальше Basic для повседневного интернета или Plus для игр и стримов.",
  },
  {
    n: "03",
    title: "Подключение",
    body: "В личном кабинете — QR-код и кнопка «Открыть в Happ». Дальше соединение поднимается само.",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="px-section" aria-labelledby="how-title">
      <div className="px-shell">
        <SectionHeading
          eyebrow="Как это работает"
          title={["От почты до подключения —", "одна минута"]}
          titleId="how-title"
          index="04"
        />

        <ol className="px-steps px-stagger">
          {STEPS.map((s) => (
            <li key={s.n} className="px-step px-reveal">
              <span className="px-step-node px-num" aria-hidden>{s.n}</span>
              <h3 className="px-h3">
                <span className="sr-only">Шаг {s.n}. </span>
                {s.title}
              </h3>
              <p className="px-body mt-3">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
