"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageContainer from "@/components/PageContainer";
import NotificationsModal from "@/components/NotificationsModal";
import { QRCodeSVG } from "qrcode.react";

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
  const [vpnKey, setVpnKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchKey = useCallback(async () => {
    try {
      // Fetch subscription URL for this user
      const res = await fetch("/api/user/subscription");
      const result = await res.json();
      if (result.success && result.data.subToken) {
        setVpnKey(`https://qodev.dev/api/sub/${result.data.subToken}`);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchKey();
  }, [fetchKey]);

  const handleCopyKey = async () => {
    if (!vpnKey) return;
    await navigator.clipboard.writeText(vpnKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <Header showBack showMenu onBack={() => router.push("/dashboard")} onNotifications={() => setShowNotifications(true)} unreadCount={unreadCount} />

      <PageContainer>
        <h1 className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 mb-5 sm:mb-6 animate-fade-in-up">
          Выбор устройств
        </h1>

        {/* Device hint */}
        {!selectedDevice && (
          <p className="text-xs text-muted mb-3 animate-fade-in">
            Нажмите на кнопку с нужным устройством, чтобы продолжить настройку
          </p>
        )}

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
          {copiedKey ? "Ссылка скопирована!" : "Поделиться подпиской"}
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

        {/* Support */}
        <a
          href="https://t.me/Atlas_SupportSecurity"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-13 sm:h-14 rounded-2xl font-semibold text-sm sm:text-base transition-all btn-press flex items-center justify-center gap-2.5 animate-fade-in-up animate-delay-4 border border-border bg-card hover:bg-card-hover"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Нужна помощь?
        </a>
      </PageContainer>

      <Footer />

      <NotificationsModal open={showNotifications} onClose={() => setShowNotifications(false)} onUnreadCountChange={setUnreadCount} />
    </div>
  );
}

// ─── Instruction Card with App Selection ─────────────────────────

interface InstructionCardProps {
  platform: string;
  vpnKey: string | null;
  onCopyKey: () => void;
  copiedKey: boolean;
}

interface AppInstruction {
  appId: string;
  appName: string;
  appDesc: string;
  storeLabel: string;
  downloadUrl: string;
  downloadLabel: string;
  recommended?: boolean;
  supportsQr?: boolean;
  deepLink?: (subUrl: string) => string;
  steps: { text: string; copyKey?: boolean }[];
}

const platformApps: Record<string, AppInstruction[]> = {
  android: [
    {
      appId: "hiddify",
      appName: "Hiddify",
      appDesc: "Универсальный клиент для Android",
      storeLabel: "Google Play",
      downloadUrl: "https://play.google.com/store/apps/details?id=app.hiddify.com",
      downloadLabel: "Скачать Hiddify",
      recommended: true,
      supportsQr: true,
      deepLink: (url) => `hiddify://import/${url}`,
      steps: [
        { text: "Откройте Google Play на вашем Android-устройстве и найдите приложение «Hiddify». Нажмите «Установить» и дождитесь завершения загрузки." },
        { text: "Скопируйте вашу ссылку подписки — она понадобится на следующем шаге.", copyKey: true },
        { text: "Откройте Hiddify. На главном экране нажмите «Новый профиль», затем выберите «Добавить профиль из буфера обмена». Приложение автоматически распознает конфигурацию и добавит сервер." },
        { text: "На главном экране Hiddify нажмите большую круглую кнопку подключения по центру. Дождитесь, пока статус изменится на «Подключено», а кнопка станет зелёной." },
        { text: "Если Android запросит разрешение на подключение — нажмите «ОК». Готово! Теперь весь ваш трафик защищён." },
      ],
    },
    {
      appId: "v2raytun",
      appName: "V2RayTun",
      appDesc: "Простой клиент для Android",
      storeLabel: "Google Play",
      downloadUrl: "https://play.google.com/store/apps/details?id=com.v2raytun.android",
      downloadLabel: "Скачать V2RayTun",
      supportsQr: true,
      deepLink: (url) => `v2raytun://import/${url}`,
      steps: [
        { text: "Откройте Google Play на вашем Android-устройстве и найдите приложение «V2RayTun». Нажмите «Установить» и дождитесь завершения загрузки." },
        { text: "Скопируйте вашу ссылку подписки — она понадобится на следующем шаге.", copyKey: true },
        { text: "Откройте V2RayTun. На главном экране нажмите значок «+» или «Импорт» в верхней панели, затем выберите «Импорт из буфера обмена». Конфигурация сервера будет добавлена автоматически." },
        { text: "Выберите добавленный сервер из списка, нажав на него. Затем нажмите кнопку подключения внизу экрана. Дождитесь статуса «Подключено»." },
        { text: "Если Android запросит разрешение на подключение — нажмите «ОК». Готово! Соединение установлено." },
      ],
    },
    {
      appId: "happ",
      appName: "Happ",
      appDesc: "Популярный клиент для Android",
      storeLabel: "Google Play",
      downloadUrl: "https://play.google.com/store/apps/details?id=com.happproxy",
      downloadLabel: "Скачать Happ",
      supportsQr: true,
      deepLink: (url) => `https://api.atlassecure.ru/open/happ?url=${encodeURIComponent(url)}`,
      steps: [
        { text: "Откройте Google Play и найдите приложение «Happ — Proxy Utility». Нажмите «Установить» и дождитесь загрузки." },
        { text: "Скопируйте вашу ссылку подписки — она понадобится на следующем шаге.", copyKey: true },
        { text: "Откройте Happ. Нажмите «+» в нижней панели, затем выберите «Добавить из буфера обмена» или «Добавить подписку». Вставьте ссылку — конфигурация импортируется автоматически." },
        { text: "Выберите сервер из списка и нажмите кнопку подключения. Разрешите VPN-подключение при запросе системы." },
        { text: "Когда статус изменится на «Подключено» — защита активна." },
      ],
    },
  ],
  ios: [
    {
      appId: "streisand",
      appName: "Streisand",
      appDesc: "Рекомендуемый клиент для iPhone и iPad",
      storeLabel: "App Store",
      downloadUrl: "https://apps.apple.com/app/streisand/id6450534064",
      downloadLabel: "Скачать Streisand",
      recommended: true,
      supportsQr: true,
      deepLink: (url) => `streisand://import/${url}`,
      steps: [
        { text: "Откройте App Store на вашем iPhone или iPad. Найдите приложение «Streisand» и нажмите «Загрузить». Дождитесь установки." },
        { text: "Скопируйте вашу ссылку подписки — она понадобится на следующем шаге.", copyKey: true },
        { text: "Откройте Streisand. На главном экране нажмите «+» в правом верхнем углу, затем выберите «Добавить из буфера обмена». Конфигурация импортируется автоматически." },
        { text: "Вернитесь на главный экран Streisand. Включите переключатель напротив добавленного сервера. При первом подключении iOS попросит разрешить конфигурацию — нажмите «Разрешить»." },
        { text: "Когда в верхней части экрана появится значок подключения — соединение активно. Весь трафик теперь защищён." },
      ],
    },
    {
      appId: "hiddify",
      appName: "Hiddify",
      appDesc: "Универсальный клиент для iOS",
      storeLabel: "App Store",
      downloadUrl: "https://apps.apple.com/app/hiddify-proxy-vpn/id6596777532",
      downloadLabel: "Скачать Hiddify",
      supportsQr: true,
      deepLink: (url) => `hiddify://import/${url}`,
      steps: [
        { text: "Откройте App Store на вашем iPhone или iPad. Найдите приложение «Hiddify» и нажмите «Загрузить». Дождитесь установки." },
        { text: "Скопируйте вашу ссылку подписки — она понадобится на следующем шаге.", copyKey: true },
        { text: "Откройте Hiddify. На главном экране нажмите «Новый профиль», затем выберите «Добавить профиль из буфера обмена». Приложение автоматически распознает конфигурацию." },
        { text: "На главном экране Hiddify нажмите большую кнопку подключения по центру. При первом подключении iOS попросит разрешить конфигурацию — нажмите «Разрешить»." },
        { text: "Когда кнопка станет зелёной и в верхней части экрана появится значок подключения — соединение активно. Весь трафик защищён." },
      ],
    },
    {
      appId: "v2raytun",
      appName: "V2RayTun",
      appDesc: "Простой клиент для iOS",
      storeLabel: "App Store",
      downloadUrl: "https://apps.apple.com/app/v2raytun/id6476628951",
      downloadLabel: "Скачать V2RayTun",
      supportsQr: true,
      deepLink: (url) => `v2raytun://import/${url}`,
      steps: [
        { text: "Откройте App Store на вашем iPhone или iPad. Найдите приложение «V2RayTun» и нажмите «Загрузить». Дождитесь установки." },
        { text: "Скопируйте вашу ссылку подписки — она понадобится на следующем шаге.", copyKey: true },
        { text: "Откройте V2RayTun. На главном экране нажмите «+» или «Импорт», затем выберите «Импорт из буфера обмена». Конфигурация сервера будет добавлена автоматически." },
        { text: "Выберите добавленный сервер в списке и нажмите кнопку подключения. При первом подключении iOS попросит разрешить конфигурацию — нажмите «Разрешить»." },
        { text: "Когда в верхней части экрана появится значок подключения — соединение активно. Весь трафик теперь защищён." },
      ],
    },
    {
      appId: "shadowrocket",
      appName: "Shadowrocket",
      appDesc: "Продвинутый клиент для iOS (платный)",
      storeLabel: "App Store",
      downloadUrl: "https://apps.apple.com/app/shadowrocket/id932747118",
      downloadLabel: "Скачать Shadowrocket",
      supportsQr: true,
      deepLink: (url) => `sub://${btoa(url)}`,
      steps: [
        { text: "Откройте App Store на вашем iPhone или iPad. Найдите приложение «Shadowrocket» (платное, ~$2.99) и нажмите «Купить» → «Загрузить». Дождитесь установки." },
        { text: "Скопируйте вашу ссылку подписки — она понадобится на следующем шаге.", copyKey: true },
        { text: "Откройте Shadowrocket. На главном экране нажмите «+» в правом верхнем углу. В поле «Тип» выберите «Subscribe», вставьте скопированную ссылку в поле «URL» и нажмите «Готово». Сервер появится в списке автоматически." },
        { text: "На главном экране Shadowrocket выберите добавленный сервер, нажав на него. Затем включите переключатель в верхней части экрана. При первом подключении iOS попросит разрешить конфигурацию — нажмите «Разрешить»." },
        { text: "Когда переключатель станет активным и в верхней части экрана появится значок подключения — соединение установлено. Shadowrocket также показывает скорость соединения в реальном времени." },
      ],
    },
    {
      appId: "happ",
      appName: "Happ",
      appDesc: "Универсальный клиент для iOS",
      storeLabel: "App Store",
      downloadUrl: "https://apps.apple.com/ru/app/happ-proxy-utility-plus/id6746188973",
      downloadLabel: "Скачать Happ",
      supportsQr: true,
      deepLink: (url) => `https://api.atlassecure.ru/open/happ?url=${encodeURIComponent(url)}`,
      steps: [
        { text: "Откройте App Store на вашем iPhone или iPad. Найдите приложение «Happ — Proxy Utility» и нажмите «Загрузить». Дождитесь установки." },
        { text: "Скопируйте вашу ссылку подписки — она понадобится на следующем шаге.", copyKey: true },
        { text: "Откройте Happ. Нажмите «+» в нижней панели, затем выберите «Добавить подписку» или «Из буфера обмена». Конфигурация импортируется автоматически." },
        { text: "Выберите сервер и нажмите кнопку подключения. При первом подключении iOS попросит разрешить конфигурацию — нажмите «Разрешить»." },
        { text: "Когда в верхней части экрана появится значок подключения — соединение активно. Весь трафик защищён." },
      ],
    },
  ],
  windows: [
    {
      appId: "hiddify",
      appName: "Hiddify",
      appDesc: "Рекомендуемый клиент для Windows",
      storeLabel: "Скачать",
      downloadUrl: "https://github.com/hiddify/hiddify-app/releases",
      downloadLabel: "Скачать Hiddify",
      recommended: true,
      steps: [
        { text: "Перейдите на страницу загрузки и скачайте установочный файл Hiddify для Windows (файл с расширением .exe или Setup). Запустите установщик и следуйте инструкциям на экране." },
        { text: "Скопируйте вашу ссылку подписки — она понадобится на следующем шаге.", copyKey: true },
        { text: "Откройте Hiddify. На главном экране нажмите «Новый профиль», затем выберите «Добавить профиль из буфера обмена». Приложение автоматически распознает конфигурацию и добавит сервер." },
        { text: "На главном экране Hiddify нажмите большую кнопку подключения по центру. Дождитесь, пока статус изменится на «Подключено»." },
        { text: "Если Windows Firewall запросит разрешение — нажмите «Разрешить доступ». Готово! Соединение установлено." },
      ],
    },
    {
      appId: "happ",
      appName: "Happ",
      appDesc: "Универсальный клиент для Windows",
      storeLabel: "Скачать",
      downloadUrl: "https://www.happ.su/main",
      downloadLabel: "Скачать Happ",
      steps: [
        { text: "Перейдите на сайт happ.su и скачайте установочный файл Happ для Windows. Запустите установщик и следуйте инструкциям." },
        { text: "Скопируйте вашу ссылку подписки — она понадобится на следующем шаге.", copyKey: true },
        { text: "Откройте Happ. Нажмите «+» → «Добавить подписку» или «Из буфера обмена». Конфигурация импортируется автоматически." },
        { text: "Выберите сервер и нажмите кнопку подключения. Разрешите доступ в брандмауэре Windows при запросе." },
        { text: "Когда статус изменится на «Подключено» — защита активна." },
      ],
    },
  ],
  macos: [
    {
      appId: "hiddify",
      appName: "Hiddify",
      appDesc: "Рекомендуемый клиент для macOS",
      storeLabel: "Скачать",
      downloadUrl: "https://github.com/hiddify/hiddify-app/releases",
      downloadLabel: "Скачать Hiddify",
      recommended: true,
      steps: [
        { text: "Перейдите на страницу загрузки и скачайте Hiddify для macOS (файл .dmg). Откройте скачанный файл и перетащите Hiddify в папку «Программы» (Applications)." },
        { text: "Скопируйте вашу ссылку подписки — она понадобится на следующем шаге.", copyKey: true },
        { text: "Откройте Hiddify из «Программ» (Finder → Программы → Hiddify). При первом запуске macOS может потребовать подтверждение — нажмите «Открыть». На главном экране нажмите «Новый профиль» → «Добавить профиль из буфера обмена»." },
        { text: "Нажмите кнопку подключения на главном экране Hiddify. При первом запуске macOS попросит разрешить конфигурацию — введите пароль от Mac и нажмите «Разрешить»." },
        { text: "Когда в строке меню (вверху экрана) появится значок подключения — соединение активно. Весь трафик теперь защищён." },
      ],
    },
    {
      appId: "streisand",
      appName: "Streisand",
      appDesc: "Кроссплатформенный клиент",
      storeLabel: "App Store",
      downloadUrl: "https://apps.apple.com/app/streisand/id6450534064",
      downloadLabel: "Скачать Streisand",
      steps: [
        { text: "Откройте App Store на вашем Mac. Найдите приложение «Streisand» и нажмите «Загрузить». Дождитесь установки." },
        { text: "Скопируйте вашу ссылку подписки — она понадобится на следующем шаге.", copyKey: true },
        { text: "Откройте Streisand. На главном экране нажмите «+» в правом верхнем углу, затем выберите «Добавить из буфера обмена». Конфигурация сервера будет импортирована автоматически." },
        { text: "Выберите добавленный сервер и включите переключатель подключения. При первом подключении macOS попросит разрешить конфигурацию — введите пароль от Mac и нажмите «Разрешить»." },
        { text: "Когда в строке меню появится значок подключения — соединение активно. Весь трафик теперь защищён." },
      ],
    },
    {
      appId: "shadowrocket",
      appName: "Shadowrocket",
      appDesc: "Продвинутый клиент для Mac (платный)",
      storeLabel: "App Store",
      downloadUrl: "https://apps.apple.com/app/shadowrocket/id932747118",
      downloadLabel: "Скачать Shadowrocket",
      steps: [
        { text: "Откройте App Store на вашем Mac (требуется Apple Silicon — M1/M2/M3). Найдите приложение «Shadowrocket» (платное, ~$2.99), переключитесь на вкладку «Приложения для iPhone и iPad» и нажмите «Купить» → «Загрузить»." },
        { text: "Скопируйте вашу ссылку подписки — она понадобится на следующем шаге.", copyKey: true },
        { text: "Откройте Shadowrocket. На главном экране нажмите «+» в правом верхнем углу. В поле «Тип» выберите «Subscribe», вставьте скопированную ссылку в поле «URL» и нажмите «Готово». Сервер появится в списке." },
        { text: "Выберите добавленный сервер, нажав на него. Затем включите переключатель в верхней части экрана. При первом подключении macOS попросит разрешить конфигурацию — введите пароль от Mac и нажмите «Разрешить»." },
        { text: "Когда переключатель станет активным и в строке меню появится значок подключения — соединение установлено. Весь трафик теперь защищён." },
      ],
    },
    {
      appId: "happ",
      appName: "Happ",
      appDesc: "Универсальный клиент для macOS",
      storeLabel: "App Store",
      downloadUrl: "https://apps.apple.com/ru/app/happ-proxy-utility-plus/id6746188973",
      downloadLabel: "Скачать Happ",
      steps: [
        { text: "Откройте App Store на вашем Mac. Найдите приложение «Happ — Proxy Utility» и нажмите «Загрузить». Дождитесь установки." },
        { text: "Скопируйте вашу ссылку подписки — она понадобится на следующем шаге.", copyKey: true },
        { text: "Откройте Happ. Нажмите «+» → «Добавить подписку» или «Из буфера обмена». Конфигурация импортируется автоматически." },
        { text: "Выберите сервер и нажмите кнопку подключения. При первом запуске macOS попросит разрешить конфигурацию — введите пароль от Mac и нажмите «Разрешить»." },
        { text: "Когда в строке меню появится значок подключения — соединение активно. Весь трафик защищён." },
      ],
    },
  ],
  tv: [
    {
      appId: "hiddify",
      appName: "Hiddify",
      appDesc: "Рекомендуемый клиент для TV",
      storeLabel: "Google Play TV",
      downloadUrl: "https://play.google.com/store/apps/details?id=app.hiddify.com",
      downloadLabel: "Скачать Hiddify",
      recommended: true,
      steps: [
        { text: "На вашем Android TV или Google TV откройте Google Play Store. Найдите и установите приложение «Hiddify»." },
        { text: "На телефоне или компьютере скопируйте вашу ссылку подписки.", copyKey: true },
        { text: "Откройте Hiddify на TV. Выберите «Новый профиль» → «Добавить профиль вручную». Введите ссылку подписки с помощью экранной клавиатуры или используйте QR-код: на телефоне сформируйте QR-код из ссылки и покажите его экрану TV." },
        { text: "Выберите добавленный сервер и нажмите кнопку подключения пультом. Разрешите подключение, если система запросит." },
        { text: "Когда статус изменится на «Подключено» — защита активна на вашем телевизоре." },
      ],
    },
    {
      appId: "v2raytun",
      appName: "V2RayTun",
      appDesc: "Простой клиент для TV",
      storeLabel: "Google Play TV",
      downloadUrl: "https://play.google.com/store/apps/details?id=com.v2raytun.android",
      downloadLabel: "Скачать V2RayTun",
      steps: [
        { text: "На вашем Android TV или Google TV откройте Google Play Store. Найдите и установите приложение «V2RayTun»." },
        { text: "На телефоне или компьютере скопируйте вашу ссылку подписки.", copyKey: true },
        { text: "Откройте V2RayTun на TV. Нажмите «+» или «Импорт» и введите ссылку подписки с помощью экранной клавиатуры, или используйте QR-код с телефона." },
        { text: "Выберите добавленный сервер и нажмите кнопку подключения пультом. Разрешите подключение, если система запросит." },
        { text: "Когда статус изменится на «Подключено» — защита активна на вашем телевизоре." },
      ],
    },
  ],
};

function InstructionCard({ platform, vpnKey, onCopyKey, copiedKey }: InstructionCardProps) {
  const apps = platformApps[platform];
  if (!apps || apps.length === 0) return null;

  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const info = selectedAppId ? apps.find((a) => a.appId === selectedAppId) : null;

  return (
    <div className="space-y-3">
      {/* App Selector Bar */}
      <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-5 animate-fade-in-up">
        <p className="text-xs text-muted mb-3 font-medium">Нажмите на кнопку с нужным приложением-клиентом для инструкции:</p>
        <div className="flex gap-2 flex-wrap">
          {apps.map((app, i) => (
            <button
              key={app.appId}
              onClick={() => setSelectedAppId(selectedAppId === app.appId ? null : app.appId)}
              style={{ animationDelay: `${i * 0.07}s` }}
              className={`h-10 sm:h-11 px-4 sm:px-5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 btn-press border animate-fade-in-up ${
                selectedAppId === app.appId
                  ? "bg-primary/15 border-primary/40 text-primary shadow-sm shadow-primary/10"
                  : "bg-background border-border hover:bg-card-hover hover:border-border/80"
              }`}
            >
              {app.appName}
              {app.recommended && (
                <span className={`ml-1.5 text-[10px] transition-colors duration-300 ${selectedAppId === app.appId ? "text-primary/60" : "text-muted/50"}`}>
                  {selectedAppId === app.appId ? "" : "*"}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Instruction Panel — shown only after app selected */}
      {info && (
        <div key={info.appId} className="bg-card border border-primary/20 rounded-2xl overflow-hidden animate-fade-in-up">
          {/* App Header */}
          <div className="bg-primary/10 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm sm:text-base">{info.appName}</h3>
                <p className="text-xs sm:text-sm text-muted">{info.appDesc}</p>
              </div>
              <span className="text-[10px] sm:text-xs bg-primary/20 text-primary px-2.5 py-1 rounded-full font-medium shrink-0 ml-2">
                {info.storeLabel}
              </span>
            </div>
          </div>

          {/* Steps */}
          <div className="px-4 sm:px-5 py-4 sm:py-5 space-y-4">
            {info.steps.map((step, i) => (
              <div
                key={i}
                style={{ animationDelay: `${i * 0.08}s` }}
                className="animate-fade-in-up opacity-0"
              >
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs sm:text-sm font-bold text-primary">{i + 1}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-light leading-relaxed pt-0.5">{step.text}</p>
                </div>

                {/* Download button after step 1 */}
                {i === 0 && (
                  <a
                    href={info.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-11 sm:h-12 rounded-xl font-medium text-sm sm:text-base transition-all duration-200 btn-press flex items-center justify-center gap-2 bg-foreground text-background hover:bg-foreground/90 mt-3"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    {info.downloadLabel}
                  </a>
                )}

                {/* Auto-configure + Copy key */}
                {step.copyKey && vpnKey && (
                  <>
                    {info.deepLink && (
                      <a
                        href={info.deepLink(vpnKey)}
                        className="w-full h-11 sm:h-12 rounded-xl font-medium text-sm sm:text-base transition-all duration-200 btn-press flex items-center justify-center gap-2 mt-3 bg-primary text-white hover:bg-primary-hover"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14" />
                          <path d="M12 5l7 7-7 7" />
                        </svg>
                        Настроить автоматически
                      </a>
                    )}

                    <button
                      onClick={onCopyKey}
                      className={`w-full h-11 sm:h-12 rounded-xl font-medium text-sm sm:text-base transition-all duration-200 btn-press flex items-center justify-center gap-2 mt-2 ${
                        copiedKey
                          ? "bg-success/20 text-success border border-success/30"
                          : "border border-border text-foreground hover:bg-card-hover"
                      }`}
                    >
                      {copiedKey ? (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Скопировано!
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                          </svg>
                          Скопировать ключ вручную
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* QR Code Section */}
          {info.supportsQr && vpnKey && (
            <div className="px-4 sm:px-5 pb-4 sm:pb-5">
              <button
                onClick={() => setShowQr(!showQr)}
                className="w-full h-11 sm:h-12 rounded-xl font-medium text-sm sm:text-base transition-all duration-200 btn-press flex items-center justify-center gap-2.5 border border-border hover:bg-card-hover"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="3" height="3" />
                  <line x1="21" y1="14" x2="21" y2="14.01" />
                  <line x1="21" y1="21" x2="21" y2="21.01" />
                  <line x1="17" y1="18" x2="17" y2="18.01" />
                </svg>
                {showQr ? "Скрыть QR-код" : "Добавить другое устройство по QR"}
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  className={`transition-transform duration-300 ${showQr ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ease-out ${
                  showQr ? "max-h-[500px] opacity-100 mt-3" : "max-h-0 opacity-0 mt-0"
                }`}
              >
                <div className="bg-background border border-border/50 rounded-2xl p-5 sm:p-6 flex flex-col items-center gap-4">
                  <p className="text-xs sm:text-sm text-muted text-center leading-relaxed">
                    Отсканируйте этот QR-код камерой или из приложения на другом устройстве, чтобы импортировать подписку
                  </p>
                  <div className="bg-white p-3 sm:p-4 rounded-2xl">
                    <QRCodeSVG
                      value={vpnKey}
                      size={180}
                      level="M"
                      bgColor="#ffffff"
                      fgColor="#000000"
                    />
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-muted/50 text-center">
                    В приложении: «+» → «Сканировать QR-код» или «Импорт из QR»
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
