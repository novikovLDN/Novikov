import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/graticule/SiteHeader";
import SiteFooter from "@/components/graticule/SiteFooter";
import {
  SERVERS,
  SERVER_ENTRY_USD,
  SERVER_MAX_GBPS,
  GUARANTEES,
  formatUsd,
} from "@/lib/servers";
import "./vds.css";

/**
 * /vds — выделенные серверы. Первая страница на светлой системе
 * «Гратикул» (фаза 5, шаг 2).
 *
 * ЧТО ИЗМЕНИЛОСЬ ПО СУЩЕСТВУ, А НЕ ПО ОФОРМЛЕНИЮ.
 *
 * 1. Цены переехали в `src/lib/servers.ts`. Раньше они были записаны
 *    прямо в разметке в четырёх местах — при том что цены подписки
 *    живут в `plans.ts` и оттуда же берутся кассой.
 *
 * 2. Линейка строится по ПОЛОСЕ, а не по модели процессора. Разбор
 *    рынка (docs/01_VDS_MARKET.md): 32 ГБ с портом 10 Гбит/с стоят
 *    ≈$190, а 128 ГБ с 32 ядрами, но портом 1 Гбит/с — €560,70.
 *    Вторая машина втрое дороже и для сетевой нагрузки хуже первой.
 *    Прежние четыре карточки различались только процессором.
 *
 * 3. Появился блок «что гарантируем, а что нет» — позиция бренда
 *    «названная граница» (docs/02_BRAND.md), выведенная в интерфейс.
 *    Ни один конкурент такого блока не показывает.
 *
 * 4. Страница стала серверным компонентом. Клиентского кода на ней
 *    не осталось вовсе: ссылки и разметка. Прежняя была `"use client"`
 *    без единого состояния.
 *
 * Конфигуратор и заказ — следующий шаг (ADR-0007); пока действия
 * ведут в переписку с инженером.
 */
export const metadata: Metadata = {
  title: "Выделенные серверы",
  description:
    `Четыре конфигурации от ${formatUsd(SERVER_ENTRY_USD)} в месяц. ` +
    "Полоса порта, память, диски и срок выдачи — числами, до заявки.",
};

export default function VdsPage() {
  return (
    <div className="g g-page">
      <SiteHeader />
      <div className="g-header-space" aria-hidden />

      <main>
        <section className="g-field g-hero">
          <h1>Железо, у которого написано, что именно гарантировано</h1>
          <p className="g-lead">
            Полоса, трафик, срок выдачи и предел — числами, до того как вы
            оставите заявку.
          </p>
          <div className="g-actions">
            <Link href="/contact?topic=vds" className="b-btn b-btn-acid">
              Обсудить конфигурацию
            </Link>
            <Link href="/pricing" className="b-btn b-btn-ghost">
              Тарифы ускорителя
            </Link>
          </div>
        </section>

        <section className="g-field g-axis" aria-labelledby="tiers-title">
          <div className="g-axis-head">
            <h2 id="tiers-title">Четыре ступени по ширине канала</h2>
            <p>
              Для сетевой нагрузки узкое место — не процессор, а порт. Поэтому
              линейка растёт по полосе: от гарантированного гигабита до
              двадцати пяти.
            </p>
          </div>

          <div className="g-tiers">
            {SERVERS.map((s) => (
              <article
                key={s.id}
                className={`g-tier${s.id === "parallel" ? " g-tier-lead" : ""}`}
              >
                <h3 className="g-tier-name">{s.name}</h3>
                <p className="g-tier-role">{s.role}</p>

                {/* Полоса порта: шкала от нуля до верхней точки линейки.
                    Разницу между 1 и 25 Гбит/с глазу видно, числам
                    нужно верить.

                    Шкала линейная, но с нижним порогом видимости в 6%:
                    честные 4% для гигабита превращались в невидимую
                    чёрточку, и ступень читалась как сломанная. Точное
                    число напечатано рядом, поэтому порог не вводит в
                    заблуждение — он не даёт полосе исчезнуть.

                    Parallel и Azimuth стоят на одном порту, и по длине
                    полосы они одинаковы — так и есть. Различает их
                    учёт трафика, и он показан тоном заливки, а не
                    подделанной длиной. */}
                <div className="g-port">
                  <span className="g-port-track" aria-hidden>
                    <span
                      className={`g-port-fill${s.meteredTraffic ? " g-port-fill-metered" : ""}`}
                      style={{
                        width: `${Math.max(6, (s.portGbps / SERVER_MAX_GBPS) * 100)}%`,
                      }}
                    />
                  </span>
                  <span className="g-port-value g-figure">
                    {s.portGbps} Гбит/с
                  </span>
                  <span className="g-port-note">
                    {s.meteredTraffic ? "трафик считается" : "без учёта трафика"}
                  </span>
                </div>

                <dl className="g-spec">
                  <div>
                    <dt>Процессор</dt>
                    <dd>{s.cpu}</dd>
                  </div>
                  <div>
                    <dt>Память</dt>
                    <dd className="g-figure">{s.ramGb} ГБ ECC</dd>
                  </div>
                  <div>
                    <dt>Диски</dt>
                    <dd>{s.disks}</dd>
                  </div>
                  <div>
                    <dt>Защита</dt>
                    <dd>{s.ddos}</dd>
                  </div>
                  <div>
                    <dt>Адреса</dt>
                    <dd>{s.ip}</dd>
                  </div>
                </dl>

                <p className="g-price">
                  <span className="g-price-num g-figure">
                    {s.from ? "от " : ""}
                    {formatUsd(s.usd)}
                  </span>
                  <span className="g-price-per">в месяц</span>
                </p>

                {/* Незакрытые параметры показываются, а не прячутся:
                    это и есть «названная граница». */}
                <p className="g-confirm">Уточняется: {s.confirm.join(", ")}.</p>
              </article>
            ))}
          </div>
        </section>

        <section className="g-field g-guarantee" aria-labelledby="guarantee-title">
          <div className="g-plane g-guarantee-card">
            <h2 id="guarantee-title">Что мы гарантируем, а что нет</h2>
            <div className="g-guarantee-cols">
              <div>
                <h3>Гарантируем</h3>
                <ul className="g-col-yes">
                  {GUARANTEES.yes.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Не гарантируем</h3>
                <ul className="g-col-no">
                  {GUARANTEES.no.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Уточняем</h3>
                <ul className="g-col-ask">
                  {GUARANTEES.confirm.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="g-field g-outro">
          <h2>Расскажите про нагрузку — предложим конфигурацию</h2>
          <p>
            Отвечает инженер, а не отдел продаж. Если подходящей ступени нет,
            так и скажем.
          </p>
          <div className="g-actions">
            <Link href="/contact?topic=vds" className="b-btn b-btn-acid">
              Написать инженеру
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
