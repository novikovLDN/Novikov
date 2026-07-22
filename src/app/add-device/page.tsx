"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

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

const PLATFORMS: { id: Platform; name: string }[] = [
  { id: "ios", name: "iPhone / iPad" },
  { id: "android", name: "Android" },
  { id: "macos", name: "macOS" },
  { id: "windows", name: "Windows" },
  { id: "tv", name: "Android TV" },
];

// ─── Icons ──────────────────────────────────────────────────

function PlatformIcon({ id, size = 22 }: { id: string; size?: number }) {
  switch (id) {
    case "android":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 16V8a7 7 0 0114 0v8" />
          <rect x="3" y="16" width="18" height="4" rx="1" />
          <circle cx="8.5" cy="8.5" r="1" fill="currentColor" />
          <circle cx="15.5" cy="8.5" r="1" fill="currentColor" />
        </svg>
      );
    case "ios": case "macos":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
      );
    case "windows":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 12V6.5l8-1.1V12H3zm0 .5V18l8 1.1V12.5H3zm9 0V18.6l9 1.4V12.5h-9zm0-.5h9V4l-9 1.4V12z" />
        </svg>
      );
    case "tv":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      );
    default: return null;
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

  // ─── Platform Selection ─────────────────────────────────

  if (step === "platform") {
    return (
      <div className="min-h-dvh bg-background flex flex-col">
        <WizardHeader onBack={() => router.push("/dashboard")} title="Добавить устройство" />
        <div className="flex-1 px-4 sm:px-6 pb-8 max-w-lg mx-auto w-full">
          <div className="text-center mt-6 sm:mt-10 mb-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center animate-scale-in">
              <svg className="w-8 h-8 sm:w-10 sm:h-10" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 animate-fade-in-up">Добавить устройство</h1>
            <p className="text-muted text-sm sm:text-base animate-fade-in-up animate-delay-1">На каком устройстве подключаемся?</p>
          </div>
          <div className="space-y-2.5">
            {PLATFORMS.map((p, i) => (
              <button
                key={p.id}
                onClick={() => handleSelectPlatform(p.id)}
                className="w-full bg-card border border-border/50 rounded-2xl p-4 sm:p-5 flex items-center gap-4 transition-all hover:border-primary/40 hover:bg-card-hover active:scale-[0.98] btn-press animate-fade-in-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                  <PlatformIcon id={p.id} />
                </div>
                <span className="font-semibold text-sm sm:text-base flex-1 text-left">{p.name}</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted shrink-0"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── App Selection ────────────────────────────────────────

  if (step === "app" && platform) {
    return (
      <div className="min-h-dvh bg-background flex flex-col">
        <WizardHeader onBack={handleBack} title="Выберите приложение" />
        <div className="flex-1 px-4 sm:px-6 pb-8 max-w-lg mx-auto w-full">
          <div className="text-center mt-6 sm:mt-10 mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">В какое приложение?</h1>
            <p className="text-muted text-sm sm:text-base">Выберите клиент, в который добавляем подписку</p>
          </div>
          <div className="space-y-3">
            {apps.map((app, i) => (
              <button
                key={app.id}
                onClick={() => { setAppIndex(i); setStep("instruction"); }}
                className="w-full bg-card border border-border/50 rounded-2xl p-5 text-left transition-all hover:border-primary/40 hover:bg-card-hover active:scale-[0.98] btn-press animate-fade-in-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                    <span className="text-xl font-bold text-primary">{app.name[0]}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm sm:text-base">{app.name}</p>
                    <p className="text-muted text-xs sm:text-sm">{app.storeLabel}</p>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted shrink-0"><path d="M9 18l6-6-6-6" /></svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Instruction + QR Code ────────────────────────────────

  if (step === "instruction" && currentApp) {
    const keyUrl = getKeyUrl();

    return (
      <div className="min-h-dvh bg-background flex flex-col">
        <WizardHeader onBack={handleBack} title={currentApp.instructions.title} />
        <div className="flex-1 px-4 sm:px-6 pb-8 max-w-lg mx-auto w-full">

          {/* QR Code */}
          {keyUrl && (
            <div className="mt-5 sm:mt-8 animate-fade-in-up">
              <div className="bg-card border border-border/50 rounded-2xl p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="3" height="3" />
                  </svg>
                  <h3 className="font-bold text-sm sm:text-base">QR-код подписки</h3>
                </div>

                <p className="text-muted text-xs sm:text-sm mb-4 leading-relaxed">
                  {currentApp.instructions.qrHint}
                </p>

                <div className="bg-white rounded-xl p-4 sm:p-5 flex items-center justify-center mx-auto max-w-[240px]">
                  <QRCodeSVG
                    value={keyUrl}
                    size={200}
                    level="M"
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step-by-step Instructions */}
          <div className="mt-4 animate-fade-in-up animate-delay-1">
            <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-5">
              <h3 className="font-bold text-sm sm:text-base mb-4">Пошаговая инструкция</h3>
              <div className="space-y-3">
                {currentApp.instructions.steps.map((s, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[11px] font-bold text-primary">{i + 1}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed pt-1">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Copy Key */}
          {keyUrl && (
            <div className="mt-4 animate-fade-in-up animate-delay-2">
              <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-5">
                <h3 className="font-bold text-sm sm:text-base mb-3">Или вставьте ключ вручную</h3>
                <div className="bg-background rounded-xl p-3 mb-3 overflow-hidden">
                  <p className="text-[11px] sm:text-xs text-muted font-mono break-all leading-relaxed select-all">
                    {keyUrl.length > 50 ? `${keyUrl.slice(0, 25)}...${keyUrl.slice(-20)}` : keyUrl}
                  </p>
                </div>
                <button
                  onClick={handleCopy}
                  className={`w-full h-11 sm:h-12 rounded-xl font-medium text-sm sm:text-base transition-all btn-press flex items-center justify-center gap-2 ${
                    copied
                      ? "bg-success/20 text-success border border-success/30"
                      : "bg-card-hover border border-border hover:bg-card-active"
                  }`}
                >
                  {copied ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                      Скопировано!
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
            </div>
          )}

          {/* Need the app? */}
          <div className="mt-4 animate-fade-in-up animate-delay-3">
            <a
              href={currentApp.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-11 sm:h-12 rounded-xl border border-border bg-card font-medium text-sm sm:text-base hover:bg-card-hover transition-all btn-press flex items-center justify-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Установить {currentApp.name} ({currentApp.storeLabel})
            </a>
          </div>

          {/* Back to dashboard */}
          <div className="mt-4 animate-fade-in-up animate-delay-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full h-11 sm:h-12 rounded-xl border border-border bg-card font-medium text-sm sm:text-base hover:bg-card-hover transition-all btn-press flex items-center justify-center gap-2 text-muted"
            >
              Вернуться в кабинет
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Wizard Header ──────────────────────────────────────────

function WizardHeader({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/30">
      <div className="max-w-lg mx-auto flex items-center h-14 sm:h-16 px-4 sm:px-6">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-card-hover transition-all btn-press -ml-2"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h2 className="font-semibold text-sm sm:text-base ml-2">{title}</h2>
      </div>
    </div>
  );
}
