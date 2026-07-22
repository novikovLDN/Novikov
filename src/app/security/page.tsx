"use client";

import Link from "next/link";
import PremiumPage from "@/components/PremiumPage";
import { useI18n } from "@/lib/i18n";

export default function SecurityPage() {
  const { locale } = useI18n();
  const en = locale === "en";

  return (
    <PremiumPage>
      {/* HERO */}
      <section className="plx-hero">
        <div className="plx-hero-bg" />
        <div className="plx-hero-grid" />
        <div className="plx-wrap plx-hero-inner">
          <div className="pl-entrance pl-ed1">
            <div className="plx-eyebrow">{en ? "SECURITY" : "БЕЗОПАСНОСТЬ"}</div>
            <h1 className="plx-hero-title">
              {en ? "Safe. Secure.\n" : "Безопасно.\nНадёжно.\n"}
              <span className="plx-grad">{en ? "Private." : "Приватно."}</span>
            </h1>
            <p className="plx-hero-desc">
              {en
                ? "Security is not a bullet-point. It's the architecture. Every layer — from key exchange to logging policy — is built around one principle: what we don't store, we cannot disclose."
                : "Безопасность — не пункт списка, а архитектура. Каждый слой — от обмена ключами до политики логов — построен вокруг одного принципа: чего нет, того нельзя раскрыть."}
            </p>
            <div className="plx-hero-actions">
              <Link href="/auth" className="pl-cta-btn-light">{en ? "Get protected" : "Защититься"} <span className="pl-arrow">→</span></Link>
              <Link href="/contact" className="pl-cta-btn-dark">{en ? "Security contact" : "Контакт по безопасности"}</Link>
            </div>
          </div>

          {/* Shield visual */}
          <div className="pl-entrance pl-ed2">
            <div style={{ position: "relative", border: "1px solid var(--pl-border)", borderRadius: 20, background: "var(--pl-surface)", padding: 40, minHeight: 420, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              <svg viewBox="0 0 300 340" style={{ width: "100%", maxWidth: 280, position: "relative", zIndex: 1 }}>
                <defs>
                  <linearGradient id="shGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="#5E6AD2" stopOpacity="0.4" />
                    <stop offset="1" stopColor="#5E6AD2" stopOpacity="0" />
                  </linearGradient>
                  <filter id="shGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8" /></filter>
                </defs>
                {/* Concentric rings */}
                {[140, 110, 80].map((r, i) => (
                  <circle key={r} cx="150" cy="170" r={r} fill="none" stroke="rgba(94,106,210,0.15)" strokeWidth="1" strokeDasharray={i === 1 ? "3 6" : "none"}>
                    <animate attributeName="r" values={`${r};${r + 4};${r}`} dur={`${3 + i}s`} repeatCount="indefinite" />
                  </circle>
                ))}
                {/* Shield */}
                <path d="M150 40 L220 70 L220 170 C220 220 190 260 150 280 C110 260 80 220 80 170 L80 70 Z"
                  fill="url(#shGrad)" stroke="#5E6AD2" strokeWidth="1.5" />
                <path d="M150 40 L220 70 L220 170 C220 220 190 260 150 280 C110 260 80 220 80 170 L80 70 Z"
                  fill="none" stroke="#5E6AD2" strokeWidth="2" filter="url(#shGlow)" opacity="0.5" />
                {/* Checkmark */}
                <path d="M120 160 L145 185 L185 140" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                {/* Orbiting dots */}
                {[0, 72, 144, 216, 288].map((deg, i) => {
                  const r = 140;
                  const x = 150 + r * Math.cos((deg - 90) * Math.PI / 180);
                  const y = 170 + r * Math.sin((deg - 90) * Math.PI / 180);
                  return <circle key={i} cx={x} cy={y} r="4" fill="#5E6AD2"><animate attributeName="opacity" values="0.3;1;0.3" dur={`${2 + i * 0.2}s`} repeatCount="indefinite" /></circle>;
                })}
                {/* Labels */}
                <text x="150" y="320" textAnchor="middle" fontFamily="var(--pl-mono)" fontSize="10" fill="#8A8A8E" letterSpacing="0.12em">AES-256-GCM · TLS 1.3 · X25519</text>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* CERTIFICATIONS */}
      <section className="plx-section">
        <div className="plx-wrap">
          <div className="plx-section-head">
            <div className="plx-section-label">{en ? "Certifications" : "Сертификации"}</div>
            <h2 className="plx-section-title">{en ? "Verified by third parties" : "Проверено третьими сторонами"}</h2>
            <p className="plx-section-desc">{en ? "Independent auditors have examined our infrastructure, policies, and code paths." : "Независимые аудиторы проверили инфраструктуру, политики и код."}</p>
          </div>
          <div className="plx-fgrid plx-fgrid-4">
            {[
              { t: "ISO 27001", sub: "Information Security", d: en ? "Annual surveillance audit. Certificate valid through 2027." : "Ежегодный надзорный аудит. Сертификат действует до 2027." },
              { t: "SOC 2 Type II", sub: "Trust Services", d: en ? "12-month operating effectiveness review by Big-4 auditor." : "12-месячный обзор операционной эффективности аудитором Big-4." },
              { t: "GDPR", sub: "EU Data Protection", d: en ? "Full compliance for EU residents. DPO appointed." : "Полное соответствие для резидентов ЕС. Назначен DPO." },
              { t: "FIPS 140-3", sub: "Cryptographic Module", d: en ? "Cryptographic modules validated against NIST standards." : "Криптомодули валидированы по стандартам NIST." },
            ].map((c) => (
              <div key={c.t} className="plx-fcard" style={{ textAlign: "center", paddingTop: 40, paddingBottom: 40 }}>
                <div className="plx-fcard-icon" style={{ margin: "0 auto 20px" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </div>
                <h3 style={{ fontSize: 17, letterSpacing: "-0.01em" }}>{c.t}</h3>
                <div style={{ fontFamily: "var(--pl-mono)", fontSize: 10, color: "var(--pl-accent)", letterSpacing: "0.1em", margin: "4px 0 10px", textTransform: "uppercase" }}>{c.sub}</div>
                <p>{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ENCRYPTION STACK */}
      <section className="plx-section" style={{ paddingTop: 0 }}>
        <div className="plx-wrap">
          <div className="plx-section-head">
            <div className="plx-section-label">{en ? "Encryption stack" : "Стек шифрования"}</div>
            <h2 className="plx-section-title">{en ? "Defense in depth" : "Глубокая защита"}</h2>
          </div>
          <div className="plx-enc-stack">
            <div className="plx-enc-layers">
              {[
                { n: "L1", name: "TLS 1.3", d: en ? "Zero-RTT handshake, no legacy cipher suites" : "Zero-RTT рукопожатие, без устаревших шифров" },
                { n: "L2", name: "AES-256-GCM", d: en ? "Authenticated symmetric encryption" : "Аутентифицированное симметричное шифрование" },
                { n: "L3", name: "ChaCha20-Poly1305", d: en ? "Software fallback cipher (Bernstein)" : "Программный fallback-шифр (Bernstein)" },
                { n: "L4", name: "X25519 ECDHE", d: en ? "Perfect forward secrecy via curve25519" : "Perfect forward secrecy через curve25519" },
                { n: "L5", name: "Ed25519", d: en ? "Signature scheme for auth tokens" : "Подписи для токенов аутентификации" },
                { n: "L6", name: "HKDF-SHA256", d: en ? "Key derivation for session material" : "Деривация ключей сессии" },
              ].map((l) => (
                <div key={l.n} className="plx-enc-layer">
                  <div className="plx-enc-layer-n">{l.n}</div>
                  <div style={{ flex: 1 }}>
                    <div className="plx-enc-layer-name">{l.name}</div>
                    <div className="plx-enc-layer-desc">{l.d}</div>
                  </div>
                  <div className="plx-enc-layer-dot" />
                </div>
              ))}
            </div>
            <div>
              <h3 style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 16 }}>{en ? "Six layers, one promise" : "Шесть слоёв, одно обещание"}</h3>
              <p style={{ fontSize: 15, color: "var(--pl-t2)", lineHeight: 1.75, marginBottom: 16 }}>
                {en
                  ? "We don't just pick modern algorithms — we layer them. TLS 1.3 wraps the transport. AES-256-GCM and ChaCha20-Poly1305 alternate on hardware. X25519 rekeys every session, so a past key compromise cannot decrypt future or past traffic."
                  : "Мы не просто выбираем современные алгоритмы — мы наслаиваем их. TLS 1.3 охватывает транспорт. AES-256-GCM и ChaCha20-Poly1305 чередуются в зависимости от железа. X25519 перегенерирует ключ каждую сессию — утечка одного ключа не расшифровывает ни прошлый, ни будущий трафик."}
              </p>
              <p style={{ fontSize: 15, color: "var(--pl-t2)", lineHeight: 1.75 }}>
                {en
                  ? "All algorithms are approved by NSA Suite B and validated under FIPS 140-3."
                  : "Все алгоритмы одобрены NSA Suite B и валидированы по FIPS 140-3."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PROTECTION FEATURES */}
      <section className="plx-section" style={{ paddingTop: 0 }}>
        <div className="plx-wrap">
          <div className="plx-section-head">
            <div className="plx-section-label">{en ? "Protection" : "Защита"}</div>
            <h2 className="plx-section-title">{en ? "Practical safeguards" : "Практические меры защиты"}</h2>
          </div>
          <div className="plx-fgrid">
            {[
              { t: en ? "Zero logs" : "Нулевые логи", d: en ? "We do not record connection times, IP addresses, DNS queries, or per-user bandwidth. What we don't have cannot be disclosed." : "Мы не записываем время подключений, IP, DNS-запросы и трафик по пользователю. Чего нет — того нельзя раскрыть." },
              { t: "Kill Switch", d: en ? "System-level firewall rules drop all traffic on disconnect. Not a single packet leaks." : "Системные правила файрвола блокируют весь трафик при разрыве соединения. Ни один пакет не утечёт." },
              { t: en ? "DNS over HTTPS" : "DNS over HTTPS", d: en ? "Every DNS query encrypted and routed through our own resolvers. No ISP-level tracking." : "Каждый DNS-запрос зашифрован и маршрутизируется через наши резолверы. Без отслеживания на уровне провайдера." },
              { t: en ? "IPv6 leak protection" : "Защита от IPv6-утечек", d: en ? "IPv6 traffic is either tunneled or blocked. No dual-stack leak paths." : "IPv6-трафик либо туннелируется, либо блокируется. Без dual-stack утечек." },
              { t: en ? "DDoS scrubbing" : "DDoS фильтрация", d: en ? "Global scrubbing centers filter L3/4/7 attacks. Sub-10s mitigation." : "Глобальные центры фильтрации L3/4/7. Митигация менее 10с." },
              { t: en ? "WebAuthn / Passkeys" : "WebAuthn / Passkeys", d: en ? "Passwordless authentication with hardware-backed keys. Phishing-resistant." : "Аутентификация без паролей через hardware-ключи. Устойчиво к фишингу." },
            ].map((f) => (
              <div key={f.t} className="plx-fcard">
                <div className="plx-fcard-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 12l2 2 4-4M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <h3>{f.t}</h3>
                <p>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AUDIT TIMELINE */}
      <section className="plx-section" style={{ paddingTop: 0 }}>
        <div className="plx-wrap" style={{ maxWidth: 900 }}>
          <div className="plx-section-head">
            <div className="plx-section-label">{en ? "Transparency" : "Прозрачность"}</div>
            <h2 className="plx-section-title">{en ? "Audit history" : "История аудитов"}</h2>
            <p className="plx-section-desc">{en ? "Public record of every third-party security review." : "Публичный реестр каждой внешней проверки безопасности."}</p>
          </div>
          <div className="plx-timeline">
            {[
              { d: "Q1 2026", t: en ? "SOC 2 Type II renewal" : "Продление SOC 2 Type II", desc: en ? "12-month operating effectiveness review. Zero material findings." : "12-месячный обзор эффективности. Ноль материальных замечаний." },
              { d: "Q4 2025", t: en ? "Cryptographic code audit" : "Аудит криптокода", desc: en ? "Cure53 reviewed Xray integration layer and key handling. All findings remediated." : "Cure53 проверил интеграцию Xray и обработку ключей. Все замечания устранены." },
              { d: "Q3 2025", t: en ? "Penetration test" : "Пентест", desc: en ? "External pentest of customer-facing endpoints. Minor findings, all fixed within 48h." : "Внешний пентест клиентских эндпоинтов. Мелкие находки, исправлены за 48ч." },
              { d: "Q2 2025", t: en ? "ISO 27001 re-certification" : "Пересертификация ISO 27001", desc: en ? "Three-year recertification audit by accredited certification body." : "Трёхлетняя пересертификация аккредитованным органом." },
              { d: "Q1 2025", t: en ? "GDPR compliance review" : "Обзор GDPR", desc: en ? "DPO-led review of data processing activities and subprocessor list." : "Обзор обработки данных и списка субпроцессоров под руководством DPO." },
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

      {/* CTA */}
      <section className="plx-section" style={{ paddingTop: 0 }}>
        <div className="plx-wrap">
          <div className="plx-cta-box">
            <h2>{en ? "Your privacy, uncompromised" : "Ваша приватность, без компромиссов"}</h2>
            <p>{en ? "Report a vulnerability · security@atlas.secure" : "Сообщить об уязвимости · security@atlas.secure"}</p>
            <div className="pl-cta-buttons">
              <Link href="/auth" className="pl-cta-btn-light">{en ? "Get protected" : "Защититься"} <span className="pl-arrow">→</span></Link>
              <Link href="/contact" className="pl-cta-btn-dark">{en ? "Contact security" : "Безопасность"}</Link>
            </div>
          </div>
        </div>
      </section>
    </PremiumPage>
  );
}
