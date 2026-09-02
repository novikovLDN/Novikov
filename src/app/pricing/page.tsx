"use client";

import Link from "next/link";
import { useState } from "react";
import SiteHeader from "@/components/pixel/SiteHeader";
import PageHero from "@/components/pixel/PageHero";
import PeriodSelector from "@/components/pixel/PeriodSelector";
import PlanCard from "@/components/pixel/PlanCard";
import SectionHeading from "@/components/pixel/SectionHeading";
import Faq, { type FaqItem } from "@/components/pixel/Faq";
import SiteOutro from "@/components/pixel/SiteOutro";
import Icon from "@/components/pixel/Icon";
import { useReveal } from "@/components/pixel/motion";
import { DEVICE_LIMIT, PERIODS, PLAN_CONTENT, type Period } from "@/lib/plans";

/**
 * /pricing — тарифы ускорителя.
 *
 * VPS и VDS — отдельные продукты со своими страницами; здесь только
 * подписка на ускоритель.
 *
 * Что изменено против прошлой версии:
 *   1. Своя шапка и свой футер заменены на общие SiteHeader/SiteOutro.
 *      Раньше страница держала второй, расходящийся набор ссылок на
 *      разделы сайта.
 *   2. Карточки тарифов и цены — общие с главной (src/lib/plans.ts,
 *      PlanCard). Цены были продублированы в трёх местах.
 *   3. Ритм поверхностей приведён к общему: тёмный первый экран →
 *      светлое тело → тёмный финал. Раньше страница была почти
 *      сплошь тёмной с оранжевой секцией во всю ширину, и акцент
 *      переставал работать акцентом.
 *   4. Исправлены два неверных утверждения в вопросах — см. FAQ ниже.
 */
export default function PricingPage() {
  const [period, setPeriod] = useState<Period>(12);
  useReveal();

  return (
    <div className="px-page">
      <div className="px-grid-bg" aria-hidden />
      <SiteHeader />

      <main>
        <PageHero
          eyebrow="Тарифы"
          title={["Простые тарифы —", "без сюрпризов"]}
          lede="Два тарифа и четыре срока. Цены в рублях, НДС включён. Списываем ровно за выбранный период, отмена — в один клик из личного кабинета."
        />

        {/* Тарифы */}
        <section className="px-section px-section-after-hero" aria-labelledby="plans-title">
          <div className="px-shell">
            <h2 id="plans-title" className="sr-only">Тарифные планы</h2>

            <div className="px-reveal mb-10 sm:mb-12">
              <PeriodSelector periods={PERIODS} value={period} onChange={setPeriod} />
            </div>

            <div className="px-stagger grid md:grid-cols-2 gap-4">
              <PlanCard plan="basic" period={period} />
              <PlanCard plan="plus" period={period} featured />
            </div>
          </div>
        </section>

        <ComparisonSection />

        <section className="px-section" aria-labelledby="faq-title">
          <div className="px-shell max-w-[860px]">
            <SectionHeading
              eyebrow="Вопросы"
              title={["Что обычно", "спрашивают"]}
              titleId="faq-title"
            />
            <div className="px-reveal">
              <Faq items={FAQ} />
            </div>
          </div>
        </section>
      </main>

      <SiteOutro
        title={["Три дня —", "чтобы проверить"]}
        lede="Регистрация занимает 30 секунд и не требует карты. Если не подойдёт — просто не продлевайте."
      />
    </div>
  );
}

/* ─── Сравнение ─────────────────────────────────────────────────────
   Строки таблицы выводятся из состава тарифов, а не выписаны заново:
   иначе таблица и карточки со временем разъезжаются. Всё, что входит
   в Basic, входит и в Plus; собственные пункты Plus — только у него.
   Пункт «Всё из Basic» в таблице не нужен: это и так видно глазом. */
const COMPARE_ROWS: Array<{ label: string; basic: boolean }> = [
  ...PLAN_CONTENT.basic.features.map((label) => ({ label, basic: true })),
  ...PLAN_CONTENT.plus.features
    .filter((f) => f !== "Всё из Basic")
    .map((label) => ({ label, basic: false })),
];

function ComparisonSection() {
  return (
    <section className="px-section" aria-labelledby="compare-title">
      <div className="px-shell">
        <SectionHeading
          eyebrow="Сравнение"
          title={["Что входит", "в каждый тариф"]}
          titleId="compare-title"
        />

        <div className="px-card px-reveal overflow-hidden">
          <table className="px-table">
            <caption className="sr-only">Состав тарифов Basic и Plus</caption>
            <thead>
              <tr>
                <th scope="col" className="px-table-lead">Возможность</th>
                <th scope="col">Basic</th>
                <th scope="col" className="px-table-featured">Plus</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row) => (
                <tr key={row.label}>
                  <th scope="row" className="px-table-lead">{row.label}</th>
                  <td><Mark on={row.basic} /></td>
                  <td className="px-table-featured"><Mark on /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/** Галочка или прочерк. Состояние дублируется текстом для озвучки. */
function Mark({ on }: { on: boolean }) {
  return on ? (
    <>
      <Icon name="check" size={18} className="px-accent mx-auto" />
      <span className="sr-only">есть</span>
    </>
  ) : (
    <>
      <span aria-hidden className="px-text-4">—</span>
      <span className="sr-only">нет</span>
    </>
  );
}

/* ─── Вопросы ───────────────────────────────────────────────────────
   Два ответа прошлой версии были неверными и здесь исправлены:

   1. «Работает ли на роутере? Да, есть прошивки для Keenetic и
      OpenWrt» — таких инструкций нет, роутеры в /devices не
      поддерживаются. Вопрос заменён на реальный список платформ.
   2. «Возврат — по запросу в первые 3 дня» — противоречило /terms,
      где возврат описан как 14 дней с момента платежа при прекращении
      услуг по вине сервиса. Ответ приведён к Условиям и ссылается
      на них.
   Способы оплаты описаны так же, как в /terms: через авторизованного
   платёжного оператора, сессия живёт 15 минут. */
const FAQ: FaqItem[] = [
  {
    q: "Как быстро подключусь после оплаты?",
    a: "Сразу. Подписка активируется автоматически после подтверждения от платёжного оператора — ключ и QR-код появятся в личном кабинете, там же ссылка на приложение под ваше устройство.",
  },
  {
    q: "На каких устройствах работает?",
    a: `iPhone и iPad, Android, macOS, Windows и Android TV. Одна подписка работает на ${DEVICE_LIMIT} устройствах одновременно — их можно менять в любой момент.`,
  },
  {
    q: "Можно ли сменить тариф?",
    a: "Да, из личного кабинета. Новый тариф начинает действовать сразу, остаток по прежнему пересчитывается пропорционально.",
  },
  {
    q: "Как проходит оплата?",
    a: "Через авторизованного платёжного оператора. На оплату отводится 15 минут с момента создания платёжной сессии; после подтверждения подписка активируется автоматически.",
  },
  {
    q: "Можно ли вернуть деньги?",
    a: "Да. Возврат возможен в течение 14 дней с момента платежа, если оказание услуги прекращено по нашей вине — порядок описан в Условиях использования.",
  },
  {
    q: "Храните ли вы историю подключений?",
    a: "Нет. Мы придерживаемся политики no-logs: посещённые сайты, DNS-запросы и история подключений не записываются и не хранятся.",
  },
];
