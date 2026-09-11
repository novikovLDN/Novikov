"use client";

import { useState, type CSSProperties } from "react";
import { QRCodeSVG } from "qrcode.react";
import Icon from "@/components/pixel/Icon";
import Corner from "./Corner";

/**
 * Кабинет · ключ подключения. Логика — из прежней SubscriptionCard один
 * в один: открыть в Happ (deep link), скопировать ссылку, QR, ручное
 * копирование, если буфер обмена недоступен.
 *
 * Сама ссылка на экран не выводится целиком — только адрес сервиса:
 * это ключ доступа, его не показывают через плечо.
 */
function happDeepLink(subscriptionUrl: string, happCryptoLink: string | null): string {
  if (happCryptoLink && happCryptoLink.startsWith("happ://")) return happCryptoLink;
  return `happ://add/${btoa(subscriptionUrl)}`;
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "ссылка подписки";
  }
}

export default function CabinetKey({
  subscriptionUrl,
  happCryptoLink,
  i,
}: {
  subscriptionUrl: string | null;
  happCryptoLink: string | null;
  i: number;
}) {
  const [copied, setCopied] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const style = { "--i": i } as CSSProperties;

  if (!subscriptionUrl) {
    return (
      <section id="ak-key" className="ak-card ak-key" data-sheet="20" style={style} aria-labelledby="ak-key-h">
        <div className="ak-card-head">
          <h2 id="ak-key-h" className="ak-eyebrow">Ключ подключения</h2>
          <span className="ak-status" data-tone="warn"><i />Готовится</span>
        </div>
        <p className="ak-h3">Ключ почти готов</p>
        <p className="ak-text">Обновите страницу через несколько секунд.</p>
      </section>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(subscriptionUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setShowFallback(true);
    }
  };

  const openHapp = () => {
    window.location.href = happDeepLink(subscriptionUrl, happCryptoLink);
  };

  return (
    <section id="ak-key" className="ak-card ak-key" data-sheet="20" style={style} aria-labelledby="ak-key-h">
      <Corner href="/devices" label="Инструкции по подключению" />
      <div className="ak-card-head">
        <h2 id="ak-key-h" className="ak-eyebrow">Ключ подключения</h2>
        <span className="ak-status"><i />Готов</span>
      </div>
      <p className="ak-h3">Одна ссылка — все ваши устройства</p>
      <p className="ak-text">Откройте её в приложении Happ на телефоне или компьютере — и всё заработает.</p>

      <div className="ak-key-strip" style={{ marginTop: "1rem" }}>
        <span>{hostOf(subscriptionUrl)}/…</span>
        <span className="ak-key-dots" aria-hidden>
          {[0, 1, 2, 3, 4].map((k) => (
            <i key={k} style={{ "--k": k } as CSSProperties} />
          ))}
        </span>
      </div>

      <div className="ak-reveal" data-open={showQr ? "" : undefined}>
        <div>
          <div className="ak-qr">
            <QRCodeSVG value={subscriptionUrl} size={200} level="M" marginSize={2} />
          </div>
          <p className="ak-fine">Наведите камеру телефона, на котором стоит Happ.</p>
        </div>
      </div>

      {showFallback && (
        <div className="ak-fallback">
          <p className="ak-fine" style={{ margin: 0 }}>Скопируйте вручную:</p>
          <code>{subscriptionUrl}</code>
        </div>
      )}

      <div className="ak-actions">
        <button type="button" onClick={openHapp} className="a-btn a-btn-primary">
          <Icon name="bolt" size={16} />
          Открыть в приложении
        </button>
        <button type="button" onClick={handleCopy} className="a-btn ak-btn-soft" data-state={copied ? "ok" : undefined}>
          <Icon name={copied ? "check" : "copy"} size={16} />
          {copied ? "Скопировано" : "Скопировать ссылку"}
        </button>
        <button type="button" onClick={() => setShowQr((v) => !v)} className="a-btn ak-btn-soft" aria-expanded={showQr}>
          <Icon name="qr" size={16} />
          {showQr ? "Скрыть QR" : "QR-код"}
        </button>
      </div>

      <p className="ak-apps">
        Нет приложения?
        <a href="https://apps.apple.com/app/happ-proxy-utility/id6504287215" target="_blank" rel="noopener noreferrer">App Store</a>
        <a href="https://play.google.com/store/apps/details?id=com.happproxy" target="_blank" rel="noopener noreferrer">Google Play</a>
      </p>
    </section>
  );
}
