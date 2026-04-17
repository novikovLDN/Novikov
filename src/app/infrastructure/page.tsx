"use client";

import Link from "next/link";
import PremiumPage from "@/components/PremiumPage";
import { useI18n } from "@/lib/i18n";

const DCS = [
  { x: 505, y: 155, name: "Frankfurt", label: "FRA" },
  { x: 595, y: 140, name: "Moscow", label: "MOW" },
  { x: 825, y: 295, name: "Sydney", label: "SYD" },
];

export default function InfrastructurePage() {
  const { locale } = useI18n();
  const en = locale === "en";

  return (
    <PremiumPage>
      {/* HERO */}
      <section className="plx-hero">
        <div className="plx-hero-bg" />
        <div className="plx-hero-grid" />
        <div className="plx-wrap plx-hero-wide">
          <div className="pl-entrance pl-ed1">
            <div className="plx-eyebrow">{en ? "INFRASTRUCTURE" : "ИНФРАСТРУКТУРА"}</div>
            <h1 className="plx-hero-title">
              {en ? "Three jurisdictions.\n" : "Три юрисдикции.\n"}
              <span className="plx-grad">{en ? "One standard." : "Один стандарт."}</span>
            </h1>
            <p className="plx-hero-desc">
              {en
                ? "Partner data centers across Europe, APAC, and Russia. Tier III+ facilities, 2N power redundancy, carrier-neutral peering, 24/7/365 on-site operations."
                : "Партнёрские дата-центры в Европе, АТР и России. Объекты Tier III+, резервирование питания 2N, carrier-neutral пиринг, on-site операции 24/7/365."}
            </p>
          </div>
        </div>
      </section>

      {/* WORLD MAP */}
      <section style={{ padding: "0 0 100px" }}>
        <div className="plx-wrap">
          <div className="plx-map-wrap">
            <svg viewBox="0 0 1000 500" className="plx-map-svg">
              {/* Dot-grid world silhouette — simplified continent patches */}
              <g fill="rgba(255,255,255,0.12)">
                {/* North America */}
                {[[120, 150], [140, 150], [160, 150], [180, 160], [200, 170], [120, 170], [140, 170], [160, 170], [100, 190], [120, 190], [140, 190], [160, 190], [180, 190], [140, 210], [160, 210], [180, 210], [200, 210], [180, 230], [200, 230], [220, 230]].map(([x, y], i) => <circle key={`na${i}`} cx={x} cy={y} r="1.5" />)}
                {/* South America */}
                {[[260, 280], [280, 280], [260, 300], [280, 300], [300, 320], [280, 320], [280, 340], [300, 340], [280, 360], [300, 360]].map(([x, y], i) => <circle key={`sa${i}`} cx={x} cy={y} r="1.5" />)}
                {/* Europe */}
                {[[480, 140], [500, 140], [520, 140], [540, 140], [480, 160], [500, 160], [520, 160], [540, 160], [560, 160], [580, 160], [500, 180], [520, 180], [540, 180], [560, 180], [580, 180]].map(([x, y], i) => <circle key={`eu${i}`} cx={x} cy={y} r="1.5" />)}
                {/* Africa */}
                {[[500, 220], [520, 220], [540, 220], [500, 240], [520, 240], [540, 240], [560, 240], [520, 260], [540, 260], [520, 280], [540, 280], [520, 300], [540, 300], [520, 320]].map(([x, y], i) => <circle key={`af${i}`} cx={x} cy={y} r="1.5" />)}
                {/* Asia */}
                {[[600, 140], [620, 140], [640, 140], [660, 140], [680, 140], [700, 140], [720, 140], [740, 140], [760, 140], [620, 160], [640, 160], [660, 160], [680, 160], [700, 160], [720, 160], [740, 160], [640, 180], [660, 180], [680, 180], [700, 180], [720, 180], [740, 180], [660, 200], [680, 200], [700, 200], [720, 200], [740, 200], [680, 220], [700, 220], [720, 220]].map(([x, y], i) => <circle key={`as${i}`} cx={x} cy={y} r="1.5" />)}
                {/* Australia */}
                {[[800, 300], [820, 300], [840, 300], [820, 320], [840, 320], [800, 320]].map(([x, y], i) => <circle key={`au${i}`} cx={x} cy={y} r="1.5" />)}
              </g>

              {/* Connection lines between DCs */}
              <g stroke="#5E6AD2" strokeWidth="1" fill="none" opacity="0.4" strokeDasharray="3 4">
                <path d="M505 155 Q550 120 595 140" />
                <path d="M505 155 Q665 225 825 295" />
                <path d="M595 140 Q710 220 825 295" />
              </g>

              {/* DC nodes with pulse */}
              {DCS.map((dc) => (
                <g key={dc.name} className="plx-map-node">
                  <circle cx={dc.x} cy={dc.y} r="18" fill="rgba(94,106,210,0.15)" className="plx-map-pulse" />
                  <circle cx={dc.x} cy={dc.y} r="10" fill="rgba(94,106,210,0.3)" />
                  <circle cx={dc.x} cy={dc.y} r="5" fill="#5E6AD2" stroke="#fff" strokeWidth="1" />
                  <text x={dc.x} y={dc.y - 24} textAnchor="middle" className="plx-map-label">{dc.label}</text>
                  <text x={dc.x} y={dc.y + 34} textAnchor="middle" fontFamily="Inter" fontSize="12" fill="#F2F2F2" fontWeight="500">{dc.name}</text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </section>

      {/* DC CARDS */}
      <section className="plx-section" style={{ paddingTop: 0 }}>
        <div className="plx-wrap">
          <div className="plx-section-head">
            <div className="plx-section-label">{en ? "Facilities" : "Объекты"}</div>
            <h2 className="plx-section-title">{en ? "Where your workloads run" : "Где работают ваши нагрузки"}</h2>
            <p className="plx-section-desc">{en ? "Carrier-neutral, Tier III+ facilities with certified compliance for each jurisdiction." : "Carrier-neutral объекты Tier III+ с сертифицированным комплаенсом для каждой юрисдикции."}</p>
          </div>
          <div className="plx-dcgrid">
            {[
              {
                flag: "🇩🇪 EU", title: "Frankfurt, DE", sub: "Tier IV · Equinix FR5",
                rows: [
                  ["Compliance", "GDPR · BSI C5 · ISO 27001"],
                  ["Peering", "DE-CIX · 10 Tbps+"],
                  ["Power", "100% renewable · PUE 1.3"],
                  ["Redundancy", "2N UPS · N+1 cooling"],
                  ["Latency → EU", "< 3 ms"],
                ],
              },
              {
                flag: "🇷🇺 RU", title: en ? "Moscow, RU" : "Москва, RU", sub: "Tier III+ · M9",
                rows: [
                  ["Compliance", "152-ФЗ · ФСТЭК · ГОСТ"],
                  ["Peering", "MSK-IX · 8 Tbps"],
                  ["Power", "2N diesel backup"],
                  ["Redundancy", "2N power · N+1 cooling"],
                  ["Latency → RU", "< 5 ms"],
                ],
              },
              {
                flag: "🇦🇺 APAC", title: "Sydney, AU", sub: "Tier III · NEXTDC S2",
                rows: [
                  ["Compliance", "Privacy Act · ASD ISM · SOC 2"],
                  ["Peering", "AMS-IX Pacific · Megaport"],
                  ["Power", "2N UPS · N+2 cooling"],
                  ["Coverage", "APAC · JP · SG · NZ"],
                  ["Latency → APAC", "< 15 ms"],
                ],
              },
            ].map((dc) => (
              <div key={dc.title} className="plx-dc">
                <div className="plx-dc-flag">{dc.flag}</div>
                <div className="plx-dc-title">{dc.title}</div>
                <div className="plx-dc-sub">{dc.sub}</div>
                {dc.rows.map(([k, v]) => (
                  <div key={k} className="plx-dc-row"><span className="plx-dc-k">{k}</span><span className="plx-dc-v">{v}</span></div>
                ))}
                <div className="plx-dc-status">{en ? "Operational" : "Работает"}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ padding: "0 0 100px" }}>
        <div className="plx-wrap">
          <div className="plx-stats">
            <div className="plx-stat"><div className="plx-stat-val">200 Gb/s</div><div className="plx-stat-label">{en ? "Per-server bandwidth" : "На сервер"}</div></div>
            <div className="plx-stat"><div className="plx-stat-val">&lt; 5 ms</div><div className="plx-stat-label">{en ? "Regional latency" : "Задержка в регионе"}</div></div>
            <div className="plx-stat"><div className="plx-stat-val">99.98%</div><div className="plx-stat-label">{en ? "Uptime SLA" : "Аптайм SLA"}</div></div>
            <div className="plx-stat"><div className="plx-stat-val">24/7</div><div className="plx-stat-label">{en ? "NOC staffed" : "NOC дежурит"}</div></div>
          </div>
        </div>
      </section>

      {/* NETWORK TOPOLOGY */}
      <section className="plx-section" style={{ paddingTop: 0 }}>
        <div className="plx-wrap">
          <div className="plx-section-head">
            <div className="plx-section-label">{en ? "Network" : "Сеть"}</div>
            <h2 className="plx-section-title">{en ? "Designed to stay up" : "Спроектировано жить"}</h2>
            <p className="plx-section-desc">{en ? "BGP Anycast routing, dual-carrier uplinks, sub-30s failover between regions." : "BGP Anycast маршрутизация, два аплинка, переключение между регионами менее 30с."}</p>
          </div>
          <div style={{ border: "1px solid var(--pl-border)", borderRadius: 20, background: "var(--pl-surface)", padding: 40 }}>
            <svg viewBox="0 0 900 360" className="plx-topo">
              <defs>
                <linearGradient id="topoCore" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0" stopColor="#5E6AD2" stopOpacity="0" />
                  <stop offset="0.5" stopColor="#5E6AD2" />
                  <stop offset="1" stopColor="#5E6AD2" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Core backbone */}
              <line x1="150" y1="180" x2="750" y2="180" stroke="url(#topoCore)" strokeWidth="2" />
              {/* DC nodes */}
              {[
                { x: 150, y: 180, label: "FRA", role: "Core" },
                { x: 450, y: 180, label: "MOW", role: "Core" },
                { x: 750, y: 180, label: "SYD", role: "Core" },
              ].map((n) => (
                <g key={n.label}>
                  <circle cx={n.x} cy={n.y} r="36" className="plx-topo-node-acc" />
                  <text x={n.x} y={n.y + 4} textAnchor="middle" fontFamily="var(--pl-mono)" fontSize="11" fill="#F2F2F2" fontWeight="500">{n.label}</text>
                  <text x={n.x} y={n.y - 48} textAnchor="middle" fontFamily="var(--pl-mono)" fontSize="9" fill="#8A8A8E" letterSpacing="0.08em">{n.role.toUpperCase()}</text>
                </g>
              ))}
              {/* Edge / peering nodes */}
              {[
                { x: 80, y: 80, l: "DE-CIX" }, { x: 220, y: 80, l: "AMS-IX" },
                { x: 380, y: 80, l: "MSK-IX" }, { x: 520, y: 80, l: "IX.ru" },
                { x: 680, y: 80, l: "Megaport" }, { x: 820, y: 80, l: "AMS-IX Pac" },
                { x: 80, y: 280, l: "Cloudflare" }, { x: 220, y: 280, l: "Google" },
                { x: 380, y: 280, l: "Yandex" }, { x: 520, y: 280, l: "VK" },
                { x: 680, y: 280, l: "AWS" }, { x: 820, y: 280, l: "Azure" },
              ].map((n) => (
                <g key={n.l}>
                  <circle cx={n.x} cy={n.y} r="18" className="plx-topo-node" />
                  <text x={n.x} y={n.y + 3} textAnchor="middle" fontFamily="var(--pl-mono)" fontSize="8" fill="#8A8A8E">{n.l}</text>
                </g>
              ))}
              {/* Lines to edge */}
              {[[150, 80], [150, 280], [450, 80], [450, 280], [750, 80], [750, 280]].map(([cx, cy], i) => (
                <line key={i} x1={cx} y1={cy === 80 ? 100 : 260} x2={cx} y2={cy === 80 ? 150 : 210} className="plx-topo-line" />
              ))}
              {/* Peering dashes */}
              {[[80, 80, 150, 150], [220, 80, 150, 150], [380, 80, 450, 150], [520, 80, 450, 150], [680, 80, 750, 150], [820, 80, 750, 150], [80, 280, 150, 210], [220, 280, 150, 210], [380, 280, 450, 210], [520, 280, 450, 210], [680, 280, 750, 210], [820, 280, 750, 210]].map(([x1, y1, x2, y2], i) => (
                <line key={i} x1={x1} y1={y1 === 80 ? 98 : 262} x2={x2} y2={y2} className="plx-topo-line" />
              ))}
            </svg>
          </div>
        </div>
      </section>

      {/* NETWORK SPECS */}
      <section className="plx-section" style={{ paddingTop: 0 }}>
        <div className="plx-wrap">
          <div className="plx-fgrid">
            {[
              { t: en ? "Bandwidth" : "Пропускная способность", d: en ? "Up to 200 Gb/s per server. Dual-carrier uplinks with BGP Anycast and sub-30s regional failover." : "До 200 Gb/s на сервер. Двойной аплинк, BGP Anycast, переключение регионов < 30с." },
              { t: en ? "Latency" : "Задержка", d: en ? "< 5 ms within region. Optimized peering with DE-CIX, AMS-IX, MSK-IX, Megaport." : "< 5 мс в регионе. Оптимизированный пиринг с DE-CIX, AMS-IX, MSK-IX, Megaport." },
              { t: en ? "Uptime SLA" : "SLA аптайм", d: en ? "99.98% guaranteed. Credits issued automatically for any breach within the month." : "99.98% гарантированно. Кредиты автоматически при нарушении в течение месяца." },
              { t: en ? "DDoS shield" : "DDoS щит", d: en ? "Terabit-scale scrubbing upstream. L3/L4/L7 protection with sub-10s activation." : "Terabit-scale фильтрация апстрим. L3/L4/L7 защита, активация < 10с." },
              { t: en ? "Monitoring" : "Мониторинг", d: en ? "Independent Prometheus, synthetic probes from 12 continents, real-user monitoring." : "Независимый Prometheus, синтетика с 12 континентов, RUM-мониторинг." },
              { t: "NOC 24/7/365", d: en ? "Tier-2 engineers on shift around the clock. < 15 minute incident response." : "Tier-2 инженеры круглосуточно. Реакция на инцидент < 15 минут." },
            ].map((f) => (
              <div key={f.t} className="plx-fcard">
                <div className="plx-fcard-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a13 13 0 010 18" /></svg>
                </div>
                <h3>{f.t}</h3>
                <p>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="plx-section" style={{ paddingTop: 0 }}>
        <div className="plx-wrap">
          <div className="plx-cta-box">
            <h2>{en ? "Deploy globally" : "Разверните глобально"}</h2>
            <p>{en ? "One account, three continents. Pick the region that fits your users." : "Один аккаунт, три континента. Выберите регион под пользователей."}</p>
            <div className="pl-cta-buttons">
              <Link href="/pricing" className="pl-cta-btn-light">{en ? "View pricing" : "Тарифы"} <span className="pl-arrow">→</span></Link>
              <Link href="/contact" className="pl-cta-btn-dark">{en ? "Talk to NOC" : "Связаться с NOC"}</Link>
            </div>
          </div>
        </div>
      </section>
    </PremiumPage>
  );
}
