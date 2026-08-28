"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import LandingFooter from "@/components/LandingFooter";

/**
 * /devices — device-setup page in the v4 light shell.
 *
 * Pick a platform → see instructions for the recommended app →
 * copy the profile link, open it via deep-link, or scan the QR.
 *
 * Visual language matches /about: MTS Wide, off-white body,
 * white rounded cards, black primary buttons, no dark glass bar.
 */

// ─── Types ──────────────────────────────────────────────────

type Platform = "ios" | "android" | "macos" | "windows" | "tv";

interface AppInfo {
  id: string;
  name: string;
  description: string;
  storeLabel: string;
  downloadUrl: string;
  searchHint: string;
  jsonFormat?: boolean;
  deepLink?: (url: string) => string;
  steps: string[];
}

// ─── Platform Config ────────────────────────────────────────

const PLATFORMS: { id: Platform; name: string; detail: string }[] = [
  { id: "ios",     name: "iPhone / iPad", detail: "iOS 16+" },
  { id: "android", name: "Android",       detail: "10+" },
  { id: "macos",   name: "macOS",         detail: "M1 / Intel" },
  { id: "windows", name: "Windows",       detail: "10 / 11" },
  { id: "tv",      name: "Android TV",    detail: "все модели" },
];

const APPS: Record<Platform, AppInfo[]> = {
  ios: [
    {
      id: "happ",
      name: "Happ",
      description: "Быстрое и простое приложение",
      storeLabel: "App Store",
      downloadUrl: "https://apps.apple.com/ru/app/happ-proxy-utility-plus/id6746188973",
      searchHint: "Найдите «Happ» в App Store или нажмите кнопку ниже",
      jsonFormat: true,
      deepLink: (url) => `https://api.atlassecure.ru/open/happ?url=${encodeURIComponent(url)}`,
      steps: [
        "Откройте Happ и нажмите «+» внизу экрана",
        "Выберите «Добавить подписку» или «Из буфера обмена»",
        "Конфигурация импортируется автоматически",
        "Нажмите кнопку подключения и разрешите системное подключение",
      ],
    },
  ],
  android: [
    {
      id: "v2raytun",
      name: "V2RayTun",
      description: "Простой и надёжный клиент",
      storeLabel: "Google Play",
      downloadUrl: "https://play.google.com/store/apps/details?id=com.v2raytun.android",
      searchHint: "Найдите «V2RayTun» в Google Play или нажмите кнопку ниже",
      deepLink: (url) => `v2raytun://import/${url}`,
      steps: [
        "Откройте V2RayTun и нажмите «+» вверху",
        "Выберите «Импорт из буфера обмена»",
        "Сервер добавится автоматически",
        "Нажмите кнопку подключения и разрешите системное подключение",
      ],
    },
    {
      id: "happ",
      name: "Happ",
      description: "Быстрое приложение",
      storeLabel: "Google Play",
      downloadUrl: "https://play.google.com/store/apps/details?id=com.happproxy",
      searchHint: "Найдите «Happ» в Google Play или нажмите кнопку ниже",
      jsonFormat: true,
      deepLink: (url) => `https://api.atlassecure.ru/open/happ?url=${encodeURIComponent(url)}`,
      steps: [
        "Откройте Happ и нажмите «+» внизу экрана",
        "Выберите «Добавить подписку» или «Из буфера обмена»",
        "Конфигурация импортируется автоматически",
        "Нажмите кнопку подключения и разрешите системное подключение",
      ],
    },
  ],
  macos: [
    {
      id: "happ",
      name: "Happ",
      description: "Быстрое приложение для Mac",
      storeLabel: "App Store",
      downloadUrl: "https://apps.apple.com/ru/app/happ-proxy-utility-plus/id6746188973",
      searchHint: "Найдите «Happ» в App Store на Mac или нажмите кнопку ниже",
      jsonFormat: true,
      deepLink: (url) => `https://api.atlassecure.ru/open/happ?url=${encodeURIComponent(url)}`,
      steps: [
        "Откройте Happ и нажмите «+» → «Добавить подписку»",
        "Вставьте ссылку из буфера обмена",
        "Конфигурация импортируется автоматически",
        "Нажмите подключиться, введите пароль Mac при запросе",
      ],
    },
  ],
  windows: [
    {
      id: "happ",
      name: "Happ",
      description: "Приложение для Windows",
      storeLabel: "Скачать с сайта",
      downloadUrl: "https://www.happ.su/main",
      searchHint: "Скачайте Happ с официального сайта и установите",
      jsonFormat: true,
      steps: [
        "Откройте Happ и нажмите «+» → «Добавить подписку»",
        "Вставьте ссылку из буфера обмена",
        "Конфигурация импортируется автоматически",
        "Нажмите подключиться, разрешите доступ в брандмауэре",
      ],
    },
  ],
  tv: [
    {
      id: "v2raytun",
      name: "V2RayTun",
      description: "Клиент для Android TV",
      storeLabel: "Google Play на TV",
      downloadUrl: "https://play.google.com/store/apps/details?id=com.v2raytun.android",
      searchHint: "Найдите «V2RayTun» в Google Play на телевизоре",
      steps: [
        "Откройте V2RayTun на TV и нажмите «+»",
        "Введите ссылку подписки с экранной клавиатуры или отсканируйте QR-код",
        "Сервер добавится автоматически",
        "Выберите сервер и нажмите кнопку подключения пультом",
      ],
    },
  ],
};

