"use client";

import Link from "next/link";
import LandingFooter from "@/components/LandingFooter";

/**
 * /about — company page in the v4 light shell.
 *
 * Hero → stats → principles → timeline → manifesto → registry →
 * CTA. Content preserved from the old premium-page implementation
 * (in Russian only now that the site is RU-locked). Visual language
 * matches the landing: MTS Wide, light off-white body, white
 * rounded cards, orange for the final CTA.
 */

const PRINCIPLES = [
  {
    n: "01",
    eyebrow: "Минимализм",
    t: "Приватность по дизайну",
    d: "Чего мы не собираем, того не украдут, не запросят повесткой и не утечёт. Каждое поле данных хранится только если технически необходимо для работы сервиса.",
  },
  {
    n: "02",
    eyebrow: "Строгость",
    t: "Криптографическая корректность",
    d: "Примитивы из NIST, NSA Suite B и академических работ. Никакого самодельного крипто и «экспериментальных» шифров в проде.",
  },
  {
    n: "03",
    eyebrow: "Независимость",
    t: "Юрисдикционное разнообразие",
    d: "HQ в Гонконге, партнёрская инфраструктура на трёх континентах. Ни одно правительство не может принудить раскрыть всю операцию.",
  },
  {
    n: "04",
    eyebrow: "Прозрачность",
    t: "Проверяемые утверждения",
    d: "Публикуем результаты внешних аудитов. Криптоутверждения — это конкретные алгоритмы и размеры ключей. Маркетинг следует за инженерией, а не наоборот.",
  },
];

const TIMELINE = [
  { d: "Q1 2026", t: "1 миллион пользователей", desc: "Превысили миллион активных пользователей. Расширили NOC до 24/7/365 в две смены." },
  { d: "Q3 2025", t: "Запуск ДЦ в Сиднее",       desc: "Третья континентальная юрисдикция. APAC-задержка упала ниже 15 мс." },
  { d: "Q1 2025", t: "Сертификация ISO 27001",   desc: "Сертификация после шестимесячного внешнего аудита. Действует до 2028." },
  { d: "Q3 2024", t: "Запуск ДЦ в Москве",       desc: "Локализация данных для клиентов РФ. 152-ФЗ комплаенс активирован." },
  { d: "Q1 2024", t: "Основание в Гонконге",     desc: "Atlas Secure зарегистрирована. Франкфурт — первое присутствие." },
];

const REGISTRY: Array<[string, string]> = [
  ["Штаб-квартира",   "Гонконг, КНР (SAR)"],
  ["Деятельность",    "B2B / B2C · Информационная безопасность"],
  ["Специализация",   "Защищённые сетевые решения, VPS/VDS, кибербезопасность"],
  ["Партнёрские ЦОД", "Германия · Россия · Австралия"],
  ["Класс защиты",    "Military-Grade · NSA Suite B · FIPS 140-3"],
  ["Стандарты",       "ISO/IEC 27001 · SOC 2 Type II · GDPR · 152-ФЗ"],
  ["Аптайм SLA",      "99,98% гарантированно"],
  ["Режим работы",    "NOC 24/7/365"],
  ["Основана",        "2024"],
  ["Контакт безопасности", "security@atlas.secure"],
];

