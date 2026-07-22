"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
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

const INTERESTS = [
  { value: "vpn", label: { en: "Service", ru: "Сервис" } },
  { value: "vps", label: { en: "VPS", ru: "VPS" } },
  { value: "vds", label: { en: "VDS", ru: "VDS" } },
  { value: "enterprise", label: { en: "Enterprise", ru: "Enterprise" } },
  { value: "security", label: { en: "Security inquiry", ru: "Безопасность" } },
  { value: "other", label: { en: "Other", ru: "Другое" } },
];

export default function ContactPage() {
  const { t, locale } = useI18n();
  const en = locale === "en";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [interest, setInterest] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("premium-page");
    return () => document.documentElement.classList.remove("premium-page");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name || !email || !interest) {
      setError(en ? "Please fill in all required fields" : "Заполните все обязательные поля");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, interest, message }),
      });
      const data = await res.json();
      if (data.success) setSent(true); else setError(data.error || "Error");
    } catch {
      setError(en ? "Network error" : "Ошибка сети");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="premium-landing">
      <header className="pl-header pl-header-solid" style={{ position: "sticky" }}>
        <div className="pl-header-inner">
          <Link href="/" className="pl-logo"><AtlasLogo size={22} /><span>Atlas Secure</span></Link>
          <nav className="pl-nav">
            <Link href="/#about">{t("nav.product")}</Link>
            <Link href="/#services">{t("nav.solutions")}</Link>
            <Link href="/pricing">{t("nav.pricing")}</Link>
          </nav>
          <div className="pl-header-actions">
            <LanguageSwitcher />
            <span className="pl-header-sep" />
            <Link href="/auth" className="pl-header-login">{t("nav.login")}</Link>
            <Link href="/auth" className="pl-header-signup">{t("nav.signup")}</Link>
          </div>
          <button className="pl-burger" onClick={() => setMobileMenu(true)} aria-label="Menu"><span /><span /><span /></button>
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

      <section style={{ position: "relative", overflow: "hidden" }}>
        <div className="plx-hero-bg" />
        <div className="plx-hero-grid" />
        <div className="plx-contact-wrap pl-entrance pl-ed1" style={{ position: "relative", zIndex: 1 }}>
          {/* LEFT — INFO */}
          <div className="plx-contact-info">
            <div className="plx-eyebrow">{en ? "CONTACT" : "КОНТАКТЫ"}</div>
            <h1>
              {en ? "Talk to us." : "Напишите нам."}<br />
              <span className="plx-grad">{en ? "We read everything." : "Мы читаем всё."}</span>
            </h1>
            <p>
              {en
                ? "Sales, technical, legal, security — pick the channel that fits your question. Most requests are answered within 4 business hours."
                : "Продажи, техподдержка, юридические вопросы, безопасность — выберите подходящий канал. На большинство запросов отвечаем в течение 4 рабочих часов."}
            </p>

            <div className="plx-contact-channels">
              <a href="https://t.me/atlassecure_bot" target="_blank" rel="noopener noreferrer" className="plx-contact-ch">
                <div className="plx-contact-ch-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M21.5 3.5L2.5 10.5c-.8.3-.8 1.5 0 1.8l4.7 1.8 2 6.3c.3.8 1.2 1 1.8.4l2.7-2.5 4.6 3.3c.8.6 1.9.2 2.1-.8l2.5-14.8c.3-1.1-.8-2-1.9-1.5zM10 15l-1 3-1-4 11-8-9 9z" /></svg>
                </div>
                <div>
                  <div className="plx-contact-ch-name">{en ? "Telegram support" : "Telegram поддержка"}</div>
                  <div className="plx-contact-ch-val">@atlassecure_bot</div>
                </div>
              </a>
              <a href="mailto:sales@atlas.secure" className="plx-contact-ch">
                <div className="plx-contact-ch-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
                </div>
                <div>
                  <div className="plx-contact-ch-name">{en ? "Sales" : "Продажи"}</div>
                  <div className="plx-contact-ch-val">sales@atlas.secure</div>
                </div>
              </a>
              <a href="mailto:security@atlas.secure" className="plx-contact-ch">
                <div className="plx-contact-ch-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z" /></svg>
                </div>
                <div>
                  <div className="plx-contact-ch-name">{en ? "Security disclosure" : "Безопасность / уязвимости"}</div>
                  <div className="plx-contact-ch-val">security@atlas.secure</div>
                </div>
              </a>
              <a href="mailto:privacy@atlas.secure" className="plx-contact-ch">
                <div className="plx-contact-ch-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" /></svg>
                </div>
                <div>
                  <div className="plx-contact-ch-name">{en ? "Privacy / DPO" : "Приватность / DPO"}</div>
                  <div className="plx-contact-ch-val">privacy@atlas.secure</div>
                </div>
              </a>
            </div>

            <div style={{ marginTop: 32, padding: 20, border: "1px solid var(--pl-border)", borderRadius: 12, background: "var(--pl-surface)" }}>
              <div style={{ fontFamily: "var(--pl-mono)", fontSize: 10, letterSpacing: "0.14em", color: "var(--pl-accent)", marginBottom: 10, textTransform: "uppercase" }}>{en ? "Response times" : "Время ответа"}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "6px 12px", fontSize: 13 }}>
                <span style={{ color: "var(--pl-t3)" }}>{en ? "Telegram" : "Telegram"}</span><span style={{ color: "var(--pl-t1)" }}>&lt; 30 {en ? "min" : "мин"}</span>
                <span style={{ color: "var(--pl-t3)" }}>{en ? "Sales email" : "Email продажи"}</span><span style={{ color: "var(--pl-t1)" }}>&lt; 4 {en ? "hrs" : "ч"}</span>
                <span style={{ color: "var(--pl-t3)" }}>{en ? "Security" : "Безопасность"}</span><span style={{ color: "var(--pl-t1)" }}>&lt; 24 {en ? "hrs" : "ч"}</span>
                <span style={{ color: "var(--pl-t3)" }}>{en ? "DPO / Privacy" : "DPO / приватность"}</span><span style={{ color: "var(--pl-t1)" }}>&lt; 48 {en ? "hrs" : "ч"}</span>
              </div>
            </div>
          </div>

          {/* RIGHT — FORM */}
          <div className="plx-contact-form-card">
            {sent ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", margin: "0 auto 24px", background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 500, marginBottom: 8 }}>{en ? "Request submitted" : "Запрос отправлен"}</h2>
                <p style={{ fontSize: 14, color: "var(--pl-t2)", marginBottom: 28 }}>{en ? "We'll get back within 4 business hours." : "Ответим в течение 4 рабочих часов."}</p>
                <Link href="/" className="pl-cta-btn-light" style={{ display: "inline-flex" }}>{en ? "Back to home" : "На главную"} <span className="pl-arrow">→</span></Link>
              </div>
            ) : (
              <>
                <h2>{en ? "Request access" : "Запросить доступ"}</h2>
                <p className="plx-sub">{en ? "Fill out the form and we'll tailor a plan for you." : "Заполните форму — подберём оптимальное решение."}</p>
                <form className="pl-form" onSubmit={handleSubmit}>
                  <div className="pl-form-group">
                    <label className="pl-form-label">{en ? "How should we address you?" : "Как к вам обращаться?"} *</label>
                    <input type="text" className="pl-form-input" placeholder={en ? "Name or Mr./Ms., name" : "Имя, например Александр"} value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="pl-form-group">
                    <label className="pl-form-label">Email *</label>
                    <input type="email" className="pl-form-input" placeholder="email@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="pl-form-group">
                    <label className="pl-form-label">{en ? "What interests you?" : "Что интересует?"} *</label>
                    <div className="pl-form-options">
                      {INTERESTS.map((opt) => (
                        <button key={opt.value} type="button" className={`pl-form-option${interest === opt.value ? " active" : ""}`} onClick={() => setInterest(opt.value)}>
                          {opt.label[locale]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="pl-form-group">
                    <label className="pl-form-label">{en ? "Message" : "Сообщение"} <span style={{ color: "var(--pl-t3)", fontWeight: 400 }}>({en ? "optional" : "опционально"})</span></label>
                    <textarea className="pl-form-input pl-form-textarea" placeholder={en ? "Tell us about your needs..." : "Расскажите о задачах..."} value={message} onChange={(e) => setMessage(e.target.value)} rows={4} />
                  </div>
                  {error && <p className="pl-form-error">{error}</p>}
                  <button type="submit" className="pl-cta-primary pl-form-submit" disabled={sending}>
                    {sending ? (en ? "Sending..." : "Отправка...") : (en ? "Submit request" : "Отправить запрос")}
                    {!sending && <span className="pl-arrow">→</span>}
                  </button>
                  <p style={{ fontSize: 11, color: "var(--pl-t3)", textAlign: "center", marginTop: 4, lineHeight: 1.5 }}>
                    {en ? "By submitting you agree to our " : "Отправляя запрос, вы соглашаетесь с "}
                    <Link href="/privacy" style={{ color: "var(--pl-t2)" }}>{en ? "Privacy Policy" : "Политикой конфиденциальности"}</Link>.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      <footer className="pl-footer-big">
        <div className="pl-footer-big-inner">
          <div className="pl-footer-logo-col">
            <Link href="/" className="pl-footer-brand"><AtlasLogo size={20} /></Link>
          </div>
          <div className="pl-footer-col">
            <h4>Product</h4>
            <Link href="/vpn">Сервис</Link>
            <Link href="/vps">VPS</Link>
            <Link href="/vds">VDS</Link>
            <Link href="/pricing">{t("nav.pricing")}</Link>
          </div>
          <div className="pl-footer-col">
            <h4>{en ? "Company" : "Компания"}</h4>
            <Link href="/about">{en ? "About" : "О нас"}</Link>
            <Link href="/infrastructure">{t("nav.infrastructure")}</Link>
            <Link href="/contact">{en ? "Contact us" : "Контакты"}</Link>
          </div>
          <div className="pl-footer-col">
            <h4>{en ? "Legal" : "Юридическое"}</h4>
            <Link href="/privacy">{t("footer.privacy")}</Link>
            <Link href="/terms">{t("footer.terms")}</Link>
          </div>
        </div>
        <div className="pl-footer-bottom">
          <span>&copy; {new Date().getFullYear()} Atlas Secure</span>
        </div>
      </footer>
    </div>
  );
}
