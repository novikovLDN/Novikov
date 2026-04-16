"use client";

import PremiumPage from "@/components/PremiumPage";
import { useI18n } from "@/lib/i18n";

export default function AboutPage() {
  const { locale } = useI18n();
  const en = locale === "en";

  return (
    <PremiumPage>
      <div className="pl-product-hero">
        <div className="pl-product-hero-inner">
          <div className="pl-product-hero-text" style={{ maxWidth: 640 }}>
            <div className="pl-eyebrow">{en ? "Company" : "Компания"}</div>
            <h1 className="pl-product-title">{en ? "Security is not\na feature \u2014\nit\u2019s architecture" : "Безопасность \u2014\nне функция,\nа архитектура"}</h1>
            <p className="pl-product-desc">{en ? "Atlas Secure is an international technology company founded in Hong Kong, specializing in protected IT solutions for enterprise and private clients worldwide." : "Atlas Secure \u2014 международная технологическая компания со штаб-квартирой в Гонконге, специализирующаяся на защищённых IT-решениях для корпоративного и частного сектора."}</p>
          </div>
        </div>
      </div>
      <div className="pl-product-features">
        <div className="pl-about-text-block">
          <p>{en ? "The company operates at the intersection of three strategic disciplines: cryptographic data protection, high-performance network engineering, and operational security. This allows Atlas Secure to set a new industry standard \u2014 providing military-grade infrastructure to those who value privacy as an absolute priority." : "Компания работает на пересечении трёх стратегических дисциплин: криптографической защиты данных, высокопроизводительной сетевой инженерии и операционной безопасности."}</p>
          <p>{en ? "Hong Kong\u2019s special administrative status provides a unique legal framework with strong trade secret protection and independence from third parties \u2014 fundamental for information security businesses." : "Особый административный статус Гонконга обеспечивает уникальный правовой режим с высоким уровнем защиты коммерческой тайны и независимости от третьих сторон."}</p>
          <p>{en ? "Partner infrastructure spans three continental jurisdictions \u2014 Germany, Russia and Australia \u2014 providing clients with data sovereignty, local regulatory compliance and geographically distributed fault tolerance." : "Партнёрская инфраструктура охватывает три континентальные юрисдикции \u2014 Германию, Россию и Австралию \u2014 обеспечивая суверенитет данных и распределённую отказоустойчивость."}</p>
        </div>
      </div>
      <div className="pl-product-features">
        <h2 className="pl-product-section-title">{en ? "Company details" : "О компании"}</h2>
        <div className="pl-about-table-full">
          {[
            [en ? "Headquarters" : "Штаб-квартира", en ? "Hong Kong SAR" : "Гонконг, КНР (SAR)"],
            [en ? "Business type" : "Деятельность", en ? "B2B / B2C \u00b7 Information Security" : "B2B / B2C \u00b7 Информационная безопасность"],
            [en ? "Specialization" : "Специализация", en ? "Encrypted network solutions, traffic protection, cybersecurity" : "Защищённые сетевые решения, шифрование трафика, кибербезопасность"],
            [en ? "Partner DCs" : "Партнёрские ЦОД", en ? "Germany \u00b7 Russia \u00b7 Australia" : "Германия \u00b7 Россия \u00b7 Австралия"],
            [en ? "Protection class" : "Класс защиты", "Military-Grade \u00b7 NSA Suite B"],
            [en ? "Standards" : "Стандарты", "ISO/IEC 27001 \u00b7 FIPS 140-3 \u00b7 GDPR"],
            [en ? "Uptime SLA" : "Аптайм SLA", en ? "99.98% guaranteed" : "99.98% гарантированно"],
            [en ? "Operations" : "Режим работы", en ? "NOC monitoring 24/7/365" : "NOC-мониторинг 24/7/365"],
          ].map(([k, v]) => (
            <div key={k} className="pl-about-row"><span className="pl-about-key">{k}</span><span className="pl-about-val">{v}</span></div>
          ))}
        </div>
      </div>
    </PremiumPage>
  );
}
