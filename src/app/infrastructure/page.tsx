"use client";

import Link from "next/link";
import SiteHeader from "@/components/pixel/SiteHeader";
import SiteFooter from "@/components/pixel/SiteFooter";
import { CITY_COUNT, COUNTRY_COUNT, plural } from "@/lib/locations";

/**
 * /infrastructure — technical marketing page in the v4 light shell.
 *
 * Rhythm: top bar → hero → stats → data-center cards → network
 * feature cards → registry (spec sheet) → orange CTA → footer.
 * Every technical claim (Tier ratings, peering fabrics, PUE,
 * latency, uptime SLA) is preserved verbatim from the source.
 */

const DATACENTERS = [
  {
    region: "EU",
    city: "Франкфурт",
    country: "Germany",
    facility: "Tier IV · Equinix FR5",
    rows: [
      ["Комплаенс",   "GDPR · BSI C5 · ISO 27001"],
      ["Пиринг",      "DE-CIX · 10 Tbps+"],
      ["Питание",     "100% возобновляемое · PUE 1.3"],
      ["Резерв",      "2N UPS · N+1 охлаждение"],
      ["Задержка в EU", "< 3 мс"],
    ] as Array<[string, string]>,
  },
  {
    region: "RU",
    city: "Москва",
    country: "Russia",
    facility: "Tier III+ · M9",
    rows: [
      ["Комплаенс",     "152-ФЗ · ФСТЭК · ГОСТ"],
      ["Пиринг",        "MSK-IX · 8 Tbps"],
      ["Питание",       "2N дизельный резерв"],
      ["Резерв",        "2N питание · N+1 охлаждение"],
      ["Задержка в RU", "< 5 мс"],
    ] as Array<[string, string]>,
  },
  {
    region: "APAC",
    city: "Сидней",
    country: "Australia",
    facility: "Tier III · NEXTDC S2",
    rows: [
      ["Комплаенс",       "Privacy Act · ASD ISM · SOC 2"],
      ["Пиринг",          "AMS-IX Pacific · Megaport"],
      ["Питание",         "2N UPS · N+2 охлаждение"],
      ["Покрытие",        "APAC · JP · SG · NZ"],
      ["Задержка в APAC", "< 15 мс"],
    ] as Array<[string, string]>,
  },
];

const NETWORK_FEATURES = [
  {
    t: "Пропускная способность",
    d: "До 200 Gb/s на сервер. Двойной аплинк, BGP Anycast, переключение регионов менее 30 секунд.",
  },
  {
    t: "Задержка",
    d: "Менее 5 мс в регионе. Оптимизированный пиринг с DE-CIX, AMS-IX, MSK-IX, Megaport.",
  },
  {
    t: "SLA аптайм",
    d: "99.98% гарантированно. Кредиты начисляются автоматически при любом нарушении в течение месяца.",
  },
  {
    t: "DDoS-защита",
    d: "Terabit-scale фильтрация апстрим. L3/L4/L7 защита, активация менее 10 секунд.",
  },
  {
    t: "Мониторинг",
    d: "Независимый Prometheus, синтетические пробы с 12 континентов, RUM-мониторинг.",
  },
  {
    t: "NOC 24/7/365",
    d: "Tier-2 инженеры круглосуточно. Реакция на инцидент менее 15 минут.",
  },
];

const REGISTRY: Array<[string, string]> = [
  ["Штаб-квартира",    "Гонконг, КНР (SAR)"],
  // Опорные ЦОД и сеть локаций — разные величины: первых три, вторых
  // девятнадцать стран. Число стран берётся из src/lib/locations.ts.
  ["Страны присутствия", `${COUNTRY_COUNT} ${plural(COUNTRY_COUNT, ["страна", "страны", "стран"])} · ${CITY_COUNT} ${plural(CITY_COUNT, ["город", "города", "городов"])}`],
  ["Опорные ЦОД",      "Франкфурт · Москва · Сидней"],
  ["Скорость канала",   "25 Гбит/с на Basic · 75 Гбит/с на Plus"],
  ["Задержка в регионе",     "< 5 мс"],
  ["Аптайм SLA",             "99.98% гарантированно"],
  ["Маршрутизация",     "BGP Anycast, двойной аплинк"],
  ["Точки обмена",           "DE-CIX · MSK-IX · AMS-IX Pacific · Megaport"],
  ["Стандарты",              "ISO/IEC 27001 · SOC 2 Type II · BSI C5 · GDPR · 152-ФЗ · ФСТЭК"],
  ["Питание",                "2N UPS, N+1/N+2 охлаждение, дизельный резерв"],
  ["Режим работы",           "NOC 24/7/365 · реакция < 15 мин"],
];

