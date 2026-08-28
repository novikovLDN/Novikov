"use client";

import Link from "next/link";
import LandingFooter from "@/components/LandingFooter";

/**
 * /vps — VPS product page in the v4 light shell.
 *
 * Hero → stats → plan tiers → features → OS stack → use cases →
 * VPS vs VDS comparison → orange CTA → LandingFooter. Content
 * preserved from the earlier PremiumPage implementation: KVM
 * virtualization, dedicated NVMe, guaranteed vCPU, 10 Gb/s
 * network, ~60s provisioning, 99.98% SLA, Frankfurt/Moscow/Sydney.
 * Prices derived from the source pricing formula
 * (7.99 + cpu*2 + ram*0.5 + disk*0.02).
 */

const STATS: Array<[string, string]> = [
  ["80k",    "NVMe IOPS"],
  ["10 Gb/s", "Сеть в базе"],
  ["~60 с",   "Развёртывание"],
  ["99,98%",  "Аптайм SLA"],
];

const TIERS = [
  {
    name:  "Start",
    tag:   "Для pet-проектов",
    price: "$11,49",
    cpu:   "1 vCPU",
    ram:   "2 ГБ RAM",
    disk:  "25 ГБ NVMe",
    net:   "10 Gb/s · трафик ∞",
    highlight: false,
  },
  {
    name:  "Standard",
    tag:   "Веб и API",
    price: "$14,99",
    cpu:   "2 vCPU",
    ram:   "4 ГБ RAM",
    disk:  "50 ГБ NVMe",
    net:   "10 Gb/s · трафик ∞",
    highlight: false,
  },
  {
    name:  "Pro",
    tag:   "Рекомендуем",
    price: "$21,99",
    cpu:   "4 vCPU",
    ram:   "8 ГБ RAM",
    disk:  "100 ГБ NVMe",
    net:   "10 Gb/s · трафик ∞",
    highlight: true,
  },
  {
    name:  "Max",
    tag:   "Продакшн",
    price: "$35,99",
    cpu:   "8 vCPU",
    ram:   "16 ГБ RAM",
    disk:  "200 ГБ NVMe",
    net:   "10 Gb/s · трафик ∞",
    highlight: false,
  },
];

const FEATURES = [
  {
    n: "01",
    eyebrow: "Гипервизор",
    t: "KVM с выделенными vCPU",
    d: "Гарантированное процессорное время. Никаких «шумных соседей» и throttling под нагрузкой — ядро принадлежит вашей ВМ.",
  },
  {
    n: "02",
    eyebrow: "Диск",
    t: "Enterprise NVMe",
    d: "Samsung и Intel NVMe уровня ЦОД. 80 000+ IOPS в устойчивом режиме, микросекундные задержки под случайным I/O.",
  },
  {
    n: "03",
    eyebrow: "Сеть",
    t: "10 Gb/s полнодуплекс",
    d: "10 Gb/s в базе, апгрейд до 100 или 200 Gb/s по запросу. Публичный IPv4 и IPv6, приватный VLAN между вашими ВМ.",
  },
  {
    n: "04",
    eyebrow: "Управление",
    t: "Root SSH, консоль и API",
    d: "Полный root, веб-консоль, монтирование ISO, API для автоматизации. Ресайз конфигурации за секунды без миграции.",
  },
  {
    n: "05",
    eyebrow: "География",
    t: "Три ЦОДа",
    d: "Франкфурт, Москва, Сидней. Разворачивайте ближе к пользователям и соблюдайте требования к локализации данных.",
  },
  {
    n: "06",
    eyebrow: "SLA",
    t: "99,98% и NOC 24/7",
    d: "Гарантированный аптайм с компенсацией. Круглосуточный NOC в две смены и техподдержка на русском и английском.",
  },
];

const OS_LIST = [
  "Ubuntu 24.04",
  "Debian 12",
  "AlmaLinux 9",
  "Rocky Linux 9",
  "Fedora Server",
  "Arch Linux",
  "FreeBSD 14",
  "Windows Server 2022",
  "OpenSUSE",
  "Alpine Linux",
  "CentOS Stream",
  "Custom ISO",
];

const USECASES = [
  { t: "Веб-приложения",   d: "Nginx с Node, PHP или Python. Балансировщик впереди, автоматический TLS через ACME." },
  { t: "Базы данных",      d: "PostgreSQL, MySQL, MongoDB, Redis. NVMe раскрывается на write-heavy нагрузках." },
  { t: "Игровые серверы",  d: "Minecraft, Counter-Strike, Valheim, Rust. Выбор региона под задержку игроков." },
  { t: "CI/CD раннеры",    d: "GitLab и GitHub runners с предсказуемой производительностью для сборок и тестов." },
  { t: "Личное облако",    d: "Nextcloud, Immich, Jellyfin, Home Assistant. Данные на ваших условиях." },
  { t: "Dev-стенды",       d: "Клоны прода по требованию. Снапшоты за секунды, восстановление за минуты." },
];

