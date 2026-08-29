"use client";

import Link from "next/link";
import LandingFooter from "@/components/LandingFooter";

/**
 * /vds — VDS product page in the v4 light shell.
 *
 * Hero → stats → CPU tiers → features → use cases → hardware
 * registry → orange CTA → LandingFooter. Content preserved from
 * the earlier PremiumPage implementation: dedicated physical
 * servers, Intel Xeon Scalable / AMD EPYC, NVMe RAID 10, up to
 * 200 Gb/s network, up to 1 TB RAM, IPMI/KVM, private VLAN,
 * from $29.99/mo. CPU line-up: EPYC 9354P (recommended), EPYC
 * 9554, Xeon Gold 6548Y, Xeon 6430.
 */

const STATS: Array<[string, string]> = [
  ["EPYC 9K",  "Свежий Zen 4c"],
  ["200 Gb/s", "Макс. сеть"],
  ["300k",     "NVMe RAID IOPS"],
  ["1 ТБ",     "Макс. RAM"],
];

const CPU_TIERS = [
  {
    name:    "EPYC 9354P",
    badge:   "Рекомендуем",
    highlight: true,
    price:   "От $29,99",
    d:       "32 ядра Zen 4c. 360W TDP. До 128 линий PCIe 5.0 для NVMe и сетевых карт.",
    specs: [
      ["Ядра",     "32 физических"],
      ["TDP",      "360 Вт"],
      ["PCIe",     "5.0 · до 128 линий"],
      ["Профиль",  "Универсальный high-end"],
    ] as Array<[string, string]>,
  },
  {
    name:    "EPYC 9554",
    badge:   "HPC",
    highlight: false,
    price:   "По запросу",
    d:       "64 ядра / 128 потоков. Для multi-tenant баз данных и HPC-кластеров с параллельными задачами.",
    specs: [
      ["Ядра",     "64 / 128 потоков"],
      ["Кэш L3",   "256 МБ"],
      ["Профиль",  "HPC, аналитика"],
      ["Сокет",    "SP5"],
    ] as Array<[string, string]>,
  },
  {
    name:    "Xeon Gold 6548Y",
    badge:   "AVX-512",
    highlight: false,
    price:   "По запросу",
    d:       "Sapphire Rapids. 32 ядра с AVX-512 и AMX — оптимально для ML-инференса на CPU.",
    specs: [
      ["Ядра",     "32 физических"],
      ["AVX-512",  "Да"],
      ["AMX",      "Да"],
      ["Профиль",  "ML-инференс"],
    ] as Array<[string, string]>,
  },
  {
    name:    "Xeon 6430",
    badge:   "Balanced",
    highlight: false,
    price:   "По запросу",
    d:       "32 ядра. Универсальная рабочая лошадка для веба и баз данных с предсказуемой ценой.",
    specs: [
      ["Ядра",     "32 физических"],
      ["Частота",  "2,1 / 3,4 ГГц"],
      ["Профиль",  "Веб, БД"],
      ["Сокет",    "LGA 4677"],
    ] as Array<[string, string]>,
  },
];

const FEATURES = [
  {
    n: "01",
    eyebrow: "Процессор",
    t: "Выделенный CPU",
    d: "Intel Xeon Gold 6xxx или AMD EPYC 9xxx. До 64 физических ядер. Полный доступ к performance-счётчикам.",
  },
  {
    n: "02",
    eyebrow: "Изоляция",
    t: "Аппаратная, без гипервизора",
    d: "Ваши потоки, кэши и шина памяти. Безопасный дом для чувствительных нагрузок и compliance-задач.",
  },
  {
    n: "03",
    eyebrow: "Диск",
    t: "NVMe RAID 10",
    d: "Enterprise NVMe в RAID 10 по умолчанию. 300 000+ IOPS, избыточность и hot-swap без простоя.",
  },
  {
    n: "04",
    eyebrow: "Сеть",
    t: "До 200 Gb/s и DDoS в базе",
    d: "Полнодуплекс до 200 Gb/s. Центр фильтрации впереди — митигирует L3/4/7 атаки до терабитного масштаба.",
  },
  {
    n: "05",
    eyebrow: "Управление",
    t: "IPMI и KVM out-of-band",
    d: "Любая ОС, монтирование ISO, power-cycle и переустановка без обращения в поддержку.",
  },
  {
    n: "06",
    eyebrow: "Сеть между узлами",
    t: "Приватный VLAN",
    d: "Объединяйте несколько VDS в приватной L2-сети. Готовая база для HA-пар и кластеров.",
  },
];

