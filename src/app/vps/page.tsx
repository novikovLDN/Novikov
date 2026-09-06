"use client";

import Link from "next/link";
import SiteHeader from "@/components/pixel/SiteHeader";
import SiteFooter from "@/components/pixel/SiteFooter";

/**
 * /vps — VPS product page in the v4 light shell.
 *
 * Hero → stats → plan tiers → features → OS stack → use cases →
 * VPS vs VDS comparison → orange CTA → общий футер сайта. Content
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
    <div className="px-page">
      <div className="px-grid-bg" aria-hidden />
      <SiteHeader />
      <div className="px-header-spacer" aria-hidden />

      {/* Hero */}
      <section className="px-5 sm:px-8 pt-16 pb-14 sm:pt-24 sm:pb-20 max-w-[1200px] mx-auto w-full">
        <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-[color:var(--px-text-4)] mb-5">
          VPS · KVM-виртуализация
        </div>
        <h1 className="font-mts-wide text-[40px] sm:text-[56px] lg:text-[80px] leading-[1.02] tracking-tight font-bold max-w-[14ch]">
          Виртуальные<br />серверы —<br />настоящая мощность
        </h1>
        <p className="font-mts-wide text-[16px] sm:text-[18px] leading-[1.5] text-[color:var(--px-text-3)] mt-8 max-w-[58ch]">
          KVM с выделенными NVMe, гарантированным vCPU, полным root и защитой от DDoS в базе. Разворачивайте во Франкфурте, Москве или Сиднее менее чем за минуту.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/subscribe" className="px-btn px-btn-md px-btn-primary">
            Выбрать конфигурацию
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </Link>
          <Link href="/contact" className="px-btn px-btn-md px-btn-secondary">
            Связаться с отделом продаж
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="px-5 sm:px-8 pb-16 sm:pb-24 max-w-[1200px] mx-auto w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {STATS.map(([v, l]) => (
            <div key={l} className="bg-[color:var(--px-surface)] border border-[color:var(--px-line)] rounded-2xl p-5 sm:p-6">
              <div className="font-mts-wide text-[32px] sm:text-[44px] font-bold leading-none tracking-tight tabular-nums">{v}</div>
              <div className="font-mts-wide text-[12px] tracking-[0.10em] uppercase text-[color:var(--px-text-4)] mt-3">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Plan tiers */}
      <section className="px-5 sm:px-8 py-16 sm:py-24 max-w-[1200px] mx-auto w-full">
        <div className="mb-12 sm:mb-16 max-w-[720px]">
          <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-[color:var(--px-text-4)] mb-4">Тарифы</div>
          <h2 className="font-mts-wide text-[32px] sm:text-[44px] lg:text-[56px] leading-[1.02] tracking-tight font-bold">
            Четыре готовые<br />конфигурации
          </h2>
          <p className="font-mts-wide text-[15px] sm:text-[16px] leading-[1.5] text-[color:var(--px-text-3)] mt-6 max-w-[58ch]">
            Стартуйте от $7,99/мес по базовой ставке и добирайте ресурсы под задачу. Ресайз без миграции и остановки.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={`rounded-3xl p-6 sm:p-8 border transition-colors flex flex-col ${
                t.highlight
                  ? "bg-[color:var(--px-surface)] text-[color:var(--px-text)] border-[color:var(--px-accent-line)] shadow-[var(--px-lift-2)]"
                  : "bg-[color:var(--px-surface)] text-[color:var(--px-text)] border-[color:var(--px-line)] hover:border-[color:var(--px-line-2)]"
              }`}
            >
              <div className={`font-mts-wide text-[11px] tracking-[0.14em] uppercase mb-4 ${t.highlight ? "text-[color:var(--px-accent-text)]" : "text-[color:var(--px-text-4)]"}`}>
                {t.tag}
              </div>
              <h3 className="font-mts-wide text-[26px] font-bold leading-[1.1] tracking-tight mb-6">{t.name}</h3>
              <div className="mb-6">
                <span className="font-mts-wide text-[36px] font-bold tabular-nums tracking-tight">{t.price}</span>
                <span className={"font-mts-wide text-[14px] ml-2 text-[color:var(--px-text-4)]"}>/ мес</span>
              </div>
              <ul className={"font-mts-wide text-[14px] leading-[1.6] space-y-2 mb-8 text-[color:var(--px-text-2)]"}>
                <li className="flex items-start gap-2.5">
                  <span className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${t.highlight ? "bg-[color:var(--px-accent)]" : "bg-[color:var(--px-text)]"}`} />
                  <span>{t.cpu}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${t.highlight ? "bg-[color:var(--px-accent)]" : "bg-[color:var(--px-text)]"}`} />
                  <span>{t.ram}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${t.highlight ? "bg-[color:var(--px-accent)]" : "bg-[color:var(--px-text)]"}`} />
                  <span>{t.disk}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${t.highlight ? "bg-[color:var(--px-accent)]" : "bg-[color:var(--px-text)]"}`} />
                  <span>{t.net}</span>
                </li>
              </ul>
              <Link href="/subscribe" className="px-btn px-btn-md px-btn-primary px-btn-block mt-auto">
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
          <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-[color:var(--px-text-4)] mb-4">Платформа</div>
          <h2 className="font-mts-wide text-[32px] sm:text-[44px] lg:text-[56px] leading-[1.02] tracking-tight font-bold">
            Производительность<br />уровня инфраструктуры
          </h2>
          <p className="font-mts-wide text-[15px] sm:text-[16px] leading-[1.5] text-[color:var(--px-text-3)] mt-6 max-w-[58ch]">
            KVM поверх Intel Xeon Gold и AMD EPYC. Enterprise NVMe и сеть 10 Gb/s — стандарт, а не апгрейд.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <div key={f.n} className="bg-[color:var(--px-surface)] border border-[color:var(--px-line)] rounded-3xl p-6 sm:p-8 hover:border-[color:var(--px-line-2)] transition-colors">
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

      {/* OS stack */}
      <section className="px-5 sm:px-8 py-16 sm:py-24 max-w-[1200px] mx-auto w-full">
        <div className="mb-10 sm:mb-14 max-w-[720px]">
          <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-[color:var(--px-text-4)] mb-4">Поддержка ОС</div>
          <h2 className="font-mts-wide text-[32px] sm:text-[44px] leading-[1.02] tracking-tight font-bold">Любой стек</h2>
          <p className="font-mts-wide text-[15px] sm:text-[16px] leading-[1.5] text-[color:var(--px-text-3)] mt-6 max-w-[58ch]">
            Готовые шаблоны или загрузка собственного ISO. Установка из rescue-режима за два клика.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {OS_LIST.map((os) => (
            <span
              key={os}
              className="font-mts-wide text-[13px] sm:text-[14px] px-4 py-2.5 rounded-full bg-[color:var(--px-surface)] border border-[color:var(--px-line)] text-[color:var(--px-text-2)]"
            >
              {os}
            </span>
          ))}
        </div>
      </section>

      {/* Use cases */}
      <section className="px-5 sm:px-8 py-16 sm:py-24 max-w-[1200px] mx-auto w-full">
        <div className="mb-12 sm:mb-16 max-w-[720px]">
          <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-[color:var(--px-text-4)] mb-4">Сценарии</div>
          <h2 className="font-mts-wide text-[32px] sm:text-[44px] lg:text-[56px] leading-[1.02] tracking-tight font-bold">
            От pet-проектов<br />до продакшна
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {USECASES.map((u, i) => (
            <div key={u.t} className="bg-[color:var(--px-surface)] border border-[color:var(--px-line)] rounded-3xl p-6 sm:p-8 hover:border-[color:var(--px-line-2)] transition-colors">
              <div className="font-mts-wide text-[12px] font-semibold text-[color:var(--px-text-4)] mb-4">{String(i + 1).padStart(2, "0")}</div>
              <h3 className="font-mts-wide text-[20px] sm:text-[22px] font-bold leading-[1.2] tracking-tight mb-3">{u.t}</h3>
              <p className="font-mts-wide text-[14px] leading-[1.55] text-[color:var(--px-text-3)]">{u.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className="px-5 sm:px-8 py-16 sm:py-24 max-w-[900px] mx-auto w-full">
        <div className="mb-10 sm:mb-14">
          <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-[color:var(--px-text-4)] mb-4">Сравнение</div>
          <h2 className="font-mts-wide text-[32px] sm:text-[44px] leading-[1.02] tracking-tight font-bold">VPS или VDS?</h2>
        </div>
        <div className="bg-[color:var(--px-surface)] border border-[color:var(--px-line)] rounded-3xl overflow-hidden">
          <div className="hidden sm:grid grid-cols-3 px-5 sm:px-8 py-4 sm:py-5 border-b border-[color:var(--px-line)]">
            <div className="font-mts-wide text-[12px] tracking-[0.10em] uppercase text-[color:var(--px-text-4)]">Характеристика</div>
            <div className="font-mts-wide text-[12px] tracking-[0.10em] uppercase text-[color:var(--px-text)] font-semibold">VPS</div>
            <div className="font-mts-wide text-[12px] tracking-[0.10em] uppercase text-[color:var(--px-text-4)]">VDS</div>
          </div>
          {COMPARE.map(([k, a, b], i) => (
            <div
              key={k}
              className={`grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-6 px-5 sm:px-8 py-4 sm:py-5 ${i > 0 ? "border-t border-[color:var(--px-line)]" : ""}`}
            >
              <div className="font-mts-wide text-[13px] text-[color:var(--px-text-4)]">{k}</div>
              <div className="font-mts-wide text-[14px] sm:text-[15px] text-[color:var(--px-text)] font-semibold">{a}</div>
              <div className="font-mts-wide text-[14px] sm:text-[15px] text-[color:var(--px-text-3)]">{b}</div>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <Link href="/vds" className="px-link gap-2 text-[14px]">
            Подробнее о VDS
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[color:var(--px-accent)] text-[color:var(--px-text)] px-5 sm:px-8 py-20 sm:py-28 mx-2 sm:mx-3 mt-8 rounded-[28px] sm:rounded-[36px]">
        <div className="max-w-[900px] mx-auto text-center">
          <h2 className="font-mts-wide text-[36px] sm:text-[52px] lg:text-[64px] leading-[1.02] tracking-tight font-bold">
            Разверните свой VPS
          </h2>
          <p className="font-mts-wide text-[16px] sm:text-[18px] leading-[1.45] text-[color:var(--px-accent-ink)] mt-6 max-w-[46ch] mx-auto">
            От $7,99/мес. Root, NVMe и защита от DDoS — в базе.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3 sm:gap-4">
            <Link href="/subscribe" className="px-btn px-btn-md px-btn-secondary">
              Развернуть
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
            <Link href="/contact" className="px-btn px-btn-md px-btn-secondary" style={{ background: "rgba(0,0,0,0.08)", color: "#000" }}>
              Связаться
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
