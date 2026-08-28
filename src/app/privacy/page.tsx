"use client";

import Link from "next/link";
import LandingFooter from "@/components/LandingFooter";

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
      <p className="font-mts-wide text-[15px] sm:text-[16px] leading-[1.65] text-black/70 mb-4">
        Настоящая Политика устанавливает порядок сбора, обработки, хранения и защиты информации, предоставляемой Пользователями сервиса Atlas Secure. Сервис работает в соответствии с принципами минимизации данных и уважения к конфиденциальности. Используя Сервис, вы подтверждаете согласие с настоящей Политикой.
      </p>
    ),
  },
  {
    n: "02",
    t: "Отсутствие логирования",
    body: (
      <>
        <p className="font-mts-wide text-[15px] sm:text-[16px] leading-[1.65] text-black/70 mb-4">
          Сервис придерживается строгой политики no-logs. Мы не записываем, не храним и не мониторим:
        </p>
        <ul className="font-mts-wide space-y-2 text-[14px] sm:text-[15px] leading-[1.6] text-black/70 pl-5 list-disc marker:text-black/40 mb-4">
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
        <p className="font-mts-wide text-[15px] sm:text-[16px] leading-[1.65] text-black/70 mb-4">
          Для работы Сервис собирает минимально необходимый объём:
        </p>
        <ul className="font-mts-wide space-y-2 text-[14px] sm:text-[15px] leading-[1.6] text-black/70 pl-5 list-disc marker:text-black/40 mb-4">
          <li><strong className="text-black/85 font-semibold">Email</strong> — идентификация аккаунта и коды верификации</li>
          <li><strong className="text-black/85 font-semibold">Хэш пароля</strong> — bcrypt-деривация, необратима</li>
          <li><strong className="text-black/85 font-semibold">Даты подписки</strong> — управление тарифом и продления</li>
          <li><strong className="text-black/85 font-semibold">Реферальный код</strong> — учёт бонусной программы</li>
          <li><strong className="text-black/85 font-semibold">Метаданные платежа</strong> — ID транзакции, сумма, статус. Данные карты не хранятся.</li>
        </ul>
      </>
    ),
  },
  {
    n: "04",
    t: "Цели обработки",
    body: (
      <p className="font-mts-wide text-[15px] sm:text-[16px] leading-[1.65] text-black/70 mb-4">
        Информация используется исключительно для: предоставления услуг, аутентификации, управления подписками, обработки платежей, работы реферальной программы, сервисных уведомлений и предотвращения злоупотреблений. Сервис не использует информацию в рекламных целях и не передаёт её для маркетинга.
      </p>
    ),
  },
  {
    n: "05",
    t: "Хранение и защита",
    body: (
      <p className="font-mts-wide text-[15px] sm:text-[16px] leading-[1.65] text-black/70 mb-4">
        Информация хранится на защищённых серверах с шифрованием at-rest и in-transit. Пароли хранятся исключительно в виде bcrypt-хэшей. Сессии передаются через httpOnly, SameSite=Strict, secure cookies.
      </p>
    ),
  },
  {
    n: "06",
    t: "Передача третьим лицам",
    body: (
      <p className="font-mts-wide text-[15px] sm:text-[16px] leading-[1.65] text-black/70 mb-4">
        Сервис не продаёт, не сдаёт в аренду и не передаёт информацию третьим лицам в коммерческих целях. Передача возможна только: (а) платёжному оператору для обработки транзакции и (б) в ответ на законные запросы компетентных органов с соблюдением установленных процедур.
      </p>
    ),
  },
  {
    n: "07",
    t: "Cookies",
    body: (
      <p className="font-mts-wide text-[15px] sm:text-[16px] leading-[1.65] text-black/70 mb-4">
        Сервис использует только функциональные cookies: сессионный (аутентификация) и верификационный. Аналитические, рекламные и cross-site tracking cookies не используются.
      </p>
    ),
  },
  {
    n: "08",
    t: "Права пользователя",
    body: (
      <>
        <p className="font-mts-wide text-[15px] sm:text-[16px] leading-[1.65] text-black/70 mb-4">
          Пользователь вправе в любое время:
        </p>
        <ul className="font-mts-wide space-y-2 text-[14px] sm:text-[15px] leading-[1.6] text-black/70 pl-5 list-disc marker:text-black/40 mb-4">
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
      <p className="font-mts-wide text-[15px] sm:text-[16px] leading-[1.65] text-black/70 mb-4">
        По вопросам обработки данных и реализации прав обращайтесь через{" "}
        <a
          href="https://t.me/atlas_suppbot"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-black/30 underline-offset-2 hover:decoration-black/80 hover:text-black transition-colors"
        >
          @atlas_suppbot
        </a>{" "}
        или по email{" "}
        <a
          href="mailto:privacy@atlas.secure"
          className="underline decoration-black/30 underline-offset-2 hover:decoration-black/80 hover:text-black transition-colors"
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
    <div className="bg-[#f5f5f0] min-h-dvh flex flex-col text-black">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 sm:px-8 pt-6 sm:pt-8">
        <Link href="/" className="flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M5 5 L1 1 M5 5 L5 1 M5 5 L1 5" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19 5 L23 1 M19 5 L19 1 M19 5 L23 5" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 19 L1 23 M5 19 L5 23 M5 19 L1 19" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19 19 L23 23 M19 19 L19 23 M19 19 L23 19" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-mts-wide text-[13px] tracking-[0.16em] uppercase text-black/85">atlas.secure</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 font-mts-wide text-[14px] text-black/60">
          <Link href="/pricing"  className="hover:text-black transition-colors">Тарифы</Link>
          <Link href="/security" className="hover:text-black transition-colors">Безопасность</Link>
          <Link href="/contact"  className="hover:text-black transition-colors">Поддержка</Link>
          <Link href="/about"    className="hover:text-black transition-colors">О нас</Link>
          <Link href="/auth"     className="ml-3 px-4 py-2 rounded-full bg-black text-white hover:bg-neutral-800 transition-colors">Войти</Link>
        </nav>
      </div>

      {/* Hero */}
      <section className="px-5 sm:px-8 pt-16 pb-12 sm:pt-24 sm:pb-16 max-w-[860px] mx-auto w-full">
        <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-black/45 mb-5">
          Правовая информация
        </div>
        <h1 className="font-mts-wide text-[36px] sm:text-[52px] lg:text-[64px] leading-[1.04] tracking-tight font-bold">
          Политика конфиденциальности
        </h1>
        <p className="font-mts-wide text-[15px] sm:text-[17px] leading-[1.5] text-black/55 mt-6 max-w-[58ch]">
          Обновлено 23 марта 2026 · Действует с 1 апреля 2026 · Версия 2.4
        </p>
      </section>

      {/* Body — single legal card */}
      <section className="px-5 sm:px-8 pb-20 sm:pb-28 max-w-[860px] mx-auto w-full">
        <article className="bg-white border border-black/[0.06] rounded-3xl p-6 sm:p-10 md:p-12">
          {SECTIONS.map((s) => (
            <section key={s.n} className="mt-10 first:mt-0">
              <div className="font-mts-wide text-[12px] tracking-[0.12em] uppercase text-black/45 mb-2">
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
      <LandingFooter />
    </div>
  );
}
