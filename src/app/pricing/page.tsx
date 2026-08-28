"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * /pricing — Basic + Plus tariff page (v4 redesign).
 *
 * Full-page rebuild in the HeroV4 visual language: MTS Wide font,
 * dark hero + light comparison + dark FAQ + dark CTA, orange
 * highlight for the recommended Plus plan.
 *
 * VPS / VDS tariffs are separate products with their own /vps and
 * /vds pages — this page is only about the accelerator subscription.
 * Prices mirror src/app/api/payments/create/route.ts::PLANS exactly
 * (period 1 / 3 / 6 / 12 months → RUB total).
 */

type Period = 1 | 3 | 6 | 12;
const PERIODS: Period[] = [1, 3, 6, 12];
const PERIOD_LABEL: Record<Period, string> = {
  1:  "1 месяц",
  3:  "3 месяца",
  6:  "6 месяцев",
  12: "12 месяцев",
};
const PLANS = {
  basic: { 1: 199, 3: 499, 6: 899, 12: 1599 },
  plus:  { 1: 349, 3: 899, 6: 1499, 12: 2599 },
} as const;

function fmt(n: number) { return n.toLocaleString("ru-RU"); }

export default function PricingPage() {
  const [period, setPeriod] = useState<Period>(12);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove("light");
  }, []);

  return (
    <div className="min-h-dvh bg-black text-white flex flex-col">
      {/* ── Header (same visual as HeroV4) ── */}
      <TopBar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      {/* ── Hero ── */}
      <section className="px-5 sm:px-8 pt-10 pb-16 sm:pt-16 sm:pb-20 max-w-[1200px] mx-auto w-full">
        <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-white/45 mb-4">
          Тарифы
        </div>
        <h1 className="font-mts-wide text-[40px] sm:text-[56px] lg:text-[72px] leading-[1.02] tracking-tight font-bold max-w-[16ch]">
          Простые тарифы —<br />без сюрпризов
        </h1>
        <p className="font-mts-wide text-[16px] sm:text-[18px] leading-[1.45] text-white/55 mt-6 max-w-[52ch]">
          Два тарифа, четыре периода. Все цены в рублях, НДС включён. Отмена в один клик из личного кабинета — списываем ровно за выбранный срок.
        </p>
      </section>

      {/* ── Period selector ── */}
      <section className="px-5 sm:px-8 pb-6 max-w-[1200px] mx-auto w-full">
        <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-full border border-white/12 bg-white/[0.03] font-mts-wide text-[13px]">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-full transition-colors ${period === p ? "bg-white text-black" : "text-white/70 hover:text-white"}`}
            >
              {PERIOD_LABEL[p]}
              {p === 12 && <span className="ml-1.5 text-[11px] opacity-70">−17%</span>}
            </button>
          ))}
        </div>
      </section>

      {/* ── Plan cards ── */}
      <section className="px-5 sm:px-8 pb-20 sm:pb-24 max-w-[1200px] mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          <PlanCard plan="basic" period={period} />
          <PlanCard plan="plus"  period={period} highlighted />
        </div>
      </section>

      {/* ── Comparison table (light) ── */}
      <ComparisonSection />

      {/* ── FAQ ── */}
      <FaqSection />

      {/* ── Final CTA ── */}
      <FinalCta />

      {/* ── Footer ── */}
      <Footer />
    </div>
  );
}

// ─── TopBar ─────────────────────────────────────────────────────