// Map dots for the world silhouette — coordinates preserved verbatim.
const MAP_DOTS = {
  na: [[120, 150], [140, 150], [160, 150], [180, 160], [200, 170], [120, 170], [140, 170], [160, 170], [100, 190], [120, 190], [140, 190], [160, 190], [180, 190], [140, 210], [160, 210], [180, 210], [200, 210], [180, 230], [200, 230], [220, 230]],
  sa: [[260, 280], [280, 280], [260, 300], [280, 300], [300, 320], [280, 320], [280, 340], [300, 340], [280, 360], [300, 360]],
  eu: [[480, 140], [500, 140], [520, 140], [540, 140], [480, 160], [500, 160], [520, 160], [540, 160], [560, 160], [580, 160], [500, 180], [520, 180], [540, 180], [560, 180], [580, 180]],
  af: [[500, 220], [520, 220], [540, 220], [500, 240], [520, 240], [540, 240], [560, 240], [520, 260], [540, 260], [520, 280], [540, 280], [520, 300], [540, 300], [520, 320]],
  as: [[600, 140], [620, 140], [640, 140], [660, 140], [680, 140], [700, 140], [720, 140], [740, 140], [760, 140], [620, 160], [640, 160], [660, 160], [680, 160], [700, 160], [720, 160], [740, 160], [640, 180], [660, 180], [680, 180], [700, 180], [720, 180], [740, 180], [660, 200], [680, 200], [700, 200], [720, 200], [740, 200], [680, 220], [700, 220], [720, 220]],
  au: [[800, 300], [820, 300], [840, 300], [820, 320], [840, 320], [800, 320]],
};

const DC_NODES = [
  { x: 505, y: 155, name: "Франкфурт", label: "FRA" },
  { x: 595, y: 140, name: "Москва",    label: "MOW" },
  { x: 825, y: 295, name: "Сидней",    label: "SYD" },
];

