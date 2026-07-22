"use client";

import Link from "next/link";
import PremiumPage from "@/components/PremiumPage";
import { useI18n } from "@/lib/i18n";

export default function AboutPage() {
  const { locale } = useI18n();
  const en = locale === "en";

  return (
    <PremiumPage>
      {/* HERO */}
      <section className="plx-hero">
        <div className="plx-hero-bg" />
        <div className="plx-hero-grid" />
        <div className="plx-wrap plx-hero-wide">
          <div className="pl-entrance pl-ed1">
            <div className="plx-eyebrow">{en ? "COMPANY" : "О КОМПАНИИ"}</div>
            <h1 className="plx-hero-title">
              {en ? "Security is not\na feature —\n" : "Безопасность —\nне функция,\n"}
              <span className="plx-grad">{en ? "it's architecture." : "а архитектура."}</span>
            </h1>
            <p className="plx-hero-desc">
              {en
                ? "Atlas Secure is an international technology company headquartered in Hong Kong. We operate at the intersection of cryptography, network engineering, and operational security."
                : "Atlas Secure — международная технологическая компания со штаб-квартирой в Гонконге. Мы работаем на пересечении криптографии, сетевой инженерии и операционной безопасности."}
            </p>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ padding: "0 0 80px" }}>
        <div className="plx-wrap">
          <div className="plx-stats">
            <div className="plx-stat"><div className="plx-stat-val">2024</div><div className="plx-stat-label">{en ? "Founded" : "Основание"}</div></div>
            <div className="plx-stat"><div className="plx-stat-val">3</div><div className="plx-stat-label">{en ? "Jurisdictions" : "Юрисдикции"}</div></div>
            <div className="plx-stat"><div className="plx-stat-val">24/7</div><div className="plx-stat-label">{en ? "NOC monitoring" : "NOC мониторинг"}</div></div>
            <div className="plx-stat"><div className="plx-stat-val">∞</div><div className="plx-stat-label">{en ? "Privacy commitment" : "Приватность"}</div></div>
          </div>
        </div>
      </section>

      {/* PRINCIPLES */}
      <section className="plx-section">
        <div className="plx-wrap">
          <div className="plx-section-head">
            <div className="plx-section-label">{en ? "Principles" : "Принципы"}</div>
            <h2 className="plx-section-title">{en ? "Four ideas we don't compromise on" : "Четыре идеи без компромиссов"}</h2>
          </div>
          <div className="plx-princ">
            {[
              { eyebrow: en ? "MINIMALISM" : "МИНИМАЛИЗМ", t: en ? "Privacy by design" : "Приватность по дизайну", d: en ? "What we don't collect cannot be stolen, subpoenaed, or leaked. Every data field we store exists only because it's technically necessary for the service to function." : "Чего мы не собираем, того не украдут, не запросят повесткой и не утечёт. Каждое поле данных хранится, только если технически необходимо для работы сервиса." },
              { eyebrow: en ? "RIGOR" : "СТРОГОСТЬ", t: en ? "Cryptographic correctness" : "Криптографическая корректность", d: en ? "We pick primitives from NIST, NSA Suite B, and peer-reviewed academic papers. No roll-your-own crypto, no 'experimental' cipher suites in production." : "Примитивы из NIST, NSA Suite B и академических работ. Никакого самодельного крипто и «экспериментальных» шифров в проде." },
              { eyebrow: en ? "INDEPENDENCE" : "НЕЗАВИСИМОСТЬ", t: en ? "Jurisdictional diversity" : "Юрисдикционное разнообразие", d: en ? "Hong Kong HQ, partner infrastructure across three continents. No single government can compel disclosure of our entire operation." : "HQ в Гонконге, партнёрская инфраструктура на трёх континентах. Ни одно правительство не может принудить раскрыть всю операцию." },
              { eyebrow: en ? "TRANSPARENCY" : "ПРОЗРАЧНОСТЬ", t: en ? "Verifiable claims" : "Проверяемые утверждения", d: en ? "Third-party audits published. Cryptographic claims are specific algorithms and key sizes. Marketing follows engineering — not the other way around." : "Публикуем результаты внешних аудитов. Криптоутверждения — это конкретные алгоритмы и размеры ключей. Маркетинг следует за инженерией, а не наоборот." },
            ].map((p, i) => (
              <div key={p.t} className="plx-princ-card" data-n={String(i + 1).padStart(2, "0")}>
                <div className="plx-princ-eyebrow">{p.eyebrow}</div>
                <h3>{p.t}</h3>
                <p>{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="plx-section" style={{ paddingTop: 0 }}>
        <div className="plx-wrap" style={{ maxWidth: 900 }}>
          <div className="plx-section-head">
            <div className="plx-section-label">{en ? "Milestones" : "Вехи"}</div>
            <h2 className="plx-section-title">{en ? "Where we've been" : "Путь компании"}</h2>
          </div>
          <div className="plx-timeline">
            {[
              { d: "Q1 2026", t: en ? "1M users" : "1 миллион пользователей", desc: en ? "Crossed a million active users. Expanded NOC to 24/7/365 across two shifts." : "Превысили миллион активных пользователей. Расширили NOC до 24/7/365 в две смены." },
              { d: "Q3 2025", t: en ? "Sydney DC online" : "Запуск ДЦ в Сиднее", desc: en ? "Third continental jurisdiction launched. APAC latency dropped below 15ms." : "Третья континентальная юрисдикция. APAC-задержка упала ниже 15мс." },
              { d: "Q1 2025", t: en ? "ISO 27001 certified" : "Сертификация ISO 27001", desc: en ? "Certified after a six-month external audit. Valid through 2028." : "Сертификация после шестимесячного внешнего аудита. Действует до 2028." },
              { d: "Q3 2024", t: en ? "Moscow DC online" : "Запуск ДЦ в Москве", desc: en ? "Data localization for RU-region customers. 152-FZ compliance enabled." : "Локализация данных для клиентов РФ. 152-ФЗ комплаенс активирован." },
              { d: "Q1 2024", t: en ? "Company founded in Hong Kong" : "Основание компании в Гонконге", desc: en ? "Atlas Secure incorporated. Frankfurt DC launched as our first presence." : "Atlas Secure зарегистрирована. Франкфурт — первое присутствие." },
            ].map((e) => (
              <div key={e.d} className="plx-tl-item">
                <div className="plx-tl-date">{e.d}</div>
                <div className="plx-tl-title">{e.t}</div>
                <div className="plx-tl-desc">{e.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="plx-section" style={{ paddingTop: 0 }}>
        <div className="plx-wrap" style={{ maxWidth: 880 }}>
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontFamily: "var(--pl-mono)", fontSize: 11, letterSpacing: "0.14em", color: "var(--pl-accent)", textTransform: "uppercase", marginBottom: 24 }}>{en ? "MANIFESTO" : "МАНИФЕСТ"}</div>
            <blockquote style={{ fontSize: "clamp(22px, 2.6vw, 34px)", fontWeight: 400, lineHeight: 1.4, letterSpacing: "-0.015em", color: "var(--pl-t1)", fontStyle: "italic", margin: 0 }}>
              {en
                ? `"Encryption is not a luxury. It is infrastructure — as foundational as electricity or water. We build the pipes, not the products you run over them."`
                : `«Шифрование — не роскошь. Это инфраструктура — такая же базовая, как электричество или вода. Мы строим трубы, а не продукты, которые через них идут».`}
            </blockquote>
            <div style={{ fontSize: 13, color: "var(--pl-t3)", marginTop: 24, letterSpacing: "0.06em" }}>— Atlas Secure</div>
          </div>
        </div>
      </section>

      {/* COMPANY DETAILS */}
      <section className="plx-section" style={{ paddingTop: 0 }}>
        <div className="plx-wrap" style={{ maxWidth: 900 }}>
          <div className="plx-section-head">
            <div className="plx-section-label">{en ? "Company details" : "Реквизиты"}</div>
            <h2 className="plx-section-title">{en ? "Who we are, on paper" : "Кто мы — документально"}</h2>
          </div>
          <div className="pl-about-table-full" style={{ maxWidth: "100%" }}>
            {[
              [en ? "Headquarters" : "Штаб-квартира", en ? "Hong Kong SAR" : "Гонконг, КНР (SAR)"],
              [en ? "Business type" : "Деятельность", en ? "B2B / B2C · Information Security" : "B2B / B2C · Информационная безопасность"],
              [en ? "Specialization" : "Специализация", en ? "Encrypted network solutions, VPS/VDS, cybersecurity" : "Защищённые сетевые решения, VPS/VDS, кибербезопасность"],
              [en ? "Partner DCs" : "Партнёрские ЦОД", en ? "Germany · Russia · Australia" : "Германия · Россия · Австралия"],
              [en ? "Protection class" : "Класс защиты", "Military-Grade · NSA Suite B · FIPS 140-3"],
              [en ? "Standards" : "Стандарты", "ISO/IEC 27001 · SOC 2 Type II · GDPR · 152-FZ"],
              [en ? "Uptime SLA" : "Аптайм SLA", en ? "99.98% guaranteed" : "99.98% гарантированно"],
              [en ? "Operations" : "Режим работы", "NOC 24/7/365"],
              [en ? "Founded" : "Основана", "2024"],
              [en ? "Security contact" : "Контакт безопасности", "security@atlas.secure"],
            ].map(([k, v]) => (
              <div key={k} className="pl-about-row"><span className="pl-about-key">{k}</span><span className="pl-about-val">{v}</span></div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="plx-section" style={{ paddingTop: 0 }}>
        <div className="plx-wrap">
          <div className="plx-cta-box">
            <h2>{en ? "Build with us" : "Построим вместе"}</h2>
            <p>{en ? "Whether you're a business or an individual, we have a plan that fits." : "Бизнес или частный клиент — у нас есть подходящий план."}</p>
            <div className="pl-cta-buttons">
              <Link href="/pricing" className="pl-cta-btn-light">{en ? "View pricing" : "Тарифы"} <span className="pl-arrow">→</span></Link>
              <Link href="/contact" className="pl-cta-btn-dark">{en ? "Contact us" : "Связаться"}</Link>
            </div>
          </div>
        </div>
      </section>
    </PremiumPage>
  );
}
