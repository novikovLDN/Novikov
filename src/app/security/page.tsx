"use client";

import Link from "next/link";
import PremiumPage from "@/components/PremiumPage";
import { useI18n } from "@/lib/i18n";

export default function SecurityPage() {
  const { locale } = useI18n();
  const en = locale === "en";

  return (
    <PremiumPage>
      <div className="pl-product-hero">
        <div className="pl-product-hero-inner">
          <div className="pl-product-hero-text">
            <div className="pl-eyebrow">Security</div>
            <h1 className="pl-product-title">{en ? "Safe, secure,\nand private." : "Безопасно,\nнадёжно, приватно."}</h1>
            <p className="pl-product-desc">{en ? "Every layer of Atlas Secure is built with security-first architecture. Your data never touches our logs because we don't keep any." : "Каждый уровень Atlas Secure построен с архитектурой security-first. Ваши данные никогда не попадают в логи, потому что мы их не ведём."}</p>
          </div>
          {/* Cert badges */}
          <div className="pl-product-visual pl-cert-visual">
            <div className="pl-cert-badges-row">
              {[
                { t1: "ISO", t2: "27001" },
                { t1: "GDPR", t2: "Compliant" },
                { t1: "FIPS", t2: "140-3" },
                { t1: "SOC 2", t2: "Type II" },
              ].map((b) => (
                <div key={b.t1} className="pl-cert-badge-sm">
                  <svg viewBox="0 0 80 80" className="pl-cert-svg-sm">
                    <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="0.6" fill="none" opacity="0.2" />
                    <text x="40" y="36" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="500" opacity="0.5">{b.t1}</text>
                    <text x="40" y="50" textAnchor="middle" fill="currentColor" fontSize="8" opacity="0.35">{b.t2}</text>
                  </svg>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Encryption stack */}
      <div className="pl-product-features">
        <h2 className="pl-product-section-title">{en ? "Encryption stack" : "Стек шифрования"}</h2>
        <div className="pl-product-grid pl-product-grid-2">
          {[
            { t: "AES-256-GCM", d: en ? "The gold standard. 256-bit symmetric encryption approved by NSA for TOP SECRET classified data. 2^256 possible keys." : "Золотой стандарт. 256-битное шифрование, одобренное NSA для данных TOP SECRET. 2^256 возможных ключей." },
            { t: "ChaCha20-Poly1305", d: en ? "Alternative cipher by Daniel Bernstein. Used by Google in QUIC. Identical security level with hardware acceleration." : "Альтернативный шифр Даниеля Бернштейна. Используется Google в QUIC. Идентичный уровень безопасности с аппаратным ускорением." },
            { t: "X25519 ECDHE", d: en ? "Elliptic curve key exchange providing Perfect Forward Secrecy. Compromise of one session cannot reveal others." : "Обмен ключами на эллиптических кривых с Perfect Forward Secrecy. Компрометация одного сеанса не раскрывает другие." },
            { t: "TLS 1.3", d: en ? "Latest TLS version with zero-RTT handshake. No legacy algorithms, no vulnerable cipher suites." : "Новейшая версия TLS с нулевым RTT. Без устаревших алгоритмов и уязвимых шифров." },
          ].map((f) => (
            <div key={f.t} className="pl-product-feature"><h3>{f.t}</h3><p>{f.d}</p></div>
          ))}
        </div>
      </div>

      {/* Protection features */}
      <div className="pl-product-features">
        <h2 className="pl-product-section-title">{en ? "Protection at every level" : "Защита на каждом уровне"}</h2>
        <div className="pl-product-grid">
          {[
            { t: en ? "Zero Logs" : "Нулевые логи", d: en ? "Strict no-log policy. We cannot disclose what we don't have." : "Строгая политика no-log. Мы не можем раскрыть то, чего у нас нет." },
            { t: "Kill Switch", d: en ? "Automatic traffic blocking on VPN disconnect. Not a single packet leaks." : "Автоматическая блокировка при отключении VPN. Ни один пакет не утечёт." },
            { t: en ? "DNS Protection" : "Защита DNS", d: en ? "All DNS queries encrypted and routed through secure resolvers." : "Все DNS-запросы зашифрованы и маршрутизируются через защищённые резолверы." },
            { t: en ? "IPv6 Leak Protection" : "Защита от утечки IPv6", d: en ? "IPv6 traffic is blocked to prevent accidental leaks outside the tunnel." : "IPv6-трафик блокируется для предотвращения утечек за пределы туннеля." },
            { t: en ? "DDoS Mitigation" : "DDoS защита", d: en ? "Multi-layer L3/L4/L7 protection with sub-10s failover." : "Многоуровневая L3/L4/L7 защита с переключением менее 10с." },
            { t: en ? "Security Audits" : "Аудит безопасности", d: en ? "Regular independent audits by third-party security researchers." : "Регулярный независимый аудит сторонними исследователями безопасности." },
          ].map((f) => (
            <div key={f.t} className="pl-product-feature"><h3>{f.t}</h3><p>{f.d}</p></div>
          ))}
        </div>
      </div>

      <div className="pl-product-cta">
        <h2>{en ? "Your privacy matters" : "Ваша приватность важна"}</h2>
        <div className="pl-cta-buttons"><Link href="/auth" className="pl-cta-btn-light">{en ? "Get protected" : "Защититься"}</Link><Link href="/contact" className="pl-cta-btn-dark">{en ? "Contact us" : "Связаться"}</Link></div>
      </div>
    </PremiumPage>
  );
}
