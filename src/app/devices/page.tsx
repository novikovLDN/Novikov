"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageContainer from "@/components/PageContainer";
import LoadingSpinner from "@/components/LoadingSpinner";

interface DeviceEntry {
  id: string;
  name: string;
  platform: string;
  icon: string;
  colSpan?: "full";
}

const devices: DeviceEntry[] = [
  { id: "android", name: "Android", platform: "android", icon: "android" },
  { id: "ios", name: "iPhone / iPad", platform: "ios", icon: "ios" },
  { id: "windows", name: "Windows", platform: "windows", icon: "windows" },
  { id: "macos", name: "macOS", platform: "macos", icon: "macos" },
  { id: "tv", name: "Android/Google TV", platform: "tv", icon: "tv", colSpan: "full" },
];

function DeviceIcon({ id, size = 20 }: { id: string; size?: number }) {
  const s = size;
  switch (id) {
    case "android":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 16V8a7 7 0 0114 0v8" />
          <rect x="3" y="16" width="18" height="4" rx="1" />
          <circle cx="8.5" cy="8.5" r="1" fill="currentColor" />
          <circle cx="15.5" cy="8.5" r="1" fill="currentColor" />
        </svg>
      );
    case "ios":
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
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Devices() {
  const router = useRouter();
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [vpnKey, setVpnKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const fetchKey = useCallback(async () => {
    try {
      const res = await fetch("/api/user/subscription");
      const result = await res.json();
      if (result.success) {
        setVpnKey(result.data.vpnKey);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchKey();
  }, [fetchKey]);

  const handleResetKey = async () => {
    if (resetting) return;

    setResetting(true);
    try {
      const res = await fetch("/api/vpn/generate-key", { method: "POST" });
      const result = await res.json();
      if (result.success) {
        setVpnKey(result.data.vpnKey);
        setResetDone(true);
        setTimeout(() => setResetDone(false), 3000);
      }
    } catch {
      // silent
    } finally {
      setResetting(false);
    }
  };

  const handleCopyKey = async () => {
    if (!vpnKey) return;
    await navigator.clipboard.writeText(vpnKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <Header showBack showMenu onBack={() => router.push("/dashboard")} />

      <PageContainer>
        <h1 className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 mb-5 sm:mb-6 animate-fade-in-up">
          Выбор устройств
        </h1>

        {/* Device Grid */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-2.5 sm:mb-3 animate-fade-in-up animate-delay-1">
          {devices.slice(0, 4).map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDevice(selectedDevice === d.id ? null : d.id)}
              className={`h-13 sm:h-14 rounded-2xl flex items-center justify-center gap-2 sm:gap-2.5 font-medium text-sm sm:text-base transition-all btn-press border ${
                selectedDevice === d.id
                  ? "bg-primary/15 border-primary/40 text-primary"
                  : "bg-card border-border hover:bg-card-hover active:bg-card-active"
              }`}
            >
              <DeviceIcon id={d.icon} size={20} />
              <span>{d.name}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => setSelectedDevice(selectedDevice === "tv" ? null : "tv")}
          className={`w-full h-13 sm:h-14 rounded-2xl flex items-center justify-center gap-2.5 font-medium text-sm sm:text-base transition-all btn-press border mb-5 sm:mb-6 animate-fade-in-up animate-delay-2 ${
            selectedDevice === "tv"
              ? "bg-primary/15 border-primary/40 text-primary"
              : "bg-card border-border hover:bg-card-hover active:bg-card-active"
          }`}
        >
          <DeviceIcon id="tv" size={20} />
          <span>Android/Google TV</span>
        </button>

        {/* Instructions for Selected Device */}
        {selectedDevice && (
          <div className="mb-5 sm:mb-6 animate-scale-in">
            <InstructionCard platform={selectedDevice} vpnKey={vpnKey} onCopyKey={handleCopyKey} copiedKey={copiedKey} />
          </div>
        )}

        {/* Share Key */}
        <button
          onClick={handleCopyKey}
          className="w-full h-13 sm:h-14 rounded-2xl bg-foreground text-background font-semibold text-sm sm:text-base hover:bg-foreground/90 transition-all btn-press flex items-center justify-center gap-2.5 mb-3 sm:mb-4 animate-fade-in-up animate-delay-3"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          {copiedKey ? "Ключ скопирован!" : "Поделиться ключом (подпиской)"}
        </button>

        {/* Device Limit Info */}
        <div className="bg-card border border-border/50 rounded-2xl p-3.5 sm:p-4 mb-5 sm:mb-6 animate-fade-in-up animate-delay-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center shrink-0 mt-0.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
            </div>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Тариф <b className="text-foreground">Basic</b> — до <b className="text-foreground">5 устройств</b>. Тариф <b className="text-foreground">Plus</b> — до <b className="text-foreground">7 устройств</b>. Воспользуйтесь кнопкой «Поделиться ключом» для быстрого подключения дополнительных устройств.
            </p>
          </div>
        </div>

        {/* Reset Key */}
        <button
          onClick={handleResetKey}
          disabled={resetting}
          className={`w-full h-13 sm:h-14 rounded-2xl font-semibold text-sm sm:text-base transition-all btn-press flex items-center justify-center gap-2.5 animate-fade-in-up animate-delay-4 border ${
            resetDone
              ? "border-success/40 text-success bg-success-light"
              : "border-danger/40 text-danger hover:bg-danger-light"
          }`}
        >
          {resetting ? (
            <>
              <LoadingSpinner size="sm" className="text-danger" />
              Сброс...
            </>
          ) : resetDone ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Ключ сброшен!
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Сбросить ключ (подписку)
            </>
          )}
        </button>
      </PageContainer>

      <Footer />
    </div>
  );
}

// ─── Instruction Card ────────────────────────────────────────────

interface InstructionCardProps {
  platform: string;
  vpnKey: string | null;
  onCopyKey: () => void;
  copiedKey: boolean;
}

const platformInstructions: Record<string, {
  appName: string;
  appDesc: string;
  storeLabel: string;
  downloadUrl: string;
  downloadLabel: string;
  steps: string[];
}> = {
  android: {
    appName: "V2rayNG",
    appDesc: "Рекомендуемый клиент для Android",
    storeLabel: "Google Play",
    downloadUrl: "https://play.google.com/store/apps/details?id=com.v2ray.ang",
    downloadLabel: "Скачать на Android",
    steps: [
      "Скачайте и установите V2rayNG из Google Play",
      "Скопируйте ваш VPN-ключ, нажав кнопку ниже",
      "Откройте V2rayNG → нажмите «+» → «Импорт из буфера»",
      "Нажмите кнопку подключения (▶) в нижней части экрана",
    ],
  },
  ios: {
    appName: "Streisand",
    appDesc: "Рекомендуемый клиент для iPhone и iPad",
    storeLabel: "App Store",
    downloadUrl: "https://apps.apple.com/app/streisand/id6450534064",
    downloadLabel: "Скачать на iPhone",
    steps: [
      "Скачайте и установите Streisand из App Store",
      "Скопируйте ваш VPN-ключ, нажав кнопку ниже",
      "Откройте Streisand → нажмите «+» → «Добавить из буфера»",
      "Включите VPN-подключение переключателем",
    ],
  },
  windows: {
    appName: "Hiddify",
    appDesc: "Рекомендуемый клиент для Windows",
    storeLabel: "Скачать",
    downloadUrl: "https://github.com/hiddify/hiddify-app/releases/latest",
    downloadLabel: "Скачать на Windows",
    steps: [
      "Скачайте и установите Hiddify с официального сайта",
      "Скопируйте ваш VPN-ключ, нажав кнопку ниже",
      "Откройте Hiddify → «Новый профиль» → «Добавить из буфера»",
      "Нажмите кнопку подключения",
    ],
  },
  macos: {
    appName: "Hiddify",
    appDesc: "Рекомендуемый клиент для macOS",
    storeLabel: "Скачать",
    downloadUrl: "https://github.com/hiddify/hiddify-app/releases/latest",
    downloadLabel: "Скачать на macOS",
    steps: [
      "Скачайте и установите Hiddify с официального сайта",
      "Скопируйте ваш VPN-ключ, нажав кнопку ниже",
      "Откройте Hiddify → «Новый профиль» → «Добавить из буфера»",
      "Нажмите кнопку подключения",
    ],
  },
  tv: {
    appName: "V2rayNG",
    appDesc: "Для Android TV и Google TV",
    storeLabel: "Google Play TV",
    downloadUrl: "https://play.google.com/store/apps/details?id=com.v2ray.ang",
    downloadLabel: "Скачать на Android TV",
    steps: [
      "Установите V2rayNG на TV из Google Play",
      "На телефоне скопируйте VPN-ключ",
      "Откройте V2rayNG на TV → добавьте подключение вручную или через QR-код",
      "Запустите подключение на TV",
    ],
  },
};

function InstructionCard({ platform, vpnKey, onCopyKey, copiedKey }: InstructionCardProps) {
  const info = platformInstructions[platform];
  if (!info) return null;

  return (
    <div className="bg-card border border-primary/20 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-primary/10 px-4 sm:px-5 py-3 sm:py-4 border-b border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm sm:text-base">{info.appName}</h3>
            <p className="text-xs sm:text-sm text-muted">{info.appDesc}</p>
          </div>
          <span className="text-[10px] sm:text-xs bg-primary/20 text-primary px-2.5 py-1 rounded-full font-medium">
            {info.storeLabel}
          </span>
        </div>
      </div>

      {/* Steps */}
      <div className="px-4 sm:px-5 py-3 sm:py-4 space-y-3 sm:space-y-4">
        {info.steps.map((step, i) => (
          <div key={i} className="flex gap-3 items-start">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs sm:text-sm font-bold text-primary">{i + 1}</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-light leading-relaxed pt-0.5">{step}</p>
          </div>
        ))}
      </div>

      {/* Download + Copy buttons */}
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-2.5">
        <a
          href={info.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-11 sm:h-12 rounded-xl font-medium text-sm sm:text-base transition-all btn-press flex items-center justify-center gap-2 bg-foreground text-background hover:bg-foreground/90"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {info.downloadLabel}
        </a>

        {vpnKey && (
          <button
            onClick={onCopyKey}
            className={`w-full h-11 sm:h-12 rounded-xl font-medium text-sm sm:text-base transition-all btn-press flex items-center justify-center gap-2 ${
              copiedKey
                ? "bg-success/20 text-success border border-success/30"
                : "bg-primary text-white hover:bg-primary-hover"
            }`}
          >
            {copiedKey ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Ключ скопирован!
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                Скопировать VPN-ключ
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
