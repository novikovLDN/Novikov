"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface DeviceInfo {
  id: string;
  name: string;
  platform: string;
  icon: string;
}

const devices: DeviceInfo[] = [
  { id: "android", name: "Android", platform: "android", icon: "android" },
  { id: "ios", name: "iPhone / iPad", platform: "ios", icon: "ios" },
  { id: "windows", name: "Windows", platform: "windows", icon: "windows" },
  { id: "macos", name: "macOS", platform: "macos", icon: "macos" },
  { id: "tv", name: "Android/Google TV", platform: "tv", icon: "tv" },
];

const deviceIcons: Record<string, React.ReactNode> = {
  android: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 16V8a7 7 0 0114 0v8" />
      <rect x="3" y="16" width="18" height="4" rx="1" />
      <circle cx="8.5" cy="8.5" r="1" fill="currentColor" />
      <circle cx="15.5" cy="8.5" r="1" fill="currentColor" />
    </svg>
  ),
  ios: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  ),
  windows: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 12V6.5l8-1.1V12H3zm0 .5V18l8 1.1V12.5H3zm9 0V18.6l9 1.4V12.5h-9zm0-.5h9V4l-9 1.4V12z"/>
    </svg>
  ),
  macos: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  ),
  tv: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
};

export default function Devices() {
  const router = useRouter();
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const handleResetKey = async () => {
    if (resetting) return;
    if (!confirm("Вы уверены? Текущий ключ перестанет работать на всех устройствах.")) return;

    setResetting(true);
    try {
      const res = await fetch("/api/vpn/generate-key", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setResetDone(true);
        setTimeout(() => setResetDone(false), 3000);
      }
    } catch {
      // handle error silently
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header showBack showMenu onBack={() => router.push("/dashboard")} />

      <main className="flex-1 px-4 max-w-lg mx-auto w-full pb-6">
        <h1 className="text-2xl font-bold mt-2 mb-6 animate-fade-in">Выбор устройств</h1>

        <div className="grid grid-cols-2 gap-3 mb-3 animate-fade-in-delay-1">
          {devices.slice(0, 4).map((device) => (
            <button
              key={device.id}
              className="h-14 bg-card hover:bg-card-hover rounded-2xl flex items-center justify-center gap-2 font-medium transition-colors border border-border"
            >
              {deviceIcons[device.icon]}
              <span>{device.name}</span>
            </button>
          ))}
        </div>

        <button className="w-full h-14 bg-card hover:bg-card-hover rounded-2xl flex items-center justify-center gap-2 font-medium transition-colors border border-border mb-6 animate-fade-in-delay-2">
          {deviceIcons.tv}
          <span>{devices[4].name}</span>
        </button>

        <button className="w-full h-14 rounded-2xl bg-foreground text-background font-semibold hover:bg-foreground/90 transition-all mb-4 flex items-center justify-center gap-2 animate-fade-in-delay-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          Поделиться ключом (подпиской)
        </button>

        <div className="bg-card rounded-2xl p-4 mb-6 animate-fade-in-delay-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className="text-sm text-muted leading-relaxed">
              Количество подключаемых устройств не ограничено. Воспользуйся QR-кодом в разделе
              «Поделиться ключом (подпиской)» для быстрого подключения дополнительных устройств
            </p>
          </div>
        </div>

        <button
          onClick={handleResetKey}
          disabled={resetting}
          className="w-full h-14 rounded-2xl border border-danger text-danger font-semibold hover:bg-danger/10 transition-colors flex items-center justify-center gap-2 animate-fade-in-delay-4"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {resetting ? "Сброс..." : resetDone ? "Ключ сброшен!" : "Сбросить ключ (подписку)"}
        </button>
      </main>

      <Footer />
    </div>
  );
}
