"use client";

import Link from "next/link";
import { useState } from "react";
import PremiumPage from "@/components/PremiumPage";
import { useI18n } from "@/lib/i18n";

function Icon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    shield: <><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z" /><path d="M9 12l2 2 4-4" /></>,
    key: <><circle cx="8" cy="15" r="4" /><path d="M10.85 12.15L19 4M18 5l2 2M15 8l2 2" /></>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a13 13 0 010 18M12 3a13 13 0 000 18" /></>,
    devices: <><rect x="2" y="4" width="14" height="10" rx="1" /><rect x="10" y="10" width="12" height="10" rx="1" /></>,
    zap: <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />,
    code: <path d="M8 6L2 12l6 6M16 6l6 6-6 6M14 4l-4 16" />,
  };
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

export default function VpnPage() {
  const { locale } = useI18n();
  const en = locale === "en";
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <PremiumPage>
      {/* HERO */}
      <section className="plx-hero">
        <div className="plx-hero-bg" />
        <div className="plx-hero-grid" />
        <div className="plx-wrap plx-hero-inner">
          <div className="pl-entrance pl-ed1">
            <div className="plx-eyebrow">VPN · VLESS + REALITY</div>
            <h1 className="plx-hero-title">
              {en ? "Encrypted tunnels.\n" : "Зашифрованные\nтуннели.\n"}
              <span className="plx-grad">{en ? "Invisible traffic." : "Невидимый трафик."}</span>
            </h1>
            <p className="plx-hero-desc">
              {en
                ? "Military-grade AES-256-GCM encryption with traffic obfuscation that bypasses DPI firewalls. Kill switch, DNS leak protection, and IPv6 tunneling across all platforms."
                : "Шифрование военного класса AES-256-GCM с обфускацией трафика, обходящей DPI-файрволы. Kill switch, защита от утечек DNS и туннелирование IPv6 на всех платформах."}
            </p>
            <div className="plx-hero-actions">
              <Link href="/auth" className="pl-cta-btn-light">{en ? "Start 3-day trial" : "Пробные 3 дня"} <span className="pl-arrow">→</span></Link>
              <Link href="/pricing" className="pl-cta-btn-dark">{en ? "View pricing" : "Тарифы"}</Link>
            </div>
          </div>

          <div className="pl-entrance pl-ed2 plx-float">
            <div className="plx-term">
              <div className="plx-term-bar">
                <span className="plx-term-dot r" /><span className="plx-term-dot y" /><span className="plx-term-dot g" />
                <span className="plx-term-title">atlas — vpn_status</span>
              </div>
              <div className="plx-term-body">
                <div className="plx-term-line"><span className="plx-term-k">status</span><span className="plx-term-v-on">● CONNECTED</span></div>
                <div className="plx-term-line"><span className="plx-term-k">protocol</span><span className="plx-term-v-acc">VLESS + Reality</span></div>
                <div className="plx-term-line"><span className="plx-term-k">encryption</span><span className="plx-term-v">AES-256-GCM</span></div>
                <div className="plx-term-line"><span className="plx-term-k">handshake</span><span className="plx-term-v">X25519 ECDHE</span></div>
                <div className="plx-term-line"><span className="plx-term-k">server</span><span className="plx-term-v">frankfurt.atlas.secure</span></div>
                <div className="plx-term-line"><span className="plx-term-k">latency</span><span className="plx-term-v-on">2ms</span></div>
                <div className="plx-term-line"><span className="plx-term-k">throughput</span><span className="plx-term-v">74.2 Gb/s</span></div>
                <div className="plx-term-line"><span className="plx-term-k">kill_switch</span><span className="plx-term-v-on">ACTIVE</span></div>
                <div className="plx-term-line"><span className="plx-term-k">dns_leak</span><span className="plx-term-v-on">PROTECTED</span></div>
                <div className="plx-term-line"><span className="plx-term-k">ipv6_leak</span><span className="plx-term-v-on">PROTECTED</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ padding: "0 0 80px" }}>
        <div className="plx-wrap">
          <div className="plx-stats">
            <div className="plx-stat"><div className="plx-stat-val">200 Gb/s</div><div className="plx-stat-label">{en ? "Bandwidth per server" : "Пропускная на сервер"}</div></div>
            <div className="plx-stat"><div className="plx-stat-val">2ms</div><div className="plx-stat-label">{en ? "Regional latency" : "Задержка в регионе"}</div></div>
            <div className="plx-stat"><div className="plx-stat-val">10</div><div className="plx-stat-label">{en ? "Devices per account" : "Устройств на аккаунт"}</div></div>
            <div className="plx-stat"><div className="plx-stat-val">99.98%</div><div className="plx-stat-label">{en ? "Uptime SLA" : "Аптайм SLA"}</div></div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="plx-section">
        <div className="plx-wrap">
          <div className="plx-section-head">
            <div className="plx-section-label">{en ? "Capabilities" : "Возможности"}</div>
            <h2 className="plx-section-title">{en ? "Everything a modern VPN should be" : "Всё, чем должен быть современный VPN"}</h2>
            <p className="plx-section-desc">{en ? "Built on open-source standards. Hardened with our operational security stack." : "Построено на open-source стандартах. Укреплено нашим стеком операционной безопасности."}</p>
          </div>
          <div className="plx-fgrid">
            {[
              { i: "lock", t: en ? "AES-256-GCM" : "AES-256-GCM", d: en ? "Symmetric encryption approved by NSA for TOP SECRET data. 2^256 possible keys." : "Симметричное шифрование, одобренное NSA для TOP SECRET. 2^256 возможных ключей." },
              { i: "eye", t: en ? "Traffic obfuscation" : "Обфускация трафика", d: en ? "Reality protocol masks VPN traffic as regular HTTPS. Undetectable by DPI." : "Протокол Reality маскирует VPN-трафик под обычный HTTPS. DPI не обнаруживает." },
              { i: "shield", t: "Kill Switch", d: en ? "Blocks all traffic instantly on VPN disconnect. No packet leaks to the ISP." : "Мгновенно блокирует весь трафик при разрыве VPN. Ни одного пакета к провайдеру." },
              { i: "key", t: "Perfect Forward Secrecy", d: en ? "X25519 ECDHE rekey every session. Compromise of one key cannot decrypt past sessions." : "Смена ключа X25519 ECDHE каждую сессию. Утечка ключа не расшифровывает прошлое." },
              { i: "globe", t: en ? "DNS & IPv6 protection" : "Защита DNS и IPv6", d: en ? "All DNS queries routed through encrypted resolvers. IPv6 tunneled or blocked." : "Все DNS-запросы через зашифрованные резолверы. IPv6 туннелируется или блокируется." },
              { i: "devices", t: en ? "Multi-device" : "Мульти-устройства", d: en ? "Connect up to 10 devices simultaneously. iOS, Android, macOS, Windows, Linux." : "Подключайте до 10 устройств одновременно. iOS, Android, macOS, Windows, Linux." },
            ].map((f) => (
              <div key={f.t} className="plx-fcard">
                <div className="plx-fcard-icon"><Icon name={f.i} /></div>
                <h3>{f.t}</h3>
                <p>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROTOCOLS */}
      <section className="plx-section" style={{ paddingTop: 0 }}>
        <div className="plx-wrap">
          <div className="plx-section-head">
            <div className="plx-section-label">{en ? "Protocols" : "Протоколы"}</div>
            <h2 className="plx-section-title">{en ? "Choose your stack" : "Выберите свой стек"}</h2>
          </div>
          <div className="plx-proto">
            {[
              { n: "VLESS + Reality", b: "REC", d: en ? "Flagship protocol. Mimics real HTTPS handshakes of major CDNs." : "Флагманский протокол. Имитирует HTTPS-рукопожатия крупных CDN.", k: "Port", v: "443" },
              { n: "VMess + WS", b: "TLS", d: en ? "Classic V2Ray over WebSocket. Works behind CDNs and reverse proxies." : "Классический V2Ray поверх WebSocket. Работает за CDN и reverse-proxy.", k: "Port", v: "443" },
              { n: "Trojan", b: "TLS", d: en ? "Lightweight, minimal overhead. Designed to look exactly like HTTPS." : "Лёгкий, минимальный оверхед. Выглядит как обычный HTTPS.", k: "Port", v: "443" },
              { n: "Shadowsocks", b: "AEAD", d: en ? "Battle-tested. Great for mobile and unstable networks." : "Проверенный временем. Хорош для мобильных и нестабильных сетей.", k: "Cipher", v: "2022" },
            ].map((p) => (
              <div key={p.n} className="plx-proto-card">
                <div className="plx-proto-name">{p.n}<span className={`plx-proto-badge ${p.b === "REC" ? "rec" : ""}`}>{p.b}</span></div>
                <div className="plx-proto-desc">{p.d}</div>
                <div className="plx-proto-spec"><span>{p.k}</span><span>{p.v}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEVICES */}
      <section className="plx-section" style={{ paddingTop: 0 }}>
        <div className="plx-wrap">
          <div className="plx-section-head">
            <div className="plx-section-label">{en ? "Platforms" : "Платформы"}</div>
            <h2 className="plx-section-title">{en ? "Works on everything you own" : "Работает на всём, что у вас есть"}</h2>
          </div>
          <div className="plx-platforms">
            {[
              { n: "iOS", sub: "Streisand", p: "M14.94 5.19A4.38 4.38 0 0016 2a4.44 4.44 0 00-3 1.52 4.17 4.17 0 00-1 3.09 3.69 3.69 0 002.94-1.42zM17.46 12.63a4.47 4.47 0 012.13-3.75 4.58 4.58 0 00-3.62-1.95c-1.55-.15-3 .9-3.79.9-.81 0-2-.88-3.3-.85a4.81 4.81 0 00-4 2.47C3.2 12.64 4.64 17.39 6.42 19.9c.87 1.24 1.89 2.62 3.22 2.57 1.31-.05 1.79-.83 3.36-.83s2 .83 3.37.8c1.39-.02 2.27-1.25 3.12-2.49a11.11 11.11 0 001.41-2.9 4.32 4.32 0 01-2.44-4.42z" },
              { n: "Android", sub: "V2rayNG", p: "M7.5 8h9a.5.5 0 01.5.5v8a2.5 2.5 0 01-2.5 2.5h-5A2.5 2.5 0 017 16.5v-8a.5.5 0 01.5-.5zM5.5 8a1.5 1.5 0 013 0v8a1.5 1.5 0 01-3 0V8zM15.5 8a1.5 1.5 0 013 0v8a1.5 1.5 0 01-3 0V8zM8.5 21.5a1.5 1.5 0 013 0v-3M12.5 21.5a1.5 1.5 0 013 0v-3M7.83 6.5a5.5 5.5 0 018.34 0M10 3.5l-1 1.5M14 3.5l1 1.5" },
              { n: "macOS", sub: "V2RayU", p: "M12 2a3 3 0 012.83 2h1.67a4.5 4.5 0 014.5 4.5v7a4.5 4.5 0 01-4.5 4.5h-9A4.5 4.5 0 013 15.5v-7A4.5 4.5 0 017.5 4h1.67A3 3 0 0112 2z" },
              { n: "Windows", sub: "v2rayN", p: "M3 5.5L10 4.5v7H3v-6zM3 12.5h7v7L3 18.5v-6zM11 4.3L21 3v9h-10V4.3zM11 13h10v8L11 19.5V13z" },
              { n: "Linux", sub: "v2ray-core", p: "M12 2c-3 0-4.5 2-4.5 5 0 2 1 3 1 4 0 2-3 4-3 7s2 4 6.5 4 6.5-1 6.5-4-3-5-3-7c0-1 1-2 1-4 0-3-1.5-5-4.5-5z M10 10l.5.5M14 10l-.5.5M11 13h2" },
              { n: "Router", sub: "OpenWrt", p: "M3 10h18v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4zM7 14v.5M11 14v.5M15 14v.5M19 14v.5M8 10V6a4 4 0 014-4 4 4 0 014 4v4" },
            ].map((p) => (
              <div key={p.n} className="plx-plat">
                <svg className="plx-plat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={p.p} />
                </svg>
                <div>
                  <div className="plx-plat-name">{p.n}</div>
                  <div className="plx-plat-sub">{p.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="plx-section" style={{ paddingTop: 0 }}>
        <div className="plx-wrap">
          <div className="plx-section-head">
            <div className="plx-section-label">{en ? "Use cases" : "Сценарии"}</div>
            <h2 className="plx-section-title">{en ? "Built for real workflows" : "Создано для реальных задач"}</h2>
          </div>
          <div className="plx-usecases">
            {[
              { t: en ? "Remote work" : "Удалённая работа", d: en ? "Secure access to corporate resources from anywhere. No SOCKS proxy pain." : "Защищённый доступ к корпоративным ресурсам из любой точки. Без боли с SOCKS." },
              { t: en ? "Public Wi-Fi" : "Публичный Wi-Fi", d: en ? "Full-tunnel encryption on cafés, airports, hotels. Kill switch prevents any leaks." : "Полное туннелирование в кафе, аэропортах, отелях. Kill switch предотвращает утечки." },
              { t: en ? "Bypass DPI" : "Обход DPI", d: en ? "Reality protocol makes VPN indistinguishable from real HTTPS traffic." : "Reality-протокол делает VPN неотличимым от обычного HTTPS." },
              { t: en ? "Privacy research" : "Приватность", d: en ? "Zero-logs guarantee. What we don't store, we cannot be compelled to disclose." : "Нулевые логи. Чего нет — того нельзя раскрыть по запросу." },
              { t: en ? "Travel" : "В путешествии", d: en ? "Access your home-region services abroad. Pick any of 3 continental jurisdictions." : "Доступ к своему региону за границей. 3 континентальные юрисдикции на выбор." },
              { t: en ? "Household" : "Для семьи", d: en ? "Up to 10 devices on one plan. Protect phones, laptops, and smart TVs alike." : "До 10 устройств на один план. Защитите телефоны, ноутбуки и ТВ сразу." },
            ].map((u, i) => (
              <div key={u.t} className="plx-uc">
                <div className="plx-uc-num">{String(i + 1).padStart(2, "0")}</div>
                <h3>{u.t}</h3>
                <p>{u.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="plx-section" style={{ paddingTop: 0 }}>
        <div className="plx-wrap">
          <div className="plx-section-head">
            <div className="plx-section-label">FAQ</div>
            <h2 className="plx-section-title">{en ? "Common questions" : "Частые вопросы"}</h2>
          </div>
          <div className="plx-faq">
            {[
              { q: en ? "Do you keep logs?" : "Ведёте ли вы логи?", a: en ? "No. We operate on a strict no-logs policy. We do not record connection times, IP addresses, DNS queries, or bandwidth per user." : "Нет. Строгая no-logs политика: не храним времена подключений, IP-адреса, DNS-запросы и трафик по пользователю." },
              { q: en ? "How fast is the VPN?" : "Насколько быстрый VPN?", a: en ? "Each server offers up to 200 Gb/s. Regional latency is under 5ms. Reality protocol adds negligible overhead (~1-2% vs direct HTTPS)." : "До 200 Гб/с на сервер. Задержка в регионе < 5мс. Reality добавляет ~1-2% оверхеда относительно прямого HTTPS." },
              { q: en ? "Can it bypass my country's firewall?" : "Обходит ли файрвол моей страны?", a: en ? "Yes. Reality protocol mimics TLS handshakes of major CDNs, making traffic indistinguishable from regular HTTPS even under DPI inspection." : "Да. Reality имитирует TLS-рукопожатия крупных CDN, делая трафик неотличимым от обычного HTTPS даже при DPI-инспекции." },
              { q: en ? "What happens if connection drops?" : "Что если соединение упадёт?", a: en ? "Kill Switch instantly blocks all traffic. Not a single packet leaks to your ISP or apps until VPN reconnects." : "Kill Switch мгновенно блокирует весь трафик. Ни один пакет не утечёт к провайдеру до восстановления VPN." },
              { q: en ? "Is there a free trial?" : "Есть ли пробный период?", a: en ? "Yes. 3 days free, no card required. Telegram bonus gives +7 days, referrals +20 days per paid friend." : "Да. 3 дня бесплатно, без карты. Telegram-бонус даёт +7 дней, рефералы +20 дней за каждого оплаченного друга." },
            ].map((f, i) => (
              <div key={f.q} className={`plx-faq-item${openFaq === i ? " open" : ""}`}>
                <button className="plx-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{f.q}</span>
                  <svg className="plx-faq-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
                </button>
                <div className="plx-faq-a">{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="plx-section" style={{ paddingTop: 0 }}>
        <div className="plx-wrap">
          <div className="plx-cta-box">
            <h2>{en ? "Start your 3-day trial" : "Начните пробный период"}</h2>
            <p>{en ? "No credit card. Cancel anytime." : "Без карты. Отмена в любой момент."}</p>
            <div className="pl-cta-buttons">
              <Link href="/auth" className="pl-cta-btn-light">{en ? "Connect to VPN" : "Подключиться"} <span className="pl-arrow">→</span></Link>
              <Link href="/pricing" className="pl-cta-btn-dark">{en ? "View pricing" : "Тарифы"}</Link>
            </div>
          </div>
        </div>
      </section>
    </PremiumPage>
  );
}
