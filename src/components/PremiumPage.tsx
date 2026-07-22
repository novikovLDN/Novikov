"use client";

import Link from "next/link";
import { useEffect, useState, ReactNode } from "react";
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

export default function PremiumPage({ children, title }: { children: ReactNode; title?: string }) {
  const { t, locale } = useI18n();
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("premium-page");
    return () => document.documentElement.classList.remove("premium-page");
  }, []);

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

      <main className="pl-page-content">
        {title && <h1 className="pl-page-title">{title}</h1>}
        {children}
      </main>

      <footer className="pl-footer-big">
        <div className="pl-footer-big-inner">
          <div className="pl-footer-logo-col">
            <Link href="/" className="pl-footer-brand"><AtlasLogo size={20} /></Link>
          </div>
          <div className="pl-footer-col">
            <h4>Product</h4>
            <Link href="/vpn">Secure</Link>
            <Link href="/vps">VPS</Link>
            <Link href="/vds">VDS</Link>
            <Link href="/pricing">{t("nav.pricing")}</Link>
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
        </div>
      </footer>
    </div>
  );
}
