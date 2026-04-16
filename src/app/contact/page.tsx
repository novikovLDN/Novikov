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
  { value: "vpn", label: { en: "VPN", ru: "VPN" } },
  { value: "vps", label: { en: "VPS", ru: "VPS" } },
  { value: "vds", label: { en: "VDS", ru: "VDS" } },
  { value: "enterprise", label: { en: "Enterprise solution", ru: "Enterprise решение" } },
  { value: "other", label: { en: "Other", ru: "Другое" } },
];

export default function ContactPage() {
  const { t, locale } = useI18n();
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
      setError(locale === "ru" ? "Заполните все обязательные поля" : "Please fill in all required fields");
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
      if (data.success) {
        setSent(true);
      } else {
        setError(data.error || "Error");
      }
    } catch {
      setError(locale === "ru" ? "Ошибка сети" : "Network error");
    } finally {
      setSending(false);
    }
  };

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
            <Link href="/pricing">{t("nav.pricing")}</Link>
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

      {/* Form */}
      <section className="pl-contact">
        <div className="pl-contact-inner pl-entrance pl-ed1">
          {sent ? (
            <div className="pl-contact-success">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12l2.5 2.5L16 9" />
              </svg>
              <h2 className="pl-contact-title">
                {locale === "ru" ? "Запрос отправлен" : "Request submitted"}
              </h2>
              <p className="pl-contact-sub">
                {locale === "ru"
                  ? "Мы свяжемся с вами в ближайшее время"
                  : "We will get back to you shortly"}
              </p>
              <Link href="/" className="pl-cta-primary" style={{ marginTop: 32 }}>
                {locale === "ru" ? "На главную" : "Back to home"} <span className="pl-arrow">&rarr;</span>
              </Link>
            </div>
          ) : (
            <>
              <h1 className="pl-contact-title">
                {locale === "ru" ? "Запросить доступ" : "Request access"}
              </h1>
              <p className="pl-contact-sub">
                {locale === "ru"
                  ? "Заполните форму и мы подберём оптимальное решение"
                  : "Fill out the form and we'll find the right solution for you"}
              </p>

              <form className="pl-form" onSubmit={handleSubmit}>
                <div className="pl-form-group">
                  <label className="pl-form-label">
                    {locale === "ru" ? "Как к вам обращаться?" : "How should we address you?"} *
                  </label>
                  <input
                    type="text"
                    className="pl-form-input"
                    placeholder={locale === "ru" ? "Господин / Госпожа, имя" : "Mr. / Ms., name"}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="pl-form-group">
                  <label className="pl-form-label">Email *</label>
                  <input
                    type="email"
                    className="pl-form-input"
                    placeholder="email@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="pl-form-group">
                  <label className="pl-form-label">
                    {locale === "ru" ? "Что вас интересует?" : "What are you interested in?"} *
                  </label>
                  <div className="pl-form-options">
                    {INTERESTS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`pl-form-option${interest === opt.value ? " active" : ""}`}
                        onClick={() => setInterest(opt.value)}
                      >
                        {opt.label[locale]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pl-form-group">
                  <label className="pl-form-label">
                    {locale === "ru" ? "Сообщение" : "Message"}
                    <span style={{ color: "var(--pl-t3)", fontWeight: 400 }}> ({locale === "ru" ? "опционально" : "optional"})</span>
                  </label>
                  <textarea
                    className="pl-form-input pl-form-textarea"
                    placeholder={locale === "ru" ? "Расскажите о ваших потребностях..." : "Tell us about your needs..."}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                  />
                </div>

                {error && <p className="pl-form-error">{error}</p>}

                <button type="submit" className="pl-cta-primary pl-form-submit" disabled={sending}>
                  {sending
                    ? (locale === "ru" ? "Отправка..." : "Sending...")
                    : (locale === "ru" ? "Отправить запрос" : "Submit request")}
                  {!sending && <span className="pl-arrow">&rarr;</span>}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
