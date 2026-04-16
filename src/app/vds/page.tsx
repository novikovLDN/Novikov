"use client";

import Link from "next/link";
import PremiumPage from "@/components/PremiumPage";
import { useI18n } from "@/lib/i18n";

export default function VdsPage() {
  const { locale } = useI18n();
  const en = locale === "en";

  return (
    <PremiumPage>
      <div className="pl-product-hero">
        <div className="pl-product-hero-inner">
          <div className="pl-product-hero-text">
            <div className="pl-eyebrow">VDS</div>
            <h1 className="pl-product-title">{en ? "Dedicated\nServers" : "Выделенные\nсерверы"}</h1>
            <p className="pl-product-desc">{en ? "Dedicated physical resources with no sharing. Maximum performance for mission-critical workloads with full hardware isolation." : "Выделенные физические ресурсы без шаринга. Максимальная производительность для критических нагрузок с полной изоляцией."}</p>
            <div className="pl-product-actions">
              <Link href="/pricing" className="pl-cta-btn-light">{en ? "Configure" : "Конфигуратор"}</Link>
              <Link href="/contact" className="pl-cta-btn-dark">{en ? "Request access" : "Запросить доступ"}</Link>
            </div>
          </div>
          <div className="pl-product-visual">
            <div className="pl-pv-specs-card">
              <div className="pl-pv-specs-title">{en ? "Dedicated Resources" : "Выделенные ресурсы"}</div>
              <div className="pl-pv-specs-grid">
                {[["CPU","2 — 32 cores"],["RAM","4 — 64 GB"],["NVMe SSD","50 — 1000 GB"],["Port","1 — 200 Gb/s"],["Traffic",en ? "Unlimited" : "Безлимит"],["Isolation",en ? "Full hardware" : "Полная аппаратная"]].map(([k,v])=>(
                  <div key={k} className="pl-pv-spec-row"><span className="pl-pv-spec-k">{k}</span><span className="pl-pv-spec-v">{v}</span></div>
                ))}
              </div>
              <div className="pl-pv-specs-price">{en ? "from" : "от"} <strong>$29.99</strong> / {en ? "month" : "мес"}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="pl-product-features">
        <h2 className="pl-product-section-title">{en ? "Maximum isolation" : "Максимальная изоляция"}</h2>
        <div className="pl-product-grid">
          {[
            { t: en?"Dedicated CPU":"Выделенный CPU", d: en?"Physical CPU cores exclusively for your workloads. No noisy neighbors.":"Физические ядра CPU эксклюзивно для ваших задач. Без соседей." },
            { t: en?"Hardware Isolation":"Аппаратная изоляция", d: en?"Complete hardware-level isolation from other customers.":"Полная изоляция на аппаратном уровне от других клиентов." },
            { t: en?"NVMe RAID":"NVMe RAID", d: en?"Enterprise NVMe storage with RAID for data redundancy.":"Enterprise NVMe хранилище с RAID для избыточности данных." },
            { t: en?"Custom OS":"Свой ОС", d: en?"Install any operating system. Full bare-metal control.":"Установите любую ОС. Полный bare-metal контроль." },
            { t: en?"200 Gb/s Ports":"Порты до 200 Gb/s", d: en?"Bandwidth up to 200 Gb/s with unlimited traffic.":"Пропускная способность до 200 Гб/с с безлимитным трафиком." },
            { t: en?"24/7 NOC":"NOC 24/7", d: en?"Round-the-clock network operations center monitoring.":"Круглосуточный мониторинг сетевого операционного центра." },
          ].map((f) => (
            <div key={f.t} className="pl-product-feature"><h3>{f.t}</h3><p>{f.d}</p></div>
          ))}
        </div>
      </div>
      <div className="pl-product-cta">
        <h2>{en ? "Get dedicated power" : "Получите выделенную мощь"}</h2>
        <div className="pl-cta-buttons"><Link href="/pricing" className="pl-cta-btn-light">{en ? "Configure" : "Конфигуратор"}</Link><Link href="/contact" className="pl-cta-btn-dark">{en ? "Request access" : "Запросить доступ"}</Link></div>
      </div>
    </PremiumPage>
  );
}
