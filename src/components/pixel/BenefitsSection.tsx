import Link from "next/link";
import Icon, { type IconName } from "./Icon";
import SectionHeading from "./SectionHeading";
import { MiniCubes } from "./CubeCluster";

/**
 * Преимущества.
 *
 * Формулировки сняты с возражений («не проседает», «не отваливается»),
 * а не с повтора метрик первого экрана: иначе посетитель дважды подряд
 * получает один и тот же аргумент.
 *
 * Приватность закрыта отдельным пунктом — заявление подтверждено
 * страницами /privacy и /security.
 *
 * Язык публичный: ускорение и стабильность, без названий туннельных
 * протоколов.
 */
interface Benefit {
  title: string;
  body: string;
  metric: string;
  icon: IconName;
  href?: string;
}

const BENEFITS: Benefit[] = [
  {
    title: "Не проседает под нагрузкой",
    body: "Магистральная маршрутизация до 200 Гбит/с. Вечерний час пик и торренты соседей по каналу не превращаются в фризы посреди катки.",
    metric: "200 Гбит/с",
    icon: "bolt",
  },
  {
    title: "Не отваливается",
    body: "Резервные каналы и запас по мощности держат соединение, когда падает отдельный сервер. Целевая доступность — 99,98%.",
    metric: "99,98 % аптайм",
    icon: "shield",
  },
  {
    title: "Не хранит историю",
    body: "Политика no-logs: посещённые сайты, DNS-запросы и история подключений не записываются. Хранить нечего — значит нечего и передать.",
    metric: "No-logs",
    icon: "globe",
    href: "/privacy",
  },
  {
    title: "Не требует настройки",
    body: "Почта, код из письма, QR-код в приложении — дальше соединение поднимается само на каждом устройстве.",
    metric: "1 минута",
    icon: "clock",
  },
];

export default function BenefitsSection() {
  return (
    <section className="px-section" aria-labelledby="benefits-title">
      <div className="px-shell">
        <SectionHeading
          eyebrow="Что вы получаете"
          title={["Четыре обещания,", "которые легко проверить"]}
          titleId="benefits-title"
        />

        <div className="px-stagger grid sm:grid-cols-2 gap-4">
          {BENEFITS.map((b) => (
            <article key={b.title} className="px-card px-reveal p-6 sm:p-8 flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <span className="px-benefit-icon" aria-hidden>
                  <Icon name={b.icon} size={22} />
                </span>
                <span className="px-eyebrow px-num">{b.metric}</span>
              </div>

              <h3 className="px-h3 mt-7">{b.title}</h3>
              <p className="px-body mt-3 flex-1">{b.body}</p>

              {b.href && (
                <Link
                  href={b.href}
                  className="px-link group mt-5"
                >
                  Политика конфиденциальности
                  <Icon
                    name="arrow-right"
                    size={13}
                    className="transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                  />
                </Link>
              )}
            </article>
          ))}
        </div>

        <p className="px-caption px-reveal mt-8 flex items-center gap-3">
          <MiniCubes />
          Каждое обещание — величина, которую можно измерить в первый же вечер.
        </p>
      </div>
    </section>
  );
}
