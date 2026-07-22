"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
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

type Tab = "vpn" | "vps" | "vds";

function AnimatedPrice({ value, duration = 600 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(value);
  const animRef = useRef<number>(0);
  const startVal = useRef(value);
  const startTime = useRef(0);

  useEffect(() => {
    if (display === value) return;
    startVal.current = display;
    startTime.current = performance.now();
    cancelAnimationFrame(animRef.current);

    const animate = (now: number) => {
      const elapsed = now - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startVal.current + (value - startVal.current) * eased;
      setDisplay(Math.round(current * 100) / 100);
      if (progress < 1) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return <>{display.toFixed(2)}</>;
}

type Bi = { en: string; ru: string };
type BiList = { en: string[]; ru: string[] };
interface Plan {
  name: Bi;
  price: number;
  priceYearly?: number;
  period: Bi;
  sub: string;
  features: BiList;
  cta: Bi;
  ctaStyle: "ghost" | "primary";
  highlighted?: boolean;
}

const PER_MONTH: Bi = { en: "per month", ru: "в месяц" };

const VPN_PLANS: Plan[] = [
  {
    name: { en: "Personal", ru: "Личный" },
    price: 4.99, priceYearly: 3.99, period: PER_MONTH, sub: "",
    features: {
      en: [
        "Stable connection around the clock",
        "Up to 3 devices at once",
        "Fast speed, no bandwidth caps",
        "Auto-reconnect if the link drops",
        "Ready in a minute — no setup pain",
      ],
      ru: [
        "Стабильное соединение 24/7",
        "До 3 устройств одновременно",
        "Быстрая скорость без ограничений",
        "Автопереподключение при обрыве",
        "Готово за минуту — без настройки",
      ],
    },
    cta: { en: "Request", ru: "Запросить" }, ctaStyle: "ghost",
  },
  {
    name: { en: "Business", ru: "Бизнес" },
    price: 9.99, priceYearly: 7.99, period: PER_MONTH, sub: "",
    features: {
      en: [
        "Everything in Personal, and more",
        "Up to 10 devices simultaneously",
        "Priority access to every location",
        "Guaranteed 99.9% stability",
        "Personal static address",
        "Priority support with a human",
      ],
      ru: [
        "Всё из Личного и сверху",
        "До 10 устройств одновременно",
        "Приоритетный доступ ко всем локациям",
        "Гарантированная стабильность 99,9%",
        "Персональный статический адрес",
        "Приоритетная поддержка от живого человека",
      ],
    },
    cta: { en: "Request", ru: "Запросить" }, ctaStyle: "primary", highlighted: true,
  },
  {
    name: { en: "Enterprise", ru: "Enterprise" },
    price: 24.99, priceYearly: 19.99, period: PER_MONTH, sub: "",
    features: {
      en: [
        "Everything in Business, and more",
        "No device limit at all",
        "Dedicated infrastructure for your team",
        "Guaranteed 99.98% uptime",
        "Round-the-clock priority support",
        "Personal account manager",
      ],
      ru: [
        "Всё из Бизнес и сверху",
        "Устройств без лимита",
        "Выделенная инфраструктура под вашу команду",
        "Гарантированный аптайм 99,98%",
        "Круглосуточная приоритетная поддержка",
        "Персональный менеджер",
      ],
    },
    cta: { en: "Request", ru: "Запросить" }, ctaStyle: "ghost",
  },
  {
    name: { en: "Custom", ru: "Индивидуальный" },
    price: 0, period: { en: "", ru: "" }, sub: "CUSTOM_SUB",
    features: {
      en: [
        "Infrastructure tailored to your load",
        "Bandwidth sized to your peak",
        "Any locations you need",
        "Invoice billing for legal entities",
        "Single sign-on (SAML / SSO)",
        "Dedicated account team on call",
      ],
      ru: [
        "Инфраструктура под ваши задачи",
        "Пропускная способность под нагрузку",
        "Любые нужные вам локации",
        "Оплата по счёту для юрлиц",
        "Единый вход SSO / SAML",
        "Выделенная команда сопровождения",
      ],
    },
    cta: { en: "Contact sales", ru: "Связаться с отделом продаж" }, ctaStyle: "ghost",
  },
];

const VPS_PRESETS = [
  { name: "Starter", cpu: 1, ram: 1, ssd: 20, port: 1, price: 7.99, priceYearly: 6.39 },
  { name: "Standard", cpu: 2, ram: 4, ssd: 50, port: 1, price: 19.99, priceYearly: 15.99 },
  { name: "Performance", cpu: 4, ram: 8, ssd: 100, port: 1, price: 39.99, priceYearly: 31.99 },
  { name: "Scale", cpu: 8, ram: 16, ssd: 200, port: 1, price: 79.99, priceYearly: 63.99 },
];

const VDS_PRESETS = [
  { name: "Starter", cpu: 2, ram: 4, ssd: 50, port: 1, price: 29.99, priceYearly: 23.99 },
  { name: "Standard", cpu: 4, ram: 8, ssd: 100, port: 1, price: 59.99, priceYearly: 47.99 },
  { name: "Performance", cpu: 8, ram: 16, ssd: 200, port: 1, price: 119.99, priceYearly: 95.99 },
  { name: "Infrastructure", cpu: 16, ram: 32, ssd: 500, port: 1, price: 249.99, priceYearly: 199.99 },
];

const PORT_OPTIONS = [1, 5, 10, 15, 25, 40, 75, 100, 150, 200];

function portPrice(gbps: number): number {
  if (gbps <= 1) return 0;
  if (gbps <= 5) return 4;
  if (gbps <= 10) return 9;
  if (gbps <= 15) return 16;
  if (gbps <= 25) return 28;
  if (gbps <= 40) return 48;
  if (gbps <= 75) return 85;
  if (gbps <= 100) return 120;
  if (gbps <= 150) return 170;
  return 230;
}

function calcVpsPrice(cpu: number, ram: number, ssd: number, port: number) {
  return Math.round((cpu * 3 + ram * 2.5 + (ssd / 10) * 1 + 2 + portPrice(port)) * 100) / 100;
}
function calcVdsPrice(cpu: number, ram: number, ssd: number, port: number) {
  return Math.round((cpu * 8 + ram * 3.5 + (ssd / 10) * 1.5 + 3 + portPrice(port)) * 100) / 100;
}

function CheckIcon() {
  return <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#5E6AD2" opacity="0.15" /><path d="M6 10l3 3 5-5" stroke="#5E6AD2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function CrossIcon() {
  return <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M7 7l6 6M13 7l-6 6" stroke="#55555A" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}

export default function PricingPage() {
  const { t, locale } = useI18n();
  const [tab, setTab] = useState<Tab>("vpn");
  const [yearly, setYearly] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [cpu, setCpu] = useState(2);
  const [ram, setRam] = useState(4);
  const [ssd, setSsd] = useState(50);
  const [port, setPort] = useState(1);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("premium-page");
    return () => document.documentElement.classList.remove("premium-page");
  }, []);

  const customPrice = tab === "vds" ? calcVdsPrice(cpu, ram, ssd, port) : calcVpsPrice(cpu, ram, ssd, port);
  const customPriceYearly = Math.round(customPrice * 0.8 * 100) / 100;
  const presets = tab === "vds" ? VDS_PRESETS : VPS_PRESETS;

  return (
    <div className="premium-landing">
      {/* Header */}
      <header className="pl-header pl-header-solid" style={{ position: "sticky" }}>
        <div className="pl-header-inner">
          <Link href="/" className="pl-logo">
            <AtlasLogo size={22} />
            <span>Atlas Secure</span>
          </Link>
          <nav className="pl-nav">
            <Link href="/#about">{t("nav.product")}</Link>
            <Link href="/#services">{t("nav.solutions")}</Link>
            <Link href="/#infra">{t("nav.infrastructure")}</Link>
            <Link href="/pricing" style={{ color: "var(--pl-t1)" }}>{t("nav.pricing")}</Link>
          </nav>
          <div className="pl-header-actions">
            <LanguageSwitcher />
            <span className="pl-header-sep" />
            <Link href="/auth" className="pl-header-login">{t("nav.login")}</Link>
            <Link href="/auth" className="pl-header-signup">{t("nav.signup")}</Link>
          </div>
          <button className="pl-burger" onClick={() => setMobileMenu(true)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </header>

      {mobileMenu && (
        <div className="pl-mobile-overlay" onClick={() => setMobileMenu(false)}>
          <nav className="pl-mobile-nav" onClick={(e) => e.stopPropagation()}>
            <button className="pl-mobile-close" onClick={() => setMobileMenu(false)} aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
            <Link href="/" onClick={() => setMobileMenu(false)}>{t("nav.product")}</Link>
            <Link href="/pricing" onClick={() => setMobileMenu(false)}>{t("nav.pricing")}</Link>
            <Link href="/auth" className="pl-mobile-cta" onClick={() => setMobileMenu(false)}>{t("nav.signup")}</Link>
            <LanguageSwitcher />
          </nav>
        </div>
      )}

      {/* Hero */}
      <section className="pl-pricing-hero">
        <h1 style={{ fontSize: "clamp(36px, 4vw, 52px)", fontWeight: 500, letterSpacing: "-.03em", marginBottom: 16 }}>{t("pricing.title")}</h1>
        <p style={{ fontSize: 17, color: "var(--pl-t2)", maxWidth: 480, marginBottom: 48 }}>
          {t("pricing.desc")}
        </p>

        {/* Tab switcher */}
        <div className="pl-pricing-tabs">
          {(["vpn", "vps", "vds"] as Tab[]).map((t) => (
            <button key={t} className={`pl-pricing-tab${tab === t ? " active" : ""}`} onClick={() => { setTab(t); setShowConfig(false); }}>
              {t === "vpn" ? "PRO" : t.toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      {/* ══ VPN Plans ══ */}
      {tab === "vpn" && (
        <section className="pl-pricing-section">
          <div className="pl-pricing-inner">
            {/* Billing toggle */}
            <div className="pl-billing-row">
              <button className={`pl-billing-toggle${yearly ? " active" : ""}`} onClick={() => setYearly(!yearly)}>
                <span className="pl-toggle-track"><span className="pl-toggle-thumb" /></span>
              </button>
              <span style={{ fontSize: 14, color: "var(--pl-t2)" }}>{t("pricing.yearly")}</span>
              {yearly && <span className="pl-save-tag">{t("pricing.save")}</span>}
            </div>

            <div className="pl-plans-grid">
              {VPN_PLANS.map((p) => (
                <div key={p.name.en} className={`pl-plan-card${p.highlighted ? " pl-plan-hl" : ""}`}>
                  <h3 className="pl-plan-name">{p.name[locale]}</h3>
                  <div className="pl-plan-price">
                    {p.price > 0 ? (
                      <>
                        <span className="pl-price-amount"><AnimatedPrice value={yearly && p.priceYearly ? p.priceYearly : p.price} /> $</span>
                        <span className="pl-price-period">{p.period[locale]}</span>
                      </>
                    ) : (
                      <span className="pl-price-amount">{p.sub === "CUSTOM_SUB" ? t("pricing.custom.sub") : (p.sub || "$0")}</span>
                    )}
                  </div>
                  {p.price > 0 && !p.sub && (
                    <div className="pl-plan-billing">
                      <button className={`pl-billing-toggle sm${yearly ? " active" : ""}`} onClick={() => setYearly(!yearly)}>
                        <span className="pl-toggle-track"><span className="pl-toggle-thumb" /></span>
                      </button>
                      <span style={{ fontSize: 13, color: "var(--pl-t3)" }}>{t("pricing.yearly")}</span>
                    </div>
                  )}
                  {p.sub && <p className="pl-plan-sub">{p.sub === "CUSTOM_SUB" ? t("pricing.custom.sub") : p.sub}</p>}
                  <div className="pl-plan-divider" />
                  <ul className="pl-plan-features">
                    {p.features[locale].map((f) => (
                      <li key={f}><CheckIcon /> {f}</li>
                    ))}
                  </ul>
                  <div className="pl-plan-cta">
                    <Link href="/contact" className={`pl-plan-btn ${p.ctaStyle}`}>{p.cta[locale]}</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ VPS / VDS Plans ══ */}
      {(tab === "vps" || tab === "vds") && (
        <section className="pl-pricing-section">
          <div className="pl-pricing-inner">
            <div className="pl-billing-row">
              <button className={`pl-billing-toggle${yearly ? " active" : ""}`} onClick={() => setYearly(!yearly)}>
                <span className="pl-toggle-track"><span className="pl-toggle-thumb" /></span>
              </button>
              <span style={{ fontSize: 14, color: "var(--pl-t2)" }}>{t("pricing.yearly")}</span>
              {yearly && <span className="pl-save-tag">{t("pricing.save")}</span>}
            </div>

            <div className="pl-plans-grid pl-plans-4">
              {presets.map((p) => (
                <div key={p.name} className="pl-plan-card">
                  <h3 className="pl-plan-name">{p.name}</h3>
                  <div className="pl-plan-price">
                    <span className="pl-price-amount"><AnimatedPrice value={yearly ? p.priceYearly : p.price} /> $</span>
                    <span className="pl-price-period">{PER_MONTH[locale]}</span>
                  </div>
                  <div className="pl-plan-divider" />
                  <ul className="pl-plan-features">
                    <li><CheckIcon /> {p.cpu} {locale === "ru" ? (tab === "vds" ? "выделенных" : "v") + "CPU" : (tab === "vds" ? "dedicated " : "v") + "CPU" + (p.cpu > 1 ? "s" : "")}</li>
                    <li><CheckIcon /> {p.ram} {locale === "ru" ? "ГБ ОЗУ" : "GB RAM"}</li>
                    <li><CheckIcon /> {p.ssd} {locale === "ru" ? "ГБ NVMe SSD" : "GB NVMe SSD"}</li>
                    <li><CheckIcon /> {p.port} {locale === "ru" ? "Гбит/с порт" : "Gbps port"}</li>
                    <li><CheckIcon /> {t("pricing.unlimited")}</li>
                    <li><CheckIcon /> {locale === "ru" ? "Шифрование AES-256" : "AES-256 encryption"}</li>
                    <li><CheckIcon /> {locale === "ru" ? "Защита от DDoS" : "DDoS protection"}</li>
                    {tab === "vds" && <li><CheckIcon /> {locale === "ru" ? "Полный root-доступ" : "Full root access"}</li>}
                  </ul>
                  <div className="pl-plan-cta">
                    <Link href="/contact" className="pl-plan-btn ghost">{locale === "ru" ? "Запросить" : "Request"}</Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Custom configurator */}
            <div className="pl-config-section">
              <button className="pl-config-toggle" onClick={() => setShowConfig(!showConfig)}>
                {t("pricing.custom")}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: showConfig ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {showConfig && (
                <div className="pl-config-panel">
                  <div className="pl-config-sliders">
                    <div className="pl-slider-group">
                      <div className="pl-slider-header">
                        <span>{tab === "vds" ? "CPU Cores" : "vCPU"}</span>
                        <span className="pl-slider-val">{cpu}</span>
                      </div>
                      <input type="range" min={1} max={tab === "vds" ? 32 : 16} value={cpu} onChange={(e) => setCpu(Number(e.target.value))} />
                      <div className="pl-slider-range"><span>1</span><span>{tab === "vds" ? 32 : 16}</span></div>
                    </div>
                    <div className="pl-slider-group">
                      <div className="pl-slider-header">
                        <span>RAM</span>
                        <span className="pl-slider-val">{ram} GB</span>
                      </div>
                      <input type="range" min={1} max={tab === "vds" ? 64 : 32} value={ram} onChange={(e) => setRam(Number(e.target.value))} />
                      <div className="pl-slider-range"><span>1 GB</span><span>{tab === "vds" ? 64 : 32} GB</span></div>
                    </div>
                    <div className="pl-slider-group">
                      <div className="pl-slider-header">
                        <span>NVMe SSD</span>
                        <span className="pl-slider-val">{ssd} GB</span>
                      </div>
                      <input type="range" min={10} max={tab === "vds" ? 1000 : 500} step={10} value={ssd} onChange={(e) => setSsd(Number(e.target.value))} />
                      <div className="pl-slider-range"><span>10 GB</span><span>{tab === "vds" ? "1 TB" : "500 GB"}</span></div>
                    </div>
                    <div className="pl-slider-group">
                      <div className="pl-slider-header">
                        <span>{t("pricing.port")}</span>
                        <span className="pl-slider-val">{port} Gb/s</span>
                      </div>
                      <div className="pl-port-select">
                        {PORT_OPTIONS.map((p) => (
                          <button key={p} className={`pl-port-btn${port === p ? " active" : ""}`} onClick={() => setPort(p)}>
                            {p}
                          </button>
                        ))}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--pl-t3)", marginTop: 6 }}>Gb/s &middot; {t("pricing.unlimited")} included</div>
                    </div>
                  </div>
                  <div className="pl-config-result">
                    <div className="pl-config-specs">
                      <div>{cpu} {tab === "vds" ? "Core" : "vCPU"}{cpu > 1 ? "s" : ""}</div>
                      <div>{ram} GB RAM</div>
                      <div>{ssd} GB NVMe</div>
                      <div>{port} Gb/s port</div>
                      <div style={{ color: "var(--pl-accent)" }}>{t("pricing.unlimited")}</div>
                    </div>
                    <div className="pl-config-price">
                      <span className="pl-config-amount"><AnimatedPrice value={yearly ? customPriceYearly : customPrice} /> $</span>
                      <span className="pl-config-period">/ month</span>
                    </div>
                    <Link href="/contact" className="pl-plan-btn primary" style={{ width: "100%", textAlign: "center", justifyContent: "center" }}>
                      {t("pricing.config.req")}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ══ Feature comparison (VPN) ══ */}
      {tab === "vpn" && (
        <section className="pl-comparison">
          <div className="pl-comparison-inner">
            <div className="pl-comp-header">
              <div className="pl-comp-label">{t("pricing.features")}</div>
              <div>{locale === "ru" ? "Пробный" : "Trial"}</div>
              <div>{locale === "ru" ? "Личный" : "Personal"}</div>
              <div>{locale === "ru" ? "Бизнес" : "Business"}</div>
              <div>Enterprise</div>
            </div>
            {(locale === "ru" ? [
              ["Шифрование", "AES-256", "AES-256", "AES-256", "AES-256"],
              ["Протоколы", "VLESS", "VLESS, WG", "Все", "Все + кастом"],
              ["Устройств", "1", "3", "10", "Без лимита"],
              ["Локации серверов", "1", "3", "Все", "Все + выделенные"],
              ["Пропускная способность", "75 Гбит/с", "75 Гбит/с", "100 Гбит/с", "200 Гбит/с"],
              ["Kill Switch", "check", "check", "check", "check"],
              ["Защита DNS", "check", "check", "check", "check"],
              ["Обфускация трафика", "cross", "check", "check", "check"],
              ["Выделенный IP", "cross", "cross", "check", "check"],
              ["Защита от DDoS", "cross", "cross", "check", "check"],
              ["Приоритетная поддержка", "cross", "cross", "check", "check"],
              ["SLA", "cross", "cross", "99,9%", "99,98%"],
              ["Персональный менеджер", "cross", "cross", "cross", "check"],
              ["Оплата по счёту", "cross", "cross", "cross", "check"],
            ] : [
              ["Encryption", "AES-256", "AES-256", "AES-256", "AES-256"],
              ["Protocols", "VLESS", "VLESS, WG", "All", "All + Custom"],
              ["Devices", "1", "3", "10", "Unlimited"],
              ["Server locations", "1", "3", "All", "All + Dedicated"],
              ["Bandwidth", "75 Gb/s", "75 Gb/s", "100 Gb/s", "200 Gb/s"],
              ["Kill Switch", "check", "check", "check", "check"],
              ["DNS protection", "check", "check", "check", "check"],
              ["Traffic obfuscation", "cross", "check", "check", "check"],
              ["Dedicated IP", "cross", "cross", "check", "check"],
              ["DDoS protection", "cross", "cross", "check", "check"],
              ["Priority support", "cross", "cross", "check", "check"],
              ["SLA guarantee", "cross", "cross", "99.9%", "99.98%"],
              ["Account manager", "cross", "cross", "cross", "check"],
              ["Invoice billing", "cross", "cross", "cross", "check"],
            ]).map(([feature, ...vals]) => (
              <div key={feature} className="pl-comp-row">
                <div className="pl-comp-feature">{feature}</div>
                {vals.map((v, i) => (
                  <div key={i} className="pl-comp-val">
                    {v === "check" ? <CheckIcon /> : v === "cross" ? <CrossIcon /> : v}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="pl-footer">
        <div className="pl-footer-inner">
          <div className="pl-footer-brand">
            <AtlasLogo size={14} />
            <span>Atlas Secure</span>
          </div>
          <div className="pl-footer-links">
            <Link href="/pricing">{t("footer.pricing")}</Link>
            <Link href="/terms">{t("footer.terms")}</Link>
            <Link href="/privacy">{t("footer.privacy")}</Link>
          </div>
          <div className="pl-footer-copy">HQ: Hong Kong SAR &middot; &copy; {new Date().getFullYear()} Atlas Secure</div>
        </div>
      </footer>
    </div>
  );
}
