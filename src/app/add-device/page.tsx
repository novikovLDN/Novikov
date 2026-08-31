"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import LandingFooter from "@/components/LandingFooter";

// ─── Types ──────────────────────────────────────────────────

type Step = "platform" | "app" | "instruction";
type Platform = "ios" | "android" | "macos" | "windows" | "tv";

interface AppConfig {
  id: string;
  name: string;
  platform: Platform;
  jsonFormat?: boolean;
  storeLabel: string;
  downloadUrl: string;
  instructions: {
    title: string;
    steps: string[];
    qrHint: string;
  };
}

// ─── App Configs ────────────────────────────────────────────

const APPS: Record<Platform, AppConfig[]> = {
  ios: [
    {
      id: "happ-ios",
      name: "Happ",
      platform: "ios",
      jsonFormat: true,
      storeLabel: "App Store",
      downloadUrl: "https://apps.apple.com/ru/app/happ-proxy-utility-plus/id6746188973",
      instructions: {
        title: "Добавить в Happ (iOS)",
        qrHint: "Откройте Happ → нажмите «+» → «Сканировать QR-код» → наведите камеру на код ниже",
        steps: [
          "Откройте приложение Happ на iPhone или iPad",
          "Нажмите «+» в нижней панели",
          "Выберите «Сканировать QR-код»",
          "Наведите камеру на QR-код ниже",
          "Конфигурация импортируется автоматически",
          "Нажмите кнопку подключения и разрешите системное подключение при запросе",
        ],
      },
    },
  ],
  android: [
    {
      id: "happ-android",
      name: "Happ",
      platform: "android",
      jsonFormat: true,
      storeLabel: "Google Play",
      downloadUrl: "https://play.google.com/store/apps/details?id=com.happproxy",
      instructions: {
        title: "Добавить в Happ (Android)",
        qrHint: "Откройте Happ → нажмите «+» → «Сканировать QR-код» → наведите камеру на код ниже",
        steps: [
          "Откройте приложение Happ на вашем Android",
          "Нажмите «+» в нижней панели",
          "Выберите «Сканировать QR-код»",
          "Наведите камеру на QR-код ниже",
          "Конфигурация импортируется автоматически",
          "Нажмите кнопку подключения и разрешите системное подключение при запросе",
        ],
      },
    },
    {
      id: "v2raytun-android",
      name: "V2RayTun",
      platform: "android",
      storeLabel: "Google Play",
      downloadUrl: "https://play.google.com/store/apps/details?id=com.v2raytun.android",
      instructions: {
        title: "Добавить в V2RayTun (Android)",
        qrHint: "Откройте V2RayTun → нажмите «+» → «Сканировать QR» → наведите камеру на код ниже",
        steps: [
          "Откройте приложение V2RayTun на Android",
          "Нажмите «+» в верхней панели",
          "Выберите «Сканировать QR-код»",
          "Наведите камеру на QR-код ниже",
          "Сервер добавится автоматически",
          "Выберите сервер и нажмите кнопку подключения",
        ],
      },
    },
  ],
  macos: [
    {
      id: "happ-macos",
      name: "Happ",
      platform: "macos",
      jsonFormat: true,
      storeLabel: "App Store",
      downloadUrl: "https://apps.apple.com/ru/app/happ-proxy-utility-plus/id6746188973",
      instructions: {
        title: "Добавить в Happ (macOS)",
        qrHint: "Откройте Happ → нажмите «+» → «Сканировать QR-код с экрана» → выделите QR-код ниже",
        steps: [
          "Откройте Happ на Mac",
          "Нажмите «+» → «Сканировать QR-код с экрана»",
          "Выделите QR-код на экране мышкой",
          "Конфигурация импортируется автоматически",
          "Нажмите подключиться, введите пароль Mac при запросе",
        ],
      },
    },
  ],
  windows: [
    {
      id: "happ-windows",
      name: "Happ",
      platform: "windows",
      jsonFormat: true,
      storeLabel: "Скачать с сайта",
      downloadUrl: "https://www.happ.su/main",
      instructions: {
        title: "Добавить в Happ (Windows)",
        qrHint: "Откройте Happ → «+» → «Сканировать QR с экрана» → выделите QR-код ниже",
        steps: [
          "Откройте Happ на компьютере",
          "Нажмите «+» → «Сканировать QR-код с экрана»",
          "Выделите QR-код на экране мышкой",
          "Конфигурация импортируется автоматически",
          "Нажмите подключиться, разрешите доступ в брандмауэре при запросе",
        ],
      },
    },
  ],
  tv: [
    {
      id: "v2raytun-tv",
      name: "V2RayTun",
      platform: "tv",
      storeLabel: "Google Play на TV",
      downloadUrl: "https://play.google.com/store/apps/details?id=com.v2raytun.android",
      instructions: {
        title: "Добавить в V2RayTun (TV)",
        qrHint: "Откройте V2RayTun на TV → «+» → «Сканировать QR» → покажите этот код экрану TV",
        steps: [
          "Откройте V2RayTun на Android TV",
          "Нажмите «+» → «Сканировать QR-код»",
          "Покажите QR-код с этого экрана перед камерой TV (или телефоном)",
          "Сервер добавится автоматически",
          "Выберите сервер и нажмите подключиться пультом",
        ],
      },
    },
  ],
};