function TopBar({ menuOpen, setMenuOpen }: { menuOpen: boolean; setMenuOpen: (v: boolean) => void }) {
  const links = [
    { label: "Тарифы", href: "/pricing" },
    { label: "Безопасность", href: "/security" },
    { label: "О нас", href: "/about" },
    { label: "Поддержка", href: "/contact" },
  ];
  return (
    <>
      <div className="flex items-center justify-between px-5 sm:px-8 pt-6 sm:pt-8">
        <Link href="/" className="flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M5 5 L1 1 M5 5 L5 1 M5 5 L1 5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19 5 L23 1 M19 5 L19 1 M19 5 L23 5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 19 L1 23 M5 19 L5 23 M5 19 L1 19" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19 19 L23 23 M19 19 L19 23 M19 19 L23 19" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-mts-wide text-[13px] tracking-[0.16em] uppercase text-white/85">atlas.secure</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 font-mts-wide text-[14px] text-white/70">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
          ))}
          <Link href="/auth" className="ml-3 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/15 transition-colors">Войти</Link>
        </nav>
        <button
          className="md:hidden w-10 h-10 rounded-full bg-white/8 border border-white/12 flex items-center justify-center"
          onClick={() => setMenuOpen(true)}
          aria-label="Меню"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
      </div>
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8 font-mts-wide" onClick={() => setMenuOpen(false)}>
          <button
            className="absolute top-6 right-6 w-11 h-11 rounded-full bg-white/8 border border-white/12 flex items-center justify-center"
            onClick={() => setMenuOpen(false)}
            aria-label="Закрыть"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-white text-2xl" onClick={() => setMenuOpen(false)}>{l.label}</Link>
          ))}
          <Link href="/auth" className="mt-4 px-6 py-3 rounded-full bg-white text-black text-base" onClick={() => setMenuOpen(false)}>Войти</Link>
        </div>
      )}
    </>
  );
}

// ─── PlanCard ───────────────────────────────────────────────────

const PLAN_FEATURES = {
  basic: [
    "3 устройства одновременно",
    "3 локации серверов",
    "Стабильное соединение 24/7",
    "Автопереподключение при обрыве",
    "Приоритет обычный",
  ],
  plus: [
    "10 устройств одновременно",
    "Все локации серверов",
    "Гарантированный SLA 99,98%",
    "Приоритетная поддержка от человека",
    "Персональный статический адрес",
    "Отдельная маршрутизация под игры и стриминг",
  ],
} as const;

function PlanCard({ plan, period, highlighted }: { plan: "basic" | "plus"; period: Period; highlighted?: boolean }) {
  const total = PLANS[plan][period];
  const perMonth = Math.round(total / period);
  const monthlyBase = PLANS[plan][1];
  const savings = monthlyBase * period - total;

  return (
    <div className={`relative rounded-3xl p-6 sm:p-8 lg:p-10 flex flex-col ${
      highlighted ? "bg-[#F97316] text-black" : "bg-white/[0.03] text-white border border-white/10"
    }`}>
      {highlighted && (
        <div className="absolute top-5 right-5 font-mts-wide text-[11px] font-bold uppercase tracking-[0.14em] text-black/70">
          популярный
        </div>
      )}

      <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase mb-6" style={{ color: highlighted ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.45)" }}>
        {plan === "basic" ? "Basic" : "Plus"}
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span className="font-mts-wide text-[52px] sm:text-[64px] font-bold leading-none tabular-nums tracking-tight">
          {fmt(perMonth)}
        </span>
        <span className="font-mts-wide text-[18px] font-medium" style={{ color: highlighted ? "rgba(0,0,0,0.65)" : "rgba(255,255,255,0.5)" }}>
          ₽/мес
        </span>
      </div>
      <div className="font-mts-wide text-[13px]" style={{ color: highlighted ? "rgba(0,0,0,0.65)" : "rgba(255,255,255,0.5)" }}>
        {period === 1 ? (
          <>Списывается каждый месяц</>
        ) : (
          <>
            {fmt(total)} ₽ разово за {PERIOD_LABEL[period].toLowerCase()}
            {savings > 0 && <span className="ml-2 opacity-70">· экономия {fmt(savings)} ₽</span>}
          </>
        )}
      </div>

      <div className={`my-6 sm:my-8 h-px ${highlighted ? "bg-black/15" : "bg-white/10"}`} />

      <ul className="space-y-3 mb-8">
        {PLAN_FEATURES[plan].map((f) => (
          <li key={f} className="flex items-start gap-3 font-mts-wide text-[14px] sm:text-[15px] leading-[1.4]" style={{ color: highlighted ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.85)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" style={{ color: highlighted ? "rgba(0,0,0,0.75)" : "rgba(255,255,255,0.65)" }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {f}
          </li>
        ))}
      </ul>

      <Link
        href={`/auth?plan=${plan}&period=${period}`}
        className={`mt-auto font-mts-wide inline-flex items-center justify-center gap-2 h-12 rounded-2xl font-semibold text-[15px] transition-all active:scale-[0.98] ${
          highlighted ? "bg-black text-white hover:bg-neutral-800" : "bg-white text-black hover:bg-neutral-100"
        }`}
      >
        Выбрать {plan === "basic" ? "Basic" : "Plus"}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}