const COMPARE: Array<[string, string, string]> = [
  ["Виртуализация",    "KVM",                              "Bare metal"],
  ["CPU",              "Общий хост, гарантированный vCPU", "Выделенный физический"],
  ["Цена от",          "$11,49 / мес",                     "$29,99 / мес"],
  ["Для чего",         "Веб, dev, small-medium прод",      "Высокие нагрузки, критичные данные"],
  ["Масштабирование",  "Ресайз за секунды",                 "Смена аппаратной конфигурации"],
  ["Изоляция",         "На уровне гипервизора",             "Полная аппаратная"],
];

export default function VpsPage() {
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
          VPS · KVM-виртуализация
        </div>
        <h1 className="font-mts-wide text-[40px] sm:text-[56px] lg:text-[80px] leading-[1.02] tracking-tight font-bold max-w-[14ch]">
          Виртуальные<br />серверы —<br />настоящая мощность
        </h1>
        <p className="font-mts-wide text-[16px] sm:text-[18px] leading-[1.5] text-black/55 mt-8 max-w-[58ch]">
          KVM с выделенными NVMe, гарантированным vCPU, полным root и защитой от DDoS в базе. Разворачивайте во Франкфурте, Москве или Сиднее менее чем за минуту.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/subscribe" className="font-mts-wide inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-black text-white font-semibold text-[15px] hover:bg-neutral-800 transition-colors active:scale-[0.98]">
            Выбрать конфигурацию
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </Link>
          <Link href="/contact" className="font-mts-wide inline-flex items-center gap-2 px-6 py-4 rounded-2xl border border-black/20 text-black font-semibold text-[15px] hover:bg-black/5 transition-colors">
            Связаться с отделом продаж
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="px-5 sm:px-8 pb-16 sm:pb-24 max-w-[1200px] mx-auto w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {STATS.map(([v, l]) => (
            <div key={l} className="bg-white border border-black/[0.06] rounded-2xl p-5 sm:p-6">
              <div className="font-mts-wide text-[32px] sm:text-[44px] font-bold leading-none tracking-tight tabular-nums">{v}</div>
              <div className="font-mts-wide text-[12px] tracking-[0.10em] uppercase text-black/45 mt-3">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Plan tiers */}
      <section className="px-5 sm:px-8 py-16 sm:py-24 max-w-[1200px] mx-auto w-full">
        <div className="mb-12 sm:mb-16 max-w-[720px]">
          <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-black/45 mb-4">Тарифы</div>
          <h2 className="font-mts-wide text-[32px] sm:text-[44px] lg:text-[56px] leading-[1.02] tracking-tight font-bold">
            Четыре готовые<br />конфигурации
          </h2>
          <p className="font-mts-wide text-[15px] sm:text-[16px] leading-[1.5] text-black/55 mt-6 max-w-[58ch]">
            Стартуйте от $7,99/мес по базовой ставке и добирайте ресурсы под задачу. Ресайз без миграции и остановки.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={`rounded-3xl p-6 sm:p-8 border transition-colors flex flex-col ${
                t.highlight
                  ? "bg-black text-white border-black"
                  : "bg-white text-black border-black/[0.06] hover:border-black/[0.15]"
              }`}
            >
              <div className={`font-mts-wide text-[11px] tracking-[0.14em] uppercase mb-4 ${t.highlight ? "text-white/55" : "text-black/45"}`}>
                {t.tag}
              </div>
              <h3 className="font-mts-wide text-[26px] font-bold leading-[1.1] tracking-tight mb-6">{t.name}</h3>
              <div className="mb-6">
                <span className="font-mts-wide text-[36px] font-bold tabular-nums tracking-tight">{t.price}</span>
                <span className={`font-mts-wide text-[14px] ml-2 ${t.highlight ? "text-white/55" : "text-black/45"}`}>/ мес</span>
              </div>
              <ul className={`font-mts-wide text-[14px] leading-[1.6] space-y-2 mb-8 ${t.highlight ? "text-white/80" : "text-black/70"}`}>
                <li className="flex items-start gap-2.5">
                  <span className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${t.highlight ? "bg-white" : "bg-black"}`} />
                  <span>{t.cpu}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${t.highlight ? "bg-white" : "bg-black"}`} />
                  <span>{t.ram}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${t.highlight ? "bg-white" : "bg-black"}`} />
                  <span>{t.disk}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${t.highlight ? "bg-white" : "bg-black"}`} />
                  <span>{t.net}</span>
                </li>
              </ul>
              <Link
                href="/subscribe"
                className={`mt-auto font-mts-wide inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-semibold text-[14px] transition-colors active:scale-[0.98] ${
                  t.highlight
                    ? "bg-white text-black hover:bg-neutral-200"
                    : "bg-black text-white hover:bg-neutral-800"
                }`}
              >
                Развернуть
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-5 sm:px-8 py-16 sm:py-24 max-w-[1200px] mx-auto w-full">
        <div className="mb-12 sm:mb-16 max-w-[720px]">
          <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-black/45 mb-4">Платформа</div>
          <h2 className="font-mts-wide text-[32px] sm:text-[44px] lg:text-[56px] leading-[1.02] tracking-tight font-bold">
            Производительность<br />уровня инфраструктуры
          </h2>
          <p className="font-mts-wide text-[15px] sm:text-[16px] leading-[1.5] text-black/55 mt-6 max-w-[58ch]">
            KVM поверх Intel Xeon Gold и AMD EPYC. Enterprise NVMe и сеть 10 Gb/s — стандарт, а не апгрейд.
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

      {/* OS stack */}
      <section className="px-5 sm:px-8 py-16 sm:py-24 max-w-[1200px] mx-auto w-full">
        <div className="mb-10 sm:mb-14 max-w-[720px]">
          <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-black/45 mb-4">Поддержка ОС</div>
          <h2 className="font-mts-wide text-[32px] sm:text-[44px] leading-[1.02] tracking-tight font-bold">Любой стек</h2>
          <p className="font-mts-wide text-[15px] sm:text-[16px] leading-[1.5] text-black/55 mt-6 max-w-[58ch]">
            Готовые шаблоны или загрузка собственного ISO. Установка из rescue-режима за два клика.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {OS_LIST.map((os) => (
            <span
              key={os}
              className="font-mts-wide text-[13px] sm:text-[14px] px-4 py-2.5 rounded-full bg-white border border-black/[0.08] text-black/75"
            >
              {os}
            </span>
          ))}
        </div>
      </section>

      {/* Use cases */}
      <section className="px-5 sm:px-8 py-16 sm:py-24 max-w-[1200px] mx-auto w-full">
        <div className="mb-12 sm:mb-16 max-w-[720px]">
          <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-black/45 mb-4">Сценарии</div>
          <h2 className="font-mts-wide text-[32px] sm:text-[44px] lg:text-[56px] leading-[1.02] tracking-tight font-bold">
            От pet-проектов<br />до продакшна
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

      {/* Comparison */}
      <section className="px-5 sm:px-8 py-16 sm:py-24 max-w-[900px] mx-auto w-full">
        <div className="mb-10 sm:mb-14">
          <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-black/45 mb-4">Сравнение</div>
          <h2 className="font-mts-wide text-[32px] sm:text-[44px] leading-[1.02] tracking-tight font-bold">VPS или VDS?</h2>
        </div>
        <div className="bg-white border border-black/[0.06] rounded-3xl overflow-hidden">
          <div className="hidden sm:grid grid-cols-3 px-5 sm:px-8 py-4 sm:py-5 border-b border-black/[0.06]">
            <div className="font-mts-wide text-[12px] tracking-[0.10em] uppercase text-black/45">Характеристика</div>
            <div className="font-mts-wide text-[12px] tracking-[0.10em] uppercase text-black font-semibold">VPS</div>
            <div className="font-mts-wide text-[12px] tracking-[0.10em] uppercase text-black/45">VDS</div>
          </div>
          {COMPARE.map(([k, a, b], i) => (
            <div
              key={k}
              className={`grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-6 px-5 sm:px-8 py-4 sm:py-5 ${i > 0 ? "border-t border-black/[0.06]" : ""}`}
            >
              <div className="font-mts-wide text-[13px] text-black/45">{k}</div>
              <div className="font-mts-wide text-[14px] sm:text-[15px] text-black font-semibold">{a}</div>
              <div className="font-mts-wide text-[14px] sm:text-[15px] text-black/60">{b}</div>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <Link href="/vds" className="font-mts-wide inline-flex items-center gap-2 text-[14px] text-black/70 hover:text-black transition-colors">
            Подробнее о VDS
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#F97316] text-black px-5 sm:px-8 py-20 sm:py-28 mx-2 sm:mx-3 mt-8 rounded-[28px] sm:rounded-[36px]">
        <div className="max-w-[900px] mx-auto text-center">
          <h2 className="font-mts-wide text-[36px] sm:text-[52px] lg:text-[64px] leading-[1.02] tracking-tight font-bold">
            Разверните свой VPS
          </h2>
          <p className="font-mts-wide text-[16px] sm:text-[18px] leading-[1.45] text-black/70 mt-6 max-w-[46ch] mx-auto">
            От $7,99/мес. Root, NVMe и защита от DDoS — в базе.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3 sm:gap-4">
            <Link href="/subscribe" className="font-mts-wide inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-black text-white font-semibold text-[15px] hover:bg-neutral-800 transition-colors active:scale-[0.98]">
              Развернуть
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
            <Link href="/contact" className="font-mts-wide inline-flex items-center gap-2 px-6 py-4 rounded-2xl border border-black/30 text-black font-semibold text-[15px] hover:bg-black/5 transition-colors">
              Связаться
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