const PLATFORMS: { id: Platform; name: string; detail: string }[] = [
  { id: "ios",     name: "iPhone / iPad", detail: "iOS 16+" },
  { id: "android", name: "Android",       detail: "10+" },
  { id: "macos",   name: "macOS",         detail: "M1 / Intel" },
  { id: "windows", name: "Windows",       detail: "10 / 11" },
  { id: "tv",      name: "Android TV",    detail: "Google TV" },
];

// ─── Icons ──────────────────────────────────────────────────

function PlatformIcon({ id }: { id: string }) {
  const p = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "w-7 h-7",
  };
  switch (id) {
    case "ios":
      return (
        <svg {...p}>
          <rect x="7" y="2" width="10" height="20" rx="2" />
          <line x1="11" y1="18" x2="13" y2="18" />
        </svg>
      );
    case "android":
      return (
        <svg {...p}>
          <path d="M4 16V9a2 2 0 012-2h12a2 2 0 012 2v7" />
          <path d="M4 16h16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
          <path d="M8 7l-2-3M16 7l2-3" />
        </svg>
      );
    case "macos":
      return (
        <svg {...p}>
          <rect x="2" y="4" width="20" height="12" rx="1" />
          <path d="M2 20h20M9 20l1-4M15 20l-1-4" />
        </svg>
      );
    case "windows":
      return (
        <svg {...p}>
          <path d="M3 5l8-1v8H3zM11 4l10-1v10H11zM3 13h8v7l-8-1zM11 13h10v8l-10-1z" />
        </svg>
      );
    case "tv":
      return (
        <svg {...p}>
          <rect x="2" y="4" width="20" height="13" rx="1.5" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      );
    default:
      return null;
  }
}

// ─── Main Component ─────────────────────────────────────────