// ─── Comparison table (light) ───────────────────────────────────

const COMPARE_ROWS: Array<[string, string, string]> = [
  ["Устройств одновременно",                    "3",              "10"],
  ["Локации серверов",                          "3",              "Все"],
  ["Соединение 24/7 · автопереподключение",     "check",          "check"],
  ["Персональный статический адрес",            "cross",          "check"],
  ["Отдельная маршрутизация для игр/стриминга", "cross",          "check"],
  ["Приоритетная поддержка от человека",        "cross",          "check"],
  ["Гарантированный SLA",                       "—",              "99,98%"],
];

function ComparisonSection() {
  return (
    <section className="bg-[#f5f5f0] text-[#111] px-5 sm:px-8 py-20 sm:py-28 lg:py-32">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-10 sm:mb-14 max-w-[720px]">
          <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-black/45 mb-4">
            Сравнение
          </div>
          <h2 className="font-mts-wide text-[32px] sm:text-[44px] lg:text-[56px] leading-[1.02] tracking-tight font-bold">
            Что входит<br />в каждый тариф
          </h2>
        </div>

        <div className="rounded-3xl bg-white border border-black/[0.04] overflow-hidden">
          <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)] font-mts-wide text-[13px] sm:text-[14px]">
            <div className="p-4 sm:p-5 text-black/45 font-medium tracking-[0.06em] uppercase text-[11px] sm:text-[12px]">
              Что вы получаете
            </div>
            <div className="p-4 sm:p-5 text-black/85 font-semibold text-center">Basic</div>
            <div className="p-4 sm:p-5 bg-[#F97316]/10 text-black font-semibold text-center">Plus</div>

            {COMPARE_ROWS.map((row, i) => (
              <div key={row[0]} className="contents">
                <div className={`p-4 sm:p-5 text-black/75 ${i > 0 ? "border-t border-black/[0.06]" : ""}`}>{row[0]}</div>
                {row.slice(1).map((v, j) => (
                  <div
                    key={j}
                    className={`p-4 sm:p-5 flex items-center justify-center ${i > 0 ? "border-t border-black/[0.06]" : ""} ${j === 1 ? "bg-[#F97316]/5" : ""}`}
                  >
                    <CompareCell v={v} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CompareCell({ v }: { v: string }) {
  if (v === "check") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }
  if (v === "cross" || v === "—") {
    return <span className="text-black/25 font-mts-wide text-[15px]">—</span>;
  }
  return <span className="font-mts-wide text-[14px] font-semibold text-black/85">{v}</span>;
}

// ─── FAQ ────────────────────────────────────────────────────────

const FAQ: Array<{ q: string; a: string }> = [
  { q: "Как быстро активируется подписка?",          a: "Мгновенно после оплаты. Ключ и инструкции по подключению откроются в личном кабинете, там же можно скачать приложение под нужное устройство." },
  { q: "Можно ли переключаться между тарифами?",      a: "Да. Из личного кабинета — новый тариф активируется сразу, остаток по старому пересчитывается пропорционально." },
  { q: "Работает ли на роутере?",                     a: "Да. Есть готовые прошивки для Keenetic и OpenWrt — инструкция в разделе Устройства." },
  { q: "Что с оплатой и возвратами?",                 a: "Оплата картой РФ и зарубежной, СБП. Возврат — по запросу в первые 3 дня, дальше — за неиспользованный остаток по тарифу." },
  { q: "Ведёте ли логи трафика?",                     a: "Нет. На магистрали журналируется только техническая метрика соединения — этого нужно, чтобы держать SLA. Содержимое трафика не хранится." },
];

function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="bg-black text-white px-5 sm:px-8 py-20 sm:py-28 lg:py-32">
      <div className="max-w-[900px] mx-auto">
        <div className="mb-12 sm:mb-16">
          <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-white/45 mb-4">
            Вопросы
          </div>
          <h2 className="font-mts-wide text-[32px] sm:text-[44px] lg:text-[56px] leading-[1.02] tracking-tight font-bold">
            Частые вопросы
          </h2>
        </div>
        <div className="divide-y divide-white/10 border-y border-white/10">
          {FAQ.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q}>
                <button
                  className="w-full text-left py-6 flex items-center justify-between gap-6 group"
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span className="font-mts-wide text-[17px] sm:text-[19px] font-medium leading-tight text-white group-hover:text-white transition-colors">
                    {item.q}
                  </span>
                  <span className={`w-8 h-8 shrink-0 rounded-full border border-white/15 flex items-center justify-center transition-transform ${isOpen ? "rotate-45 bg-white text-black border-white" : ""}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </button>
                <div
                  className="grid transition-all duration-300"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <p className="pb-6 pr-14 font-mts-wide text-[15px] sm:text-[16px] leading-[1.6] text-white/65">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA ──────────────────────────────────────────────────

function FinalCta() {
  return (
    <section className="bg-[#F97316] text-black px-5 sm:px-8 py-20 sm:py-28 lg:py-32">
      <div className="max-w-[900px] mx-auto text-center">
        <h2 className="font-mts-wide text-[36px] sm:text-[52px] lg:text-[72px] leading-[1.02] tracking-tight font-bold">
          Начните<br />за минуту
        </h2>
        <p className="font-mts-wide text-[16px] sm:text-[18px] leading-[1.45] text-black/70 mt-6 max-w-[42ch] mx-auto">
          Регистрация занимает 30 секунд. Никаких предоплат за пробный доступ.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3 sm:gap-4">
          <Link href="/auth" className="font-mts-wide inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-black text-white font-semibold text-[15px] hover:bg-neutral-800 transition-colors active:scale-[0.98]">
            Создать аккаунт
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </Link>
          <Link href="/contact" className="font-mts-wide inline-flex items-center gap-2 px-6 py-4 rounded-2xl border border-black/30 text-black font-semibold text-[15px] hover:bg-black/5 transition-colors">
            Поговорить с командой
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ─────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-black text-white/50 px-5 sm:px-8 py-10 sm:py-12 mt-auto border-t border-white/10">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row md:items-center gap-6 md:gap-10 font-mts-wide text-[13px]">
        <div className="flex items-center gap-2 text-white/85">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M5 5 L1 1 M5 5 L5 1 M5 5 L1 5" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            <path d="M19 5 L23 1 M19 5 L19 1 M19 5 L23 5" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            <path d="M5 19 L1 23 M5 19 L5 23 M5 19 L1 19" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            <path d="M19 19 L23 23 M19 19 L19 23 M19 19 L23 19" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="tracking-[0.14em] uppercase text-[12px]">atlas.secure</span>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/terms"    className="hover:text-white transition-colors">Условия</Link>
          <Link href="/privacy"  className="hover:text-white transition-colors">Приватность</Link>
          <Link href="/contact"  className="hover:text-white transition-colors">Поддержка</Link>
        </div>
        <div className="md:ml-auto text-white/45">
          &copy; {new Date().getFullYear()} Atlas Secure
        </div>
      </div>
    </footer>
  );
}
