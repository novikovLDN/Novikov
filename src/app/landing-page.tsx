"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function LandingPage({ referralCode }: { referralCode?: string }) {
  const authUrl = referralCode ? `/auth?ref=${referralCode}` : "/auth";
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
            <svg className="pl-splash-logo" viewBox="0 0 60 60" width="40" height="40" fill="none">
              <polygon points="30,4 54,18 54,42 30,56 6,42 6,18" stroke="#5E6AD2" strokeWidth="1.2" fill="none" />
              <circle cx="30" cy="30" r="3" fill="#5E6AD2" className="pl-splash-dot" />
            </svg>
            <div className="pl-splash-text">Atlas Secure</div>
            <div className="pl-splash-bar"><div className="pl-splash-bar-fill" /></div>
          </div>
        </div>
      )}

      {/* ═══ HEADER ═══ */}
      <header className={`pl-header${headerSolid ? " pl-header-solid" : ""}${headerVisible ? "" : " pl-header-hide"}`}>
        <div className="pl-header-inner">
          <Link href="/" className="pl-logo">
            <svg viewBox="0 0 32 32" width="24" height="24" fill="none">
              <polygon points="16,2 29,9.5 29,22.5 16,30 3,22.5 3,9.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <circle cx="16" cy="16" r="2.5" fill="currentColor" />
            </svg>
            <span>Atlas Secure</span>
          </Link>
          <nav className="pl-nav">
            <a href="#about">Product</a>
            <a href="#services">Solutions</a>
            <a href="#infra">Infrastructure</a>
            <a href="#tech">Security</a>
          </nav>
          <div className="pl-header-actions">
            <span className="pl-header-sep" />
            <Link href={authUrl} className="pl-header-login">Log in</Link>
            <Link href={authUrl} className="pl-header-signup">Sign up</Link>
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
            <a href="#about" onClick={() => setMobileMenu(false)}>Product</a>
            <a href="#services" onClick={() => setMobileMenu(false)}>Solutions</a>
            <a href="#infra" onClick={() => setMobileMenu(false)}>Infrastructure</a>
            <a href="#tech" onClick={() => setMobileMenu(false)}>Security</a>
            <Link href={authUrl} className="pl-mobile-cta" onClick={() => setMobileMenu(false)}>Sign up</Link>
          </nav>
        </div>
      )}

      {/* ═══ HERO — two columns like Linear ═══ */}
      <section className="pl-hero">
        <div className="pl-hero-inner">
          <div className="pl-hero-left">
            <h1 className="pl-hero-title">
              The secure infrastructure for business and beyond
            </h1>
          </div>
          <div className="pl-hero-right">
            <p className="pl-hero-desc">
              Enterprise-grade VPN, VPS and VDS solutions with military-class encryption.
              Headquartered in Hong Kong with data centers across three continental jurisdictions.
            </p>
            <div className="pl-hero-link">
              <Link href={authUrl} className="pl-arrow-link">
                <span className="pl-arrow-ver">1.0</span>
                Request access <span className="pl-arrow">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
        {/* Hero visual — system status panel */}
        <div className="pl-hero-visual pl-reveal">
          <div className="pl-panel-mock">
            <div className="pl-panel-sidebar">
              <div className="pl-panel-brand">
                <svg viewBox="0 0 20 20" width="16" height="16" fill="none"><polygon points="10,1 19,6 19,14 10,19 1,14 1,6" stroke="#5E6AD2" strokeWidth="1.2" fill="none" /><circle cx="10" cy="10" r="1.5" fill="#5E6AD2" /></svg>
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
      <section className="pl-strip">
        <div className="pl-strip-inner">
          <div className="pl-strip-item"><span className="pl-strip-val">3+</span><span className="pl-strip-label">Data centers</span></div>
          <div className="pl-strip-item"><span className="pl-strip-val">200 Gb/s</span><span className="pl-strip-label">Bandwidth</span></div>
          <div className="pl-strip-item"><span className="pl-strip-val">256-bit</span><span className="pl-strip-label">Encryption</span></div>
          <div className="pl-strip-item"><span className="pl-strip-val">99.98%</span><span className="pl-strip-label">SLA uptime</span></div>
          <div className="pl-strip-item"><span className="pl-strip-val">24/7</span><span className="pl-strip-label">NOC monitoring</span></div>
        </div>
      </section>

      {/* ═══ BIG STATEMENT — like Linear's "A new species..." ═══ */}
      <section className="pl-statement pl-reveal">
        <div className="pl-statement-inner">
          <h2 className="pl-statement-text">
            <span className="pl-statement-white">A new standard of security.</span>{" "}
            <span className="pl-statement-muted">Military-grade encryption infrastructure built for businesses and individuals who value privacy as an absolute priority.</span>
          </h2>
        </div>
      </section>

      {/* ═══ 3-CARD ISOMETRIC — like Linear's FIG cards ═══ */}
      <section className="pl-figures pl-reveal">
        <div className="pl-figures-inner">
          <div className="pl-fig-card">
            <div className="pl-fig-label">FIG 0.1</div>
            <div className="pl-fig-illustration">
              {/* Isometric server stack */}
              <svg viewBox="0 0 280 220" fill="none" className="pl-iso-svg">
                <g transform="translate(140,30)">
                  <path d="M0,0 L100,50 L0,100 L-100,50 Z" stroke="currentColor" strokeWidth="0.8" opacity="0.15" />
                  <path d="M0,0 L100,50 L100,50 L0,100" stroke="currentColor" strokeWidth="0.8" opacity="0.1" />
                  <g transform="translate(0,-15)">
                    <path d="M0,0 L100,50 L0,100 L-100,50 Z" stroke="currentColor" strokeWidth="0.8" opacity="0.2" />
                    <ellipse cx="0" cy="50" rx="40" ry="20" stroke="currentColor" strokeWidth="0.8" opacity="0.15" />
                  </g>
                  <g transform="translate(0,-30)">
                    <path d="M0,0 L100,50 L0,100 L-100,50 Z" stroke="currentColor" strokeWidth="0.8" opacity="0.25" />
                    <ellipse cx="0" cy="50" rx="30" ry="15" stroke="currentColor" strokeWidth="0.8" opacity="0.2" />
                  </g>
                  <g transform="translate(0,-45)">
                    <path d="M0,0 L100,50 L0,100 L-100,50 Z" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
                    <path d="M-20,40 L0,30 L20,40 L0,50 Z" stroke="currentColor" strokeWidth="0.8" fill="currentColor" opacity="0.06" />
                  </g>
                  <g transform="translate(0,-60)">
                    <path d="M0,0 L100,50 L0,100 L-100,50 Z" stroke="currentColor" strokeWidth="0.8" opacity="0.35" />
                  </g>
                </g>
              </svg>
            </div>
            <h3 className="pl-fig-title">Built for enterprise</h3>
            <p className="pl-fig-desc">Infrastructure designed around the needs of businesses handling sensitive data across jurisdictions.</p>
          </div>
          <div className="pl-fig-card">
            <div className="pl-fig-label">FIG 0.2</div>
            <div className="pl-fig-illustration">
              {/* Isometric hexagonal nodes */}
              <svg viewBox="0 0 280 220" fill="none" className="pl-iso-svg">
                <g transform="translate(140,110)">
                  <polygon points="0,-50 43,-25 43,25 0,50 -43,25 -43,-25" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
                  <polygon points="0,-35 30,-17.5 30,17.5 0,35 -30,17.5 -30,-17.5" stroke="currentColor" strokeWidth="0.8" opacity="0.2" />
                  <circle cx="0" cy="0" r="4" fill="currentColor" opacity="0.15" />
                  <g transform="translate(75,-30)">
                    <polygon points="0,-30 26,-15 26,15 0,30 -26,15 -26,-15" stroke="currentColor" strokeWidth="0.8" opacity="0.2" />
                    <circle cx="0" cy="0" r="3" fill="currentColor" opacity="0.1" />
                  </g>
                  <g transform="translate(-75,-30)">
                    <polygon points="0,-30 26,-15 26,15 0,30 -26,15 -26,-15" stroke="currentColor" strokeWidth="0.8" opacity="0.2" />
                    <circle cx="0" cy="0" r="3" fill="currentColor" opacity="0.1" />
                  </g>
                  <g transform="translate(0,70)">
                    <polygon points="0,-25 22,-12.5 22,12.5 0,25 -22,12.5 -22,-12.5" stroke="currentColor" strokeWidth="0.8" opacity="0.15" />
                    <circle cx="0" cy="0" r="2.5" fill="currentColor" opacity="0.1" />
                  </g>
                  <line x1="30" y1="17" x2="50" y2="-13" stroke="currentColor" strokeWidth="0.5" opacity="0.12" />
                  <line x1="-30" y1="17" x2="-50" y2="-13" stroke="currentColor" strokeWidth="0.5" opacity="0.12" />
                  <line x1="0" y1="35" x2="0" y2="45" stroke="currentColor" strokeWidth="0.5" opacity="0.12" />
                </g>
              </svg>
            </div>
            <h3 className="pl-fig-title">Distributed by design</h3>
            <p className="pl-fig-desc">Three continental jurisdictions ensure data sovereignty and geographic fault tolerance.</p>
          </div>
          <div className="pl-fig-card">
            <div className="pl-fig-label">FIG 0.3</div>
            <div className="pl-fig-illustration">
              {/* Isometric speed/layers */}
              <svg viewBox="0 0 280 220" fill="none" className="pl-iso-svg">
                <g transform="translate(60,60)">
                  {[0,1,2,3,4,5,6,7].map((i) => (
                    <line key={i} x1={20} y1={30 + i * 18} x2={200} y2={30 + i * 18} stroke="currentColor" strokeWidth="0.6" opacity={0.08 + i * 0.03} />
                  ))}
                  <g transform="translate(0,0)">
                    <rect x="20" y="25" width="180" height="8" rx="1" stroke="currentColor" strokeWidth="0.8" opacity="0.25" fill="none" />
                    <rect x="20" y="45" width="140" height="8" rx="1" stroke="currentColor" strokeWidth="0.8" opacity="0.2" fill="none" />
                    <rect x="20" y="65" width="160" height="8" rx="1" stroke="currentColor" strokeWidth="0.8" opacity="0.15" fill="none" />
                  </g>
                  <g transform="translate(130,85)">
                    <rect x="0" y="0" width="70" height="55" rx="2" stroke="currentColor" strokeWidth="0.8" opacity="0.25" fill="none" />
                    <rect x="0" y="-15" width="70" height="55" rx="2" stroke="currentColor" strokeWidth="0.8" opacity="0.2" fill="none" />
                    <rect x="0" y="-30" width="70" height="55" rx="2" stroke="currentColor" strokeWidth="0.8" opacity="0.15" fill="none" />
                  </g>
                </g>
              </svg>
            </div>
            <h3 className="pl-fig-title">Engineered for speed</h3>
            <p className="pl-fig-desc">200 Gb/s bandwidth per server, sub-5ms regional latency, BGP Anycast routing.</p>
          </div>
        </div>
      </section>

      {/* ═══ FEATURE 1 — Encryption (two-col + visual) ═══ */}
      <section id="tech" className="pl-feature">
        <div className="pl-feature-inner pl-reveal">
          <div className="pl-feature-left">
            <h2 className="pl-feature-title">Military-grade encryption — not marketing</h2>
          </div>
          <div className="pl-feature-right">
            <p className="pl-feature-desc">AES-256-GCM combined with ChaCha20-Poly1305 — the standard used by NSA, NATO and EU intelligence for TOP SECRET classified data. Perfect Forward Secrecy via X25519 ECDHE.</p>
            <Link href="#tech-detail" className="pl-arrow-link">
              <span className="pl-arrow-ver">2.0</span>
              Security stack <span className="pl-arrow">&rarr;</span>
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
            <h2 className="pl-feature-title">Solutions for every scale</h2>
          </div>
          <div className="pl-feature-right">
            <p className="pl-feature-desc">From personal privacy to critical enterprise infrastructure — Atlas Secure covers the full spectrum of security needs.</p>
            <Link href={authUrl} className="pl-arrow-link">
              <span className="pl-arrow-ver">3.0</span>
              Get started <span className="pl-arrow">&rarr;</span>
            </Link>
          </div>
        </div>
        <div className="pl-services-grid pl-reveal">
          {[
            { n: "01", t: "Secure VPN & Tunneling", d: "WireGuard, IKEv2/IPSec, OpenVPN with AES-256-GCM. Traffic obfuscation, HTTPS masking, DPI protection." },
            { n: "02", t: "Zero Trust Network", d: "Zero trust architecture for enterprise. Microsegmentation, RBAC, continuous session verification." },
            { n: "03", t: "DDoS Protection", d: "Multi-layer L3/L4/L7 protection. Behavioral analysis, anycast filtering, <10s failover." },
            { n: "04", t: "Encrypted Storage", d: "Client-side encryption — keys never leave the device. BYOK/BYOE, S3-compatible API." },
            { n: "05", t: "Secure Remote Access", d: "SD-WAN, split-tunneling, hardware MFA tokens, tamper-proof session audit logs." },
            { n: "06", t: "Threat Intelligence", d: "24/7 SOC monitoring. Threat Hunting, SIEM integration, incident response with 15min SLA." },
          ].map((s) => (
            <div key={s.n} className="pl-srv-card">
              <span className="pl-srv-num">{s.n}</span>
              <h3 className="pl-srv-title">{s.t}</h3>
              <p className="pl-srv-desc">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURE 3 — Infrastructure ═══ */}
      <section id="infra" className="pl-feature">
        <div className="pl-feature-inner pl-reveal">
          <div className="pl-feature-left">
            <h2 className="pl-feature-title">Three jurisdictions. One standard.</h2>
          </div>
          <div className="pl-feature-right">
            <p className="pl-feature-desc">Partner data center network spanning Europe, Asia-Pacific and Russia — ensuring data sovereignty and compliance with local regulation.</p>
            <Link href="#infra-detail" className="pl-arrow-link">
              <span className="pl-arrow-ver">4.0</span>
              Infrastructure <span className="pl-arrow">&rarr;</span>
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
            <h2 className="pl-feature-title">Security is not a feature — it{"\u2019"}s architecture</h2>
          </div>
          <div className="pl-feature-right">
            <p className="pl-feature-desc">Atlas Secure is an international technology company founded in Hong Kong, specializing in protected IT solutions for enterprise and private clients worldwide.</p>
          </div>
        </div>
        <div className="pl-about-content pl-reveal">
          <div className="pl-about-text">
            <p>The company operates at the intersection of three strategic disciplines: cryptographic data protection, high-performance network engineering, and operational security.</p>
            <p>Hong Kong&apos;s special administrative status provides a unique legal framework with strong trade secret protection and independence from third parties — fundamental for information security businesses.</p>
            <p>Partner infrastructure spans three continental jurisdictions — Germany, Russia and Australia — providing clients with data sovereignty, local regulatory compliance and geographically distributed fault tolerance.</p>
          </div>
          <div className="pl-about-table">
            {[
              ["Headquarters", "Hong Kong SAR"],
              ["Business type", "B2B / B2C · Information Security"],
              ["Specialization", "Encrypted network solutions"],
              ["Partner DCs", "Germany · Russia · Australia"],
              ["Protection class", "Military-Grade · NSA Suite B"],
              ["Standards", "ISO 27001 · FIPS 140-3 · GDPR"],
              ["Uptime SLA", "99.98% guaranteed"],
              ["Operations", "NOC monitoring 24/7/365"],
            ].map(([k, v]) => (
              <div key={k} className="pl-about-row">
                <span className="pl-about-key">{k}</span>
                <span className="pl-about-val">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ MANIFESTO ═══ */}
      <section className="pl-manifesto-section pl-reveal">
        <div className="pl-manifesto-inner">
          <blockquote className="pl-quote">
            &laquo;Privacy is not an option or a privilege. It is a fundamental right of everyone operating in the digital space. We exist to technically guarantee that right.&raquo;
          </blockquote>
          <div className="pl-principles">
            {[
              ["Zero logs", "Strict No-Log policy: no client activity data is recorded or can be disclosed to third parties."],
              ["Transparency", "Open audit of cryptographic solutions by independent researchers. Quarterly transparency reports."],
              ["Independence", "Hong Kong jurisdiction ensures legal independence from third-state pressure and foreign regulators."],
              ["Security by Design", "Protection is built into the architecture level, not added as an afterthought."],
            ].map(([t, d]) => (
              <div key={t} className="pl-principle">
                <h4>{t}</h4>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="pl-cta-final pl-reveal">
        <div className="pl-cta-final-inner">
          <h2 className="pl-cta-title">Ready to get started?</h2>
          <p className="pl-cta-desc">Request access to Enterprise VPN, VPS or VDS infrastructure.</p>
          <Link href={authUrl} className="pl-cta-primary">
            Request access <span className="pl-arrow">&rarr;</span>
          </Link>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="pl-footer">
        <div className="pl-footer-inner">
          <div className="pl-footer-brand">
            <svg viewBox="0 0 20 20" width="16" height="16" fill="none"><polygon points="10,1 19,6 19,14 10,19 1,14 1,6" stroke="currentColor" strokeWidth="1.2" fill="none" /><circle cx="10" cy="10" r="1.5" fill="currentColor" /></svg>
            <span>Atlas Secure</span>
          </div>
          <div className="pl-footer-links">
            <Link href="/pricing">Pricing</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
          </div>
          <div className="pl-footer-copy">
            HQ: Hong Kong SAR &middot; Infra: DE &middot; RU &middot; AU &middot; &copy; {new Date().getFullYear()} Atlas Secure
          </div>
        </div>
      </footer>
    </div>
  );
}
