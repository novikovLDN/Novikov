"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

// ─── Types ──────────────────────────────────────────────────

type Step = "device" | "app" | "install" | "done";
type Platform = "ios" | "android" | "windows" | "macos" | "tv";

interface AppInfo {
  id: string;
  name: string;
  description: string;
  storeLabel: string;
  downloadUrl: string;
  searchHint: string;
  deepLink?: (url: string) => string;
  steps: string[];
}

// ─── Platform Config ────────────────────────────────────────

const PLATFORMS: { id: Platform; name: string; icon: string }[] = [
  { id: "ios", name: "iPhone / iPad", icon: "ios" },
  { id: "android", name: "Android", icon: "android" },
  { id: "macos", name: "macOS", icon: "macos" },
  { id: "windows", name: "Windows", icon: "windows" },
  { id: "tv", name: "Android TV", icon: "tv" },
];

const APPS: Record<Platform, AppInfo[]> = {
  ios: [
    {
      id: "happ",
      name: "Happ",
      description: "Быстрый и простой VPN-клиент",
      storeLabel: "App Store",
      downloadUrl: "https://apps.apple.com/ru/app/happ-proxy-utility-plus/id6746188973",
      searchHint: "Найдите «Happ» в App Store или нажмите кнопку ниже",
      deepLink: (url) => `https://api.atlassecure.ru/open/happ?url=${encodeURIComponent(url)}`,
      steps: [
        "Откройте Happ и нажмите «+» внизу экрана",
        "Выберите «Добавить подписку» или «Из буфера обмена»",
        "Конфигурация импортируется автоматически",
        "Нажмите кнопку подключения и разрешите VPN",
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
        "Нажмите кнопку подключения и разрешите VPN",
      ],
    },
    {
      id: "happ",
      name: "Happ",
      description: "Быстрый VPN-клиент",
      storeLabel: "Google Play",
      downloadUrl: "https://play.google.com/store/apps/details?id=com.happproxy",
      searchHint: "Найдите «Happ» в Google Play или нажмите кнопку ниже",
      deepLink: (url) => `https://api.atlassecure.ru/open/happ?url=${encodeURIComponent(url)}`,
      steps: [
        "Откройте Happ и нажмите «+» внизу экрана",
        "Выберите «Добавить подписку» или «Из буфера обмена»",
        "Конфигурация импортируется автоматически",
        "Нажмите кнопку подключения и разрешите VPN",
      ],
    },
  ],
  macos: [
    {
      id: "happ",
      name: "Happ",
      description: "Быстрый VPN-клиент для Mac",
      storeLabel: "App Store",
      downloadUrl: "https://apps.apple.com/ru/app/happ-proxy-utility-plus/id6746188973",
      searchHint: "Найдите «Happ» в App Store на Mac или нажмите кнопку ниже",
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
      description: "VPN-клиент для Windows",
      storeLabel: "Скачать с сайта",
      downloadUrl: "https://www.happ.su/main",
      searchHint: "Скачайте Happ с официального сайта и установите",
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

function PlatformIcon({ id, size = 24 }: { id: string; size?: number }) {
  const s = size;
  switch (id) {
    case "android":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 16V8a7 7 0 0114 0v8" />
          <rect x="3" y="16" width="18" height="4" rx="1" />
          <circle cx="8.5" cy="8.5" r="1" fill="currentColor" />
          <circle cx="15.5" cy="8.5" r="1" fill="currentColor" />
        </svg>
      );
    case "ios":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
      );
    case "macos":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
      );
    case "windows":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 12V6.5l8-1.1V12H3zm0 .5V18l8 1.1V12.5H3zm9 0V18.6l9 1.4V12.5h-9zm0-.5h9V4l-9 1.4V12z" />
        </svg>
      );
    case "tv":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      );
    default:
      return null;
  }
}

// ─── Confetti ───────────────────────────────────────────────