const USECASES = [
  { t: "Нагруженные БД",     d: "PostgreSQL, Cassandra, ClickHouse с непредсказуемыми запросами и большими буферами." },
  { t: "ML-инференс",        d: "Ускоренный AVX-512 и AMX инференс без стоимости GPU. Обслуживание LLM на CPU." },
  { t: "Финтрейдинг",        d: "Микросекундная предсказуемость задержек. Никакого джиттера гипервизора для HFT-задач." },
  { t: "Enterprise ERP",     d: "SAP, Oracle, 1С — нагрузки, требующие сертифицированного железа и полной изоляции." },
  { t: "Compliance-задачи",  d: "PCI-DSS, HIPAA, 152-ФЗ. Физическая изоляция устраивает самых строгих аудиторов." },
  { t: "Рендер-фермы",       d: "100% CPU часами. Без throttling и соседей, предсказуемое время рендера." },
];

const HARDWARE: Array<[string, string]> = [
  ["Класс серверов",       "Bare metal · без гипервизора"],
  ["Процессоры",           "Intel Xeon Gold 6xxx · AMD EPYC 9xxx"],
  ["Максимум ядер",        "До 64 физических"],
  ["Максимум RAM",         "До 1 ТБ ECC"],
  ["Диски",                "Enterprise NVMe · RAID 10 · hot-swap"],
  ["Дисковая производительность", "300 000+ IOPS в RAID"],
  ["Сеть",                 "10 / 100 / 200 Gb/s полнодуплекс"],
  ["Приватная сеть",       "L2 VLAN между вашими VDS"],
  ["Защита",               "DDoS L3/4/7 · до терабитного масштаба"],
  ["Управление",           "IPMI · KVM · ISO-mount · API"],
  ["ЦОДы",                 "Франкфурт · Москва · Сидней"],
  ["Аптайм SLA",           "99,98% с компенсацией"],
  ["Поддержка",            "NOC 24/7/365"],
  ["Стартовая цена",       "От $29,99 / мес"],
];

