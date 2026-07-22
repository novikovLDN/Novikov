"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Locale = "en" | "ru";

const t = {
  // ═══ HEADER / NAV ═══
  "nav.product": { en: "Product", ru: "Продукт" },
  "nav.solutions": { en: "Solutions", ru: "Решения" },
  "nav.infrastructure": { en: "Infrastructure", ru: "Инфраструктура" },
  "nav.security": { en: "Security", ru: "Безопасность" },
  "nav.pricing": { en: "Pricing", ru: "Тарифы" },
  "nav.login": { en: "Log in", ru: "Войти" },
  "nav.signup": { en: "Sign up", ru: "Регистрация" },

  // ═══ HERO ═══
  "hero.title": {
    en: "The secure infrastructure for business and beyond",
    ru: "Защищённая инфраструктура для бизнеса",
  },
  "hero.desc": {
    en: "Enterprise-grade secure connectivity, VPS and VDS solutions with military-class encryption. Headquartered in Hong Kong with data centers across three continental jurisdictions.",
    ru: "Защищённое соединение, VPS и VDS решения корпоративного класса с шифрованием военного уровня. Штаб-квартира в Гонконге, дата-центры в трёх континентальных юрисдикциях.",
  },
  "hero.cta": { en: "Request access", ru: "Запросить доступ" },
  "hero.vpn": { en: "Connect", ru: "Подключиться" },

  // ═══ STATS ═══
  "stats.dc": { en: "Data centers", ru: "Дата-центра" },
  "stats.bw": { en: "Bandwidth", ru: "Пропускная способность" },
  "stats.enc": { en: "Encryption", ru: "Шифрование" },
  "stats.sla": { en: "SLA uptime", ru: "SLA аптайм" },
  "stats.noc": { en: "NOC monitoring", ru: "NOC мониторинг" },

  // ═══ BIG STATEMENT ═══
  "statement.white": {
    en: "A new standard of security.",
    ru: "Новый стандарт безопасности.",
  },
  "statement.muted": {
    en: "Military-grade encryption infrastructure built for businesses and individuals who value privacy as an absolute priority.",
    ru: "Инфраструктура шифрования военного класса для бизнеса и частных лиц, ценящих конфиденциальность как абсолютный приоритет.",
  },

  // ═══ FIG CARDS ═══
  "fig1.title": { en: "Built for enterprise", ru: "Создано для бизнеса" },
  "fig1.desc": {
    en: "Infrastructure designed around the needs of businesses handling sensitive data across jurisdictions.",
    ru: "Инфраструктура, спроектированная для бизнеса, работающего с конфиденциальными данными в разных юрисдикциях.",
  },
  "fig2.title": { en: "Distributed by design", ru: "Распределённая архитектура" },
  "fig2.desc": {
    en: "Three continental jurisdictions ensure data sovereignty and geographic fault tolerance.",
    ru: "Три континентальные юрисдикции обеспечивают суверенитет данных и географическую отказоустойчивость.",
  },
  "fig3.title": { en: "Engineered for speed", ru: "Инженерия скорости" },
  "fig3.desc": {
    en: "200 Gb/s bandwidth per server, sub-5ms regional latency, BGP Anycast routing.",
    ru: "200 Гб/с на сервер, задержка менее 5мс в регионе, BGP Anycast маршрутизация.",
  },

  // ═══ FEATURE: ENCRYPTION ═══
  "enc.title": {
    en: "Encryption trusted by governments",
    ru: "Шифрование, которому доверяют государства",
  },
  "enc.desc": {
    en: "AES-256-GCM combined with ChaCha20-Poly1305 — the standard used by NSA, NATO and EU intelligence for TOP SECRET classified data. Perfect Forward Secrecy via X25519 ECDHE.",
    ru: "AES-256-GCM в сочетании с ChaCha20-Poly1305 — стандарт шифрования спецслужб NSA, НАТО и ЕС для данных категории TOP SECRET. Perfect Forward Secrecy через X25519 ECDHE.",
  },
  "enc.link": { en: "Security stack", ru: "Стек безопасности" },

  // ═══ FEATURE: SOLUTIONS ═══
  "sol.title": { en: "Solutions for every scale", ru: "Решения любого масштаба" },
  "sol.desc": {
    en: "From personal privacy to critical enterprise infrastructure — Atlas Secure covers the full spectrum of security needs.",
    ru: "От персональной конфиденциальности до критической корпоративной инфраструктуры — Atlas Secure покрывает полный спектр потребностей.",
  },
  "sol.link": { en: "Get started", ru: "Начать" },

  // Service cards
  "srv1.t": { en: "Secure Tunneling", ru: "Защищённое туннелирование" },
  "srv1.d": {
    en: "WireGuard, IKEv2/IPSec with AES-256-GCM. Traffic obfuscation, HTTPS masking, advanced traffic protection.",
    ru: "WireGuard, IKEv2/IPSec с AES-256-GCM. Обфускация трафика, маскировка под HTTPS, продвинутая защита трафика.",
  },
  "srv2.t": { en: "Zero Trust Network", ru: "Сеть нулевого доверия" },
  "srv2.d": {
    en: "Zero trust architecture for enterprise. Microsegmentation, RBAC, continuous session verification.",
    ru: "Архитектура нулевого доверия для корпоративных сред. Микросегментация, RBAC, непрерывная верификация.",
  },
  "srv3.t": { en: "DDoS Protection", ru: "DDoS защита" },
  "srv3.d": {
    en: "Multi-layer L3/L4/L7 protection. Behavioral analysis, anycast filtering, <10s failover.",
    ru: "Многоуровневая защита L3/L4/L7. Поведенческий анализ, anycast-фильтрация, переключение <10с.",
  },
  "srv4.t": { en: "Encrypted Storage", ru: "Зашифрованное хранилище" },
  "srv4.d": {
    en: "Client-side encryption — keys never leave the device. BYOK/BYOE, S3-compatible API.",
    ru: "Клиентское шифрование — ключи не покидают устройство. BYOK/BYOE, S3-совместимый API.",
  },
  "srv5.t": { en: "Secure Remote Access", ru: "Защищённый удалённый доступ" },
  "srv5.d": {
    en: "SD-WAN, split-tunneling, hardware MFA tokens, tamper-proof session audit logs.",
    ru: "SD-WAN, split-tunneling, аппаратные MFA-токены, защищённые логи сессий.",
  },
  "srv6.t": { en: "Threat Intelligence", ru: "Анализ угроз" },
  "srv6.d": {
    en: "24/7 SOC monitoring. Threat Hunting, SIEM integration, incident response with 15min SLA.",
    ru: "SOC-мониторинг 24/7. Threat Hunting, SIEM-интеграция, реагирование с SLA 15 минут.",
  },

  // ═══ FEATURE: INFRASTRUCTURE ═══
  "infra.title": { en: "Three jurisdictions. One standard.", ru: "Три юрисдикции. Один стандарт." },
  "infra.desc": {
    en: "Partner data center network spanning Europe, Asia-Pacific and Russia — ensuring data sovereignty and compliance with local regulation.",
    ru: "Партнёрская сеть дата-центров в Европе, Азии и России — суверенитет данных и соответствие локальному регулированию.",
  },
  "infra.link": { en: "Infrastructure", ru: "Инфраструктура" },

  // ═══ FEATURE: ABOUT ═══
  "about.title": {
    en: "Security is not a feature — it\u2019s architecture",
    ru: "Безопасность — не функция, а архитектура",
  },
  "about.desc": {
    en: "Atlas Secure is an international technology company founded in Hong Kong, specializing in protected IT solutions for enterprise and private clients worldwide.",
    ru: "Atlas Secure — международная технологическая компания со штаб-квартирой в Гонконге, специализирующаяся на защищённых IT-решениях для корпоративного и частного сектора.",
  },
  "about.p1": {
    en: "The company operates at the intersection of three strategic disciplines: cryptographic data protection, high-performance network engineering, and operational security.",
    ru: "Компания работает на пересечении трёх стратегических дисциплин: криптографической защиты данных, высокопроизводительной сетевой инженерии и операционной безопасности.",
  },
  "about.p2": {
    en: "Hong Kong\u2019s special administrative status provides a unique legal framework with strong trade secret protection and independence from third parties — fundamental for information security businesses.",
    ru: "Особый административный статус Гонконга обеспечивает уникальный правовой режим с высоким уровнем защиты коммерческой тайны и независимости от третьих сторон.",
  },
  "about.p3": {
    en: "Partner infrastructure spans three continental jurisdictions — Germany, Russia and Australia — providing clients with data sovereignty, local regulatory compliance and geographically distributed fault tolerance.",
    ru: "Партнёрская инфраструктура охватывает три континентальные юрисдикции — Германию, Россию и Австралию — обеспечивая суверенитет данных и распределённую отказоустойчивость.",
  },

  // About table
  "at.hq": { en: "Headquarters", ru: "Штаб-квартира" },
  "at.hq.v": { en: "Hong Kong SAR", ru: "Гонконг, КНР (SAR)" },
  "at.type": { en: "Business type", ru: "Тип деятельности" },
  "at.type.v": { en: "B2B / B2C \u00b7 Information Security", ru: "B2B / B2C \u00b7 Информационная безопасность" },
  "at.spec": { en: "Specialization", ru: "Специализация" },
  "at.spec.v": { en: "Encrypted network solutions", ru: "Защищённые сетевые решения" },
  "at.dc": { en: "Partner DCs", ru: "Партнёрские ЦОД" },
  "at.dc.v": { en: "Germany \u00b7 Russia \u00b7 Australia", ru: "Германия \u00b7 Россия \u00b7 Австралия" },
  "at.class": { en: "Protection class", ru: "Класс защиты" },
  "at.class.v": { en: "Military-Grade \u00b7 NSA Suite B", ru: "Military-Grade \u00b7 NSA Suite B" },
  "at.std": { en: "Standards", ru: "Стандарты" },
  "at.std.v": { en: "ISO 27001 \u00b7 FIPS 140-3 \u00b7 GDPR", ru: "ISO 27001 \u00b7 FIPS 140-3 \u00b7 GDPR" },
  "at.sla": { en: "Uptime SLA", ru: "Аптайм SLA" },
  "at.sla.v": { en: "99.98% guaranteed", ru: "99.98% гарантированно" },
  "at.ops": { en: "Operations", ru: "Режим работы" },
  "at.ops.v": { en: "NOC monitoring 24/7/365", ru: "NOC-мониторинг 24/7/365" },

  // ═══ MANIFESTO ═══
  "quote": {
    en: "\u00abPrivacy is not an option or a privilege. It is a fundamental right of everyone operating in the digital space. We exist to technically guarantee that right.\u00bb",
    ru: "\u00abКонфиденциальность — это не опция и не привилегия. Это фундаментальное право каждого, кто действует в цифровом пространстве. Мы существуем, чтобы технически его гарантировать.\u00bb",
  },
  "pr1.t": { en: "Zero logs", ru: "Нулевые логи" },
  "pr1.d": {
    en: "Strict No-Log policy: no client activity data is recorded or can be disclosed to third parties.",
    ru: "Строгая политика No-Log: данные о действиях клиента не регистрируются и не передаются третьим лицам.",
  },
  "pr2.t": { en: "Transparency", ru: "Прозрачность" },
  "pr2.d": {
    en: "Open audit of cryptographic solutions by independent researchers. Quarterly transparency reports.",
    ru: "Открытый аудит криптографических решений. Ежеквартальные отчёты о прозрачности.",
  },
  "pr3.t": { en: "Independence", ru: "Независимость" },
  "pr3.d": {
    en: "Hong Kong jurisdiction ensures legal independence from third-state pressure and foreign regulators.",
    ru: "Юрисдикция Гонконга обеспечивает правовую независимость от давления третьих государств.",
  },
  "pr4.t": { en: "Security by Design", ru: "Security by Design" },
  "pr4.d": {
    en: "Protection is built into the architecture level, not added as an afterthought.",
    ru: "Защита закладывается на уровне архитектуры, а не добавляется постфактум.",
  },

  // ═══ CTA ═══
  "cta.title": { en: "Built for the future.\nAvailable today.", ru: "Создано для будущего.\nДоступно сейчас." },
  "cta.btn": { en: "Request access", ru: "Запросить доступ" },

  // ═══ FOOTER ═══
  "footer.pricing": { en: "Pricing", ru: "Тарифы" },
  "footer.terms": { en: "Terms", ru: "Условия" },
  "footer.privacy": { en: "Privacy", ru: "Конфиденциальность" },

  // ═══ PRICING PAGE ═══
  "pricing.title": { en: "Pricing", ru: "Тарифы" },
  "pricing.desc": {
    en: "Transparent pricing for every scale. Choose your configuration.",
    ru: "Прозрачное ценообразование для любого масштаба. Выберите конфигурацию.",
  },
  "pricing.yearly": { en: "Billed yearly", ru: "Годовая оплата" },
  "pricing.save": { en: "Save 20%", ru: "Скидка 20%" },
  "pricing.mo": { en: "per month", ru: "в месяц" },
  "pricing.request": { en: "Request", ru: "Запросить" },
  "pricing.contact": { en: "Contact sales", ru: "Связаться" },
  "pricing.custom": { en: "Custom configuration", ru: "Своя конфигурация" },
  "pricing.custom.sub": { en: "Custom configuration", ru: "Индивидуальная конфигурация" },
  "pricing.config.req": { en: "Request configuration", ru: "Запросить конфигурацию" },
  "pricing.unlimited": { en: "Unlimited traffic", ru: "Безлимитный трафик" },
  "pricing.port": { en: "Port speed", ru: "Скорость порта" },
  "pricing.features": { en: "Features", ru: "Возможности" },
} as const;

type TranslationKey = keyof typeof t;

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "ru",
  setLocale: () => {},
  t: (key) => t[key]?.ru || t[key]?.en || key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ru");

  useEffect(() => {
    const saved = localStorage.getItem("atlas-locale") as Locale | null;
    if (saved && (saved === "en" || saved === "ru")) {
      setLocaleState(saved);
    } else {
      // No saved preference: keep the Russian default unless the
      // browser is explicitly non-Russian AND non-CIS.
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith("en")) setLocaleState("en");
    }
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("atlas-locale", l);
  };

  const translate = (key: TranslationKey): string => {
    const entry = t[key];
    if (!entry) return key;
    return entry[locale] || entry["ru"] || entry["en"] || key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: translate }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  return (
    <button
      className="pl-lang-switch"
      onClick={() => setLocale(locale === "en" ? "ru" : "en")}
      aria-label="Switch language"
    >
      {locale === "en" ? "RU" : "EN"}
    </button>
  );
}
