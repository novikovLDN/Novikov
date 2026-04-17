"use client";

import Link from "next/link";
import PremiumPage from "@/components/PremiumPage";
import { useI18n } from "@/lib/i18n";

function Icon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    server: <><rect x="3" y="4" width="18" height="6" rx="1" /><rect x="3" y="14" width="18" height="6" rx="1" /><path d="M7 7h.01M7 17h.01M11 7h6M11 17h6" /></>,
    cpu: <><rect x="5" y="5" width="14" height="14" rx="1.5" /><rect x="8" y="8" width="8" height="8" rx="0.5" /><path d="M9 2v2M12 2v2M15 2v2M2 9h2M2 12h2M2 15h2M22 9h-2M22 12h-2M22 15h-2M9 22v-2M12 22v-2M15 22v-2" /></>,
    shield: <><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" /></>,
    rack: <><rect x="4" y="3" width="16" height="18" rx="1" /><path d="M4 7h16M4 11h16M4 15h16M4 19h16M7 5h.01M7 9h.01M7 13h.01M7 17h.01" /></>,
    disk: <><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14a9 3 0 0018 0V5" /><path d="M3 12a9 3 0 0018 0" /></>,
  };
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

export default function VdsPage() {
  const { locale } = useI18n();
  const en = locale === "en";

  return (
    <PremiumPage>
      {/* HERO */}
      <section className="plx-hero">
        <div className="plx-hero-bg" />
        <div className="plx-hero-grid" />
        <div className="plx-wrap plx-hero-inner">
          <div className="pl-entrance pl-ed1">
            <div className="plx-eyebrow">VDS · BARE METAL</div>
            <h1 className="plx-hero-title">
              {en ? "Dedicated metal.\n" : "Выделенное железо.\n"}
              <span className="plx-grad">{en ? "Zero neighbors." : "Ноль соседей."}</span>
            </h1>
            <p className="plx-hero-desc">
              {en
                ? "Full physical server. No hypervisor overhead, no noisy neighbors, no shared cache lines. Intel Xeon Scalable or AMD EPYC with enterprise NVMe and up to 200 Gb/s networking."
                : "Полный физический сервер. Без оверхеда гипервизора, без соседей, без общих cache-линий. Intel Xeon Scalable или AMD EPYC, enterprise NVMe и сеть до 200 Gb/s."}
            </p>
            <div className="plx-hero-actions">
              <Link href="/pricing" className="pl-cta-btn-light">{en ? "Configure VDS" : "Конфигуратор"} <span className="pl-arrow">→</span></Link>
              <Link href="/contact" className="pl-cta-btn-dark">{en ? "Talk to engineer" : "Написать инженеру"}</Link>
            </div>
          </div>

          {/* Server rack visual */}
          <div className="pl-entrance pl-ed2">
            <div style={{ border: "1px solid var(--pl-border)", borderRadius: 20, background: "var(--pl-surface)", padding: 24, boxShadow: "0 30px 80px -20px rgba(0,0,0,0.6)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontFamily: "var(--pl-mono)", color: "var(--pl-t3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{en ? "Rack R-07 · Frankfurt" : "Стойка R-07 · Франкфурт"}</div>
                <div style={{ fontSize: 11, color: "#34D399", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34D399", boxShadow: "0 0 8px rgba(52,211,153,0.6)" }} />
                  {en ? "Online" : "Онлайн"}
                </div>
              </div>
              <svg viewBox="0 0 360 300" style={{ width: "100%", height: "auto", display: "block" }}>
                <defs>
                  <linearGradient id="rackGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="#18181B" />
                    <stop offset="1" stopColor="#111113" />
                  </linearGradient>
                </defs>
                {/* Rack frame */}
                <rect x="40" y="20" width="280" height="260" rx="4" fill="url(#rackGrad)" stroke="rgba(255,255,255,0.08)" />
                {/* Units */}
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <g key={i}>
                    <rect x="50" y={32 + i * 30} width="260" height="26" rx="3" fill="#0A0A0B" stroke="rgba(255,255,255,0.05)" />
                    {/* LEDs */}
                    <circle cx="64" cy={45 + i * 30} r="2.5" fill={i === 2 ? "#5E6AD2" : "#34D399"} opacity={i === 7 ? "0.3" : "1"}>
                      {i === 2 && <animate attributeName="opacity" values="0.3;1;0.3" dur="1.8s" repeatCount="indefinite" />}
                    </circle>
                    <circle cx="74" cy={45 + i * 30} r="2.5" fill="#34D399" opacity={i === 7 ? "0.3" : "1"} />
                    {/* Label */}
                    <text x="86" y={48 + i * 30} fontFamily="var(--pl-mono)" fontSize="9" fill="#55555A" letterSpacing="0.08em">
                      {i === 2 ? "YOUR-VDS-07  · EPYC 9354P · 128 GB · 2×NVMe 3.84 TB" : `NODE-${String(i + 1).padStart(2, "0")}`}
                    </text>
                    {/* Port */}
                    {[0, 1, 2, 3].map((p) => (
                      <rect key={p} x={270 + p * 8} y={42 + i * 30} width="5" height="8" rx="1" fill={p < 3 ? "#34D399" : "#333"} opacity={i === 2 ? "1" : "0.4"} />
                    ))}
                  </g>
                ))}
                {/* Highlight your unit */}
                <rect x="48" y={92 - 2} width="264" height="30" rx="4" fill="none" stroke="#5E6AD2" strokeWidth="1" opacity="0.5" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* HARDWARE STATS */}
      <section style={{ padding: "0 0 80px" }}>
        <div className="plx-wrap">
          <div className="plx-stats">
            <div className="plx-stat"><div className="plx-stat-val">EPYC 9K</div><div className="plx-stat-label">{en ? "Latest Zen 4c" : "Новейший Zen 4c"}</div></div>
            <div className="plx-stat"><div className="plx-stat-val">200 Gb/s</div><div className="plx-stat-label">{en ? "Max network" : "Макс. сеть"}</div></div>
            <div className="plx-stat"><div className="plx-stat-val">300k</div><div className="plx-stat-label">{en ? "NVMe RAID IOPS" : "NVMe RAID IOPS"}</div></div>
            <div className="plx-stat"><div className="plx-stat-val">1 TB</div><div className="plx-stat-label">{en ? "Max RAM" : "Макс. RAM"}</div></div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="plx-section">
        <div className="plx-wrap">
          <div className="plx-section-head">
            <div className="plx-section-label">{en ? "Hardware" : "Железо"}</div>
            <h2 className="plx-section-title">{en ? "What you actually get" : "Что реально получаете"}</h2>
            <p className="plx-section-desc">{en ? "Not abstractions, not shares — physical components that belong to your workload." : "Не абстракции, не доли — физические компоненты, принадлежащие вашей нагрузке."}</p>
          </div>
          <div className="plx-fgrid">
            {[
              { i: "cpu", t: en ? "Dedicated CPU" : "Выделенный CPU", d: en ? "Intel Xeon Gold 6xxx or AMD EPYC 9xxx. Up to 64 physical cores. Full performance counters." : "Intel Xeon Gold 6xxx или AMD EPYC 9xxx. До 64 физических ядер. Полный доступ к счётчикам." },
              { i: "lock", t: en ? "Hardware isolation" : "Аппаратная изоляция", d: en ? "No shared hypervisor. Your threads, caches, and memory bus. Sensitive workloads' safest home." : "Никакого общего гипервизора. Ваши потоки, кэши, шина памяти. Безопасный дом для чувствительных нагрузок." },
              { i: "disk", t: en ? "NVMe RAID 10" : "NVMe RAID 10", d: en ? "Enterprise NVMe in RAID 10 by default. 300k+ IOPS, redundancy, hot-swap." : "Enterprise NVMe в RAID 10 по умолчанию. 300k+ IOPS, избыточность, hot-swap." },
              { i: "shield", t: en ? "DDoS baseline" : "DDoS в базе", d: en ? "Scrubbing center in front. Mitigates L3/4/7 attacks up to terabit scale." : "Центр фильтрации впереди. Митигирует L3/4/7 атаки до терабитного масштаба." },
              { i: "server", t: en ? "IPMI / KVM" : "IPMI / KVM", d: en ? "Out-of-band management. Reinstall any OS, mount ISO, power-cycle without support." : "Out-of-band управление. Любая ОС, монтирование ISO, power-cycle без поддержки." },
              { i: "rack", t: en ? "Private VLAN" : "Приватный VLAN", d: en ? "Connect multiple VDS on a private L2 network. Perfect for clusters and HA pairs." : "Объедините несколько VDS в приватной L2-сети. Для кластеров и HA-пар." },
            ].map((f) => (
              <div key={f.t} className="plx-fcard">
                <div className="plx-fcard-icon"><Icon name={f.i} /></div>
                <h3>{f.t}</h3>
                <p>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CPU generations */}
      <section className="plx-section" style={{ paddingTop: 0 }}>
        <div className="plx-wrap">
          <div className="plx-section-head">
            <div className="plx-section-label">{en ? "CPU generations" : "Поколения CPU"}</div>
            <h2 className="plx-section-title">{en ? "Latest silicon, always" : "Всегда свежий кремний"}</h2>
          </div>
          <div className="plx-proto">
            {[
              { n: "EPYC 9354P", b: "REC", d: en ? "32-core Zen 4c. 360W TDP. Up to 128 PCIe 5.0 lanes." : "32 ядра Zen 4c. 360W TDP. До 128 PCIe 5.0 линий.", k: "TDP", v: "360W" },
              { n: "EPYC 9554", b: "HPC", d: en ? "64 cores / 128 threads. Best for multi-tenant DB and HPC clusters." : "64 ядра / 128 потоков. Для multi-tenant БД и HPC-кластеров.", k: "Cores", v: "64" },
              { n: "Xeon Gold 6548Y", b: "AVX-512", d: en ? "Sapphire Rapids. 32 cores with AVX-512 and AMX for ML inference." : "Sapphire Rapids. 32 ядра, AVX-512 и AMX для ML-инференса.", k: "AMX", v: "yes" },
              { n: "Xeon 6430", b: "BALANCED", d: en ? "32 cores. All-round workhorse for web and databases." : "32 ядра. Универсальная рабочая лошадка для веба и БД.", k: "GHz", v: "2.1/3.4" },
            ].map((p) => (
              <div key={p.n} className="plx-proto-card">
                <div className="plx-proto-name">{p.n}<span className={`plx-proto-badge ${p.b === "REC" ? "rec" : ""}`}>{p.b}</span></div>
                <div className="plx-proto-desc">{p.d}</div>
                <div className="plx-proto-spec"><span>{p.k}</span><span>{p.v}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="plx-section" style={{ paddingTop: 0 }}>
        <div className="plx-wrap">
          <div className="plx-section-head">
            <div className="plx-section-label">{en ? "Ideal workloads" : "Идеальные нагрузки"}</div>
            <h2 className="plx-section-title">{en ? "When bare metal wins" : "Когда выигрывает bare metal"}</h2>
          </div>
          <div className="plx-usecases">
            {[
              { t: en ? "High-load databases" : "Нагруженные БД", d: en ? "PostgreSQL / Cassandra / ClickHouse with unpredictable query patterns and large shared buffers." : "PostgreSQL / Cassandra / ClickHouse с непредсказуемыми запросами и большими буферами." },
              { t: en ? "ML inference" : "ML инференс", d: en ? "AVX-512 / AMX-accelerated inference without GPU cost. CPU-only LLM serving." : "AVX-512 / AMX ускоренный инференс без стоимости GPU. LLM на CPU." },
              { t: en ? "Financial trading" : "Финтрейдинг", d: en ? "Microsecond-predictable latency. No hypervisor jitter for HFT-adjacent workloads." : "Микросекундная предсказуемость. Без джиттера гипервизора для HFT-задач." },
              { t: en ? "Enterprise ERP" : "Enterprise ERP", d: en ? "SAP, Oracle, 1C — workloads that demand certified hardware and full isolation." : "SAP, Oracle, 1С — нагрузки, требующие сертифицированного железа и полной изоляции." },
              { t: en ? "Compliance workloads" : "Compliance-задачи", d: en ? "PCI-DSS, HIPAA, 152-FZ. Physical isolation satisfies most strict auditors." : "PCI-DSS, HIPAA, 152-ФЗ. Физическая изоляция устраивает строжайших аудиторов." },
              { t: en ? "Render farms" : "Рендер-фермы", d: en ? "Sustained 100% CPU for hours. No throttling, no noisy neighbors, predictable ETA." : "100% CPU часами. Без throttling и соседей, предсказуемое ETA." },
            ].map((u, i) => (
              <div key={u.t} className="plx-uc">
                <div className="plx-uc-num">{String(i + 1).padStart(2, "0")}</div>
                <h3>{u.t}</h3>
                <p>{u.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="plx-section" style={{ paddingTop: 0 }}>
        <div className="plx-wrap">
          <div className="plx-cta-box">
            <h2>{en ? "Claim your metal" : "Заберите своё железо"}</h2>
            <p>{en ? "From $29.99/month. Full hardware, full control, zero compromises." : "От $29.99/мес. Полное железо, полный контроль, без компромиссов."}</p>
            <div className="pl-cta-buttons">
              <Link href="/pricing" className="pl-cta-btn-light">{en ? "Configure" : "Конфигуратор"} <span className="pl-arrow">→</span></Link>
              <Link href="/contact" className="pl-cta-btn-dark">{en ? "Custom build" : "Кастомная сборка"}</Link>
            </div>
          </div>
        </div>
      </section>
    </PremiumPage>
  );
}
