"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import HeroV4 from "@/components/HeroV4";
import DeviceGallerySection from "@/components/DeviceGallerySection";
import ThreePillarsSection from "@/components/ThreePillarsSection";
import PricingPreviewSection from "@/components/PricingPreviewSection";

function AtlasLogo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5,5 L1,1 M5,5 L5,1 M5,5 L1,5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19,5 L23,1 M19,5 L19,1 M19,5 L23,5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5,19 L1,23 M5,19 L5,23 M5,19 L1,19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19,19 L23,23 M19,19 L19,23 M19,19 L23,19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function LandingPage({ referralCode }: { referralCode?: string }) {
  const authUrl = referralCode ? `/auth?ref=${referralCode}` : "/auth";
  const { t, locale } = useI18n();

  useEffect(() => {
    document.documentElement.classList.add("premium-page");
    return () => document.documentElement.classList.remove("premium-page");
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("pl-visible"); obs.unobserve(e.target); }
      }),
      { threshold: 0.08, rootMargin: "0px 0px -60px 0px" }
    );
    document.querySelectorAll(".pl-reveal").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="premium-landing bg-[#f5f5f0]">
      {/* ═══ HERO v4 — new design (provod.ai-inspired) ═══ */}
      <HeroV4 />

      {/* ═══ Section 2 — Device support (dark) ═══ */}
      <DeviceGallerySection />

      {/* ═══ Section 3 — Three pillars (light) ═══ */}
      <ThreePillarsSection />

      {/* ═══ Section 4 — Pricing preview (dark) ═══ */}
      <PricingPreviewSection />
      {/* End of v4 redesign block — old marketing sections continue below */}

      {/* ═══ LOGOS / STATS strip ═══ */}
      <section className="pl-strip pl-reveal">
        <div className="pl-strip-inner">
          <div className="pl-strip-item"><span className="pl-strip-val">3+</span><span className="pl-strip-label">{t("stats.dc")}</span></div>
          <div className="pl-strip-item"><span className="pl-strip-val">200 Gb/s</span><span className="pl-strip-label">{t("stats.bw")}</span></div>
          <div className="pl-strip-item"><span className="pl-strip-val">256-bit</span><span className="pl-strip-label">{t("stats.enc")}</span></div>
          <div className="pl-strip-item"><span className="pl-strip-val">99.98%</span><span className="pl-strip-label">{t("stats.sla")}</span></div>
          <div className="pl-strip-item"><span className="pl-strip-val">24/7</span><span className="pl-strip-label">{t("stats.noc")}</span></div>
        </div>
      </section>

      {/* ═══ BIG STATEMENT — like Linear's "A new species..." ═══ */}
      <section className="pl-statement pl-reveal">
        <div className="pl-statement-inner">
          <h2 className="pl-statement-text">
            <span className="pl-statement-white">{t("statement.white")}</span>{" "}
            <span className="pl-statement-muted">{t("statement.muted")}</span>
          </h2>
        </div>
      </section>

      {/* ═══ 3-CARD ISOMETRIC — detailed, animated ═══ */}
      <section className="pl-figures pl-reveal">
        <div className="pl-figures-inner">

          {/* ── Card 1: Server Platform ── */}
          <div className="pl-fig-card">
            <div className="pl-fig-label">FIG 0.1</div>
            <div className="pl-fig-illustration">
              <svg viewBox="0 0 320 260" fill="none" className="pl-iso-svg">
                {/* Base platform with dotted grid */}
                <path d="M160,230 L290,165 L160,100 L30,165 Z" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
                <line x1="63" y1="148" x2="257" y2="148" stroke="currentColor" strokeWidth="0.3" opacity="0.05" strokeDasharray="2 6" />
                <line x1="63" y1="165" x2="257" y2="165" stroke="currentColor" strokeWidth="0.3" opacity="0.05" strokeDasharray="2 6" />
                <line x1="63" y1="182" x2="257" y2="182" stroke="currentColor" strokeWidth="0.3" opacity="0.05" strokeDasharray="2 6" />
                <line x1="95" y1="132" x2="95" y2="198" stroke="currentColor" strokeWidth="0.3" opacity="0.04" strokeDasharray="2 6" />
                <line x1="160" y1="100" x2="160" y2="230" stroke="currentColor" strokeWidth="0.3" opacity="0.04" strokeDasharray="2 6" />
                <line x1="225" y1="132" x2="225" y2="198" stroke="currentColor" strokeWidth="0.3" opacity="0.04" strokeDasharray="2 6" />
                {/* Layer 1 */}
                <g className="pl-iso-l pl-iso-l1">
                  <path d="M160,210 L275,152 L160,94 L45,152 Z" stroke="currentColor" strokeWidth="0.6" opacity="0.15" />
                  <path d="M45,152 L45,160 L160,218 L275,160 L275,152" stroke="currentColor" strokeWidth="0.5" opacity="0.08" />
                  <path d="M160,210 L160,218" stroke="currentColor" strokeWidth="0.5" opacity="0.08" />
                  <line x1="80" y1="152" x2="240" y2="152" stroke="currentColor" strokeWidth="0.3" opacity="0.06" className="pl-fl" />
                </g>
                {/* Layer 2 */}
                <g className="pl-iso-l pl-iso-l2">
                  <path d="M160,190 L255,140 L160,90 L65,140 Z" stroke="currentColor" strokeWidth="0.6" opacity="0.2" />
                  <path d="M65,140 L65,147 L160,197 L255,147 L255,140" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
                  <path d="M160,190 L160,197" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
                  <line x1="95" y1="140" x2="225" y2="140" stroke="currentColor" strokeWidth="0.3" opacity="0.07" className="pl-fl" />
                  <line x1="105" y1="133" x2="215" y2="133" stroke="currentColor" strokeWidth="0.3" opacity="0.05" className="pl-fl" />
                </g>
                {/* Layer 3 */}
                <g className="pl-iso-l pl-iso-l3">
                  <path d="M160,172 L235,130 L160,88 L85,130 Z" stroke="currentColor" strokeWidth="0.6" opacity="0.25" />
                  <path d="M85,130 L85,136 L160,178 L235,136 L235,130" stroke="currentColor" strokeWidth="0.5" opacity="0.12" />
                  <path d="M160,172 L160,178" stroke="currentColor" strokeWidth="0.5" opacity="0.12" />
                  <ellipse cx="160" cy="130" rx="35" ry="18" stroke="currentColor" strokeWidth="0.5" opacity="0.12" />
                  <ellipse cx="160" cy="130" rx="20" ry="10" stroke="currentColor" strokeWidth="0.4" opacity="0.08" />
                </g>
                {/* Layer 4 */}
                <g className="pl-iso-l pl-iso-l4">
                  <path d="M160,155 L218,120 L160,85 L102,120 Z" stroke="currentColor" strokeWidth="0.6" opacity="0.3" />
                  <path d="M102,120 L102,125 L160,160 L218,125 L218,120" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
                  <path d="M160,155 L160,160" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
                  <ellipse cx="160" cy="120" rx="25" ry="13" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
                  <path d="M150,116 C153,108 167,108 170,116" stroke="currentColor" strokeWidth="0.5" opacity="0.1" fill="none" />
                  <line x1="140" y1="120" x2="180" y2="120" stroke="currentColor" strokeWidth="0.3" opacity="0.08" className="pl-fl" />
                </g>
                {/* Layer 5 — top cap */}
                <g className="pl-iso-l pl-iso-l5">
                  <path d="M160,138 L200,110 L160,82 L120,110 Z" stroke="currentColor" strokeWidth="0.7" opacity="0.35" />
                  <path d="M120,110 L120,113 L160,141 L200,113 L200,110" stroke="currentColor" strokeWidth="0.5" opacity="0.18" />
                  <path d="M160,138 L160,141" stroke="currentColor" strokeWidth="0.5" opacity="0.18" />
                </g>
              </svg>
            </div>
            <h3 className="pl-fig-title">{t("fig1.title")}</h3>
            <p className="pl-fig-desc">{t("fig1.desc")}</p>
          </div>

          {/* ── Card 2: Distributed Hex Cluster ── */}
          <div className="pl-fig-card">
            <div className="pl-fig-label">FIG 0.2</div>
            <div className="pl-fig-illustration">
              <svg viewBox="0 0 320 260" fill="none" className="pl-iso-svg">
                {/* Large cube — bottom center */}
                <g className="pl-hex-main">
                  <path d="M160,140 L210,165 L160,190 L110,165 Z" stroke="currentColor" strokeWidth="0.7" opacity="0.3" />
                  <path d="M110,165 L110,205 L160,230 L160,190 Z" stroke="currentColor" strokeWidth="0.6" opacity="0.18" />
                  <path d="M210,165 L210,205 L160,230 L160,190 Z" stroke="currentColor" strokeWidth="0.6" opacity="0.12" />
                  <polygon points="160,140 210,165 160,190 110,165" fill="currentColor" opacity="0.03" />
                  <circle cx="160" cy="165" r="3" fill="currentColor" opacity="0.08" className="pl-glow" />
                </g>
                {/* Medium cube — upper right */}
                <g className="pl-hex-med">
                  <path d="M230,85 L268,105 L230,125 L192,105 Z" stroke="currentColor" strokeWidth="0.6" opacity="0.25" />
                  <path d="M192,105 L192,135 L230,155 L230,125 Z" stroke="currentColor" strokeWidth="0.5" opacity="0.14" />
                  <path d="M268,105 L268,135 L230,155 L230,125 Z" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
                  <polygon points="230,85 268,105 230,125 192,105" fill="currentColor" opacity="0.02" />
                  <circle cx="230" cy="105" r="2.5" fill="currentColor" opacity="0.06" className="pl-glow" />
                </g>
                {/* Small cube — upper left */}
                <g className="pl-hex-sm">
                  <path d="M95,70 L123,85 L95,100 L67,85 Z" stroke="currentColor" strokeWidth="0.6" opacity="0.2" />
                  <path d="M67,85 L67,108 L95,123 L95,100 Z" stroke="currentColor" strokeWidth="0.5" opacity="0.12" />
                  <path d="M123,85 L123,108 L95,123 L95,100 Z" stroke="currentColor" strokeWidth="0.5" opacity="0.08" />
                  <polygon points="95,70 123,85 95,100 67,85" fill="currentColor" opacity="0.02" />
                  <circle cx="95" cy="85" r="2" fill="currentColor" opacity="0.06" className="pl-glow" />
                </g>
                {/* Connection lines */}
                <line x1="135" y1="155" x2="200" y2="120" stroke="currentColor" strokeWidth="0.4" opacity="0.1" />
                <line x1="120" y1="150" x2="100" y2="110" stroke="currentColor" strokeWidth="0.4" opacity="0.1" />
                <line x1="115" y1="95" x2="200" y2="100" stroke="currentColor" strokeWidth="0.4" opacity="0.08" />
                {/* Flow dots on connections */}
                <circle cx="168" cy="137" r="1.5" fill="currentColor" className="pl-flow-dot pl-fd1" opacity="0.08" />
                <circle cx="110" cy="130" r="1.5" fill="currentColor" className="pl-flow-dot pl-fd2" opacity="0.08" />
                <circle cx="155" cy="98" r="1.5" fill="currentColor" className="pl-flow-dot pl-fd3" opacity="0.08" />
                {/* Tiny floating cube */}
                <g opacity="0.12">
                  <path d="M175,60 L190,68 L175,76 L160,68 Z" stroke="currentColor" strokeWidth="0.5" />
                  <path d="M160,68 L160,78 L175,86 L175,76 Z" stroke="currentColor" strokeWidth="0.4" />
                  <path d="M190,68 L190,78 L175,86 L175,76 Z" stroke="currentColor" strokeWidth="0.4" />
                </g>
              </svg>
            </div>
            <h3 className="pl-fig-title">{t("fig2.title")}</h3>
            <p className="pl-fig-desc">{t("fig2.desc")}</p>
          </div>

          {/* ── Card 3: Speed / Data Layers ── */}
          <div className="pl-fig-card">
            <div className="pl-fig-label">FIG 0.3</div>
            <div className="pl-fig-illustration">
              <svg viewBox="0 0 320 260" fill="none" className="pl-iso-svg">
                {/* Vertical server structure — left side */}
                <g className="pl-rack">
                  <path d="M60,60 L60,220 L100,240 L100,80 Z" stroke="currentColor" strokeWidth="0.6" opacity="0.2" fill="none" />
                  <path d="M100,80 L100,240 L110,235 L110,75 Z" stroke="currentColor" strokeWidth="0.5" opacity="0.12" fill="none" />
                  {/* Shelf lines inside rack */}
                  {[0,1,2,3,4,5,6,7,8].map((i) => (
                    <line key={`shelf-${i}`} x1="60" y1={80 + i * 18} x2="100" y2={100 + i * 18} stroke="currentColor" strokeWidth="0.4" opacity="0.1" />
                  ))}
                </g>
                {/* Horizontal data bars extending right */}
                <g className="pl-speed-lines">
                  {[0,1,2,3,4,5,6,7].map((i) => (
                    <g key={`bar-${i}`} className={`pl-speed-bar pl-sb${i}`}>
                      <line x1="110" y1={88 + i * 20} x2={180 + (i % 3) * 30 + (i % 2) * 20} y2={88 + i * 20} stroke="currentColor" strokeWidth="0.6" opacity={0.08 + i * 0.025} />
                      <rect x="110" y={84 + i * 20} width={70 + (i % 3) * 30 + (i % 2) * 20} height="8" rx="1" stroke="currentColor" strokeWidth="0.5" opacity={0.06 + i * 0.02} fill="none" />
                    </g>
                  ))}
                </g>
                {/* Stacked panels — right side */}
                <g className="pl-panels">
                  <g className="pl-panel-stack">
                    <rect x="200" y="155" width="80" height="60" rx="2" stroke="currentColor" strokeWidth="0.6" opacity="0.2" fill="none" />
                    <line x1="200" y1="170" x2="280" y2="170" stroke="currentColor" strokeWidth="0.3" opacity="0.08" />
                    <line x1="215" y1="178" x2="265" y2="178" stroke="currentColor" strokeWidth="0.3" opacity="0.06" />
                    <line x1="215" y1="186" x2="250" y2="186" stroke="currentColor" strokeWidth="0.3" opacity="0.06" />
                  </g>
                  <g className="pl-panel-stack" style={{ transform: 'translateY(-18px)' }}>
                    <rect x="200" y="155" width="80" height="60" rx="2" stroke="currentColor" strokeWidth="0.5" opacity="0.15" fill="none" />
                  </g>
                  <g className="pl-panel-stack" style={{ transform: 'translateY(-36px)' }}>
                    <rect x="200" y="155" width="80" height="60" rx="2" stroke="currentColor" strokeWidth="0.4" opacity="0.1" fill="none" />
                  </g>
                </g>
              </svg>
            </div>
            <h3 className="pl-fig-title">{t("fig3.title")}</h3>
            <p className="pl-fig-desc">{t("fig3.desc")}</p>
          </div>

        </div>
      </section>

      {/* ═══ FEATURE 1 — Encryption (two-col + visual) ═══ */}
      <section id="tech" className="pl-feature">
        <div className="pl-feature-inner pl-reveal">
          <div className="pl-feature-left">
            <h2 className="pl-feature-title">{t("enc.title")}</h2>
          </div>
          <div className="pl-feature-right">
            <p className="pl-feature-desc">{t("enc.desc")}</p>
            <Link href="#tech-detail" className="pl-arrow-link">
              <span className="pl-arrow-ver">2.0</span>
              {t("enc.link")} <span className="pl-arrow">&rarr;</span>
            </Link>
          </div>
        </div>
        <div className="pl-feature-visual pl-reveal" id="tech-detail">
          <div className="pl-mock-full">
            {/* Left: crypto config terminal */}
            <div className="pl-mock-panel">
              <div className="pl-terminal" style={{ border: 'none', borderRadius: 0 }}>
                <div className="pl-terminal-bar">
                  <span className="pl-dot pl-dot-r" /><span className="pl-dot pl-dot-y" /><span className="pl-dot pl-dot-g" />
                  <span className="pl-terminal-title">crypto_config.conf</span>
                </div>
                <div className="pl-terminal-body">
                  <div className="pl-code-comment"># Primary encryption stack</div>
                  <div className="pl-code-line"><span className="pl-code-k">cipher</span><span className="pl-code-v">AES-256-GCM</span></div>
                  <div className="pl-code-line"><span className="pl-code-k">fallback_cipher</span><span className="pl-code-v">CHACHA20-POLY1305</span></div>
                  <div className="pl-code-line"><span className="pl-code-k">key_length</span><span className="pl-code-v">256</span><span className="pl-code-c"># bits</span></div>
                  <div className="pl-code-spacer" />
                  <div className="pl-code-comment"># Key exchange</div>
                  <div className="pl-code-line"><span className="pl-code-k">kex_algo</span><span className="pl-code-v">ECDHE</span></div>
                  <div className="pl-code-line"><span className="pl-code-k">curve</span><span className="pl-code-v">X25519</span></div>
                  <div className="pl-code-line"><span className="pl-code-k">pfs</span><span className="pl-code-g">ENABLED</span></div>
                  <div className="pl-code-spacer" />
                  <div className="pl-code-comment"># Protection</div>
                  <div className="pl-code-line"><span className="pl-code-k">tls_version</span><span className="pl-code-v">TLS 1.3</span><span className="pl-code-c"># only</span></div>
                  <div className="pl-code-line"><span className="pl-code-k">kill_switch</span><span className="pl-code-g">ENABLED</span></div>
                  <div className="pl-code-line"><span className="pl-code-k">dns_leak_protect</span><span className="pl-code-g">ENABLED</span></div>
                </div>
              </div>
            </div>
            {/* Right: live datacenter monitoring */}
            <div className="pl-mock-panel pl-mock-monitor">
              <div className="pl-monitor-header">
                <span className="pl-monitor-title">Network Monitoring</span>
                <span className="pl-monitor-live"><span className="pl-live-dot" />Live</span>
              </div>
              <div className="pl-monitor-nodes">
                <div className="pl-node-row">
                  <span className="pl-node-flag">DE</span>
                  <span className="pl-node-name">Frankfurt</span>
                  <span className="pl-node-bar"><span className="pl-bar-fill" style={{ width: '95%' }} /><span className="pl-bar-ping">2ms</span></span>
                  <span className="pl-node-speed">74.2 Gb/s</span>
                </div>
                <div className="pl-node-row">
                  <span className="pl-node-flag">RU</span>
                  <span className="pl-node-name">Moscow</span>
                  <span className="pl-node-bar"><span className="pl-bar-fill" style={{ width: '88%' }} /><span className="pl-bar-ping">4ms</span></span>
                  <span className="pl-node-speed">71.8 Gb/s</span>
                </div>
                <div className="pl-node-row">
                  <span className="pl-node-flag">AU</span>
                  <span className="pl-node-name">Sydney</span>
                  <span className="pl-node-bar"><span className="pl-bar-fill" style={{ width: '82%' }} /><span className="pl-bar-ping">8ms</span></span>
                  <span className="pl-node-speed">68.4 Gb/s</span>
                </div>
              </div>
              <div className="pl-monitor-graph">
                <div className="pl-graph-label">Throughput — last 24h</div>
                <svg viewBox="0 0 400 80" className="pl-graph-svg">
                  <path d="M0,60 C30,58 60,40 100,42 S160,20 200,25 S260,35 300,15 S360,30 400,10" stroke="#5E6AD2" strokeWidth="1.5" fill="none" opacity="0.6" />
                  <path d="M0,60 C30,58 60,40 100,42 S160,20 200,25 S260,35 300,15 S360,30 400,10 L400,80 L0,80 Z" fill="url(#graphGrad)" opacity="0.15" />
                  <defs><linearGradient id="graphGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5E6AD2" /><stop offset="100%" stopColor="transparent" /></linearGradient></defs>
                </svg>
              </div>
              <div className="pl-monitor-metrics">
                <div className="pl-metric"><span className="pl-metric-val">214.4</span><span className="pl-metric-unit">Gb/s total</span></div>
                <div className="pl-metric"><span className="pl-metric-val">99.98%</span><span className="pl-metric-unit">uptime</span></div>
                <div className="pl-metric"><span className="pl-metric-val">4.7ms</span><span className="pl-metric-unit">avg latency</span></div>
              </div>
            </div>
            <div className="pl-panel-fade" />
          </div>
        </div>
      </section>

      {/* ═══ FEATURE 2 — Solutions (two-col) ═══ */}
      <section id="services" className="pl-feature">
        <div className="pl-feature-inner pl-reveal">
          <div className="pl-feature-left">
            <h2 className="pl-feature-title">{t("sol.title")}</h2>
          </div>
          <div className="pl-feature-right">
            <p className="pl-feature-desc">{t("sol.desc")}</p>
            <Link href={authUrl} className="pl-arrow-link">
              <span className="pl-arrow-ver">3.0</span>
              {t("sol.link")} <span className="pl-arrow">&rarr;</span>
            </Link>
          </div>
        </div>
        {/* Full-width solutions visual */}
        <div className="pl-feature-visual pl-reveal">
          <div className="pl-mock-full">
            {/* Left: service catalog */}
            <div className="pl-mock-panel pl-mock-catalog">
              <div className="pl-catalog-title">Service Catalog</div>
              <div className="pl-catalog-items">
                {[
                  { icon: "vpn", label: "Secure Tunneling", count: "3 locations", active: true },
                  { icon: "vps", label: "Virtual Servers", count: "12 instances" },
                  { icon: "vds", label: "Dedicated Servers", count: "4 nodes" },
                  { icon: "ddos", label: "DDoS Protection", count: "L3/L4/L7" },
                  { icon: "soc", label: "SOC Monitoring", count: "24/7" },
                ].map((item) => (
                  <div key={item.label} className={`pl-catalog-item${item.active ? " pl-cat-active" : ""}`}>
                    <span className="pl-cat-icon" />
                    <div className="pl-cat-info">
                      <span className="pl-cat-label">{item.label}</span>
                      <span className="pl-cat-count">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Right: deployment timeline */}
            <div className="pl-mock-panel pl-mock-timeline">
              <div className="pl-timeline-header">
                <span>Deployment Timeline</span>
                <span style={{ fontSize: 12, color: 'var(--pl-t3)' }}>Q1 2026 — Q3 2026</span>
              </div>
              <div className="pl-timeline-months">
                {["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG"].map((m) => (
                  <span key={m} className="pl-tl-month">{m}</span>
                ))}
              </div>
              <div className="pl-timeline-rows">
                <div className="pl-tl-row">
                  <span className="pl-tl-label">Frankfurt Expansion</span>
                  <div className="pl-tl-bar" style={{ left: '5%', width: '35%', background: '#5E6AD2' }} />
                </div>
                <div className="pl-tl-row">
                  <span className="pl-tl-label">Moscow Tier IV Upgrade</span>
                  <div className="pl-tl-bar" style={{ left: '20%', width: '30%', background: '#818CF8' }} />
                </div>
                <div className="pl-tl-row">
                  <span className="pl-tl-label">Sydney PoP Launch</span>
                  <div className="pl-tl-bar" style={{ left: '40%', width: '25%', background: '#06B6D4' }} />
                </div>
                <div className="pl-tl-row">
                  <span className="pl-tl-label">Zero Trust v2.0</span>
                  <div className="pl-tl-bar" style={{ left: '55%', width: '40%', background: '#34D399' }} />
                </div>
              </div>
            </div>
            <div className="pl-panel-fade" />
          </div>
        </div>

        <div className="pl-services-grid pl-reveal">
          {([["01","srv1"],["02","srv2"],["03","srv3"],["04","srv4"],["05","srv5"],["06","srv6"]] as const).map(([n, k]) => (
            <div key={n} className="pl-srv-card">
              <span className="pl-srv-num">{n}</span>
              <h3 className="pl-srv-title">{t(`${k}.t`)}</h3>
              <p className="pl-srv-desc">{t(`${k}.d`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURE 3 — Infrastructure ═══ */}
      <section id="infra" className="pl-feature">
        <div className="pl-feature-inner pl-reveal">
          <div className="pl-feature-left">
            <h2 className="pl-feature-title">{t("infra.title")}</h2>
          </div>
          <div className="pl-feature-right">
            <p className="pl-feature-desc">{t("infra.desc")}</p>
            <Link href="#infra-detail" className="pl-arrow-link">
              <span className="pl-arrow-ver">4.0</span>
              {t("infra.link")} <span className="pl-arrow">&rarr;</span>
            </Link>
          </div>
        </div>
        <div className="pl-dc-grid pl-reveal" id="infra-detail">
          {[
            { flag: "DE", country: "Germany", city: "Frankfurt am Main · Tier IV", specs: ["GDPR / BSI C5 / ISO 27001", "DE-CIX — world's largest IXP", "100% renewable energy", "PUE \u2264 1.3"] },
            { flag: "RU", country: "Russia", city: "Moscow · Tier III+", specs: ["152-FZ / FSTEC / GOST", "MSK-IX backbone", "Data localization compliant", "2N power redundancy"] },
            { flag: "AU", country: "Australia", city: "Sydney · Tier III", specs: ["Privacy Act 1988 / ASD ISM", "AMS-IX Pacific / Megaport", "APAC coverage: JP, SG, NZ", "SOC 2 Type II certified"] },
          ].map((dc) => (
            <div key={dc.country} className="pl-dc-card">
              <div className="pl-dc-flag">{dc.flag}</div>
              <h3 className="pl-dc-country">{dc.country}</h3>
              <p className="pl-dc-city">{dc.city}</p>
              <ul className="pl-dc-specs">
                {dc.specs.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </div>
          ))}
        </div>
        {/* Infrastructure monitoring visual */}
        <div className="pl-feature-visual pl-reveal">
          <div className="pl-mock-full">
            <div className="pl-mock-panel pl-mock-dc-status">
              <div className="pl-dc-pulse-title">{locale === "ru" ? "Еженедельный отчёт" : "Weekly Infrastructure Report"}</div>
              <div className="pl-dc-pulse-date">Apr 16, 2026</div>
              <div className="pl-dc-pulse-divider" />
              <div className="pl-dc-pulse-section">Frankfurt (DE)</div>
              <div className="pl-dc-pulse-item"><span className="pl-pulse-status pl-ps-green" /><span>Operational</span><span className="pl-pulse-meta">uptime 99.99% &middot; 14 days</span></div>
              <div className="pl-dc-pulse-item"><span className="pl-pulse-status pl-ps-green" /><span>Bandwidth peak 74.2 Gb/s</span></div>
              <div className="pl-dc-pulse-divider" />
              <div className="pl-dc-pulse-section">Moscow (RU)</div>
              <div className="pl-dc-pulse-item"><span className="pl-pulse-status pl-ps-green" /><span>Operational</span><span className="pl-pulse-meta">uptime 99.98% &middot; 14 days</span></div>
              <div className="pl-dc-pulse-item"><span className="pl-pulse-status pl-ps-yellow" /><span>{locale === "ru" ? "Плановое обслуживание запланировано" : "Scheduled maintenance planned"}</span></div>
              <div className="pl-dc-pulse-divider" />
              <div className="pl-dc-pulse-section">Sydney (AU)</div>
              <div className="pl-dc-pulse-item"><span className="pl-pulse-status pl-ps-green" /><span>Operational</span><span className="pl-pulse-meta">uptime 100% &middot; 14 days</span></div>
            </div>
            <div className="pl-mock-panel pl-mock-dc-graph">
              <div className="pl-dc-graph-title">{locale === "ru" ? "Задержка по регионам" : "Latency by region"}</div>
              <svg viewBox="0 0 500 200" className="pl-dc-scatter-svg">
                {/* Y axis labels */}
                <text x="20" y="30" fill="#55555A" fontSize="10">18ms</text>
                <text x="20" y="70" fill="#55555A" fontSize="10">12ms</text>
                <text x="20" y="110" fill="#55555A" fontSize="10">6ms</text>
                <text x="20" y="150" fill="#55555A" fontSize="10">0ms</text>
                {/* Grid lines */}
                {[30,70,110,150].map((y) => <line key={y} x1="50" y1={y} x2="480" y2={y} stroke="#1a1a1e" strokeWidth="0.5" />)}
                {/* Frankfurt dots — low latency cluster */}
                {Array.from({length: 25}).map((_, i) => <circle key={`de-${i}`} cx={100 + Math.sin(i*1.7)*30 + (i%5)*6} cy={130 - Math.random()*20 - Math.sin(i)*8} r="3" fill="#5E6AD2" opacity="0.7" />)}
                {/* Moscow dots — medium */}
                {Array.from({length: 25}).map((_, i) => <circle key={`ru-${i}`} cx={250 + Math.sin(i*2.1)*30 + (i%5)*6} cy={115 - Math.random()*25 - Math.cos(i)*10} r="3" fill="#F97316" opacity="0.7" />)}
                {/* Sydney dots — higher latency */}
                {Array.from({length: 25}).map((_, i) => <circle key={`au-${i}`} cx={400 + Math.sin(i*1.3)*25 + (i%4)*5} cy={100 - Math.random()*30 - Math.sin(i)*6} r="3" fill="#8A8A8E" opacity="0.5" />)}
                {/* X axis labels */}
                <text x="110" y="175" fill="#55555A" fontSize="11" textAnchor="middle">Frankfurt</text>
                <text x="260" y="175" fill="#55555A" fontSize="11" textAnchor="middle">Moscow</text>
                <text x="405" y="175" fill="#55555A" fontSize="11" textAnchor="middle">Sydney</text>
                {/* Trend lines */}
                <line x1="70" y1="125" x2="140" y2="120" stroke="#5E6AD2" strokeWidth="0.8" opacity="0.3" />
                <line x1="220" y1="108" x2="290" y2="100" stroke="#F97316" strokeWidth="0.8" opacity="0.3" />
                <line x1="375" y1="90" x2="440" y2="82" stroke="#8A8A8E" strokeWidth="0.8" opacity="0.3" />
              </svg>
            </div>
            <div className="pl-panel-fade" />
          </div>
        </div>
      </section>

      {/* ═══ SECURITY — Linear "Safe, secure, private" style ═══ */}
      <section className="pl-security-section pl-reveal">
        <div className="pl-security-inner">
          <div className="pl-security-eyebrow">Security</div>
          <h2 className="pl-security-title">{locale === "ru" ? "Безопасно,\nнадёжно, приватно." : "Safe, secure,\nand private."}</h2>
          <p className="pl-security-desc">
            {locale === "ru"
              ? "Всё в Atlas Secure спроектировано для защиты ваших данных. Потому что ваш бизнес — только ваше дело."
              : "Everything in Atlas Secure is designed to keep your data safe and secure. Because your business is nobody else\u2019s business."}
          </p>
          {/* Certification badges */}
          <div className="pl-cert-badges">
            <div className="pl-cert-badge">
              <svg viewBox="0 0 120 120" className="pl-cert-svg">
                <circle cx="60" cy="60" r="54" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.2" />
                <circle cx="60" cy="60" r="48" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.1" />
                <text x="60" y="50" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="500" opacity="0.6">ISO</text>
                <text x="60" y="70" textAnchor="middle" fill="currentColor" fontSize="12" opacity="0.4">27001</text>
              </svg>
            </div>
            <div className="pl-cert-badge">
              <svg viewBox="0 0 120 120" className="pl-cert-svg">
                <circle cx="60" cy="60" r="54" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.2" />
                {[0,60,120,180,240,300].map((a,i) => <circle key={i} cx={60 + 38*Math.cos(a*Math.PI/180)} cy={60 + 38*Math.sin(a*Math.PI/180)} r="3" fill="currentColor" opacity="0.15" />)}
                <text x="60" y="56" textAnchor="middle" fill="currentColor" fontSize="15" fontWeight="500" opacity="0.6">GDPR</text>
                <text x="60" y="72" textAnchor="middle" fill="currentColor" fontSize="10" opacity="0.35">Compliant</text>
              </svg>
            </div>
            <div className="pl-cert-badge">
              <svg viewBox="0 0 120 120" className="pl-cert-svg">
                <circle cx="60" cy="60" r="54" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.2" />
                <circle cx="60" cy="60" r="44" stroke="currentColor" strokeWidth="0.3" fill="none" opacity="0.1" />
                <text x="60" y="50" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="500" opacity="0.6">FIPS</text>
                <text x="60" y="68" textAnchor="middle" fill="currentColor" fontSize="11" opacity="0.4">140-3</text>
              </svg>
            </div>
            <div className="pl-cert-badge">
              <svg viewBox="0 0 120 120" className="pl-cert-svg">
                <circle cx="60" cy="60" r="54" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.2" />
                <text x="60" y="50" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="500" opacity="0.6">SOC 2</text>
                <text x="60" y="68" textAnchor="middle" fill="currentColor" fontSize="10" opacity="0.35">Type II</text>
              </svg>
            </div>
          </div>
        </div>
        {/* Security features grid */}
        <div className="pl-security-grid">
          <div className="pl-sec-hero-text">
            <span className="pl-sec-label">{locale === "ru" ? "Корпоративная безопасность" : "Enterprise-grade security"}</span>
            <p className="pl-sec-desc-big">
              <strong>{locale === "ru" ? "Спокойствие как сервис." : "Peace of mind as a service."}</strong>{" "}
              <span className="pl-sec-muted">
                {locale === "ru"
                  ? "Atlas Secure построен на лучших практиках безопасности. Шифрование на каждом уровне, надёжные партнёры и независимый аудит."
                  : "Atlas Secure is built with best-in-class security practices. State-of-the-art encryption, reliable infrastructure partners, and independently verified security controls."}
              </span>
            </p>
          </div>
          {[
            { title: locale === "ru" ? "AES-256-GCM" : "AES-256-GCM", desc: locale === "ru" ? "Шифрование военного класса, одобренное NSA для данных TOP SECRET." : "Military-grade encryption approved by NSA for TOP SECRET data." },
            { title: "Perfect Forward Secrecy", desc: locale === "ru" ? "Компрометация одного сеанса не раскрывает предыдущие или будущие." : "Compromise of one session cannot reveal previous or future sessions." },
            { title: locale === "ru" ? "Нулевые логи" : "Zero logs", desc: locale === "ru" ? "Политика строгого No-Log. Никакие данные о действиях не регистрируются." : "Strict No-Log policy. No activity data is recorded or can be disclosed." },
            { title: locale === "ru" ? "Kill Switch" : "Kill Switch", desc: locale === "ru" ? "Автоматическая остановка трафика при разрыве защищённого соединения." : "Automatic traffic halt if the secure connection drops." },
            { title: locale === "ru" ? "Аудит безопасности" : "Security audit", desc: locale === "ru" ? "Открытый аудит криптографических решений независимыми исследователями." : "Open audit of cryptographic solutions by independent researchers." },
            { title: locale === "ru" ? "DNS защита" : "DNS protection", desc: locale === "ru" ? "Полная защита от утечек DNS и IPv6 на всех устройствах." : "Full DNS and IPv6 leak protection on all devices." },
          ].map((item) => (
            <div key={item.title} className="pl-sec-card">
              <h4>{item.title}</h4>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ ABOUT ═══ */}
      <section id="about" className="pl-feature">
        <div className="pl-feature-inner pl-reveal">
          <div className="pl-feature-left">
            <h2 className="pl-feature-title">{t("about.title")}</h2>
          </div>
          <div className="pl-feature-right">
            <p className="pl-feature-desc">{t("about.desc")}</p>
          </div>
        </div>
        <div className="pl-about-content pl-reveal">
          <div className="pl-about-text">
            <p>{t("about.p1")}</p>
            <p>{t("about.p2")}</p>
            <p>{t("about.p3")}</p>
          </div>
          <div className="pl-about-table">
            {(["at.hq","at.type","at.spec","at.dc","at.class","at.std","at.sla","at.ops"] as const).map((k) => (
              <div key={k} className="pl-about-row">
                <span className="pl-about-key">{t(k)}</span>
                <span className="pl-about-val">{t(`${k}.v` as const)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ MANIFESTO ═══ */}
      <section className="pl-manifesto-section pl-reveal">
        <div className="pl-manifesto-inner pl-reveal">
          <blockquote className="pl-quote">
            {t("quote")}
          </blockquote>
          <div className="pl-principles">
            {(["pr1","pr2","pr3","pr4"] as const).map((k) => (
              <div key={k} className="pl-principle">
                <h4>{t(`${k}.t`)}</h4>
                <p>{t(`${k}.d`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA — Linear "Built for the future" style ═══ */}
      <section className="pl-cta-final pl-reveal">
        <div className="pl-cta-final-inner">
          <h2 className="pl-cta-big">{t("cta.title")}</h2>
          <div className="pl-cta-buttons">
            <Link href={authUrl} className="pl-cta-btn-light">{t("hero.vpn")}</Link>
            <Link href="/contact" className="pl-cta-btn-dark">{t("cta.btn")}</Link>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER — Linear style columns ═══ */}
      <footer className="pl-footer-big">
        <div className="pl-footer-big-inner">
          <div className="pl-footer-logo-col">
            <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="pl-footer-brand" style={{ cursor: 'pointer', textDecoration: 'none' }}>
              <AtlasLogo size={20} />
            </a>
          </div>
          <div className="pl-footer-col">
            <h4>Product</h4>
            <Link href="/vpn">Pro</Link>
            <Link href="/vps">VPS</Link>
            <Link href="/vds">VDS</Link>
            <Link href="/pricing">{t("nav.pricing")}</Link>
          </div>
          <div className="pl-footer-col">
            <h4>{locale === "ru" ? "Безопасность" : "Security"}</h4>
            <Link href="/security">{locale === "ru" ? "Обзор" : "Overview"}</Link>
            <Link href="/security">AES-256-GCM</Link>
            <Link href="/security">TLS 1.3</Link>
            <Link href="/security">Zero Trust</Link>
          </div>
          <div className="pl-footer-col">
            <h4>{locale === "ru" ? "Компания" : "Company"}</h4>
            <Link href="/about">{locale === "ru" ? "О нас" : "About"}</Link>
            <Link href="/infrastructure">{t("nav.infrastructure")}</Link>
            <Link href="/contact">{locale === "ru" ? "Контакты" : "Contact us"}</Link>
          </div>
          <div className="pl-footer-col">
            <h4>{locale === "ru" ? "Юридическое" : "Legal"}</h4>
            <Link href="/privacy">{t("footer.privacy")}</Link>
            <Link href="/terms">{t("footer.terms")}</Link>
          </div>
        </div>
        <div className="pl-footer-bottom">
          <span>&copy; {new Date().getFullYear()} Atlas Secure</span>
          <span>HQ: Hong Kong SAR</span>
          <span>Infra: DE &middot; RU &middot; AU</span>
        </div>
      </footer>
    </div>
  );
}
