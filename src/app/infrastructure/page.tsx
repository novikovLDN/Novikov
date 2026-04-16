"use client";

import Link from "next/link";
import PremiumPage from "@/components/PremiumPage";
import { useI18n } from "@/lib/i18n";

export default function InfrastructurePage() {
  const { locale } = useI18n();
  const en = locale === "en";

  return (
    <PremiumPage>
      <div className="pl-product-hero">
        <div className="pl-product-hero-inner">
          <div className="pl-product-hero-text">
            <div className="pl-eyebrow">{en ? "Infrastructure" : "Инфраструктура"}</div>
            <h1 className="pl-product-title">{en ? "Three jurisdictions.\nOne standard." : "Три юрисдикции.\nОдин стандарт."}</h1>
            <p className="pl-product-desc">{en ? "Partner data centers across Europe, Asia-Pacific and Russia. Data sovereignty, local compliance, and geographic fault tolerance." : "Партнёрские дата-центры в Европе, АТР и России. Суверенитет данных, локальное соответствие и географическая отказоустойчивость."}</p>
          </div>
        </div>
      </div>
      <div className="pl-product-features">
        <div className="pl-product-grid">
          {[
            { t: "Frankfurt, DE", sub: "Tier IV", specs: en ? ["GDPR / BSI C5 / ISO 27001", "DE-CIX — world's largest IXP", "100% renewable energy", "PUE \u2264 1.3"] : ["GDPR / BSI C5 / ISO 27001", "DE-CIX — крупнейший IXP в мире", "100% возобновляемая энергия", "PUE \u2264 1.3"] },
            { t: en ? "Moscow, RU" : "Москва, RU", sub: "Tier III+", specs: en ? ["152-FZ / FSTEC / GOST", "MSK-IX backbone", "Data localization compliant", "2N power redundancy"] : ["152-ФЗ / ФСТЭК / ГОСТ", "MSK-IX магистраль", "Локализация данных в РФ", "2N резервирование питания"] },
            { t: "Sydney, AU", sub: "Tier III", specs: en ? ["Privacy Act 1988 / ASD ISM", "AMS-IX Pacific / Megaport", "APAC: JP, SG, NZ coverage", "SOC 2 Type II certified"] : ["Privacy Act 1988 / ASD ISM", "AMS-IX Pacific / Megaport", "АТР: Япония, Сингапур, НЗ", "SOC 2 Type II сертификация"] },
          ].map((dc) => (
            <div key={dc.t} className="pl-product-feature">
              <h3>{dc.t}</h3>
              <p style={{ color: 'var(--pl-accent)', fontSize: 12, marginBottom: 12 }}>{dc.sub}</p>
              {dc.specs.map((s) => <p key={s} style={{ marginBottom: 4 }}>{s}</p>)}
            </div>
          ))}
        </div>
      </div>
      <div className="pl-product-features">
        <h2 className="pl-product-section-title">{en ? "Network specifications" : "Сетевые характеристики"}</h2>
        <div className="pl-product-grid pl-product-grid-2">
          {[
            { t: en ? "Bandwidth" : "Пропускная способность", d: en ? "Up to 200 Gb/s per server. BGP Anycast routing with sub-30s failover." : "До 200 Гб/с на сервер. BGP Anycast маршрутизация с переключением менее 30с." },
            { t: en ? "Latency" : "Задержка", d: en ? "Sub-5ms within region. Optimized peering with major IX points." : "Менее 5мс внутри региона. Оптимизированный пиринг с крупными IX." },
            { t: en ? "Uptime SLA" : "SLA аптайм", d: en ? "99.98% guaranteed uptime backed by enterprise-grade redundancy." : "99.98% гарантированный аптайм с корпоративным резервированием." },
            { t: "NOC 24/7/365", d: en ? "Network operations center monitoring around the clock, every day." : "Круглосуточный мониторинг сетевого операционного центра." },
          ].map((f) => (
            <div key={f.t} className="pl-product-feature"><h3>{f.t}</h3><p>{f.d}</p></div>
          ))}
        </div>
      </div>
      <div className="pl-product-cta">
        <h2>{en ? "Deploy globally" : "Разверните глобально"}</h2>
        <div className="pl-cta-buttons"><Link href="/pricing" className="pl-cta-btn-light">{en ? "View pricing" : "Тарифы"}</Link><Link href="/contact" className="pl-cta-btn-dark">{en ? "Contact us" : "Связаться"}</Link></div>
      </div>
    </PremiumPage>
  );
}
