"use client";

import Link from "next/link";
import SiteHeader from "@/components/pixel/SiteHeader";
import SiteFooter from "@/components/pixel/SiteFooter";
import PageHero from "@/components/pixel/PageHero";
import SectionHeading from "@/components/pixel/SectionHeading";
import Icon from "@/components/pixel/Icon";
import BusinessRequestForm from "./BusinessRequestForm";
import { useReveal } from "@/components/pixel/motion";
import { DEVICE_LIMIT } from "@/lib/plans";
import { CITY_COUNT, COUNTRY_COUNT, plural } from "@/lib/locations";

/**
 * /business — тело страницы для компаний.
 *
 * Порядок разговора обратный частному: компания сначала узнаёт себя
 * в задаче, потом смотрит, что входит, и только потом оставляет
 * заявку. Цен на странице нет — корпоративный расчёт зависит от
 * числа мест и состава, и обещать сумму до разговора нельзя.
 *
 * Финального призыва SiteOutro здесь нет намеренно: форма и есть
 * конечное действие страницы, и второй призыв под ней уводил бы
 * заполнившего человека мимо цели.
 */
const CASES = [
  {
    icon: "globe" as const,
    title: "Сотрудники работают откуда угодно",
    body:
      "Дом, коворкинг, гостиница, чужой Wi-Fi в аэропорту. Соединение одинаковое везде, и рабочие сервисы открываются так же, как в офисе.",
  },
  {
    icon: "bolt" as const,
    title: "Созвоны рассыпаются",
    body:
      "Видео замирает, звук отстаёт, демонстрацию экрана видно через раз. Широкий канал снимает вопрос до того, как встреча превратится в переписку.",
  },
  {
    icon: "shield" as const,
    title: "Данные ходят по открытым сетям",
    body:
      "Публичные точки доступа не защищают трафик. Мы не храним ни истории подключений, ни DNS-запросов — хранить нечего, значит нечего и передать.",
  },
  {
    icon: "clock" as const,
    title: "Нужны машины под задачу",
    body:
      "Тестовый стенд, база данных, сборка. Виртуальный сервер поднимается примерно за минуту, выделенный — с железом, которое не делится ни с кем.",
  },
];

/** Что входит в корпоративное подключение. Числа берутся из кода:
 *  число устройств — src/lib/plans.ts, страны и города —
 *  src/lib/locations.ts. */
const INCLUDED: Array<{ term: string; detail: string }> = [
  {
    term: "Договор и закрывающие документы",
    detail:
      "Работаем с юридическим лицом по безналичному расчёту. Акты и счета-фактуры — в обычном порядке, без карт сотрудников и авансовых отчётов.",
  },
  {
    term: "Единый счёт за всю команду",
    detail:
      "Подключения живут в общем аккаунте компании. Одна оплата вместо десятка личных подписок, которые бухгалтерия не может принять к учёту.",
  },
  {
    term: "Управление доступами",
    detail:
      "Администратор компании выдаёт и отзывает доступ сам. Сотрудник ушёл — доступ снимается в тот же день вместе со всеми его устройствами.",
  },
  {
    term: `До ${DEVICE_LIMIT} устройств на человека`,
    detail:
      "Ноутбук, телефон, планшет, рабочая станция — одно место закрывает все устройства сотрудника, доплачивать за каждое не нужно.",
  },
  {
    // Число и его форма считаются вместе: «22 городов» — то, что
    // получается, если склонение зашить руками под текущее значение.
    term: `${COUNTRY_COUNT} ${plural(COUNTRY_COUNT, ["страна", "страны", "стран"])} и ${CITY_COUNT} ${plural(CITY_COUNT, ["город", "города", "городов"])} на выбор`,
    detail:
      "Точку подключения выбирает сотрудник или назначает администратор — в зависимости от того, к каким сервисам команде нужен доступ.",
  },
  {
    term: "Поддержка вне общей очереди",
    detail:
      "Отдельный канал связи для компаний и приоритет в обработке обращений. Заявка сотрудника не ждёт в общем потоке.",
  },
];

export default function BusinessView() {
  useReveal();

  return (
    <div className="px-page">
      <div className="px-grid-bg" aria-hidden />
      <SiteHeader />

      <main>
        <PageHero
          eyebrow="Для бизнеса"
          title={["Интернет и серверы", "для команды"]}
          lede="Подключения сотрудников и машины под задачи — по договору, на одном счёте и с понятным, кто за что отвечает. Расскажите про команду: вернёмся с расчётом в течение четырёх рабочих часов."
        >
          <div className="flex flex-wrap gap-3">
            <a href="#request" className="px-btn px-btn-md px-btn-primary group">
              Оставить заявку
              <Icon
                name="arrow-right"
                size={16}
                className="transition-transform duration-200 ease-out group-hover:translate-x-1"
              />
            </a>
            {/* Адрес продаж совпадает с /contact и блоком «Компаниям»
                на главной. При смене менять во всех трёх местах. */}
            <a href="mailto:sales@atlas.secure" className="px-btn px-btn-md px-btn-secondary">
              sales@atlas.secure
            </a>
          </div>
        </PageHero>

        {/* ─── Задачи ─────────────────────────────────────────────── */}
        <section className="px-section px-section-after-hero" aria-labelledby="cases-title">
          <div className="px-shell">
            <SectionHeading
              eyebrow="Задачи"
              title={["С чем к нам", "приходят команды"]}
              titleId="cases-title"
              index="01"
            />

            <div className="px-stagger grid sm:grid-cols-2 gap-4">
              {CASES.map((c) => (
                <article key={c.title} className="px-card px-spot px-reveal p-6 sm:p-8">
                  <span className="px-benefit-icon" aria-hidden>
                    <Icon name={c.icon} size={20} />
                  </span>
                  <h3 className="px-h3 mt-6">{c.title}</h3>
                  <p className="px-body mt-3">{c.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Что входит ─────────────────────────────────────────── */}
        <section className="px-section" aria-labelledby="included-title">
          <div className="px-shell">
            <SectionHeading
              eyebrow="Состав"
              title={["Что входит", "в корпоративный доступ"]}
              titleId="included-title"
              index="02"
            />

            <dl className="px-included px-stagger">
              {INCLUDED.map((i) => (
                <div key={i.term} className="px-included-row px-reveal">
                  <dt className="px-included-term">
                    <span className="px-included-mark" aria-hidden>
                      <Icon name="check" size={13} />
                    </span>
                    {i.term}
                  </dt>
                  <dd className="px-body px-included-detail">{i.detail}</dd>
                </div>
              ))}
            </dl>

            <p className="px-caption mt-8">
              Нужны виртуальные или выделенные машины —{" "}
              <Link href="/vps" className="px-link-inline">параметры VPS</Link> и{" "}
              <Link href="/vds" className="px-link-inline">параметры VDS</Link> опубликованы
              отдельно. В заявке можно указать и то, и другое.
            </p>
          </div>
        </section>

        {/* ─── Заявка ─────────────────────────────────────────────── */}
        <section className="px-section" id="request" aria-labelledby="request-title">
          <div className="px-shell">
            <SectionHeading
              eyebrow="Заявка"
              title={["Расскажите", "про команду"]}
              titleId="request-title"
              index="03"
            />
            <BusinessRequestForm />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