export default function InfrastructurePage() {
  return (
    <div className="px-page">
      <div className="px-grid-bg" aria-hidden />
      <SiteHeader />
      <div className="px-header-spacer" aria-hidden />

      {/* Hero */}
      <section className="px-5 sm:px-8 pt-16 pb-16 sm:pt-24 sm:pb-24 max-w-[1200px] mx-auto w-full">
        <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-[color:var(--px-text-4)] mb-5">
          Инфраструктура
        </div>
        <h1 className="font-mts-wide text-[40px] sm:text-[56px] lg:text-[80px] leading-[1.02] tracking-tight font-bold max-w-[14ch]">
          {COUNTRY_COUNT} стран.<br />Один стандарт.
        </h1>
        <p className="font-mts-wide text-[16px] sm:text-[18px] leading-[1.5] text-[color:var(--px-text-3)] mt-8 max-w-[58ch]">
          Сеть присутствия в {COUNTRY_COUNT} странах и {CITY_COUNT}{" "}
          {plural(CITY_COUNT, ["городе", "городах", "городах"])} стоит
          на трёх опорных дата-центрах — в Европе, России и АТР. Объекты Tier III+,
          резервирование питания 2N, carrier-neutral пиринг, on-site операции 24/7/365.
        </p>
      </section>

      {/* Stats */}
      <section className="px-5 sm:px-8 pb-16 sm:pb-24 max-w-[1200px] mx-auto w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[
            [String(COUNTRY_COUNT), "Стран присутствия"],
            ["< 5 мс",   "Задержка в регионе"],
            ["99.98%",   "Аптайм SLA"],
            ["24/7",     "NOC дежурит"],
          ].map(([v, l]) => (
            <div key={l} className="bg-[color:var(--px-surface)] border border-[color:var(--px-line)] rounded-2xl p-5 sm:p-6">
              <div className="font-mts-wide text-[32px] sm:text-[44px] font-bold leading-none tracking-tight tabular-nums">{v}</div>
              <div className="font-mts-wide text-[12px] tracking-[0.10em] uppercase text-[color:var(--px-text-4)] mt-3">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* World map card */}
      <section className="px-5 sm:px-8 pb-16 sm:pb-24 max-w-[1200px] mx-auto w-full">
        <div className="bg-[color:var(--px-surface)] border border-[color:var(--px-line)] rounded-3xl p-6 sm:p-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <div className="font-mts-wide text-[11px] tracking-[0.14em] uppercase text-[color:var(--px-text-4)] mb-3">Присутствие</div>
              <h2 className="font-mts-wide text-[22px] sm:text-[28px] font-bold leading-tight">Три опорные точки</h2>
            </div>
            <div className="font-mts-wide text-[12px] tracking-[0.10em] uppercase text-[color:var(--px-text-4)]">FRA · MOW · SYD</div>
          </div>

          <div className="w-full overflow-x-auto">
            <svg viewBox="0 0 1000 500" className="w-full min-w-[720px] h-auto" role="img" aria-label="Карта присутствия">
              {/* Continent dots */}
              <g fill="rgba(0,0,0,0.14)">
                {MAP_DOTS.na.map(([x, y], i) => <circle key={`na${i}`} cx={x} cy={y} r="1.5" />)}
                {MAP_DOTS.sa.map(([x, y], i) => <circle key={`sa${i}`} cx={x} cy={y} r="1.5" />)}
                {MAP_DOTS.eu.map(([x, y], i) => <circle key={`eu${i}`} cx={x} cy={y} r="1.5" />)}
                {MAP_DOTS.af.map(([x, y], i) => <circle key={`af${i}`} cx={x} cy={y} r="1.5" />)}
                {MAP_DOTS.as.map(([x, y], i) => <circle key={`as${i}`} cx={x} cy={y} r="1.5" />)}
                {MAP_DOTS.au.map(([x, y], i) => <circle key={`au${i}`} cx={x} cy={y} r="1.5" />)}
              </g>

              {/* Connection lines between DCs */}
              <g stroke="currentColor" strokeWidth="1" fill="none" opacity="0.35" strokeDasharray="3 4">
                <path d="M505 155 Q550 120 595 140" />
                <path d="M505 155 Q665 225 825 295" />
                <path d="M595 140 Q710 220 825 295" />
              </g>

              {/* DC nodes */}
              {DC_NODES.map((dc) => (
                <g key={dc.name}>
                  <circle cx={dc.x} cy={dc.y} r="18" fill="rgba(0,0,0,0.08)" />
                  <circle cx={dc.x} cy={dc.y} r="10" fill="rgba(0,0,0,0.20)" />
                  <circle cx={dc.x} cy={dc.y} r="5" fill="#111" stroke="#fff" strokeWidth="1.5" />
                  <text x={dc.x} y={dc.y - 24} textAnchor="middle" className="font-mts-wide" fontSize="11" fill="#111" fontWeight="600" letterSpacing="1">{dc.label}</text>
                  <text x={dc.x} y={dc.y + 34} textAnchor="middle" className="font-mts-wide" fontSize="12" fill="rgba(0,0,0,0.6)">{dc.name}</text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </section>

      {/* DC cards */}
      <section className="px-5 sm:px-8 py-16 sm:py-24 max-w-[1200px] mx-auto w-full">
        <div className="mb-12 sm:mb-16 max-w-[720px]">
          <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-[color:var(--px-text-4)] mb-4">Объекты</div>
          <h2 className="font-mts-wide text-[32px] sm:text-[44px] lg:text-[56px] leading-[1.02] tracking-tight font-bold">
            Где работают<br />ваши нагрузки
          </h2>
          <p className="font-mts-wide text-[15px] sm:text-[17px] leading-[1.55] text-[color:var(--px-text-3)] mt-6 max-w-[58ch]">
            Carrier-neutral объекты Tier III+ с сертифицированным комплаенсом для каждой юрисдикции.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DATACENTERS.map((dc) => (
            <div key={dc.city} className="bg-[color:var(--px-surface)] border border-[color:var(--px-line)] rounded-3xl p-6 sm:p-8 hover:border-[color:var(--px-line-2)] transition-colors flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <span className="font-mts-wide text-[11px] tracking-[0.14em] uppercase text-[color:var(--px-text-4)]">{dc.region}</span>
                <span className="font-mts-wide text-[11px] tracking-[0.10em] uppercase text-[color:var(--px-text-4)] inline-flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-black" />
                  Работает
                </span>
              </div>
              <div className="font-mts-wide text-[22px] sm:text-[24px] font-bold leading-tight">{dc.city}</div>
              <div className="font-mts-wide text-[12px] text-[color:var(--px-text-4)] uppercase tracking-[0.10em] mt-1 mb-2">{dc.country}</div>
              <div className="font-mts-wide text-[13px] text-[color:var(--px-text-2)] mb-6">{dc.facility}</div>

              <div className="border-t border-[color:var(--px-line)] pt-4 space-y-3 flex-1">
                {dc.rows.map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-3">
                    <span className="font-mts-wide text-[12px] text-[color:var(--px-text-4)] shrink-0">{k}</span>
                    <span className="font-mts-wide text-[13px] text-[color:var(--px-text)] font-medium text-right">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Network feature cards */}
      <section className="px-5 sm:px-8 py-16 sm:py-24 max-w-[1200px] mx-auto w-full">
        <div className="mb-12 sm:mb-16 max-w-[720px]">
          <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-[color:var(--px-text-4)] mb-4">Сеть</div>
          <h2 className="font-mts-wide text-[32px] sm:text-[44px] lg:text-[56px] leading-[1.02] tracking-tight font-bold">
            Спроектировано<br />жить
          </h2>
          <p className="font-mts-wide text-[15px] sm:text-[17px] leading-[1.55] text-[color:var(--px-text-3)] mt-6 max-w-[58ch]">
            BGP Anycast маршрутизация, два аплинка, переключение между регионами менее 30 секунд.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {NETWORK_FEATURES.map((f, i) => (
            <div key={f.t} className="bg-[color:var(--px-surface)] border border-[color:var(--px-line)] rounded-3xl p-6 sm:p-8 hover:border-[color:var(--px-line-2)] transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <span className="font-mts-wide text-[12px] font-semibold text-[color:var(--px-text-4)] tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <span className="h-px flex-1 bg-black/10" />
              </div>
              <h3 className="font-mts-wide text-[20px] sm:text-[22px] font-bold leading-[1.2] tracking-tight mb-3">{f.t}</h3>
              <p className="font-mts-wide text-[14px] sm:text-[15px] leading-[1.55] text-[color:var(--px-text-3)]">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Registry — full spec sheet */}
      <section className="px-5 sm:px-8 py-16 sm:py-24 max-w-[900px] mx-auto w-full">
        <div className="mb-10 sm:mb-14">
          <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-[color:var(--px-text-4)] mb-4">Спецификация</div>
          <h2 className="font-mts-wide text-[32px] sm:text-[44px] leading-[1.02] tracking-tight font-bold">
            Инфраструктура —<br />документально
          </h2>
        </div>
        <div className="bg-[color:var(--px-surface)] border border-[color:var(--px-line)] rounded-3xl overflow-hidden">
          {REGISTRY.map(([k, v], i) => (
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

      {/* Final CTA */}
      <section className="bg-[color:var(--px-accent)] text-[color:var(--px-text)] px-5 sm:px-8 py-20 sm:py-28 mx-2 sm:mx-3 mt-8 rounded-[28px] sm:rounded-[36px]">
        <div className="max-w-[900px] mx-auto text-center">
          <h2 className="font-mts-wide text-[36px] sm:text-[52px] lg:text-[64px] leading-[1.02] tracking-tight font-bold">
            Разверните глобально
          </h2>
          <p className="font-mts-wide text-[16px] sm:text-[18px] leading-[1.45] text-[color:var(--px-text-2)] mt-6 max-w-[46ch] mx-auto">
            Один аккаунт, три континента. Выберите регион под своих пользователей.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3 sm:gap-4">
            <Link href="/pricing" className="px-btn px-btn-md px-btn-primary">
              Тарифы
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
            <Link href="/contact" className="px-btn px-btn-md px-btn-secondary" style={{ background: "rgba(0,0,0,0.08)", color: "#000" }}>
              Связаться с NOC
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