export default function AddDevice() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("platform");
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [appIndex, setAppIndex] = useState(0);
  const [vpnKey, setVpnKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const fetchKey = useCallback(async () => {
    try {
      const res = await fetch("/api/user/subscription");
      const r = await res.json();
      if (r.success && r.data.vpnKey) setVpnKey(r.data.vpnKey);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchKey(); }, [fetchKey]);

  const apps = platform ? APPS[platform] : [];
  const currentApp = apps[appIndex] || null;

  const getKeyUrl = useCallback(() => {
    if (!vpnKey) return null;
    if (currentApp?.jsonFormat) {
      const sep = vpnKey.includes("?") ? "&" : "?";
      return `${vpnKey}${sep}format=json`;
    }
    return vpnKey;
  }, [vpnKey, currentApp]);

  const handleBack = () => {
    if (step === "instruction") setStep(apps.length > 1 ? "app" : "platform");
    else if (step === "app") setStep("platform");
    else router.push("/dashboard");
  };

  const handleSelectPlatform = (p: Platform) => {
    setPlatform(p);
    setAppIndex(0);
    if (APPS[p].length === 1) setStep("instruction");
    else setStep("app");
  };

  const handleCopy = async () => {
    const key = getKeyUrl();
    if (!key) return;
    try { await navigator.clipboard.writeText(key); }
    catch {
      const ta = document.createElement("textarea");
      ta.value = key; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const backLabel =
    step === "platform" ? "В кабинет"
    : step === "app"    ? "К устройствам"
    :                     apps.length > 1 ? "К приложениям" : "К устройствам";

  const stepLabel =
    step === "platform"   ? "Шаг 1 из 3 · Устройство"
    : step === "app"      ? "Шаг 2 из 3 · Приложение"
    :                       "Шаг 3 из 3 · Подключение";

  const navLinks = [
    { label: "Личный кабинет", href: "/dashboard" },
    { label: "Тарифы",         href: "/pricing" },
    { label: "Поддержка",      href: "/contact" },
  ];

  return (
    <div className="bg-[#101010] min-h-dvh flex flex-col text-black">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 sm:px-8 pt-6 sm:pt-8">
        <Link href="/" className="flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M5 5 L1 1 M5 5 L5 1 M5 5 L1 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19 5 L23 1 M19 5 L19 1 M19 5 L23 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 19 L1 23 M5 19 L5 23 M5 19 L1 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19 19 L23 23 M19 19 L19 23 M19 19 L23 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-mts-wide text-[13px] tracking-[0.16em] uppercase text-black/85">atlas.secure</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 font-mts-wide text-[14px] text-black/60">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-black transition-colors">{l.label}</Link>
          ))}
        </nav>

        <button
          className="md:hidden w-11 h-11 rounded-full bg-black/[0.04] border border-black/10 flex items-center justify-center active:scale-[0.95] transition-transform"
          onClick={() => setMenuOpen(true)}
          aria-label="Меню"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#101010] flex flex-col items-center justify-center gap-8 font-mts-wide"
          onClick={() => setMenuOpen(false)}
        >
          <button
            className="absolute top-6 right-6 w-11 h-11 rounded-full bg-black/[0.04] border border-black/10 flex items-center justify-center"
            onClick={() => setMenuOpen(false)}
            aria-label="Закрыть"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="text-black text-2xl" onClick={() => setMenuOpen(false)}>
              {l.label}
            </Link>
          ))}
        </div>
      )}

      {/* Wizard content */}
      <section className="flex-1 px-5 sm:px-8 pt-8 sm:pt-12 pb-16 sm:pb-24 max-w-[900px] mx-auto w-full">

        {/* Back + step */}
        <div className="flex items-center justify-between mb-8 sm:mb-10">
          <button
            onClick={handleBack}
            className="px-btn px-btn-sm px-btn-secondary"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Назад · {backLabel}
          </button>
          <span className="font-mts-wide text-[11px] tracking-[0.14em] uppercase text-black/45">
            {stepLabel}
          </span>
        </div>

        {/* ─── Platform Selection ─── */}
        {step === "platform" && (
          <>
            <div className="mb-10 sm:mb-14">
              <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-black/45 mb-4">
                Добавление устройства
              </div>
              <h1 className="font-mts-wide text-[36px] sm:text-[52px] leading-[1.02] tracking-tight font-bold">
                На каком<br />устройстве?
              </h1>
              <p className="font-mts-wide text-[15px] sm:text-[17px] leading-[1.5] text-black/60 mt-6 max-w-[52ch]">
                Ваш ключ подписки работает на любом устройстве. Выберите платформу — покажем подходящее приложение и QR-код для быстрого добавления.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPlatform(p.id)}
                  className="group text-left bg-[color:var(--px-surface)] border border-black/[0.06] rounded-2xl p-5 sm:p-6 flex items-center gap-5 hover:border-black/[0.15] hover:-translate-y-0.5 transition-all active:scale-[0.99]"
                >
                  <div className="w-12 h-12 rounded-xl bg-black/[0.04] flex items-center justify-center shrink-0 text-black/70 group-hover:text-black transition-colors">
                    <PlatformIcon id={p.id} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mts-wide text-[16px] sm:text-[17px] font-medium text-black">{p.name}</div>
                    <div className="font-mts-wide text-[12px] text-black/45 mt-0.5">{p.detail}</div>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-black/30 group-hover:text-black/70 transition-colors shrink-0">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ─── App Selection ─── */}
        {step === "app" && platform && (
          <>
            <div className="mb-10 sm:mb-14">
              <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-black/45 mb-4">
                Приложение для подключения
              </div>
              <h1 className="font-mts-wide text-[36px] sm:text-[52px] leading-[1.02] tracking-tight font-bold">
                В какое<br />приложение?
              </h1>
              <p className="font-mts-wide text-[15px] sm:text-[17px] leading-[1.5] text-black/60 mt-6 max-w-[52ch]">
                Для {PLATFORMS.find((p) => p.id === platform)?.name} есть несколько подходящих клиентов. Выберите один — добавим подписку туда.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {apps.map((app, i) => (
                <button
                  key={app.id}
                  onClick={() => { setAppIndex(i); setStep("instruction"); }}
                  className="group text-left bg-[color:var(--px-surface)] border border-black/[0.06] rounded-2xl p-5 sm:p-6 flex items-center gap-5 hover:border-black/[0.15] hover:-translate-y-0.5 transition-all active:scale-[0.99]"
                >
                  <div className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center shrink-0 font-mts-wide text-[22px] font-bold">
                    {app.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mts-wide text-[17px] sm:text-[19px] font-medium text-black">{app.name}</div>
                    <div className="font-mts-wide text-[12px] text-black/45 mt-0.5 uppercase tracking-[0.10em]">{app.storeLabel}</div>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-black/30 group-hover:text-black/70 transition-colors shrink-0">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ─── Instruction + QR ─── */}
        {step === "instruction" && currentApp && (
          <>
            <div className="mb-10 sm:mb-12">
              <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-black/45 mb-4">
                {PLATFORMS.find((p) => p.id === currentApp.platform)?.name} · {currentApp.name}
              </div>
              <h1 className="font-mts-wide text-[32px] sm:text-[44px] leading-[1.05] tracking-tight font-bold max-w-[18ch]">
                {currentApp.instructions.title}
              </h1>
            </div>

            {/* QR card */}
            {getKeyUrl() && (
              <div className="bg-[color:var(--px-surface)] border border-black/[0.06] rounded-3xl p-6 sm:p-8 mb-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg bg-black text-white flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3"  width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                      <rect x="14" y="14" width="3" height="3" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-mts-wide text-[11px] tracking-[0.14em] uppercase text-black/45">Импорт</div>
                    <h3 className="font-mts-wide text-[16px] sm:text-[18px] font-bold leading-tight">QR-код подписки</h3>
                  </div>
                </div>

                <p className="font-mts-wide text-[13px] sm:text-[14px] leading-[1.55] text-black/60 mb-6">
                  {currentApp.instructions.qrHint}
                </p>

                <div className="bg-[color:var(--px-surface)] border border-black/[0.08] rounded-2xl p-5 sm:p-6 flex items-center justify-center mx-auto max-w-[280px]">
                  <QRCodeSVG
                    value={getKeyUrl()!}
                    size={220}
                    level="M"
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </div>
              </div>
            )}

            {/* Steps card */}
            <div className="bg-[color:var(--px-surface)] border border-black/[0.06] rounded-3xl p-6 sm:p-8 mb-4">
              <div className="font-mts-wide text-[11px] tracking-[0.14em] uppercase text-black/45 mb-4">
                Пошаговая инструкция
              </div>
              <h3 className="font-mts-wide text-[18px] sm:text-[22px] font-bold leading-tight mb-6">
                Как добавить подписку
              </h3>
              <ol className="space-y-4">
                {currentApp.instructions.steps.map((s, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center shrink-0 mt-0.5 font-mts-wide text-[12px] font-bold tabular-nums">
                      {i + 1}
                    </div>
                    <p className="font-mts-wide text-[14px] sm:text-[15px] leading-[1.55] text-black/75 pt-1">{s}</p>
                  </li>
                ))}
              </ol>
            </div>

            {/* Manual key card */}
            {getKeyUrl() && (
              <div className="bg-[color:var(--px-surface)] border border-black/[0.06] rounded-3xl p-6 sm:p-8 mb-4">
                <div className="font-mts-wide text-[11px] tracking-[0.14em] uppercase text-black/45 mb-3">
                  Или скопируйте вручную
                </div>
                <h3 className="font-mts-wide text-[18px] sm:text-[22px] font-bold leading-tight mb-5">
                  Ключ подписки
                </h3>

                <div className="bg-black/[0.04] border border-black/[0.08] rounded-2xl p-4 mb-4 font-mono text-xs break-all leading-relaxed text-black/70 select-all">
                  {getKeyUrl()}
                </div>

                <button
                  onClick={handleCopy}
                  className={`px-btn px-btn-md px-btn-block ${copied ? "px-btn-good" : "px-btn-primary"}`}
                >
                  {copied ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Скопировано
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                      Скопировать ключ
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Install app CTA */}
            <a
              href={currentApp.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-btn px-btn-md px-btn-secondary px-btn-block"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Установить {currentApp.name} · {currentApp.storeLabel}
            </a>

            {/* Return to dashboard */}
            <div className="mt-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="px-btn px-btn-md px-btn-secondary px-btn-block"
              >
                Готово — вернуться в кабинет
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </>
        )}
      </section>

      <LandingFooter />
    </div>
  );
}
