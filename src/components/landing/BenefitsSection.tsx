import Link from "next/link";
import Icon, { type IconName } from "./Icon";

/**
 * Блок 3 — «Что вы получаете».
 *
 * Было: три одинаковые карточки, повторявшие цифры первого экрана
 * (< 5 мс, SLA, 6 платформ). Читатель дважды подряд получал один и тот
 * же аргумент, а вопрос приватности не закрывался вообще.
 *
 * Стало:
 *   - формулировки сняты с возражений («не проседает», «не отваливается»),
 *     а не с повтора метрик героя;
 *   - добавлена приватность — она подтверждена страницами /privacy и
 *     /security и до сих пор на лендинге отсутствовала;
 *   - форма изменена на редакционный список с волосяными разделителями,
 *     чтобы блок не был третьей подряд сеткой карточек (принцип 3);
 *   - заголовок липнет к экрану на десктопе, пока читаются строки —
 *     это удерживает контекст без повторов.
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
    body: "Политика no-logs: мы не записываем посещённые сайты, DNS-запросы и историю подключений. Хранить нечего — значит нечего и передать.",
    metric: "No-logs",
    icon: "globe",
    href: "/privacy",
  },
  {
    title: "Не требует настройки",
    body: "Почта, код из письма, QR-код в приложении — и дальше соединение поднимается само на каждом устройстве.",
    metric: "1 минута",
    icon: "clock",
  },
];

export default function BenefitsSection() {
  return (
    <section className="ls-section" aria-labelledby="benefits-title">
      <div className="ls-shell grid lg:grid-cols-12 gap-12 lg:gap-16">
        <div className="lg:col-span-4 ls-reveal">
          <div className="lg:sticky lg:top-[calc(var(--ls-header-h)+48px)]">
            <p className="ls-eyebrow">Что вы получаете</p>
            <h2 id="benefits-title" className="ls-display-col mt-4">
              Четыре обещания,
              <br />
              которые легко
              <br />
              проверить
            </h2>
            <p className="ls-body mt-6 max-w-[34ch]">
              Каждое из них — не лозунг, а величина, которую можно
              измерить в первый же вечер.
            </p>
          </div>
        </div>

        <ul className="ls-rows ls-stagger lg:col-span-8">
          {BENEFITS.map((b) => (
            <li key={b.title} className="ls-reveal py-8 sm:py-10 first:pt-0">
              <div className="flex items-start gap-5 sm:gap-7">
                <span className="ls-ink-4 ls-row-icon shrink-0 mt-1" aria-hidden>
                  <Icon name={b.icon} size={24} />
                </span>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <h3 className="ls-h3">{b.title}</h3>
                    <span className="ls-num ls-ink-4 text-[12px] font-medium tracking-[0.08em] uppercase">
                      {b.metric}
                    </span>
                  </div>

                  <p className="ls-body mt-3">{b.body}</p>

                  {b.href && (
                    <Link
                      href={b.href}
                      className="ls-tap group mt-2 gap-1.5 text-[13px] font-medium underline-offset-4 hover:underline"
                    >
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
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
