"use client";

import Link from "next/link";
import LandingFooter from "@/components/LandingFooter";

/**
 * /terms — Пользовательское соглашение in the v4 light shell.
 *
 * Legal clauses preserved verbatim from the previous version. Only
 * the visual chrome (top bar, hero, single white card, footer)
 * follows the refreshed provod.ai-inspired aesthetic.
 */

const SECTIONS: Array<{
  n: string;
  t: string;
  body: React.ReactNode;
}> = [
  {
    n: "01",
    t: "Общие положения",
    body: (
      <p className="font-mts-wide text-[15px] sm:text-[16px] leading-[1.65] text-black/70 mb-4">
        Настоящие Условия регулируют правоотношения между Atlas Secure (Сервис) и Пользователем. Акцепт Соглашения осуществляется путём регистрации, использования Сервиса или оплаты подписки и является полным и безоговорочным.
      </p>
    ),
  },
  {
    n: "02",
    t: "Предмет Соглашения",
    body: (
      <p className="font-mts-wide text-[15px] sm:text-[16px] leading-[1.65] text-black/70 mb-4">
        Сервис предоставляет доступ к технологии защищённого соединения: шифрование трафика (VLESS/Reality, VMess, Trojan), маскирование IP-адреса, доступ к серверной инфраструктуре в различных юрисдикциях и техническую поддержку в рамках выбранного тарифного плана.
      </p>
    ),
  },
  {
    n: "03",
    t: "Регистрация",
    body: (
      <p className="font-mts-wide text-[15px] sm:text-[16px] leading-[1.65] text-black/70 mb-4">
        Для доступа к Сервису Пользователь обязан пройти регистрацию с действительным адресом email. Пользователь несёт ответственность за сохранность учётных данных и все действия, совершённые с использованием его аккаунта. Сервис вправе приостанавливать или прекращать действие аккаунтов, нарушающих Условия.
      </p>
    ),
  },
  {
    n: "04",
    t: "Тарифные планы",
    body: (
      <>
        <p className="font-mts-wide text-[15px] sm:text-[16px] leading-[1.65] text-black/70 mb-4">
          Стоимость и характеристики всех тарифных планов публикуются на странице Тарифов. Сервис оставляет за собой право изменять стоимость в любое время; изменения не затрагивают уже оплаченные периоды.
        </p>
        <ul className="font-mts-wide space-y-2 text-[14px] sm:text-[15px] leading-[1.6] text-black/70 pl-5 list-disc marker:text-black/40 mb-4">
          <li><strong className="text-black/85 font-semibold">Trial</strong> — 3 дня бесплатно, без оплаты</li>
          <li><strong className="text-black/85 font-semibold">Telegram бонус</strong> — +7 дней</li>
          <li><strong className="text-black/85 font-semibold">Реферальный бонус</strong> — +20 дней за оплаченного реферала</li>
        </ul>
      </>
    ),
  },
  {
    n: "05",
    t: "Оплата",
    body: (
      <p className="font-mts-wide text-[15px] sm:text-[16px] leading-[1.65] text-black/70 mb-4">
        Оплата производится через авторизованного платёжного оператора. Срок оплаты — 15 минут с момента создания платёжной сессии. Активация подписки происходит автоматически после подтверждения от оператора.
      </p>
    ),
  },
  {
    n: "06",
    t: "Ограничения использования",
    body: (
      <>
        <p className="font-mts-wide text-[15px] sm:text-[16px] leading-[1.65] text-black/70 mb-4">
          Сервис запрещено использовать для:
        </p>
        <ul className="font-mts-wide space-y-2 text-[14px] sm:text-[15px] leading-[1.6] text-black/70 pl-5 list-disc marker:text-black/40 mb-4">
          <li>Распространения вредоносного ПО или попыток несанкционированного доступа</li>
          <li>Распространения материалов сексуального насилия в отношении детей</li>
          <li>Массовых рассылок спама или коммерческих рассылок</li>
          <li>Атак на сторонние системы (DoS, эксплуатация, брутфорс)</li>
          <li>Нарушения законодательства юрисдикции Пользователя</li>
        </ul>
      </>
    ),
  },
  {
    n: "07",
    t: "Качество услуг",
    body: (
      <p className="font-mts-wide text-[15px] sm:text-[16px] leading-[1.65] text-black/70 mb-4">
        Сервис предоставляется на условиях «как есть» с SLA по аптайму 99.98%. Сервис прилагает разумные усилия для обеспечения непрерывности, но не гарантирует бесперебойную работу, определённую скорость или доступность конкретных серверов. Кредиты начисляются автоматически при нарушении месячного SLA.
      </p>
    ),
  },
  {
    n: "08",
    t: "Ответственность",
    body: (
      <p className="font-mts-wide text-[15px] sm:text-[16px] leading-[1.65] text-black/70 mb-4">
        Совокупная ответственность Сервиса ограничивается суммой, уплаченной Пользователем за текущий период подписки. Возврат средств возможен в течение 14 дней с момента платежа при прекращении услуг по вине Сервиса. Сервис не несёт ответственности за действия Пользователя или сторонние сервисы.
      </p>
    ),
  },
  {
    n: "09",
    t: "Контакты",
    body: (
      <p className="font-mts-wide text-[15px] sm:text-[16px] leading-[1.65] text-black/70 mb-4">
        По всем вопросам обращайтесь через{" "}
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
          href="mailto:support@atlas.secure"
          className="underline decoration-black/30 underline-offset-2 hover:decoration-black/80 hover:text-black transition-colors"
        >
          support@atlas.secure
        </a>
        .
      </p>
    ),
  },
];

export default function TermsPage() {
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
          Пользовательское соглашение
        </h1>
        <p className="font-mts-wide text-[15px] sm:text-[17px] leading-[1.5] text-black/55 mt-6 max-w-[58ch]">
          Обновлено 23 марта 2026 · Действует с 1 апреля 2026 · Версия 3.1
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
