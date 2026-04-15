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
    if (isTouch || window.innerWidth < 1024) {
      setSplashDone(true);
      return;
    }
    const t1 = setTimeout(() => setSplashFading(true), 2000);
    const t2 = setTimeout(() => setSplashDone(true), 2700);
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
      {/* ══════ SPLASH ══════ */}
      {!splashDone && (
        <div className={`pl-splash${splashFading ? " pl-splash-out" : ""}`}>
          <div className="pl-splash-inner">
            <svg className="pl-splash-logo" viewBox="0 0 60 60" width="48" height="48" fill="none">
              <polygon points="30,4 54,18 54,42 30,56 6,42 6,18" stroke="#5E6AD2" strokeWidth="1.2" fill="none" />
              <circle cx="30" cy="30" r="3" fill="#5E6AD2" className="pl-splash-dot" />
            </svg>
            <div className="pl-splash-text">Atlas Secure</div>
            <div className="pl-splash-bar"><div className="pl-splash-bar-fill" /></div>
          </div>
        </div>
      )}

      {/* ══════ HEADER ══════ */}
      <header className={`pl-header${headerSolid ? " pl-header-solid" : ""}${headerVisible ? "" : " pl-header-hide"}`}>
        <div className="pl-header-inner">
          <Link href="/" className="pl-logo">
            <svg viewBox="0 0 38 38" width="28" height="28" fill="none">
              <polygon points="19,2 35,11 35,27 19,36 3,27 3,11" stroke="#5E6AD2" strokeWidth="1.5" fill="none" />
              <circle cx="19" cy="19" r="3" fill="#5E6AD2" />
            </svg>
            <span>Atlas Secure</span>
          </Link>
          <nav className="pl-nav">
            <a href="#about">О компании</a>
            <a href="#tech">Технологии</a>
            <a href="#services">Решения</a>
            <a href="#infra">Инфраструктура</a>
          </nav>
          <div className="pl-header-right">
            <Link href={authUrl} className="pl-header-cta">Личный кабинет</Link>
          </div>
          <button className="pl-burger" onClick={() => setMobileMenu(true)} aria-label="Меню">
            <span /><span /><span />
          </button>
        </div>
      </header>

      {/* ══════ MOBILE MENU ══════ */}
      {mobileMenu && (
        <div className="pl-mobile-overlay" onClick={() => setMobileMenu(false)}>
          <nav className="pl-mobile-nav" onClick={(e) => e.stopPropagation()}>
            <button className="pl-mobile-close" onClick={() => setMobileMenu(false)} aria-label="Закрыть">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
            <a href="#about" onClick={() => setMobileMenu(false)}>О компании</a>
            <a href="#tech" onClick={() => setMobileMenu(false)}>Технологии</a>
            <a href="#services" onClick={() => setMobileMenu(false)}>Решения</a>
            <a href="#infra" onClick={() => setMobileMenu(false)}>Инфраструктура</a>
            <Link href={authUrl} className="pl-mobile-cta" onClick={() => setMobileMenu(false)}>Запросить доступ</Link>
          </nav>
        </div>
      )}

      {/* ══════ HERO ══════ */}
      <section className="pl-hero">
        <div className="pl-hero-glow" aria-hidden="true" />
        <div className="pl-hero-orb" aria-hidden="true">
          <div className="pl-orb-ring pl-orb-r1" />
          <div className="pl-orb-ring pl-orb-r2" />
          <div className="pl-orb-ring pl-orb-r3" />
          <div className="pl-orb-core" />
        </div>
        <div className="pl-hero-content">
          <div className="pl-hero-badge">Enterprise Infrastructure · Hong Kong</div>
          <h1 className="pl-hero-title">
            Защищённая<br />
            <span className="pl-gradient-text">инфраструктура</span><br />
            нового поколения
          </h1>
          <p className="pl-hero-sub">
            Международная IT-компания с штаб-квартирой в Гонконге.
            VPN, VPS и VDS решения военного класса с шифрованием AES-256 и 99.98% SLA.
          </p>
          <div className="pl-hero-actions">
            <Link href={authUrl} className="pl-cta-primary">
              Запросить доступ
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
            <a href="#about" className="pl-cta-ghost">Подробнее</a>
          </div>
          <div className="pl-hero-stats">
            <div className="pl-stat">
              <span className="pl-stat-val">3+</span>
              <span className="pl-stat-label">Дата-центра</span>
            </div>
            <div className="pl-stat-sep" />
            <div className="pl-stat">
              <span className="pl-stat-val">200 Гб/с</span>
              <span className="pl-stat-label">Пропускная способность</span>
            </div>
            <div className="pl-stat-sep" />
            <div className="pl-stat">
              <span className="pl-stat-val">256-bit</span>
              <span className="pl-stat-label">Шифрование</span>
            </div>
            <div className="pl-stat-sep" />
            <div className="pl-stat">
              <span className="pl-stat-val">99.98%</span>
              <span className="pl-stat-label">SLA аптайм</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ ABOUT ══════ */}
      <section id="about" className="pl-section">
        <div className="pl-container pl-reveal">
          <div className="pl-eyebrow">О компании</div>
          <h2 className="pl-title">
            Безопасность —<br /><span className="pl-gradient-text">не функция,</span> а архитектура
          </h2>
          <div className="pl-about-grid">
            <div className="pl-about-text">
              <p><strong>Atlas Secure</strong> — международная технологическая компания, основанная в Гонконге и специализирующаяся на разработке и предоставлении защищённых IT-решений для корпоративного сектора и частных клиентов по всему миру.</p>
              <p>Компания работает на пересечении трёх стратегических дисциплин: криптографической защиты данных, высокопроизводительной сетевой инженерии и операционной безопасности. Это позволяет Atlas Secure формировать новый отраслевой стандарт — предоставлять инфраструктуру военного класса тем, кто ценит конфиденциальность как абсолютный приоритет.</p>
              <p>Выбор Гонконга в качестве юрисдикции штаб-квартиры не случаен: <strong>особый административный статус</strong> города обеспечивает уникальный правовой режим с высоким уровнем защиты коммерческой тайны и независимости от третьих сторон.</p>
              <p>Партнёрская инфраструктура компании охватывает три континентальные юрисдикции — <strong>Германию, Россию и Австралию</strong> — что обеспечивает клиентам суверенитет данных, соответствие локальному регулированию и географически распределённую отказоустойчивость.</p>
            </div>
            <div className="pl-about-cards">
              {[
                ["Штаб-квартира", "Гонконг, КНР (SAR)"],
                ["Деятельность", "B2B / B2C · Информационная безопасность"],
                ["Специализация", "Защищённые сетевые решения, шифрование трафика"],
                ["Партнёрские ЦОД", "Германия · Россия · Австралия"],
                ["Класс защиты", "Military-Grade · NSA Suite B"],
                ["Стандарты", "ISO/IEC 27001 · FIPS 140-3 · GDPR"],
                ["Аптайм SLA", "99.98% — гарантированно"],
                ["Режим работы", "NOC-мониторинг 24 / 7 / 365"],
              ].map(([k, v]) => (
                <div key={k} className="pl-info-row">
                  <span className="pl-info-key">{k}</span>
                  <span className="pl-info-val">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════ ENCRYPTION ══════ */}
      <section id="tech" className="pl-section pl-section-alt">
        <div className="pl-container pl-reveal">
          <div className="pl-eyebrow">Технология защиты</div>
          <h2 className="pl-title">
            Военный класс —<br /><span className="pl-gradient-text">не маркетинг</span>
          </h2>
          <p className="pl-lead">
            Комбинация AES-256-GCM и ChaCha20-Poly1305 — стандарт шифрования спецслужб и военных ведомств для защиты данных категории TOP SECRET.
          </p>
          <div className="pl-enc-grid">
            <div className="pl-terminal">
              <div className="pl-terminal-bar">
                <span className="pl-dot pl-dot-r" />
                <span className="pl-dot pl-dot-y" />
                <span className="pl-dot pl-dot-g" />
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
                <div className="pl-code-comment"># Authentication</div>
                <div className="pl-code-line"><span className="pl-code-k">hmac</span><span className="pl-code-v">SHA-512</span></div>
                <div className="pl-code-line"><span className="pl-code-k">tls_version</span><span className="pl-code-v">TLS 1.3</span><span className="pl-code-c"># only</span></div>
                <div className="pl-code-line"><span className="pl-code-k">handshake</span><span className="pl-code-v">Ed25519</span></div>
                <div className="pl-code-spacer" />
                <div className="pl-code-comment"># Leak protection</div>
                <div className="pl-code-line"><span className="pl-code-k">dns_leak_protect</span><span className="pl-code-g">ENABLED</span></div>
                <div className="pl-code-line"><span className="pl-code-k">ipv6_leak_protect</span><span className="pl-code-g">ENABLED</span></div>
                <div className="pl-code-line"><span className="pl-code-k">kill_switch</span><span className="pl-code-g">ENABLED</span></div>
              </div>
              <div className="pl-terminal-specs">
                {[
                  ["Стойкость ключа", "2²⁵⁶ вариантов"],
                  ["Классификация", "NSA Suite B / FIPS 197"],
                  ["TLS версия", "TLS 1.3 (только)"],
                  ["Forward Secrecy", "PERFECT — X25519 ECDHE"],
                ].map(([k, v]) => (
                  <div key={k} className="pl-spec-row">
                    <span className="pl-spec-k">{k}</span>
                    <span className="pl-spec-v">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pl-enc-info">
              <p><strong>AES-256-GCM</strong> — алгоритм с длиной ключа 256 бит, принятый NIST и NSA для защиты данных категории TOP SECRET. Количество возможных ключей — 2²⁵⁶, больше чем атомов во Вселенной.</p>
              <p><strong>ChaCha20-Poly1305</strong> — альтернативный шифр Google для QUIC и TLS. Идентичная стойкость с аппаратным ускорением на мобильных платформах.</p>
              <p>Обмен ключами по протоколу <strong>ECDHE на кривой X25519</strong> обеспечивает Perfect Forward Secrecy: компрометация одного сеанса не позволяет расшифровать другие.</p>
              <p>Весь трафик исключительно через <strong>TLS 1.3</strong> — нулевой RTT-хендшейк, без устаревших алгоритмов.</p>
              <div className="pl-badges">
                {["AES-256-GCM", "ChaCha20", "TLS 1.3", "X25519 ECDHE", "SHA-512", "Ed25519", "Kill Switch", "DNS Protection", "PFS"].map((b) => (
                  <span key={b} className="pl-badge">{b}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ SERVICES ══════ */}
      <section id="services" className="pl-section">
        <div className="pl-container pl-reveal">
          <div className="pl-eyebrow">Продуктовый портфель</div>
          <h2 className="pl-title">
            Решения для <span className="pl-gradient-text">каждого масштаба</span>
          </h2>
          <p className="pl-lead">
            От персональной конфиденциальности до критической корпоративной инфраструктуры.
          </p>
          <div className="pl-services-grid">
            {[
              { num: "01", title: "Secure VPN & Tunneling", desc: "VPN-туннели на базе WireGuard, IKEv2/IPSec и OpenVPN с AES-256-GCM. Обфускация трафика, маскировка под HTTPS, защита от DPI.", icon: "M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" },
              { num: "02", title: "Zero Trust Network Access", desc: "Архитектура нулевого доверия для корпоративных сред. Микросегментация, RBAC, непрерывная верификация и интеграция с IdP.", icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
              { num: "03", title: "DDoS Protection", desc: "Многоуровневая защита L3/L4/L7 с переключением менее 10 секунд. Поведенческий анализ, anycast-фильтрация.", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
              { num: "04", title: "Encrypted Cloud Storage", desc: "Хранилища с клиентским шифрованием — ключи никогда не покидают устройство. BYOK/BYOE, S3-совместимый API.", icon: "M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7c0-2 1-3 3-3h10c2 0 3 1 3 3M4 7h16M8 12h.01M12 12h.01M16 12h.01" },
              { num: "05", title: "Secure Remote Access", desc: "Защищённый удалённый доступ для команд и филиалов. SD-WAN, split-tunneling, MFA с аппаратными токенами.", icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
              { num: "06", title: "Threat Intelligence & SOC", desc: "Центр мониторинга угроз 24/7. Threat Hunting, SIEM, анализ IoC и реагирование на инциденты с SLA до 15 минут.", icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" },
            ].map((s) => (
              <div key={s.num} className="pl-srv-card">
                <div className="pl-srv-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={s.icon} /></svg>
                </div>
                <span className="pl-srv-num">{s.num}</span>
                <h3 className="pl-srv-title">{s.title}</h3>
                <p className="pl-srv-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ INFRASTRUCTURE ══════ */}
      <section id="infra" className="pl-section pl-section-alt">
        <div className="pl-container pl-reveal">
          <div className="pl-eyebrow">Инфраструктура</div>
          <h2 className="pl-title">
            Три юрисдикции. <span className="pl-gradient-text">Один стандарт.</span>
          </h2>
          <p className="pl-lead">
            Партнёрская сеть дата-центров охватывает Европу, Азию и Австралию — суверенитет данных и соответствие локальному законодательству.
          </p>
          <div className="pl-dc-grid">
            {[
              { flag: "🇩🇪", country: "Германия", city: "Frankfurt am Main · Tier IV", specs: ["GDPR / BSI C5 / ISO 27001", "DE-CIX — крупнейший IXP в мире", "100% возобновляемые источники", "PUE ≤ 1.3"] },
              { flag: "🇷🇺", country: "Россия", city: "Москва · Tier III+", specs: ["152-ФЗ / ФСТЭК / ГОСТ", "MSK-IX / РТКОМ магистраль", "Данные россиян хранятся в РФ", "2N электропитание и охлаждение"] },
              { flag: "🇦🇺", country: "Австралия", city: "Sydney · Tier III", specs: ["Privacy Act 1988 / ASD ISM", "AMS-IX Pacific / Megaport", "АТР — Япония, Сингапур, НЗ", "SOC 2 Type II"] },
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
          <div className="pl-bw-grid">
            {[
              ["Частные лица (B2C)", "75 Гб/с", "Burst до 100 Гб/с"],
              ["Малый бизнес (SMB)", "100 Гб/с", "Выделенный канал"],
              ["Enterprise", "200 Гб/с", "По требованиям"],
            ].map(([seg, bw, peak]) => (
              <div key={seg} className="pl-bw-row">
                <span className="pl-bw-seg">{seg}</span>
                <span className="pl-bw-val">{bw}</span>
                <span className="pl-bw-peak">{peak}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ MANIFESTO ══════ */}
      <section className="pl-section">
        <div className="pl-container pl-reveal">
          <div className="pl-manifesto">
            <blockquote className="pl-quote">
              «Конфиденциальность — это не опция и не привилегия. Это фундаментальное право каждого, кто действует в цифровом пространстве.»
            </blockquote>
            <div className="pl-principles">
              {[
                ["Нулевые логи", "Политика строгого No-Log: никакие данные о действиях клиента не регистрируются и не могут быть переданы третьим лицам."],
                ["Прозрачность", "Открытый аудит криптографических решений. Публикация отчётов о прозрачности на ежеквартальной основе."],
                ["Независимость", "Гонконгская юрисдикция обеспечивает правовую независимость от давления со стороны третьих государств."],
                ["Security by Design", "Защита закладывается на уровне архитектуры, а не добавляется постфактум."],
              ].map(([t, d]) => (
                <div key={t} className="pl-principle">
                  <h4>{t}</h4>
                  <p>{d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════ COMPLIANCE ══════ */}
      <section className="pl-section pl-section-alt">
        <div className="pl-container pl-reveal">
          <div className="pl-eyebrow">Сертификация</div>
          <h2 className="pl-title">
            Стандарты <span className="pl-gradient-text">без исключений</span>
          </h2>
          <div className="pl-compliance-grid">
            {[
              ["🔐", "ISO/IEC 27001", "Международный стандарт управления информационной безопасностью"],
              ["🛡️", "FIPS 140-3", "Федеральный стандарт криптографических модулей США"],
              ["🇪🇺", "GDPR Ready", "Соответствие европейскому регламенту защиты данных"],
              ["📋", "SOC 2 Type II", "Независимый аудит безопасности и конфиденциальности"],
            ].map(([icon, name, desc]) => (
              <div key={name} className="pl-comp-card">
                <div className="pl-comp-icon">{icon}</div>
                <h4 className="pl-comp-name">{name}</h4>
                <p className="pl-comp-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ CTA FINAL ══════ */}
      <section className="pl-section pl-cta-section">
        <div className="pl-container pl-reveal">
          <h2 className="pl-title" style={{ textAlign: "center" }}>
            Готовы к <span className="pl-gradient-text">безопасности</span>?
          </h2>
          <p className="pl-lead" style={{ textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
            Подключите Enterprise VPN, VPS или VDS инфраструктуру за несколько минут.
          </p>
          <div className="pl-hero-actions" style={{ justifyContent: "center", marginTop: 40 }}>
            <Link href={authUrl} className="pl-cta-primary pl-cta-lg">
              Запросить доступ
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════ FOOTER ══════ */}
      <footer className="pl-footer">
        <div className="pl-footer-inner">
          <div className="pl-footer-brand">
            <svg viewBox="0 0 38 38" width="24" height="24" fill="none">
              <polygon points="19,2 35,11 35,27 19,36 3,27 3,11" stroke="#5E6AD2" strokeWidth="1.5" fill="none" />
              <circle cx="19" cy="19" r="2.5" fill="#5E6AD2" opacity="0.5" />
            </svg>
            <span>Atlas Secure</span>
          </div>
          <div className="pl-footer-links">
            <Link href="/pricing">Тарифы</Link>
            <Link href="/terms">Условия</Link>
            <Link href="/privacy">Конфиденциальность</Link>
          </div>
          <div className="pl-footer-copy">
            HQ: Hong Kong SAR · Infra: DE · RU · AU · © {new Date().getFullYear()} Atlas Secure
          </div>
        </div>
      </footer>
    </div>
  );
}