export default function VdsPage() {
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
      <section className="px-5 sm:px-8 pt-16 pb-14 sm:pt-24 sm:pb-20 max-w-[1200px] mx-auto w-full">
        <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-black/45 mb-5">
          VDS · Выделенное железо
        </div>
        <h1 className="font-mts-wide text-[40px] sm:text-[56px] lg:text-[80px] leading-[1.02] tracking-tight font-bold max-w-[14ch]">
          Выделенное<br />железо.<br />Ноль соседей
        </h1>
        <p className="font-mts-wide text-[16px] sm:text-[18px] leading-[1.5] text-black/55 mt-8 max-w-[58ch]">
          Полный физический сервер. Без оверхеда гипервизора, без соседей, без общих cache-линий. Intel Xeon Scalable или AMD EPYC, enterprise NVMe и сеть до 200 Gb/s.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/subscribe" className="as-btn as-btn-primary as-btn-accent">
            Выбрать конфигурацию
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </Link>
          <Link href="/contact" className="as-btn as-btn-secondary as-btn-ghost">
            Написать инженеру
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="px-5 sm:px-8 pb-16 sm:pb-24 max-w-[1200px] mx-auto w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {STATS.map(([v, l]) => (
            <div key={l} className="bg-white border border-black/[0.06] rounded-2xl p-5 sm:p-6">
              <div className="font-mts-wide text-[28px] sm:text-[40px] font-bold leading-none tracking-tight tabular-nums">{v}</div>
              <div className="font-mts-wide text-[12px] tracking-[0.10em] uppercase text-black/45 mt-3">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CPU tiers */}
      <section className="px-5 sm:px-8 py-16 sm:py-24 max-w-[1200px] mx-auto w-full">
        <div className="mb-12 sm:mb-16 max-w-[720px]">
          <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-black/45 mb-4">Поколения CPU</div>
          <h2 className="font-mts-wide text-[32px] sm:text-[44px] lg:text-[56px] leading-[1.02] tracking-tight font-bold">
            Всегда свежий<br />кремний
          </h2>
          <p className="font-mts-wide text-[15px] sm:text-[16px] leading-[1.5] text-black/55 mt-6 max-w-[58ch]">
            Четыре поколения процессоров под разные профили нагрузки. Начиная от $29,99/мес за EPYC 9354P.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CPU_TIERS.map((t) => (
            <div
              key={t.name}
              className={`rounded-3xl p-6 sm:p-8 border transition-colors flex flex-col ${
                t.highlight
                  ? "bg-black text-white border-black"
                  : "bg-white text-black border-black/[0.06] hover:border-black/[0.15]"
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <span className={`font-mts-wide text-[11px] tracking-[0.14em] uppercase ${t.highlight ? "text-white/55" : "text-black/45"}`}>
                  {t.badge}
                </span>
                <span className={`font-mts-wide text-[13px] font-semibold ${t.highlight ? "text-white/85" : "text-black/70"}`}>
                  {t.price} / мес
                </span>
              </div>
              <h3 className="font-mts-wide text-[24px] sm:text-[28px] font-bold leading-[1.1] tracking-tight mb-3">{t.name}</h3>
              <p className={`font-mts-wide text-[14px] sm:text-[15px] leading-[1.55] mb-6 ${t.highlight ? "text-white/70" : "text-black/60"}`}>
                {t.d}
              </p>
              <dl className={`grid grid-cols-2 gap-x-4 gap-y-3 mb-8 pt-6 border-t ${t.highlight ? "border-white/10" : "border-black/[0.08]"}`}>
                {t.specs.map(([k, v]) => (
                  <div key={k}>
                    <dt className={`font-mts-wide text-[11px] tracking-[0.10em] uppercase mb-1 ${t.highlight ? "text-white/45" : "text-black/45"}`}>{k}</dt>
                    <dd className="font-mts-wide text-[14px] font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
              <Link href="/subscribe" className="mt-auto as-btn as-btn-secondary as-btn-accent as-btn-block">
                Заказать сборку
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-5 sm:px-8 py-16 sm:py-24 max-w-[1200px] mx-auto w-full">
        <div className="mb-12 sm:mb-16 max-w-[720px]">
          <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-black/45 mb-4">Железо</div>
          <h2 className="font-mts-wide text-[32px] sm:text-[44px] lg:text-[56px] leading-[1.02] tracking-tight font-bold">
            Что реально<br />получаете
          </h2>
          <p className="font-mts-wide text-[15px] sm:text-[16px] leading-[1.5] text-black/55 mt-6 max-w-[58ch]">
            Не абстракции и не доли — физические компоненты, принадлежащие вашей нагрузке.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <div key={f.n} className="bg-white border border-black/[0.06] rounded-3xl p-6 sm:p-8 hover:border-black/[0.15] transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <span className="font-mts-wide text-[12px] font-semibold text-black/45">{f.n}</span>
                <span className="font-mts-wide text-[11px] tracking-[0.14em] uppercase text-black/45">{f.eyebrow}</span>
              </div>
              <h3 className="font-mts-wide text-[22px] sm:text-[26px] font-bold leading-[1.2] tracking-tight mb-3">{f.t}</h3>
              <p className="font-mts-wide text-[14px] sm:text-[15px] leading-[1.55] text-black/60">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Use cases */}
      <section className="px-5 sm:px-8 py-16 sm:py-24 max-w-[1200px] mx-auto w-full">
        <div className="mb-12 sm:mb-16 max-w-[720px]">
          <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-black/45 mb-4">Идеальные нагрузки</div>
          <h2 className="font-mts-wide text-[32px] sm:text-[44px] lg:text-[56px] leading-[1.02] tracking-tight font-bold">
            Когда выигрывает<br />bare metal
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {USECASES.map((u, i) => (
            <div key={u.t} className="bg-white border border-black/[0.06] rounded-3xl p-6 sm:p-8 hover:border-black/[0.15] transition-colors">
              <div className="font-mts-wide text-[12px] font-semibold text-black/45 mb-4">{String(i + 1).padStart(2, "0")}</div>
              <h3 className="font-mts-wide text-[20px] sm:text-[22px] font-bold leading-[1.2] tracking-tight mb-3">{u.t}</h3>
              <p className="font-mts-wide text-[14px] leading-[1.55] text-black/60">{u.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Hardware registry */}
      <section className="px-5 sm:px-8 py-16 sm:py-24 max-w-[900px] mx-auto w-full">
        <div className="mb-10 sm:mb-14">
          <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-black/45 mb-4">Спецификации</div>
          <h2 className="font-mts-wide text-[32px] sm:text-[44px] leading-[1.02] tracking-tight font-bold">Полный лист железа</h2>
        </div>
        <div className="bg-white border border-black/[0.06] rounded-3xl overflow-hidden">
          {HARDWARE.map(([k, v], i) => (
            <div
              key={k}
              className={`flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6 px-5 sm:px-8 py-4 sm:py-5 ${i > 0 ? "border-t border-black/[0.06]" : ""}`}
            >
              <div className="font-mts-wide text-[13px] text-black/45 sm:w-[260px] shrink-0">{k}</div>
              <div className="font-mts-wide text-[14px] sm:text-[15px] text-black/85 font-medium">{v}</div>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <Link href="/vps" className="font-mts-wide inline-flex items-center gap-2 text-[14px] text-black/70 hover:text-black transition-colors">
            Сравнить с VPS
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#F97316] text-black px-5 sm:px-8 py-20 sm:py-28 mx-2 sm:mx-3 mt-8 rounded-[28px] sm:rounded-[36px]">
        <div className="max-w-[900px] mx-auto text-center">
          <h2 className="font-mts-wide text-[36px] sm:text-[52px] lg:text-[64px] leading-[1.02] tracking-tight font-bold">
            Заберите своё железо
          </h2>
          <p className="font-mts-wide text-[16px] sm:text-[18px] leading-[1.45] text-black/70 mt-6 max-w-[46ch] mx-auto">
            От $29,99/мес. Полное железо, полный контроль, без компромиссов.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3 sm:gap-4">
            <Link href="/subscribe" className="as-btn as-btn-primary as-btn-solid">
              Заказать
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
            <Link href="/contact" className="as-btn as-btn-secondary" style={{ background: "rgba(0,0,0,0.08)", color: "#000" }}>
              Кастомная сборка
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
