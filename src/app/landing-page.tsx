"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useI18n, LanguageSwitcher } from "@/lib/i18n";

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
  const { t } = useI18n();
  const [splashDone, setSplashDone] = useState(false);
  const [splashFading, setSplashFading] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [headerSolid, setHeaderSolid] = useState(false);
  const lastScroll = useRef(0);
  const [headerVisible, setHeaderVisible] = useState(true);

  useEffect(() => {
    document.documentElement.classList.add("premium-page");
    return () => document.documentElement.classList.remove("premium-page");
  }, []);

  useEffect(() => {
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch || window.innerWidth < 1024) { setSplashDone(true); return; }
    const t1 = setTimeout(() => setSplashFading(true), 1800);
    const t2 = setTimeout(() => setSplashDone(true), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    const fn = () => {
      const y = window.scrollY;
      setHeaderSolid(y > 20);
      if (y > lastScroll.current + 4) setHeaderVisible(false);
      else if (y < lastScroll.current - 4) setHeaderVisible(true);
      if (y < 10) setHeaderVisible(true);
      lastScroll.current = y;
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    if (!splashDone) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("pl-visible"); obs.unobserve(e.target); }
      }),
      { threshold: 0.08, rootMargin: "0px 0px -60px 0px" }
    );
    document.querySelectorAll(".pl-reveal").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [splashDone]);

  return (
    <div className="premium-landing">
      {/* ═══ SPLASH ═══ */}
      {!splashDone && (
        <div className={`pl-splash${splashFading ? " pl-splash-out" : ""}`}>
          <div className="pl-splash-inner">
            <div className="pl-splash-logo" style={{ color: '#5E6AD2' }}><AtlasLogo size={40} /></div>
            <div className="pl-splash-text">Atlas Secure</div>
            <div className="pl-splash-bar"><div className="pl-splash-bar-fill" /></div>
          </div>
        </div>
      )}

      {/* ═══ HEADER ═══ */}
      <header className={`pl-header${headerSolid ? " pl-header-solid" : ""}${headerVisible ? "" : " pl-header-hide"}`}>
        <div className="pl-header-inner">
          <Link href="/" className="pl-logo">
            <AtlasLogo size={22} />
            <span>Atlas Secure</span>
          </Link>
          <nav className="pl-nav">
            <a href="#about">{t("nav.product")}</a>
            <a href="#services">{t("nav.solutions")}</a>
            <a href="#infra">{t("nav.infrastructure")}</a>
            <a href="#tech">{t("nav.security")}</a>
            <Link href="/pricing">{t("nav.pricing")}</Link>
          </nav>
          <div className="pl-header-actions">
            <LanguageSwitcher />
            <span className="pl-header-sep" />
            <Link href={authUrl} className="pl-header-login">{t("nav.login")}</Link>
            <Link href={authUrl} className="pl-header-signup">{t("nav.signup")}</Link>
          </div>
          <button className="pl-burger" onClick={() => setMobileMenu(true)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </header>

      {/* ═══ MOBILE MENU ═══ */}
      {mobileMenu && (
        <div className="pl-mobile-overlay" onClick={() => setMobileMenu(false)}>
          <nav className="pl-mobile-nav" onClick={(e) => e.stopPropagation()}>
            <button className="pl-mobile-close" onClick={() => setMobileMenu(false)} aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
            <a href="#about" onClick={() => setMobileMenu(false)}>{t("nav.product")}</a>
            <a href="#services" onClick={() => setMobileMenu(false)}>{t("nav.solutions")}</a>
            <a href="#infra" onClick={() => setMobileMenu(false)}>{t("nav.infrastructure")}</a>
            <a href="#tech" onClick={() => setMobileMenu(false)}>{t("nav.security")}</a>
            <Link href={authUrl} className="pl-mobile-cta" onClick={() => setMobileMenu(false)}>{t("nav.signup")}</Link>
            <LanguageSwitcher />
          </nav>
        </div>
      )}

      {/* ═══ HERO — two columns like Linear ═══ */}
      <section className="pl-hero">
        <div className="pl-hero-inner">
          <div className="pl-hero-left pl-entrance pl-ed1">
            <h1 className="pl-hero-title">{t("hero.title")}</h1>
          </div>
          <div className="pl-hero-right pl-entrance pl-ed2">
            <p className="pl-hero-desc">{t("hero.desc")}</p>
            <div className="pl-hero-link pl-entrance pl-ed3">
              <Link href={authUrl} className="pl-arrow-link">
                <span className="pl-arrow-ver">1.0</span>
                {t("hero.cta")} <span className="pl-arrow">&rarr;</span>
              </Link>
            </div>
            <Link href={authUrl} className="pl-hero-vpn-btn pl-entrance pl-ed4">
              {t("hero.vpn")}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
        {/* Hero visual — system status panel */}
        <div className="pl-hero-visual pl-reveal">
          <div className="pl-panel-mock">
            <div className="pl-panel-sidebar">
              <div className="pl-panel-brand">
                <span style={{ color: '#5E6AD2' }}><AtlasLogo size={14} /></span>
                <span>Atlas Secure</span>
              </div>
              <div className="pl-panel-menu">
                <div className="pl-panel-item pl-panel-active">Dashboard</div>
                <div className="pl-panel-item">VPN Keys</div>
                <div className="pl-panel-item">Devices</div>
                <div className="pl-panel-item">Referrals</div>
              </div>
              <div className="pl-panel-section">Infrastructure</div>
              <div className="pl-panel-menu">
                <div className="pl-panel-item">Servers</div>
                <div className="pl-panel-item">Monitoring</div>
              </div>
            </div>
            <div className="pl-panel-main">
              <div className="pl-panel-header">
                <span>System Status</span>
                <span className="pl-panel-status">All systems operational</span>
              </div>
              <div className="pl-panel-grid">
                <div className="pl-panel-card">
                  <div className="pl-panel-card-label">Encryption</div>
                  <div className="pl-panel-card-val">AES-256-GCM</div>
                </div>
                <div className="pl-panel-card">
                  <div className="pl-panel-card-label">Uptime SLA</div>
                  <div className="pl-panel-card-val">99.98%</div>
                </div>
                <div className="pl-panel-card">
                  <div className="pl-panel-card-label">Bandwidth</div>
                  <div className="pl-panel-card-val">200 Gb/s</div>
                </div>
                <div className="pl-panel-card">
                  <div className="pl-panel-card-label">Data Centers</div>
                  <div className="pl-panel-card-val">DE · RU · AU</div>
                </div>
              </div>
              <div className="pl-panel-activity">
                <div className="pl-panel-act-row"><span className="pl-act-dot pl-act-green" />Frankfurt node — latency 2ms — operational</div>
                <div className="pl-panel-act-row"><span className="pl-act-dot pl-act-green" />Moscow node — latency 4ms — operational</div>
                <div className="pl-panel-act-row"><span className="pl-act-dot pl-act-green" />Sydney node — latency 8ms — operational</div>
              </div>
            </div>
            <div className="pl-panel-detail">
              <div className="pl-panel-detail-title">Connection</div>
              <div className="pl-panel-detail-row"><span>Protocol</span><span>VLESS + Reality</span></div>
              <div className="pl-panel-detail-row"><span>TLS</span><span>1.3</span></div>
              <div className="pl-panel-detail-row"><span>PFS</span><span>X25519 ECDHE</span></div>
              <div className="pl-panel-detail-row"><span>Kill Switch</span><span className="pl-detail-on">Enabled</span></div>
              <div className="pl-panel-detail-row"><span>DNS Leak</span><span className="pl-detail-on">Protected</span></div>
            </div>
          </div>
          <div className="pl-panel-fade" />
        </div>
      </section>

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
          <div className="pl-terminal">
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

      {/* ═══ CTA ═══ */}
      <section className="pl-cta-final pl-reveal">
        <div className="pl-cta-final-inner">
          <h2 className="pl-cta-title">{t("cta.title")}</h2>
          <p className="pl-cta-desc">{t("cta.desc")}</p>
          <Link href={authUrl} className="pl-cta-primary">
            {t("cta.btn")} <span className="pl-arrow">&rarr;</span>
          </Link>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="pl-footer">
        <div className="pl-footer-inner">
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="pl-footer-brand" style={{ cursor: 'pointer', textDecoration: 'none' }}>
            <AtlasLogo size={14} />
            <span>Atlas Secure</span>
          </a>
          <div className="pl-footer-links">
            <Link href="/pricing">{t("footer.pricing")}</Link>
            <Link href="/terms">{t("footer.terms")}</Link>
            <Link href="/privacy">{t("footer.privacy")}</Link>
          </div>
          <div className="pl-footer-copy">
            HQ: Hong Kong SAR &middot; Infra: DE &middot; RU &middot; AU &middot; &copy; {new Date().getFullYear()} Atlas Secure
          </div>
        </div>
      </footer>
    </div>
  );
}