function Confetti() {
  const [particles, setParticles] = useState<Array<{
    id: number; x: number; y: number; color: string;
    size: number; rotation: number; delay: number; duration: number;
    shape: "circle" | "rect" | "star";
  }>>([]);

  useEffect(() => {
    const colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#22c55e", "#06b6d4", "#f97316", "#a855f7"];
    const shapes: ("circle" | "rect" | "star")[] = ["circle", "rect", "star"];
    const p = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 30,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 4 + Math.random() * 8,
      rotation: Math.random() * 360,
      delay: Math.random() * 0.6,
      duration: 1.5 + Math.random() * 2,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
    }));
    setParticles(p);
  }, []);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute confetti-particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.shape === "rect" ? p.size * 0.6 : p.size,
            backgroundColor: p.color,
            borderRadius: p.shape === "circle" ? "50%" : p.shape === "star" ? "2px" : "1px",
            transform: `rotate(${p.rotation}deg)`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

export default function Devices() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("device");
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [appIndex, setAppIndex] = useState(0);
  const [vpnKey, setVpnKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

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

  const selectedApps = platform ? APPS[platform] : [];
  const currentApp = selectedApps[appIndex] || null;

  const handleBack = () => {
    if (step === "done") { setStep("install"); setShowConfetti(false); }
    else if (step === "install") setStep(selectedApps.length > 1 ? "app" : "device");
    else if (step === "app") setStep("device");
    else router.push("/dashboard");
  };

  const handleSelectPlatform = (p: Platform) => {
    setPlatform(p);
    setAppIndex(0);
    if (APPS[p].length === 1) {
      setStep("install");
    } else {
      setStep("app");
    }
  };

  const handleSelectApp = (idx: number) => {
    setAppIndex(idx);
    setStep("install");
  };

  const handleCopy = async () => {
    if (!vpnKey) return;
    try {
      await navigator.clipboard.writeText(vpnKey);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = vpnKey;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleAutoInstall = () => {
    if (!vpnKey || !currentApp?.deepLink) return;
    window.location.href = currentApp.deepLink(vpnKey);
  };

  const handleDone = () => {
    setStep("done");
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000);
  };

  // ─── Step: Device Selection ─────────────────────────────

  if (step === "device") {
    return (
      <div className="min-h-dvh bg-background flex flex-col">
        <WizardHeader onBack={() => router.push("/dashboard")} title="Подключение" />
        <div className="flex-1 flex flex-col px-4 sm:px-6 pb-8 max-w-lg mx-auto w-full">
          <div className="text-center mt-6 sm:mt-10 mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Выберите устройство</h1>
            <p className="text-muted text-sm sm:text-base">На каком устройстве настраиваем VPN?</p>
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
                  <PlatformIcon id={p.icon} size={24} />
                </div>
                <span className="font-semibold text-sm sm:text-base flex-1 text-left">{p.name}</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted shrink-0">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Step: App Selection (only if >1 app) ─────────────────

  if (step === "app" && platform) {
    return (
      <div className="min-h-dvh bg-background flex flex-col">
        <WizardHeader onBack={handleBack} title="Выберите приложение" />
        <div className="flex-1 flex flex-col px-4 sm:px-6 pb-8 max-w-lg mx-auto w-full">
          <div className="text-center mt-6 sm:mt-10 mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Установите приложение</h1>
            <p className="text-muted text-sm sm:text-base">Выберите VPN-клиент для установки</p>
          </div>
          <div className="space-y-3">
            {selectedApps.map((app, i) => (
              <button
                key={app.id}
                onClick={() => handleSelectApp(i)}
                className="w-full bg-card border border-border/50 rounded-2xl p-5 text-left transition-all hover:border-primary/40 hover:bg-card-hover active:scale-[0.98] btn-press animate-fade-in-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                    <span className="text-xl font-bold text-primary">{app.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm sm:text-base">{app.name}</p>
                    <p className="text-muted text-xs sm:text-sm">{app.description}</p>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted shrink-0">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Step: Install App + Setup Key ────────────────────────

  if (step === "install" && currentApp) {
    return (
      <div className="min-h-dvh bg-background flex flex-col">
        <WizardHeader onBack={handleBack} title={currentApp.name} />
        <div className="flex-1 flex flex-col px-4 sm:px-6 pb-8 max-w-lg mx-auto w-full">

          {/* Step 1: Install App */}
          <div className="mt-5 sm:mt-8 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                <span className="text-white text-sm font-bold">1</span>
              </div>
              <h2 className="font-bold text-base sm:text-lg">Установите {currentApp.name}</h2>
            </div>
            <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-5">
              <p className="text-muted text-xs sm:text-sm mb-4 leading-relaxed">
                {currentApp.searchHint}
              </p>
              <a
                href={currentApp.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-12 sm:h-13 rounded-xl bg-foreground text-background font-semibold text-sm sm:text-base hover:bg-foreground/90 transition-all btn-press flex items-center justify-center gap-2.5"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Установить {currentApp.name}
              </a>
            </div>
          </div>

          {/* Step 2: Setup Key */}
          <div className="mt-5 animate-fade-in-up animate-delay-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                <span className="text-white text-sm font-bold">2</span>
              </div>
              <h2 className="font-bold text-base sm:text-lg">Настройте подключение</h2>
            </div>
            <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-5">
              {/* Auto-install button */}
              {currentApp.deepLink && vpnKey && (
                <button
                  onClick={handleAutoInstall}
                  className="w-full h-12 sm:h-13 rounded-xl bg-primary text-white font-semibold text-sm sm:text-base hover:bg-primary-hover transition-all btn-press flex items-center justify-center gap-2.5 mb-3"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  Автоустановка
                </button>
              )}

              <p className="text-muted text-[11px] sm:text-xs mb-4 text-center">
                {currentApp.deepLink ? "Или настройте вручную:" : "Инструкция по настройке:"}
              </p>

              {/* Manual steps */}
              <div className="space-y-3 mb-4">
                {currentApp.steps.map((s, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[11px] font-bold text-primary">{i + 1}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">{s}</p>
                  </div>
                ))}
              </div>

              {/* VPN Key */}
              {vpnKey && (
                <>
                  <div className="bg-background rounded-xl p-3 mb-3 overflow-hidden">
                    <p className="text-[11px] sm:text-xs text-muted font-mono break-all leading-relaxed select-all">
                      {vpnKey.length > 40
                        ? `${vpnKey.slice(0, 20)}...${vpnKey.slice(-15)}`
                        : vpnKey}
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
                </>
              )}
            </div>
          </div>

          {/* Done button */}
          <div className="mt-6 animate-fade-in-up animate-delay-2">
            <button
              onClick={handleDone}
              className="w-full h-13 sm:h-14 rounded-2xl bg-success text-white font-bold text-base sm:text-lg hover:bg-success/90 transition-all btn-press flex items-center justify-center gap-2.5"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Готово
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Step: Done with Confetti ─────────────────────────────

  if (step === "done") {
    return (
      <div className="min-h-dvh bg-background flex flex-col">
        {showConfetti && <Confetti />}
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pb-8 max-w-lg mx-auto w-full">
          <div className="text-center animate-scale-in">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-success/15 flex items-center justify-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 animate-fade-in-up">VPN подключён!</h1>
            <p className="text-muted text-sm sm:text-base mb-8 leading-relaxed max-w-xs mx-auto animate-fade-in-up animate-delay-1">
              Ваше соединение защищено. Наслаждайтесь безопасным интернетом!
            </p>
          </div>
          <div className="w-full space-y-3 animate-fade-in-up animate-delay-2">
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full h-13 sm:h-14 rounded-2xl bg-foreground text-background font-semibold text-base sm:text-lg hover:bg-foreground/90 transition-all btn-press"
            >
              Перейти в кабинет
            </button>
            <a
              href="https://t.me/Atlas_SupportSecurity"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-12 sm:h-13 rounded-2xl border border-border bg-card font-medium text-sm sm:text-base hover:bg-card-hover transition-all btn-press flex items-center justify-center gap-2"
            >
              Нужна помощь?
            </a>
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
