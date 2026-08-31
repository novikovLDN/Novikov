import Link from "next/link";
import Icon, { type IconName } from "./Icon";
import SectionHeading from "./SectionHeading";
import { AnimatedNumber } from "./motion";

/**
 * Преимущества.
 *
 * Было: четыре равные карточки в сетке 2×2. Равный вес означает, что
 * ни один аргумент не главный, и читатель проходит блок по диагонали.
 *
 * Стало: асимметричное bento. Ведущая ячейка вдвое крупнее и несёт
 * главный аргумент вместе с его числом; три поддерживающие идут
 * колонкой рядом. Порядок чтения задан размером, а не только позицией.
 *
 * Формулировки сняты с возражений («не проседает», «не отваливается»),
 * а не с повтора цифр первого экрана: иначе посетитель дважды подряд
 * получает один и тот же аргумент.
 *
 * Приватность закрыта отдельным пунктом — заявление подтверждено
 * страницами /privacy и /security.
 */
interface Benefit {
  title: string;
  body: string;
  icon: IconName;
  href?: string;
}

const LEAD = {
  title: "Не проседает под нагрузкой",
  body:
    "Магистральная маршрутизация до 200 Гбит/с в каждой локации. Вечерний час пик, торренты соседей по каналу и вечерний стрим не превращаются в фризы посреди катки.",
  value: 200,
  suffix: " Гбит/с",
  label: "пропускная способность",
  icon: "bolt" as IconName,
};

const REST: Benefit[] = [
  {
    title: "Не отваливается",
    body: "Резервные каналы и запас по мощности держат соединение, когда падает отдельный сервер.",
    icon: "shield",
  },
  {
    title: "Не хранит историю",
    body: "Ни посещённых сайтов, ни DNS-запросов, ни истории подключений. Хранить нечего — значит нечего и передать.",
    icon: "globe",
    href: "/privacy",
  },
  {
    title: "Не требует настройки",
    body: "Почта, код из письма, QR-код в приложении — дальше соединение поднимается само.",
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
          index="02"
        />

        <div className="px-bento px-stagger">
          <article className="px-card px-bento-lead px-reveal p-7 sm:p-9 lg:p-10 flex flex-col">
            <span className="px-benefit-icon" aria-hidden>
              <Icon name={LEAD.icon} size={22} />
            </span>

            <h3 className="px-h3 mt-8">{LEAD.title}</h3>
            <p className="px-body mt-4 flex-1">{LEAD.body}</p>

            <div className="mt-8 pt-7 border-t border-[color:var(--px-line)]">
              <p className="px-rail-metric-label">{LEAD.label}</p>
              <p className="px-num mt-2 font-bold text-[clamp(34px,5vw,52px)] leading-none tracking-[-0.04em]">
                <AnimatedNumber value={LEAD.value} suffix={LEAD.suffix} />
              </p>
            </div>
          </article>

          {REST.map((b) => (
            <article key={b.title} className="px-card px-reveal p-6 sm:p-7 flex flex-col">
              <div className="flex items-start gap-4">
                <span className="px-benefit-icon shrink-0" aria-hidden>
                  <Icon name={b.icon} size={20} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[17px] sm:text-[18px] font-bold tracking-[-0.02em] leading-tight">
                    {b.title}
                  </h3>
                  <p className="px-body mt-2">{b.body}</p>
                  {b.href && (
                    <Link href={b.href} className="px-link group mt-2">
                      Политика конфиденциальности
                      <Icon
                        name="arrow-right"
                        size={13}
                        className="transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                      />
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
