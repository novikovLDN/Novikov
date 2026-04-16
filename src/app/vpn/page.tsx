"use client";

import Link from "next/link";
import PremiumPage from "@/components/PremiumPage";
import { useI18n } from "@/lib/i18n";

export default function VpnPage() {
  const { locale } = useI18n();
  const en = locale === "en";

  return (
    <PremiumPage>
      {/* Hero */}
      <div className="pl-product-hero">
        <div className="pl-product-hero-inner">
          <div className="pl-product-hero-text">
            <div className="pl-eyebrow">VPN</div>
            <h1 className="pl-product-title">{en ? "Secure VPN\nfor everyone" : "Защищённый VPN\nдля каждого"}</h1>
            <p className="pl-product-desc">{en ? "Military-grade encrypted tunnels with AES-256-GCM. Traffic obfuscation, DPI bypass, and kill switch protection across all your devices." : "Зашифрованные туннели военного класса с AES-256-GCM. Обфускация трафика, обход DPI и защита kill switch на всех устройствах."}</p>
            <div className="pl-product-actions">
              <Link href="/auth" className="pl-cta-btn-light">{en ? "Connect to VPN" : "Подключиться к VPN"}</Link>
              <Link href="/pricing" className="pl-cta-btn-dark">{en ? "View pricing" : "Тарифы"}</Link>
            </div>
          </div>
          {/* Visual */}
          <div className="pl-product-visual">
            <div className="pl-pv-terminal">
              <div className="pl-terminal-bar"><span className="pl-dot pl-dot-r" /><span className="pl-dot pl-dot-y" /><span className="pl-dot pl-dot-g" /><span className="pl-terminal-title">vpn_status</span></div>
              <div className="pl-terminal-body" style={{ fontSize: 12 }}>
                <div className="pl-code-line"><span className="pl-code-k">status</span><span className="pl-code-g">CONNECTED</span></div>
                <div className="pl-code-line"><span className="pl-code-k">protocol</span><span className="pl-code-v">VLESS + Reality</span></div>
                <div className="pl-code-line"><span className="pl-code-k">encryption</span><span className="pl-code-v">AES-256-GCM</span></div>
                <div className="pl-code-line"><span className="pl-code-k">server</span><span className="pl-code-v">Frankfurt, DE</span></div>
                <div className="pl-code-line"><span className="pl-code-k">latency</span><span className="pl-code-v">2ms</span></div>
                <div className="pl-code-line"><span className="pl-code-k">bandwidth</span><span className="pl-code-v">74.2 Gb/s</span></div>
                <div className="pl-code-line"><span className="pl-code-k">kill_switch</span><span className="pl-code-g">ACTIVE</span></div>
                <div className="pl-code-line"><span className="pl-code-k">dns_leak</span><span className="pl-code-g">PROTECTED</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="pl-product-features">
        <h2 className="pl-product-section-title">{en ? "Everything you need" : "Всё что нужно"}</h2>
        <div className="pl-product-grid">
          {[
            { t: en ? "AES-256 Encryption" : "Шифрование AES-256", d: en ? "Government-grade encryption standard trusted by intelligence agencies worldwide." : "Стандарт шифрования государственного уровня, используемый спецслужбами по всему миру." },
            { t: en ? "Traffic Obfuscation" : "Обфускация трафика", d: en ? "Your VPN traffic looks like regular HTTPS, bypassing DPI firewalls." : "VPN-трафик выглядит как обычный HTTPS, обходя DPI-файрволы." },
            { t: en ? "Kill Switch" : "Kill Switch", d: en ? "Automatic traffic blocking if VPN connection drops. Zero data leaks." : "Автоматическая блокировка трафика при разрыве VPN. Ноль утечек." },
            { t: en ? "DNS Protection" : "Защита DNS", d: en ? "Complete DNS and IPv6 leak protection on all platforms." : "Полная защита от утечек DNS и IPv6 на всех платформах." },
            { t: en ? "Multi-Device" : "Мульти-устройства", d: en ? "Connect up to 10 devices simultaneously with a single account." : "Подключайте до 10 устройств одновременно с одного аккаунта." },
            { t: en ? "3 Data Centers" : "3 дата-центра", d: en ? "Germany, Russia, Australia — choose the fastest server for your region." : "Германия, Россия, Австралия — выбирайте ближайший сервер." },
          ].map((f) => (
            <div key={f.t} className="pl-product-feature">
              <h3>{f.t}</h3>
              <p>{f.d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="pl-product-cta">
        <h2>{en ? "Ready to connect?" : "Готовы подключиться?"}</h2>
        <div className="pl-cta-buttons">
          <Link href="/auth" className="pl-cta-btn-light">{en ? "Connect to VPN" : "Подключиться к VPN"}</Link>
          <Link href="/contact" className="pl-cta-btn-dark">{en ? "Request access" : "Запросить доступ"}</Link>
        </div>
      </div>
    </PremiumPage>
  );
}
