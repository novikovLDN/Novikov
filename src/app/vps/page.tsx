"use client";

import Link from "next/link";
import { useState } from "react";
import PremiumPage from "@/components/PremiumPage";
import { useI18n } from "@/lib/i18n";

function Icon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    cpu: <><rect x="5" y="5" width="14" height="14" rx="1.5" /><rect x="8" y="8" width="8" height="8" rx="0.5" /><path d="M9 2v2M12 2v2M15 2v2M2 9h2M2 12h2M2 15h2M22 9h-2M22 12h-2M22 15h-2M9 22v-2M12 22v-2M15 22v-2" /></>,
    disk: <><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14a9 3 0 0018 0V5" /><path d="M3 12a9 3 0 0018 0" /></>,
    shield: <><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z" /><path d="M9 12l2 2 4-4" /></>,
    zap: <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a13 13 0 010 18M12 3a13 13 0 000 18" /></>,
    terminal: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 9l3 3-3 3M13 15h4" /></>,
  };
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

export default function VpsPage() {
  const { locale } = useI18n();
  const en = locale === "en";
  const [cpu, setCpu] = useState(4);
  const [ram, setRam] = useState(8);
  const [disk, setDisk] = useState(100);

  return (
    <PremiumPage>
      {/* HERO */}
      <section className="plx-hero">
        <div className="plx-hero-bg" />
        <div className="plx-hero-grid" />
        <div className="plx-wrap plx-hero-inner">
          <div className="pl-entrance pl-ed1">
            <div className="plx-eyebrow">VPS · KVM VIRTUALIZATION</div>
            <h1 className="plx-hero-title">
              {en ? "Virtual servers\nwith " : "Виртуальные\nсерверы "}
              <span className="plx-grad">{en ? "real power." : "реальной мощности."}</span>
            </h1>
            <p className="plx-hero-desc">
              {en
                ? "KVM-virtualized VPS with dedicated NVMe, guaranteed vCPU, full root access, and DDoS protection out of the box. Deploy in Frankfurt, Moscow, or Sydney in under 60 seconds."
                : "KVM-виртуализация с выделенными NVMe, гарантированными vCPU, полным root и защитой от DDoS в базе. Развёртывание во Франкфурте, Москве или Сиднее менее чем за минуту."}
            </p>
            <div className="plx-hero-actions">
              <Link href="/pricing" className="pl-cta-btn-light">{en ? "Configure VPS" : "Конфигуратор"} <span className="pl-arrow">→</span></Link>
              <Link href="/contact" className="pl-cta-btn-dark">{en ? "Talk to sales" : "Связаться"}</Link>
            </div>
          </div>

          <div className="pl-entrance pl-ed2">
            <div className="plx-config-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontFamily: "var(--pl-mono)", color: "var(--pl-t3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{en ? "Your configuration" : "Ваша конфигурация"}</div>
                <div style={{ fontSize: 11, color: "#34D399", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34D399", boxShadow: "0 0 8px rgba(52,211,153,0.6)" }} />
                  {en ? "Live preview" : "Живой предпросмотр"}
                </div>
              </div>
              <div className="plx-config-row">
                <span className="plx-config-k">vCPU</span>
                <div className="plx-config-track"><div className="plx-config-fill" style={{ width: `${(cpu / 16) * 100}%` }} /></div>
                <span className="plx-config-v">{cpu} {en ? "cores" : "ядер"}</span>
              </div>
              <div className="plx-config-row">
                <span className="plx-config-k">RAM</span>
                <div className="plx-config-track"><div className="plx-config-fill" style={{ width: `${(ram / 32) * 100}%` }} /></div>
                <span className="plx-config-v">{ram} GB</span>
              </div>
              <div className="plx-config-row">
                <span className="plx-config-k">NVMe SSD</span>
                <div className="plx-config-track"><div className="plx-config-fill" style={{ width: `${(disk / 500) * 100}%` }} /></div>
                <span className="plx-config-v">{disk} GB</span>
              </div>
              <div className="plx-config-row">
                <span className="plx-config-k">{en ? "Traffic" : "Трафик"}</span>
                <div className="plx-config-track"><div className="plx-config-fill" style={{ width: "100%" }} /></div>
                <span className="plx-config-v">∞</span>
              </div>
              <div className="plx-config-row">
                <span className="plx-config-k">DDoS</span>
                <div className="plx-config-track"><div className="plx-config-fill" style={{ width: "100%" }} /></div>
                <span className="plx-config-v">L3/4/7</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
                {[1, 2, 4, 8, 16].map((n) => (
                  <button key={n} onClick={() => { setCpu(n); setRam(n * 2); setDisk(n * 25); }} style={{ padding: "6px 14px", fontSize: 12, borderRadius: 8, border: "1px solid var(--pl-border)", background: cpu === n ? "var(--pl-accent)" : "var(--pl-surface)", color: cpu === n ? "#fff" : "var(--pl-t2)", cursor: "pointer", fontFamily: "var(--pl-mono)", transition: "all 0.15s" }}>{n}×</button>
                ))}
              </div>
              <div style={{ marginTop: 20, fontSize: 13, color: "var(--pl-t2)" }}>
                {en ? "From" : "От"} <strong style={{ fontSize: 22, color: "var(--pl-t1)", fontWeight: 500 }}>${(7.99 + cpu * 2 + ram * 0.5 + disk * 0.02).toFixed(2)}</strong> / {en ? "month" : "мес"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PERFORMANCE STATS */}
      <section style={{ padding: "0 0 80px" }}>
        <div className="plx-wrap">
          <div className="plx-stats">
            <div className="plx-stat"><div className="plx-stat-val">80k</div><div className="plx-stat-label">{en ? "NVMe IOPS" : "NVMe IOPS"}</div></div>
            <div className="plx-stat"><div className="plx-stat-val">10 Gb/s</div><div className="plx-stat-label">{en ? "Network default" : "Сеть по умолчанию"}</div></div>
            <div className="plx-stat"><div className="plx-stat-val">~60s</div><div className="plx-stat-label">{en ? "Provisioning" : "Развёртывание"}</div></div>
            <div className="plx-stat"><div className="plx-stat-val">99.98%</div><div className="plx-stat-label">{en ? "Uptime SLA" : "Аптайм SLA"}</div></div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="plx-section">
        <div className="plx-wrap">
          <div className="plx-section-head">
            <div className="plx-section-label">{en ? "Platform" : "Платформа"}</div>
            <h2 className="plx-section-title">{en ? "Infrastructure-grade performance" : "Производительность уровня инфраструктуры"}</h2>
            <p className="plx-section-desc">{en ? "Built on KVM with Intel Xeon Gold / EPYC, enterprise NVMe and 10 Gb/s networking as a baseline." : "Построено на KVM с Intel Xeon Gold / EPYC, enterprise NVMe и сетью 10 Gb/s в базе."}</p>
          </div>
          <div className="plx-fgrid">
            {[
              { i: "cpu", t: en ? "Dedicated vCPU" : "Выделенные vCPU", d: en ? "Guaranteed CPU time. No noisy neighbors, no throttling under load." : "Гарантированное процессорное время. Без соседей и throttling под нагрузкой." },
              { i: "disk", t: en ? "Enterprise NVMe" : "Enterprise NVMe", d: en ? "Samsung / Intel datacenter-grade NVMe. 80k+ IOPS sustained, microsecond latency." : "Samsung / Intel NVMe уровня ДЦ. 80k+ IOPS в устойчивом режиме, микросекундные задержки." },
              { i: "shield", t: en ? "DDoS L3/4/7" : "DDoS L3/4/7", d: en ? "Multi-layer protection included. Sub-10s detection and mitigation." : "Многоуровневая защита в базе. Обнаружение и митигация менее 10с." },
              { i: "zap", t: en ? "10 Gb/s network" : "Сеть 10 Gb/s", d: en ? "Full-duplex 10 Gb/s by default. Upgrade to 100 or 200 Gb/s on demand." : "Полнодуплекс 10 Gb/s по умолчанию. До 100 и 200 Gb/s по запросу." },
              { i: "globe", t: en ? "3 regions" : "3 региона", d: en ? "Frankfurt, Moscow, Sydney. Data sovereignty across three jurisdictions." : "Франкфурт, Москва, Сидней. Суверенитет данных в трёх юрисдикциях." },
              { i: "terminal", t: en ? "Full root + API" : "Root + API", d: en ? "Root SSH, full console access, API for automation, ISO mount supported." : "Root SSH, консоль, API для автоматизации, поддержка ISO-монтирования." },
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

      {/* OS STACK */}
      <section className="plx-section" style={{ paddingTop: 0 }}>
        <div className="plx-wrap">
          <div className="plx-section-head">
            <div className="plx-section-label">{en ? "OS support" : "Поддержка ОС"}</div>
            <h2 className="plx-section-title">{en ? "Pick any stack" : "Любой стек"}</h2>
            <p className="plx-section-desc">{en ? "Pre-built templates or upload your own ISO. Install from recovery mode in 2 clicks." : "Готовые шаблоны или свой ISO. Установка из rescue-режима в 2 клика."}</p>
          </div>
          <div className="plx-stack-row">
            {["Ubuntu 24.04", "Debian 12", "AlmaLinux 9", "Rocky Linux 9", "Fedora Server", "Arch Linux", "FreeBSD 14", "Windows Server 2022", "OpenSUSE", "Alpine Linux", "CentOS Stream", "Custom ISO"].map((os) => (
              <span key={os} className={`plx-stack-pill${os.startsWith("Ubuntu") ? " accent" : ""}`}>{os}</span>
            ))}
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="plx-section" style={{ paddingTop: 0 }}>
        <div className="plx-wrap">
          <div className="plx-section-head">
            <div className="plx-section-label">{en ? "Use cases" : "Сценарии"}</div>
            <h2 className="plx-section-title">{en ? "From side projects to production" : "От pet-проектов до продакшна"}</h2>
          </div>
          <div className="plx-usecases">
            {[
              { t: en ? "Web applications" : "Веб-приложения", d: en ? "Nginx + Node / PHP / Python stacks. Load balancers in front. Managed TLS." : "Nginx + Node / PHP / Python. Балансировщик впереди. Managed TLS." },
              { t: en ? "Databases" : "Базы данных", d: en ? "PostgreSQL, MySQL, MongoDB, Redis. NVMe IOPS shine for write-heavy workloads." : "PostgreSQL, MySQL, MongoDB, Redis. NVMe IOPS сияет на write-heavy нагрузках." },
              { t: en ? "Game servers" : "Игровые серверы", d: en ? "Low-latency region selection. Minecraft, Counter-Strike, Valheim, Rust." : "Низкая задержка по регионам. Minecraft, Counter-Strike, Valheim, Rust." },
              { t: en ? "CI/CD runners" : "CI/CD раннеры", d: en ? "GitLab / GitHub runners with predictable throughput for test suites and builds." : "GitLab / GitHub раннеры с предсказуемым throughput для тестов и сборок." },
              { t: en ? "Personal cloud" : "Личное облако", d: en ? "Nextcloud, Immich, Jellyfin, Home Assistant. Your data, your terms." : "Nextcloud, Immich, Jellyfin, Home Assistant. Ваши данные на ваших условиях." },
              { t: en ? "Dev sandboxes" : "Dev-стенды", d: en ? "Clone production on-demand. Snapshots in seconds, restore in minutes." : "Клонирование прода по требованию. Снапшоты за секунды, восстановление за минуты." },
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

      {/* COMPARISON */}
      <section className="plx-section" style={{ paddingTop: 0 }}>
        <div className="plx-wrap">
          <div className="plx-section-head">
            <div className="plx-section-label">{en ? "Compare" : "Сравнение"}</div>
            <h2 className="plx-section-title">{en ? "VPS or VDS?" : "VPS или VDS?"}</h2>
          </div>
          <div className="plx-compare">
            <div className="plx-compare-row">
              <div className="plx-compare-cell head">{en ? "Feature" : "Характеристика"}</div>
              <div className="plx-compare-cell head"><span className="plx-hl">VPS</span></div>
              <div className="plx-compare-cell head">VDS</div>
            </div>
            {[
              [en ? "Virtualization" : "Виртуализация", "KVM", en ? "Bare metal" : "Bare metal"],
              ["CPU", en ? "Shared host, guaranteed vCPU" : "Shared host, гарантированный vCPU", en ? "Dedicated physical" : "Выделенный физический"],
              [en ? "Price from" : "Цена от", "$7.99 / mo", "$29.99 / mo"],
              [en ? "Best for" : "Подходит для", en ? "Web, dev, small-medium prod" : "Веб, dev, small-medium прод", en ? "High-load, critical data" : "Высокие нагрузки, критические данные"],
              [en ? "Scaling" : "Масштабирование", en ? "Resize in seconds" : "Ресайз за секунды", en ? "Hardware swap" : "Смена железа"],
              [en ? "Isolation" : "Изоляция", en ? "Hypervisor-level" : "На уровне гипервизора", en ? "Full hardware" : "Полная аппаратная"],
            ].map((row) => (
              <div key={row[0]} className="plx-compare-row">
                <div className="plx-compare-cell k">{row[0]}</div>
                <div className="plx-compare-cell"><span className="plx-hl">{row[1]}</span></div>
                <div className="plx-compare-cell">{row[2]}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="plx-section" style={{ paddingTop: 0 }}>
        <div className="plx-wrap">
          <div className="plx-cta-box">
            <h2>{en ? "Deploy your VPS" : "Разверните свой VPS"}</h2>
            <p>{en ? "From $7.99/month. Root access, NVMe, DDoS included." : "От $7.99/мес. Root, NVMe, DDoS в базе."}</p>
            <div className="pl-cta-buttons">
              <Link href="/pricing" className="pl-cta-btn-light">{en ? "Configure" : "Конфигуратор"} <span className="pl-arrow">→</span></Link>
              <Link href="/contact" className="pl-cta-btn-dark">{en ? "Contact sales" : "Связаться"}</Link>
            </div>
          </div>
        </div>
      </section>
    </PremiumPage>
  );
}
