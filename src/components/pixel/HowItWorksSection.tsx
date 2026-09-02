import SectionHeading from "./SectionHeading";
import StickyScene, { type SceneStep } from "./StickyScene";

/**
 * Как это работает.
 *
 * Три шага показаны залипающей сценой: пока читатель проходит её
 * высоту, экран держит кадр, а шаги сменяются. Механика вынесена в
 * StickyScene и переиспользуется другими секциями — см.
 * SecuritySection.
 */
const STEPS: SceneStep[] = [
  {
    n: "01",
    title: "Регистрация",
    body: "Введите почту — придёт код для входа. Без пароля и анкеты, около 30 секунд.",
    hint: "почта → код из письма → готово",
    icon: "clock",
  },
  {
    n: "02",
    title: "Тариф",
    body: "Первые 3 дня бесплатно. Дальше Basic для повседневного интернета или Plus для игр и стримов.",
    hint: "3 дня бесплатно → Basic или Plus",
    icon: "bolt",
  },
  {
    n: "03",
    title: "Подключение",
    body: "В личном кабинете — QR-код и кнопка «Открыть в Happ». Дальше соединение поднимается само.",
    hint: "QR-код → приложение → соединение",
    icon: "shield",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="px-section px-steps-section" aria-labelledby="how-title">
      <div className="px-shell">
        <SectionHeading
          eyebrow="Как это работает"
          title={["От почты до подключения —", "одна минута"]}
          titleId="how-title"
          index="04"
        />
      </div>

      <StickyScene caption="Как это работает" steps={STEPS} />
    </section>
  );
}