// ─── Icons ──────────────────────────────────────────────────

function PlatformIcon({ id, className }: { id: Platform; className?: string }) {
  const props = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: className ?? "w-8 h-8",
  };
  switch (id) {
    case "ios":
      return (
        <svg {...props}>
          <rect x="7" y="2" width="10" height="20" rx="2" />
          <line x1="11" y1="18" x2="13" y2="18" />
        </svg>
      );
    case "android":
      return (
        <svg {...props}>
          <path d="M4 16V9a2 2 0 012-2h12a2 2 0 012 2v7" />
          <path d="M4 16h16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
          <path d="M8 7l-2-3M16 7l2-3" />
        </svg>
      );
    case "macos":
      return (
        <svg {...props}>
          <rect x="2" y="4" width="20" height="12" rx="1" />
          <path d="M2 20h20M9 20l1-4M15 20l-1-4" />
        </svg>
      );
    case "windows":
      return (
        <svg {...props}>
          <path d="M3 5l8-1v8H3zM11 4l10-1v10H11zM3 13h8v7l-8-1zM11 13h10v8l-10-1z" />
        </svg>
      );
    case "tv":
      return (
        <svg {...props}>
          <rect x="2" y="4" width="20" height="13" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      );
  }
}

// ─── Nav Links ──────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Тарифы",       href: "/pricing" },
  { label: "Безопасность", href: "/security" },
  { label: "О нас",        href: "/about" },
  { label: "Поддержка",    href: "/contact" },
];

// ─── Main Component ─────────────────────────────────────────

