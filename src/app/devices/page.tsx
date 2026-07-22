"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import CursorGlowTracker from "@/components/CursorGlowTracker";

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
  jsonFormat?: boolean;
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

  // Build the key URL: add &format=json for Happ, plain for V2RayTun
  const getKeyUrl = useCallback(() => {
    if (!vpnKey) return null;
    if (currentApp?.jsonFormat) {
      const sep = vpnKey.includes("?") ? "&" : "?";
      return `${vpnKey}${sep}format=json`;
    }
    return vpnKey;
  }, [vpnKey, currentApp]);

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

  const handleDone = () => {
    setStep("done");
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000);
  };

  // Step number for the progress indicator (1..3)
  const stepNum = step === "device" ? 1 : step === "app" ? 2 : step === "install" ? 3 : 3;
  const totalSteps = selectedApps.length > 1 ? 3 : 2;
  const displayedNum = selectedApps.length > 1 ? stepNum : step === "install" ? 2 : 1;

  // ─── Step: Device Selection ─────────────────────────────

  if (step === "device") {
    return (
      <div className="dashboard-v2 min-h-dvh flex flex-col">
        <CursorGlowTracker />
        <WizardHeader onBack={() => router.push("/dashboard")} title="Подключение" step={1} total={2} />
        <div className="flex-1 px-4 sm:px-6 pb-10 max-w-2xl mx-auto w-full">
          <div className="pt-6 sm:pt-10 pb-8">
            <div className="dv2-eyebrow mb-3">ШАГ 1 — УСТРОЙСТВО</div>
            <h1 className="text-[32px] sm:text-[40px] font-light leading-[1.1] tracking-tight text-white">
              На каком устройстве<br />
              <span className="text-white/50">подключаемся?</span>
            </h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PLATFORMS.map((p, i) => (
              <button
                key={p.id}
                onClick={() => handleSelectPlatform(p.id)}
                className="dv2-card p-5 flex items-center gap-4 text-left transition-all active:scale-[0.985] group animate-fade-in-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 text-white/80 group-hover:text-white group-hover:border-white/[0.14] transition-colors">
                  <PlatformIcon id={p.icon} size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-medium text-white/95">{p.name}</div>
                  <div className="text-[11px] text-white/40 mt-0.5">Настройка за 2 шага</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all shrink-0">
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
      <div className="dashboard-v2 min-h-dvh flex flex-col">
        <CursorGlowTracker />
        <WizardHeader onBack={handleBack} title="Выберите приложение" step={2} total={3} />
        <div className="flex-1 px-4 sm:px-6 pb-10 max-w-2xl mx-auto w-full">
          <div className="pt-6 sm:pt-10 pb-8">
            <div className="dv2-eyebrow mb-3">ШАГ 2 — ПРИЛОЖЕНИЕ</div>
            <h1 className="text-[32px] sm:text-[40px] font-light leading-[1.1] tracking-tight text-white">
              Выберите<br />
              <span className="text-white/50">приложение</span>
            </h1>
          </div>

          <div className="space-y-2.5">
            {selectedApps.map((app, i) => (
              <button
                key={app.id}
                onClick={() => handleSelectApp(i)}
                className="dv2-card p-5 w-full text-left transition-all active:scale-[0.985] group animate-fade-in-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#5E6AD2]/20 to-white/[0.02] border border-white/[0.06] flex items-center justify-center shrink-0">
                    <span className="text-[22px] font-light text-white">{app.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-medium text-white/95">{app.name}</div>
                    <div className="text-[12px] text-white/40 mt-0.5">{app.description}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all shrink-0">
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
      <div className="dashboard-v2 min-h-dvh flex flex-col">
        <CursorGlowTracker />
        <WizardHeader onBack={handleBack} title={currentApp.name} step={displayedNum} total={totalSteps} />
        <div className="flex-1 px-4 sm:px-6 pb-10 max-w-2xl mx-auto w-full">
          <div className="pt-6 sm:pt-10 pb-6">
            <div className="dv2-eyebrow mb-3">{currentApp.name.toUpperCase()} · НАСТРОЙКА</div>
            <h1 className="text-[28px] sm:text-[36px] font-light leading-[1.1] tracking-tight text-white">
              Установите приложение и<br />
              <span className="text-white/50">импортируйте подписку</span>
            </h1>
          </div>

          {/* Step 1: Install App */}
          <div className="dv2-card p-5 sm:p-6 mb-3 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 rounded-full bg-[#5E6AD2]/15 border border-[#5E6AD2]/30 flex items-center justify-center shrink-0">
                <span className="text-[#8F8FD9] text-[12px] font-medium">1</span>
              </div>
              <h2 className="text-[15px] font-medium text-white">Установите {currentApp.name}</h2>
            </div>
            <p className="text-[12px] text-white/50 mb-4 leading-relaxed pl-10">
              {currentApp.searchHint}
            </p>
            <a
              href={currentApp.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-12 rounded-2xl bg-white text-black font-medium text-[14px] hover:bg-white/95 transition-all active:scale-[0.985] flex items-center justify-center gap-2"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Открыть {currentApp.storeLabel}
            </a>
          </div>

          {/* Step 2: Setup connection */}
          <div className="dv2-card p-5 sm:p-6 mb-3 animate-fade-in-up animate-delay-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 rounded-full bg-[#5E6AD2]/15 border border-[#5E6AD2]/30 flex items-center justify-center shrink-0">
                <span className="text-[#8F8FD9] text-[12px] font-medium">2</span>
              </div>
              <h2 className="text-[15px] font-medium text-white">Настройте подключение</h2>
            </div>

            {/* Auto-install */}
            {currentApp.deepLink && getKeyUrl() && (
              <>
                <button
                  onClick={handleAutoInstall}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#5E6AD2] to-[#8F8FD9] text-white font-medium text-[14px] hover:opacity-95 transition-all active:scale-[0.985] flex items-center justify-center gap-2 mb-4"
                  style={{ boxShadow: "0 8px 24px -8px rgba(94,106,210,0.5)" }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  Автоустановка в {currentApp.name}
                </button>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="text-[10px] font-mono text-white/30 tracking-wider">ИЛИ ВРУЧНУЮ</span>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                </div>
              </>
            )}

            {/* Manual steps */}
            <div className="space-y-3 mb-4">
              {currentApp.steps.map((s, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-medium text-white/70">{i + 1}</span>
                  </div>
                  <p className="text-[13px] text-white/75 leading-relaxed">{s}</p>
                </div>
              ))}
            </div>

            {/* Key + copy */}
            {getKeyUrl() && (
              <button
                onClick={handleCopy}
                className={`w-full h-12 rounded-2xl font-medium text-[13px] transition-all active:scale-[0.985] flex items-center justify-center gap-2 ${
                  copied
                    ? "bg-[#34D399]/10 border border-[#34D399]/30 text-[#34D399]"
                    : "bg-white/[0.04] border border-white/[0.08] text-white/85 hover:bg-white/[0.06] hover:border-white/[0.12]"
                }`}
              >
                {copied ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Скопировано
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                    Скопировать ссылку подписки
                  </>
                )}
              </button>
            )}
          </div>

          {/* Done button */}
          <button
            onClick={handleDone}
            className="w-full h-14 rounded-2xl bg-white text-black font-medium text-[15px] hover:bg-white/95 transition-all active:scale-[0.985] flex items-center justify-center gap-2 mt-4 animate-fade-in-up animate-delay-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Всё готово
          </button>
        </div>
      </div>
    );
  }

  // ─── Step: Done with Confetti ─────────────────────────────

  if (step === "done") {
    return (
      <div className="dashboard-v2 min-h-dvh flex flex-col">
        {showConfetti && <Confetti />}
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pb-10 max-w-md mx-auto w-full">
          <div className="text-center mb-8">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full bg-[#34D399]/15 animate-ping" style={{ animationDuration: "2.4s" }} />
              <div className="relative w-full h-full rounded-full bg-gradient-to-br from-[#34D399]/30 to-[#34D399]/10 border border-[#34D399]/30 flex items-center justify-center">
                <svg className="w-10 h-10 sm:w-12 sm:h-12" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
            <h1 className="text-[36px] sm:text-[44px] font-light tracking-tight leading-[1.05] text-white">
              Подключено
            </h1>
            <p className="text-[14px] text-white/50 mt-4 leading-relaxed max-w-sm">
              Соединение защищено. Откройте приложение чтобы убедиться что оно установило подписку.
            </p>
          </div>
          <div className="w-full space-y-2.5">
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full h-14 rounded-2xl bg-white text-black font-medium text-[15px] hover:bg-white/95 transition-all active:scale-[0.985]"
            >
              Вернуться в кабинет
            </button>
            <button
              onClick={() => router.push("/support")}
              className="w-full h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white/85 font-medium text-[13px] hover:bg-white/[0.06] transition-all active:scale-[0.985] flex items-center justify-center gap-2"
            >
              Нужна помощь?
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Wizard Header ──────────────────────────────────────────

function WizardHeader({ onBack, title, step, total }: { onBack: () => void; title: string; step?: number; total?: number }) {
  return (
    <div className="sticky top-0 z-40 bg-[#0A0A0B]/85 backdrop-blur-xl border-b border-white/[0.05]">
      <div className="max-w-2xl mx-auto flex items-center h-14 sm:h-16 px-4 sm:px-6 gap-3">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/[0.05] transition-all -ml-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h2 className="text-[14px] font-medium text-white/90 truncate">{title}</h2>
        {step && total && (
          <div className="ml-auto flex items-center gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i + 1 <= step ? "w-6 bg-white/90" : "w-2 bg-white/15"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