export default function AboutPage() {
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
          <Link href="/auth"     className="ml-3 px-4 py-2 rounded-full bg-black text-white hover:bg-neutral-800 transition-colors">Войти</Link>
        </nav>
      </div>

      {/* Hero */}
      <section className="px-5 sm:px-8 pt-16 pb-16 sm:pt-24 sm:pb-24 max-w-[1200px] mx-auto w-full">
        <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-black/45 mb-5">
          О компании
        </div>
        <h1 className="font-mts-wide text-[40px] sm:text-[56px] lg:text-[80px] leading-[1.02] tracking-tight font-bold max-w-[14ch]">
          Безопасность —<br />не функция,<br />а архитектура
        </h1>
        <p className="font-mts-wide text-[16px] sm:text-[18px] leading-[1.5] text-black/55 mt-8 max-w-[58ch]">
          Atlas Secure — международная технологическая компания со штаб-квартирой в Гонконге. Мы работаем на пересечении криптографии, сетевой инженерии и операционной безопасности.
        </p>
      </section>

      {/* Stats */}
      <section className="px-5 sm:px-8 pb-16 sm:pb-24 max-w-[1200px] mx-auto w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[
            ["2024", "Основание"],
            ["3",    "Юрисдикции"],
            ["24/7", "NOC мониторинг"],
            ["∞",    "Приватность"],
          ].map(([v, l]) => (
            <div key={l} className="bg-white border border-black/[0.06] rounded-2xl p-5 sm:p-6">
              <div className="font-mts-wide text-[36px] sm:text-[48px] font-bold leading-none tracking-tight tabular-nums">{v}</div>
              <div className="font-mts-wide text-[12px] tracking-[0.10em] uppercase text-black/45 mt-3">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Principles */}
      <section className="px-5 sm:px-8 py-16 sm:py-24 max-w-[1200px] mx-auto w-full">
        <div className="mb-12 sm:mb-16 max-w-[720px]">
          <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-black/45 mb-4">Принципы</div>
          <h2 className="font-mts-wide text-[32px] sm:text-[44px] lg:text-[56px] leading-[1.02] tracking-tight font-bold">
            Четыре идеи<br />без компромиссов
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRINCIPLES.map((p) => (
            <div key={p.n} className="bg-white border border-black/[0.06] rounded-3xl p-6 sm:p-8 hover:border-black/[0.15] transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <span className="font-mts-wide text-[12px] font-semibold text-black/45">{p.n}</span>
                <span className="font-mts-wide text-[11px] tracking-[0.14em] uppercase text-black/45">{p.eyebrow}</span>
              </div>
              <h3 className="font-mts-wide text-[22px] sm:text-[26px] font-bold leading-[1.2] tracking-tight mb-3">{p.t}</h3>
              <p className="font-mts-wide text-[14px] sm:text-[15px] leading-[1.55] text-black/60">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="px-5 sm:px-8 py-16 sm:py-24 max-w-[900px] mx-auto w-full">
        <div className="mb-10 sm:mb-14">
          <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-black/45 mb-4">Вехи</div>
          <h2 className="font-mts-wide text-[32px] sm:text-[44px] leading-[1.02] tracking-tight font-bold">Путь компании</h2>
        </div>
        <ol className="relative border-l border-black/10 pl-6 sm:pl-8 space-y-8">
          {TIMELINE.map((e) => (
            <li key={e.d} className="relative">
              <span className="absolute -left-[29px] sm:-left-[37px] top-2 w-3 h-3 rounded-full bg-black" />
              <div className="font-mts-wide text-[12px] tracking-[0.12em] uppercase text-black/45 mb-1">{e.d}</div>
              <div className="font-mts-wide text-[18px] sm:text-[20px] font-bold leading-tight mb-1.5">{e.t}</div>
              <div className="font-mts-wide text-[14px] leading-[1.55] text-black/60">{e.desc}</div>
            </li>
          ))}
        </ol>
      </section>

      {/* Manifesto */}
      <section className="px-5 sm:px-8 py-16 sm:py-24 max-w-[900px] mx-auto w-full">
        <div className="bg-white border border-black/[0.06] rounded-3xl p-8 sm:p-12 text-center">
          <div className="font-mts-wide text-[11px] tracking-[0.14em] uppercase text-black/45 mb-6">Манифест</div>
          <blockquote className="font-mts-wide text-[22px] sm:text-[28px] lg:text-[32px] leading-[1.35] tracking-tight font-medium">
            «Шифрование — не роскошь. Это инфраструктура — такая же базовая, как электричество или вода. Мы строим трубы, а не продукты, которые через них идут».
          </blockquote>
          <div className="font-mts-wide text-[13px] tracking-[0.06em] text-black/45 mt-6">— Atlas Secure</div>
        </div>
      </section>

      {/* Registry */}
      <section className="px-5 sm:px-8 py-16 sm:py-24 max-w-[900px] mx-auto w-full">
        <div className="mb-10 sm:mb-14">
          <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-black/45 mb-4">Реквизиты</div>
          <h2 className="font-mts-wide text-[32px] sm:text-[44px] leading-[1.02] tracking-tight font-bold">Кто мы — документально</h2>
        </div>
        <div className="bg-white border border-black/[0.06] rounded-3xl overflow-hidden">
          {REGISTRY.map(([k, v], i) => (
            <div
              key={k}
              className={`flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6 px-5 sm:px-8 py-4 sm:py-5 ${i > 0 ? "border-t border-black/[0.06]" : ""}`}
            >
              <div className="font-mts-wide text-[13px] text-black/45 sm:w-[220px] shrink-0">{k}</div>
              <div className="font-mts-wide text-[14px] sm:text-[15px] text-black/85 font-medium">{v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#F97316] text-black px-5 sm:px-8 py-20 sm:py-28 mx-2 sm:mx-3 mt-8 rounded-[28px] sm:rounded-[36px]">
        <div className="max-w-[900px] mx-auto text-center">
          <h2 className="font-mts-wide text-[36px] sm:text-[52px] lg:text-[64px] leading-[1.02] tracking-tight font-bold">
            Построим вместе
          </h2>
          <p className="font-mts-wide text-[16px] sm:text-[18px] leading-[1.45] text-black/70 mt-6 max-w-[46ch] mx-auto">
            Бизнес или частный клиент — у нас есть подходящий план.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3 sm:gap-4">
            <Link href="/pricing" className="as-btn as-btn-primary as-btn-solid">
              Тарифы
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
            <Link href="/contact" className="as-btn as-btn-secondary" style={{ background: "rgba(0,0,0,0.08)", color: "#000" }}>
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
