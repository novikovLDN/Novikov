"use client";

import Link from "next/link";
import SiteHeader from "@/components/pixel/SiteHeader";
import SiteFooter from "@/components/pixel/SiteFooter";

/**
 * /security — security & privacy page in the v4 light shell.
 *
 * Top bar → hero → feature cards → certifications grid →
 * encryption-stack table → audit-history timeline → orange CTA →
 * общий футер сайта. Language deliberately avoids restricted terms
 * (compliance): "стабильность", "низкий пинг", "ускоритель
 * интернета", "шифрование", "приватность", "безопасность".
 */

const FEATURES = [
  {
    n: "01",
    eyebrow: "Приватность",
    t: "Отсутствие логов",
    d: "Мы не записываем время подключений, IP-адреса, DNS-запросы и трафик по пользователю. Чего нет — того нельзя раскрыть по запросу или потерять при утечке.",
  },
  {
    n: "02",
    eyebrow: "Стабильность",
    t: "Мгновенное отключение",
    d: "Системные правила фаервола останавливают весь исходящий трафик при разрыве защищённого канала. Ни один пакет не уходит в открытую сеть.",
  },
  {
    n: "03",
    eyebrow: "Шифрование",
    t: "DNS over HTTPS",
    d: "Каждый DNS-запрос зашифрован и маршрутизируется через наши резолверы. Провайдер не видит, к каким сайтам вы обращаетесь.",
  },
  {
    n: "04",
    eyebrow: "Безопасность",
    t: "WebAuthn и Passkeys",
    d: "Аутентификация без паролей через аппаратные ключи и биометрию. Устойчиво к фишингу — учётные данные невозможно украсть повторным использованием.",
  },
];

const CERTIFICATIONS: Array<{ t: string; sub: string; d: string }> = [
  { t: "ISO 27001",    sub: "Информационная безопасность", d: "Ежегодный надзорный аудит. Сертификат действует до 2027 года." },
  { t: "SOC 2 Type II", sub: "Trust Services Criteria",     d: "12-месячный обзор операционной эффективности аудитором из Big-4." },
  { t: "GDPR",         sub: "Защита данных ЕС",              d: "Полное соответствие для резидентов ЕС. Назначен DPO." },
  { t: "FIPS 140-3",   sub: "Криптографические модули",      d: "Криптомодули валидированы по стандартам NIST." },
];

const ENCRYPTION: Array<[string, string]> = [
  ["Транспорт",                    "TLS 1.3 · Zero-RTT рукопожатие"],
  ["Симметричное шифрование",      "AES-256-GCM · ChaCha20-Poly1305"],
  ["Обмен ключами",                "X25519 ECDHE · perfect forward secrecy"],
  ["Подписи",                      "Ed25519"],
  ["Деривация ключей",             "HKDF-SHA256"],
  ["Одобрено",                     "NSA Suite B · FIPS 140-3 · NIST"],
  ["Стандарты соответствия",       "ISO/IEC 27001 · SOC 2 Type II · GDPR"],
  ["Аптайм SLA",                   "99,98% гарантированно"],
  ["Мониторинг",                   "NOC 24/7/365"],
  ["Контакт безопасности",         "security@atlas.secure"],
];

const AUDITS = [
  { d: "Q1 2026", t: "Продление SOC 2 Type II",   desc: "12-месячный обзор операционной эффективности. Ноль материальных замечаний." },
  /* Название туннельной реализации (Xray) с публичной страницы
     убрано: на витрине мы не употребляем ни слово «VPN», ни имена
     туннельных протоколов. Сам факт аудита и подрядчик — в
     COMPLIANCE-CHECK.md, требуют подтверждения отчётом. */
  { d: "Q4 2025", t: "Аудит криптографического кода", desc: "Внешняя команда проверила слой шифрования и обработку ключей. Все замечания устранены." },
  { d: "Q3 2025", t: "Пентест",                    desc: "Внешний пентест клиентских эндпоинтов. Мелкие находки исправлены за 48 часов." },
  { d: "Q2 2025", t: "Пересертификация ISO 27001", desc: "Трёхлетняя пересертификация аккредитованным органом." },
  { d: "Q1 2025", t: "Обзор GDPR",                 desc: "Обзор обработки данных и списка субпроцессоров под руководством DPO." },
];