export default function DevicesPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>("ios");
  const [appIndex, setAppIndex] = useState(0);
  const [vpnKey, setVpnKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const fetchKey = useCallback(async () => {
    try {
      const res = await fetch("/api/user/subscription");
      const result = await res.json();
      if (result.success && result.data.vpnKey) {
        setVpnKey(result.data.vpnKey);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchKey(); }, [fetchKey]);

  const selectedApps = APPS[platform];
  const currentApp = selectedApps[appIndex] ?? selectedApps[0];

  // Build the key URL: add &format=json for Happ, plain for V2RayTun
  const getKeyUrl = useCallback(() => {
    if (!vpnKey) return null;
    if (currentApp?.jsonFormat) {
      const sep = vpnKey.includes("?") ? "&" : "?";
      return `${vpnKey}${sep}format=json`;
    }
    return vpnKey;
  }, [vpnKey, currentApp]);

  const handleSelectPlatform = (p: Platform) => {
    setPlatform(p);
    setAppIndex(0);
    setShowQR(false);
    setCopied(false);
  };

  const handleSelectApp = (idx: number) => {
    setAppIndex(idx);
    setShowQR(false);
    setCopied(false);
  };

  const handleCopy = async () => {
    const key = getKeyUrl();
    if (!key) return;
    try {
      await navigator.clipboard.writeText(key);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = key;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleAutoInstall = () => {
    const key = getKeyUrl();
    if (!key || !currentApp?.deepLink) return;
    window.location.href = currentApp.deepLink(key);
  };

  const keyUrl = getKeyUrl();

  return (
    <div className="bg-[#f5f5f0] min-h-dvh flex flex-col text-black">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 sm:px-8 pt-6 sm:pt-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            aria-label="Назад в кабинет"
            className="w-10 h-10 rounded-full border border-black/15 flex items-center justify-center text-black/70 hover:text-black hover:bg-black/5 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <Link href="/" className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M5 5 L1 1 M5 5 L5 1 M5 5 L1 5" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M19 5 L23 1 M19 5 L19 1 M19 5 L23 5" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 19 L1 23 M5 19 L5 23 M5 19 L1 19" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M19 19 L23 23 M19 19 L19 23 M19 19 L23 19" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-mts-wide text-[13px] tracking-[0.16em] uppercase text-black/85">atlas.secure</span>
          </Link>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 font-mts-wide text-[14px] text-black/60">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-black transition-colors">
              {l.label}
            </Link>
          ))}
          <Link
            href="/dashboard"
            className="ml-3 px-4 py-2 rounded-full bg-black text-white hover:bg-neutral-800 transition-colors"
          >
            Кабинет
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden w-11 h-11 rounded-full bg-black/[0.06] border border-black/10 flex items-center justify-center active:scale-[0.95] transition-transform"
          onClick={() => setMenuOpen(true)}
          aria-label="Меню"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8 font-mts-wide"
          onClick={() => setMenuOpen(false)}
        >
          <button
            className="absolute top-6 right-6 w-11 h-11 rounded-full bg-white/10 border border-white/15 flex items-center justify-center"
            onClick={() => setMenuOpen(false)}
            aria-label="Закрыть"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-white text-2xl" onClick={() => setMenuOpen(false)}>
              {l.label}
            </Link>
          ))}
          <Link
            href="/dashboard"
            className="mt-4 px-6 py-3 rounded-full bg-white text-black text-base"
            onClick={() => setMenuOpen(false)}
          >
            Кабинет
          </Link>
        </div>
      )}

      {/* Hero */}
      <section className="px-5 sm:px-8 pt-14 pb-10 sm:pt-20 sm:pb-14 max-w-[900px] mx-auto w-full">
        <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-black/45 mb-5">
          Устройства
        </div>
        <h1 className="font-mts-wide text-[36px] sm:text-[52px] lg:text-[68px] leading-[1.02] tracking-tight font-bold max-w-[16ch]">
          Настройка на<br />любом устройстве
        </h1>
        <p className="font-mts-wide text-[16px] sm:text-[18px] leading-[1.5] text-black/55 mt-7 max-w-[54ch]">
          Выберите устройство, установите приложение и импортируйте профиль. Занимает около минуты, дальше всё работает автоматически.
        </p>
      </section>

      {/* Platform picker */}
      <section className="px-5 sm:px-8 pb-8 sm:pb-12 max-w-[900px] mx-auto w-full">
        <div className="font-mts-wide text-[12px] tracking-[0.12em] uppercase text-black/45 mb-4">
          Шаг 1 — устройство
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {PLATFORMS.map((p) => {
            const active = platform === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPlatform(p.id)}
                aria-pressed={active}
                className={
                  "group aspect-square rounded-2xl border p-4 sm:p-5 flex flex-col justify-between text-left transition-all active:scale-[0.98] " +
                  (active
                    ? "bg-black text-white border-black shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)]"
                    : "bg-white text-black border-black/[0.06] hover:border-black/[0.15] hover:-translate-y-0.5")
                }
              >
                <PlatformIcon
                  id={p.id}
                  className={
                    "w-9 h-9 sm:w-8 sm:h-8 transition-colors " +
                    (active ? "text-white" : "text-black/60 group-hover:text-black")
                  }
                />
                <div>
                  <div className={"font-mts-wide text-[15px] sm:text-[17px] font-medium " + (active ? "text-white" : "text-black")}>
                    {p.name}
                  </div>
                  <div className={"font-mts-wide text-[11px] sm:text-[12px] mt-0.5 " + (active ? "text-white/60" : "text-black/50")}>
                    {p.detail}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Instructions panel */}
      <section className="px-5 sm:px-8 pb-16 sm:pb-24 max-w-[900px] mx-auto w-full">
        <div className="font-mts-wide text-[12px] tracking-[0.12em] uppercase text-black/45 mb-4">
          Шаг 2 — приложение и профиль
        </div>

        <div className="bg-white border border-black/[0.06] rounded-3xl p-6 sm:p-8">
          {/* App tabs (only when >1 app for the platform) */}
          {selectedApps.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {selectedApps.map((a, i) => {
                const active = i === appIndex;
                return (
                  <button
                    key={a.id}
                    onClick={() => handleSelectApp(i)}
                    className={
                      "font-mts-wide px-4 py-2 rounded-full text-[13px] transition-colors " +
                      (active
                        ? "bg-black text-white"
                        : "bg-black/[0.04] border border-black/[0.08] text-black/70 hover:bg-black/[0.06]")
                    }
                  >
                    {a.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* App header */}
          <div className="flex items-start gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-black/[0.04] border border-black/[0.08] flex items-center justify-center shrink-0">
              <span className="font-mts-wide text-[22px] font-semibold text-black">{currentApp.name[0]}</span>
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="font-mts-wide text-[20px] sm:text-[22px] font-bold leading-tight tracking-tight">
                {currentApp.name}
              </div>
              <div className="font-mts-wide text-[13px] sm:text-[14px] text-black/55 mt-1">
                {currentApp.description}
              </div>
            </div>
          </div>

          {/* Step 1: install */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center font-mts-wide text-[13px] font-semibold shrink-0">
                1
              </div>
              <div className="font-mts-wide text-[17px] font-bold">Установите приложение</div>
            </div>
            <p className="font-mts-wide text-[14px] leading-[1.55] text-black/60 pl-11 mb-4">
              {currentApp.searchHint}
            </p>
            <div className="pl-11">
              <a
                href={currentApp.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mts-wide inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-black text-white font-semibold text-[14px] hover:bg-neutral-800 transition-colors active:scale-[0.98]"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Открыть {currentApp.storeLabel}
              </a>
            </div>
          </div>

          {/* Step 2: import profile */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center font-mts-wide text-[13px] font-semibold shrink-0">
                2
              </div>
              <div className="font-mts-wide text-[17px] font-bold">Импортируйте профиль</div>
            </div>

            <div className="pl-11">
              {/* Key display */}
              {keyUrl ? (
                <div className="bg-black/[0.04] border border-black/[0.08] rounded-2xl p-4 font-mono text-xs break-all text-black/75 mb-4">
                  {keyUrl}
                </div>
              ) : (
                <div className="bg-black/[0.04] border border-black/[0.08] rounded-2xl p-4 font-mono text-xs text-black/45 mb-4">
                  Загружаем ссылку профиля…
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={handleCopy}
                  disabled={!keyUrl}
                  className={
                    "font-mts-wide inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-[14px] transition-colors active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed " +
                    (copied
                      ? "bg-black/[0.04] border border-black/15 text-black"
                      : "bg-black text-white hover:bg-neutral-800")
                  }
                >
                  {copied ? (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Скопировано
                    </>
                  ) : (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                      Скопировать ссылку
                    </>
                  )}
                </button>

                {currentApp.deepLink && (
                  <button
                    onClick={handleAutoInstall}
                    disabled={!keyUrl}
                    className="font-mts-wide inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-black text-white font-semibold text-[14px] hover:bg-neutral-800 transition-colors active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                    Открыть в приложении
                  </button>
                )}

                <button
                  onClick={() => setShowQR((v) => !v)}
                  disabled={!keyUrl}
                  aria-pressed={showQR}
                  className="font-mts-wide inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-black/15 text-black/75 font-semibold text-[14px] hover:bg-black/5 hover:border-black/25 transition-colors active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <path d="M14 14h3v3h-3zM20 14h1M14 20h1M20 20h1" />
                  </svg>
                  {showQR ? "Скрыть QR" : "Показать QR"}
                </button>
              </div>

              {/* QR panel */}
              {showQR && keyUrl && (
                <div className="mb-6 inline-flex flex-col items-center gap-3 p-5 bg-white border border-black/[0.08] rounded-2xl">
                  <QRCodeSVG value={keyUrl} size={192} bgColor="#ffffff" fgColor="#000000" level="M" />
                  <div className="font-mts-wide text-[12px] text-black/55 max-w-[220px] text-center leading-[1.45]">
                    Наведите камеру приложения на код, чтобы импортировать профиль
                  </div>
                </div>
              )}

              {/* Numbered manual steps */}
              <ol className="space-y-3">
                {currentApp.steps.map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-black/[0.06] border border-black/[0.08] flex items-center justify-center shrink-0 mt-0.5">
                      <span className="font-mts-wide text-[11px] font-semibold text-black/70">{i + 1}</span>
                    </div>
                    <p className="font-mts-wide text-[14px] leading-[1.55] text-black/70">{s}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Done row */}
          <div className="border-t border-black/[0.06] pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="font-mts-wide text-[13px] text-black/55 max-w-[46ch]">
              Готово — приложение подключится автоматически при следующем запуске.
            </div>
            <Link
              href="/dashboard"
              className="font-mts-wide inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-black/15 text-black/75 font-semibold text-[14px] hover:bg-black/5 hover:border-black/25 transition-colors self-start sm:self-auto"
            >
              Вернуться в кабинет
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Help nudge */}
      <section className="px-5 sm:px-8 pb-16 sm:pb-24 max-w-[900px] mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 sm:p-8 rounded-3xl border border-black/[0.08] bg-white">
          <div>
            <div className="font-mts-wide text-[11px] tracking-[0.14em] uppercase text-black/45 mb-2">Не получается?</div>
            <div className="font-mts-wide text-[17px] font-bold leading-tight">Мы поможем настроить лично</div>
            <p className="font-mts-wide text-[14px] text-black/55 mt-2 max-w-[52ch]">
              Напишите в поддержку — ответим в течение нескольких минут и доведём настройку до конца.
            </p>
          </div>
          <Link
            href="/contact"
            className="font-mts-wide inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-black text-white font-semibold text-[14px] hover:bg-neutral-800 transition-colors active:scale-[0.98] self-start sm:self-auto shrink-0"
          >
            Написать в поддержку
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
