"use client";

import Link from "next/link";
import PremiumPage from "@/components/PremiumPage";
import { useI18n } from "@/lib/i18n";

export default function VpsPage() {
  const { locale } = useI18n();
  const en = locale === "en";

  return (
    <PremiumPage>
      <div className="pl-product-hero">
        <div className="pl-product-hero-inner">
          <div className="pl-product-hero-text">
            <div className="pl-eyebrow">VPS</div>
            <h1 className="pl-product-title">{en ? "Virtual Private\nServers" : "Виртуальные\nсерверы"}</h1>
            <p className="pl-product-desc">{en ? "Scalable virtual infrastructure with NVMe storage, DDoS protection, and full root access. Deploy in Frankfurt, Moscow, or Sydney." : "Масштабируемая виртуальная инфраструктура с NVMe хранилищем, DDoS защитой и полным root-доступом. Деплой во Франкфурте, Москве или Сиднее."}</p>
            <div className="pl-product-actions">
              <Link href="/pricing" className="pl-cta-btn-light">{en ? "Configure" : "Конфигуратор"}</Link>
              <Link href="/contact" className="pl-cta-btn-dark">{en ? "Request access" : "Запросить доступ"}</Link>
            </div>
          </div>
          <div className="pl-product-visual">
            <div className="pl-pv-specs-card">
              <div className="pl-pv-specs-title">{en ? "Configuration" : "Конфигурация"}</div>
              <div className="pl-pv-specs-grid">
                {[["vCPU","1 — 16"],["RAM","1 — 32 GB"],["NVMe SSD","10 — 500 GB"],["Port","1 — 200 Gb/s"],["Traffic",en ? "Unlimited" : "Безлимит"],["DDoS","L3/L4/L7"]].map(([k,v])=>(
                  <div key={k} className="pl-pv-spec-row"><span className="pl-pv-spec-k">{k}</span><span className="pl-pv-spec-v">{v}</span></div>
                ))}
              </div>
              <div className="pl-pv-specs-price">{en ? "from" : "от"} <strong>$7.99</strong> / {en ? "month" : "мес"}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="pl-product-features">
        <h2 className="pl-product-section-title">{en ? "Built for performance" : "Создано для производительности"}</h2>
        <div className="pl-product-grid">
          {[
            { t: en?"NVMe Storage":"NVMe хранилище", d: en?"Ultra-fast NVMe SSD storage with consistent IOPS.":"Сверхбыстрое NVMe SSD хранилище со стабильным IOPS." },
            { t: en?"Full Root Access":"Полный root-доступ", d: en?"Complete control over your server. Install anything.":"Полный контроль над сервером. Устанавливайте что угодно." },
            { t: en?"DDoS Protection":"DDoS защита", d: en?"Multi-layer L3/L4/L7 protection included with every VPS.":"Многоуровневая L3/L4/L7 защита включена в каждый VPS." },
            { t: en?"Unlimited Traffic":"Безлимитный трафик", d: en?"No bandwidth caps. Transfer as much data as you need.":"Без ограничений трафика. Передавайте сколько нужно." },
            { t: en?"3 Regions":"3 региона", d: en?"Deploy in Germany, Russia, or Australia.":"Деплой в Германии, России или Австралии." },
            { t: en?"99.98% SLA":"99.98% SLA", d: en?"Enterprise-grade uptime guarantee backed by our infrastructure.":"Гарантия аптайма корпоративного уровня." },
          ].map((f) => (
            <div key={f.t} className="pl-product-feature"><h3>{f.t}</h3><p>{f.d}</p></div>
          ))}
        </div>
      </div>
      <div className="pl-product-cta">
        <h2>{en ? "Deploy your server" : "Разверните сервер"}</h2>
        <div className="pl-cta-buttons"><Link href="/pricing" className="pl-cta-btn-light">{en ? "Configure" : "Конфигуратор"}</Link><Link href="/contact" className="pl-cta-btn-dark">{en ? "Request access" : "Запросить доступ"}</Link></div>
      </div>
    </PremiumPage>
  );
}