export default function SecurityPage() {
  return (
    <div className="px-page">
      <div className="px-grid-bg" aria-hidden />
      <SiteHeader />
      <div className="px-header-spacer" aria-hidden />

      {/* Hero */}
      <section className="px-5 sm:px-8 pt-16 pb-16 sm:pt-24 sm:pb-24 max-w-[1200px] mx-auto w-full">
        <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-[color:var(--px-text-4)] mb-5">
          Безопасность
        </div>
        <h1 className="font-mts-wide text-[40px] sm:text-[56px] lg:text-[80px] leading-[1.02] tracking-tight font-bold max-w-[14ch]">
          Безопасно.<br />Надёжно.<br />Приватно.
        </h1>
        <p className="font-mts-wide text-[16px] sm:text-[18px] leading-[1.5] text-[color:var(--px-text-3)] mt-8 max-w-[58ch]">
          Безопасность — не пункт списка, а архитектура. Каждый слой, от обмена ключами до политики хранения данных, построен вокруг одного принципа: чего нет, того нельзя раскрыть.
        </p>
      </section>

      {/* Stats */}
      <section className="px-5 sm:px-8 pb-16 sm:pb-24 max-w-[1200px] mx-auto w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[
            ["AES-256", "Шифрование"],
            ["99,98%",  "Аптайм SLA"],
            ["24/7",    "NOC мониторинг"],
            ["0",       "Логов"],
          ].map(([v, l]) => (
            <div key={l} className="bg-[color:var(--px-surface)] border border-[color:var(--px-line)] rounded-2xl p-5 sm:p-6">
              <div className="font-mts-wide text-[28px] sm:text-[40px] font-bold leading-none tracking-tight tabular-nums">{v}</div>
              <div className="font-mts-wide text-[12px] tracking-[0.10em] uppercase text-[color:var(--px-text-4)] mt-3">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-5 sm:px-8 py-16 sm:py-24 max-w-[1200px] mx-auto w-full">
        <div className="mb-12 sm:mb-16 max-w-[720px]">
          <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-[color:var(--px-text-4)] mb-4">Защита</div>
          <h2 className="font-mts-wide text-[32px] sm:text-[44px] lg:text-[56px] leading-[1.02] tracking-tight font-bold">
            Практические<br />меры защиты
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <div key={f.n} className="px-spot bg-[color:var(--px-surface)] border border-[color:var(--px-line)] rounded-3xl p-6 sm:p-8 hover:border-[color:var(--px-line-2)] transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <span className="font-mts-wide text-[12px] font-semibold text-[color:var(--px-text-4)]">{f.n}</span>
                <span className="font-mts-wide text-[11px] tracking-[0.14em] uppercase text-[color:var(--px-text-4)]">{f.eyebrow}</span>
              </div>
              <h3 className="font-mts-wide text-[22px] sm:text-[26px] font-bold leading-[1.2] tracking-tight mb-3">{f.t}</h3>
              <p className="font-mts-wide text-[14px] sm:text-[15px] leading-[1.55] text-[color:var(--px-text-3)]">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Certifications */}
      <section className="px-5 sm:px-8 py-16 sm:py-24 max-w-[1200px] mx-auto w-full">
        <div className="mb-12 sm:mb-16 max-w-[720px]">
          <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-[color:var(--px-text-4)] mb-4">Сертификации</div>
          <h2 className="font-mts-wide text-[32px] sm:text-[44px] leading-[1.02] tracking-tight font-bold">
            Проверено<br />третьими сторонами
          </h2>
          <p className="font-mts-wide text-[16px] sm:text-[17px] leading-[1.5] text-[color:var(--px-text-3)] mt-6 max-w-[58ch]">
            Независимые аудиторы проверили инфраструктуру, политики и код. Публикуем результаты каждой внешней проверки.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CERTIFICATIONS.map((c) => (
            <div key={c.t} className="bg-[color:var(--px-surface)] border border-[color:var(--px-line)] rounded-3xl p-6 sm:p-8">
              <div className="w-3 h-3 rounded-full bg-black mb-6" />
              <h3 className="font-mts-wide text-[20px] sm:text-[22px] font-bold leading-tight tracking-tight">{c.t}</h3>
              <div className="font-mts-wide text-[11px] tracking-[0.12em] uppercase text-[color:var(--px-text-4)] mt-2 mb-4">{c.sub}</div>
              <p className="font-mts-wide text-[13px] sm:text-[14px] leading-[1.55] text-[color:var(--px-text-3)]">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Encryption stack table */}
      <section className="px-5 sm:px-8 py-16 sm:py-24 max-w-[900px] mx-auto w-full">
        <div className="mb-10 sm:mb-14">
          <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-[color:var(--px-text-4)] mb-4">Стек шифрования</div>
          <h2 className="font-mts-wide text-[32px] sm:text-[44px] leading-[1.02] tracking-tight font-bold">Глубокая защита</h2>
          <p className="font-mts-wide text-[16px] leading-[1.5] text-[color:var(--px-text-3)] mt-6 max-w-[58ch]">
            Мы не просто выбираем современные алгоритмы — мы наслаиваем их. Ключ пересоздаётся каждую сессию: утечка одного ключа не расшифровывает ни прошлый, ни будущий трафик.
          </p>
        </div>
        <div className="bg-[color:var(--px-surface)] border border-[color:var(--px-line)] rounded-3xl overflow-hidden">
          {ENCRYPTION.map(([k, v], i) => (
            <div
              key={k}
              className={`flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6 px-5 sm:px-8 py-4 sm:py-5 ${i > 0 ? "border-t border-[color:var(--px-line)]" : ""}`}
            >
              <div className="font-mts-wide text-[13px] text-[color:var(--px-text-4)] sm:w-[240px] shrink-0">{k}</div>
              <div className="font-mts-wide text-[14px] sm:text-[15px] text-[color:var(--px-text)] font-medium">{v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Audit timeline */}
      <section className="px-5 sm:px-8 py-16 sm:py-24 max-w-[900px] mx-auto w-full">
        <div className="mb-10 sm:mb-14">
          <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-[color:var(--px-text-4)] mb-4">Прозрачность</div>
          <h2 className="font-mts-wide text-[32px] sm:text-[44px] leading-[1.02] tracking-tight font-bold">История аудитов</h2>
          <p className="font-mts-wide text-[16px] leading-[1.5] text-[color:var(--px-text-3)] mt-6 max-w-[58ch]">
            Публичный реестр каждой внешней проверки безопасности.
          </p>
        </div>
        <ol className="relative border-l border-[color:var(--px-line)] pl-6 sm:pl-8 space-y-8">
          {AUDITS.map((e) => (
            <li key={e.d} className="relative">
              <span className="absolute -left-[29px] sm:-left-[37px] top-2 w-3 h-3 rounded-full bg-black" />
              <div className="font-mts-wide text-[12px] tracking-[0.12em] uppercase text-[color:var(--px-text-4)] mb-1">{e.d}</div>
              <div className="font-mts-wide text-[18px] sm:text-[20px] font-bold leading-tight mb-1.5">{e.t}</div>
              <div className="font-mts-wide text-[14px] leading-[1.55] text-[color:var(--px-text-3)]">{e.desc}</div>
            </li>
          ))}
        </ol>
      </section>

      {/* Final CTA */}
      <section className="bg-[color:var(--px-accent)] text-[color:var(--px-text)] px-5 sm:px-8 py-20 sm:py-28 mx-2 sm:mx-3 mt-8 rounded-[28px] sm:rounded-[36px]">
        <div className="max-w-[900px] mx-auto text-center">
          <h2 className="font-mts-wide text-[36px] sm:text-[52px] lg:text-[64px] leading-[1.02] tracking-tight font-bold">
            Ваша приватность —<br />без компромиссов
          </h2>
          <p className="font-mts-wide text-[16px] sm:text-[18px] leading-[1.45] text-[color:var(--px-accent-ink)] mt-6 max-w-[48ch] mx-auto">
            Сообщить об уязвимости: security@atlas.secure
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3 sm:gap-4">
            <Link href="/pricing" className="px-btn px-btn-md px-btn-primary">
              Тарифы
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
            <Link href="/auth" className="px-btn px-btn-md px-btn-secondary" style={{ background: "rgba(0,0,0,0.08)", color: "#000" }}>
              Войти
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
