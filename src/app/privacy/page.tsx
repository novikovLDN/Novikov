"use client";

import Link from "next/link";
import SiteHeader from "@/components/pixel/SiteHeader";
import SiteFooter from "@/components/pixel/SiteFooter";

/**
 * /privacy — Политика конфиденциальности in the v4 light shell.
 *
 * Legal copy is preserved word-for-word from the previous version.
 * Only the visual chrome (top bar, hero, single white card, footer)
 * follows the provod.ai-inspired light aesthetic used across the
 * refreshed site.
 */

const SECTIONS: Array<{
  n: string;
  t: string;
  body: React.ReactNode;
}> = [
  {
    n: "01",
    t: "Введение",
    body: (
      <p className="font-mts-wide text-[15px] sm:text-[16px] leading-[1.65] text-[color:var(--px-text-2)] mb-4">
        Настоящая Политика устанавливает порядок сбора, обработки, хранения и защиты информации, предоставляемой Пользователями сервиса Atlas Secure. Сервис работает в соответствии с принципами минимизации данных и уважения к конфиденциальности. Используя Сервис, вы подтверждаете согласие с настоящей Политикой.
      </p>
    ),
  },
  {
    n: "02",
    t: "Отсутствие логирования",
    body: (
      <>
        <p className="font-mts-wide text-[15px] sm:text-[16px] leading-[1.65] text-[color:var(--px-text-2)] mb-4">
          Сервис придерживается строгой политики no-logs. Мы не записываем, не храним и не мониторим:
        </p>
        <ul className="font-mts-wide space-y-2 text-[14px] sm:text-[15px] leading-[1.6] text-[color:var(--px-text-2)] pl-5 list-disc marker:text-[color:var(--px-text-4)] mb-4">
          <li>Содержимое интернет-трафика и адреса назначения</li>
          <li>IP-адреса подключения (исходные и назначаемые)</li>
          <li>DNS-запросы и логи резолвинга</li>
          <li>Метки времени сессий и продолжительность</li>
          <li>Объём трафика в привязке к Пользователю</li>
          <li>Информацию о посещаемых ресурсах</li>
        </ul>
      </>
    ),
  },
  {
    n: "03",
    t: "Собираемая информация",
    body: (
      <>
        <p className="font-mts-wide text-[15px] sm:text-[16px] leading-[1.65] text-[color:var(--px-text-2)] mb-4">
          Для работы Сервис собирает минимально необходимый объём:
        </p>
        <ul className="font-mts-wide space-y-2 text-[14px] sm:text-[15px] leading-[1.6] text-[color:var(--px-text-2)] pl-5 list-disc marker:text-[color:var(--px-text-4)] mb-4">
          <li><strong className="text-[color:var(--px-text)] font-semibold">Email</strong> — идентификация аккаунта и коды верификации</li>
          <li><strong className="text-[color:var(--px-text)] font-semibold">Хэш пароля</strong> — bcrypt-деривация, необратима</li>
          <li><strong className="text-[color:var(--px-text)] font-semibold">Даты подписки</strong> — управление тарифом и продления</li>
          <li><strong className="text-[color:var(--px-text)] font-semibold">Реферальный код</strong> — учёт бонусной программы</li>
          <li><strong className="text-[color:var(--px-text)] font-semibold">Метаданные платежа</strong> — ID транзакции, сумма, статус. Данные карты не хранятся.</li>
        </ul>
      </>
    ),
  },
  {
    n: "04",
    t: "Цели обработки",
    body: (
      <p className="font-mts-wide text-[15px] sm:text-[16px] leading-[1.65] text-[color:var(--px-text-2)] mb-4">
        Информация используется исключительно для: предоставления услуг, аутентификации, управления подписками, обработки платежей, работы реферальной программы, сервисных уведомлений и предотвращения злоупотреблений. Сервис не использует информацию в рекламных целях и не передаёт её для маркетинга.
      </p>
    ),
  },
  {
    n: "05",
    t: "Хранение и защита",
    body: (
      <p className="font-mts-wide text-[15px] sm:text-[16px] leading-[1.65] text-[color:var(--px-text-2)] mb-4">
        Информация хранится на защищённых серверах с шифрованием at-rest и in-transit. Пароли хранятся исключительно в виде bcrypt-хэшей. Сессии передаются через httpOnly, SameSite=Strict, secure cookies.
      </p>
    ),
  },
  {
    n: "06",
    t: "Передача третьим лицам",
    body: (
      <p className="font-mts-wide text-[15px] sm:text-[16px] leading-[1.65] text-[color:var(--px-text-2)] mb-4">
        Сервис не продаёт, не сдаёт в аренду и не передаёт информацию третьим лицам в коммерческих целях. Передача возможна только: (а) платёжному оператору для обработки транзакции и (б) в ответ на законные запросы компетентных органов с соблюдением установленных процедур.
      </p>
    ),
  },
  {
    n: "07",
    t: "Cookies",
    body: (
      <p className="font-mts-wide text-[15px] sm:text-[16px] leading-[1.65] text-[color:var(--px-text-2)] mb-4">
        Сервис использует только функциональные cookies: сессионный (аутентификация) и верификационный. Аналитические, рекламные и cross-site tracking cookies не используются.
      </p>
    ),
  },
  {
    n: "08",
    t: "Права пользователя",
    body: (
      <>
        <p className="font-mts-wide text-[15px] sm:text-[16px] leading-[1.65] text-[color:var(--px-text-2)] mb-4">
          Пользователь вправе в любое время:
        </p>
        <ul className="font-mts-wide space-y-2 text-[14px] sm:text-[15px] leading-[1.6] text-[color:var(--px-text-2)] pl-5 list-disc marker:text-[color:var(--px-text-4)] mb-4">
          <li>Запросить копию всех данных, связанных с аккаунтом</li>
          <li>Потребовать удаления аккаунта и всех связанных данных</li>
          <li>Отозвать согласие на обработку данных</li>
          <li>Экспортировать данные в машиночитаемом формате</li>
        </ul>
      </>
    ),
  },
  {
    n: "09",
    t: "Контакты",
    body: (
      <p className="font-mts-wide text-[15px] sm:text-[16px] leading-[1.65] text-[color:var(--px-text-2)] mb-4">
        По вопросам обработки данных и реализации прав обращайтесь через{" "}
        <a
          href="https://t.me/atlas_suppbot"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-black/30 underline-offset-2 hover:decoration-black/80 hover:text-[color:var(--px-text)] transition-colors"
        >
          @atlas_suppbot
        </a>{" "}
        или по email{" "}
        <a
          href="mailto:privacy@atlas.secure"
          className="underline decoration-black/30 underline-offset-2 hover:decoration-black/80 hover:text-[color:var(--px-text)] transition-colors"
        >
          privacy@atlas.secure
        </a>
        .
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div className="px-page">
      <div className="px-grid-bg" aria-hidden />
      <SiteHeader />
      <div className="px-header-spacer" aria-hidden />

      {/* Hero */}
      <section className="px-5 sm:px-8 pt-16 pb-12 sm:pt-24 sm:pb-16 max-w-[860px] mx-auto w-full">
        <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-[color:var(--px-text-4)] mb-5">
          Правовая информация
        </div>
        <h1 className="font-mts-wide text-[36px] sm:text-[52px] lg:text-[64px] leading-[1.04] tracking-tight font-bold">
          Политика конфиденциальности
        </h1>
        <p className="font-mts-wide text-[15px] sm:text-[17px] leading-[1.5] text-[color:var(--px-text-3)] mt-6 max-w-[58ch]">
          Обновлено 23 марта 2026 · Действует с 1 апреля 2026 · Версия 2.4
        </p>
      </section>

      {/* Body — single legal card */}
      <section className="px-5 sm:px-8 pb-20 sm:pb-28 max-w-[860px] mx-auto w-full">
        <article className="bg-[color:var(--px-surface)] border border-[color:var(--px-line)] rounded-3xl p-6 sm:p-10 md:p-12">
          {SECTIONS.map((s) => (
            <section key={s.n} className="mt-10 first:mt-0">
              <div className="font-mts-wide text-[12px] tracking-[0.12em] uppercase text-[color:var(--px-text-4)] mb-2">
                {s.n}
              </div>
              <h2 className="font-mts-wide text-[22px] sm:text-[28px] font-bold tracking-tight mb-4">
                {s.t}
              </h2>
              {s.body}
            </section>
          ))}
        </article>
      </section>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
