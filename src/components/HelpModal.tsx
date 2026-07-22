"use client";

import { useState } from "react";

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

type Platform = "android" | "ios" | "windows" | "macos" | "tv" | "huawei" | null;

const platforms: { id: Platform; label: string; icon: string }[] = [
  { id: "android", label: "Android", icon: "android" },
  { id: "ios", label: "iPhone / iPad", icon: "ios" },
  { id: "windows", label: "Windows", icon: "windows" },
  { id: "macos", label: "macOS", icon: "macos" },
  { id: "tv", label: "Android TV", icon: "tv" },
  { id: "huawei", label: "Huawei", icon: "huawei" },
];

interface AppInfo {
  name: string;
  desc: string;
  url: string;
  urlLabel: string;
  steps: string[];
}

const instructions: Record<string, { title: string; apps: AppInfo[] }> = {
  android: {
    title: "Настройка на Android (телефон/планшет)",
    apps: [
      {
        name: "V2RayTun",
        desc: "Простой и надёжный клиент",
        url: "https://play.google.com/store/apps/details?id=com.v2raytun.android",
        urlLabel: "Скачать из Google Play",
        steps: [
          "Скачайте V2RayTun из Google Play",
          "Откройте приложение и нажмите «+» в правом нижнем углу",
          "Выберите «Импортировать из буфера обмена»",
          "Скопируйте ваш ключ на странице «Устройства» и вернитесь в приложение",
          "Нажмите на кнопку подключения (▶) внизу экрана",
          "Разрешите создание подключения во всплывающем окне",
        ],
      },
      {
        name: "Hiddify",
        desc: "Расширенный клиент с множеством настроек",
        url: "https://play.google.com/store/apps/details?id=app.hiddify.com",
        urlLabel: "Скачать из Google Play",
        steps: [
          "Скачайте Hiddify из Google Play",
          "Откройте приложение → нажмите «Новый профиль»",
          "Выберите «Добавить из буфера обмена»",
          "Скопируйте ваш ключ на странице «Устройства»",
          "Нажмите кнопку подключения в центре экрана",
          "Разрешите создание подключения",
        ],
      },
    ],
  },
  ios: {
    title: "Настройка на iPhone / iPad",
    apps: [
      {
        name: "Streisand",
        desc: "Лучшее приложение для iOS",
        url: "https://apps.apple.com/app/streisand/id6450534064",
        urlLabel: "Скачать из App Store",
        steps: [
          "Скачайте Streisand из App Store",
          "Откройте приложение и нажмите «+» в правом верхнем углу",
          "Выберите «Добавить из буфера обмена»",
          "Скопируйте ваш ключ на странице «Устройства»",
          "Вернитесь в Streisand — профиль появится автоматически",
          "Включите подключение переключателем на главном экране",
          "Разрешите добавление конфигурации в настройках iOS",
        ],
      },
      {
        name: "V2RayTun",
        desc: "Альтернативное приложение для iOS",
        url: "https://apps.apple.com/app/v2raytun/id6476628951",
        urlLabel: "Скачать из App Store",
        steps: [
          "Скачайте V2RayTun из App Store",
          "Откройте приложение и нажмите «+»",
          "Выберите «Импортировать из буфера»",
          "Скопируйте ваш ключ и вернитесь в приложение",
          "Нажмите на кнопку подключения",
          "Разрешите конфигурацию при появлении запроса",
        ],
      },
    ],
  },
  windows: {
    title: "Настройка на ноутбуке / ПК (Windows)",
    apps: [
      {
        name: "Hiddify",
        desc: "Рекомендуемое приложение для Windows",
        url: "https://github.com/hiddify/hiddify-app/releases/latest",
        urlLabel: "Скачать с GitHub",
        steps: [
          "Скачайте Hiddify с официальной страницы (файл .exe для Windows)",
          "Установите приложение, следуя инструкциям установщика",
          "Откройте Hiddify и нажмите «Новый профиль»",
          "Выберите «Добавить из буфера обмена»",
          "Скопируйте ваш ключ на странице «Устройства» и вернитесь в Hiddify",
          "Нажмите кнопку подключения в центре экрана",
          "При запросе брандмауэра Windows — нажмите «Разрешить»",
        ],
      },
      {
        name: "V2RayN",
        desc: "Лёгкое приложение для продвинутых пользователей",
        url: "https://github.com/2dust/v2rayN/releases/latest",
        urlLabel: "Скачать с GitHub",
        steps: [
          "Скачайте V2RayN с GitHub (файл v2rayN-windows.zip)",
          "Распакуйте архив в удобную папку и запустите v2rayN.exe",
          "В трее (возле часов) кликните правой кнопкой на иконку V2RayN",
          "Выберите «Добавить сервер» → «Импорт из буфера обмена»",
          "Скопируйте ваш ключ на странице «Устройства»",
          "Кликните правой кнопкой на иконку в трее → «Системный прокси» → «Авто»",
        ],
      },
    ],
  },
  macos: {
    title: "Настройка на macOS",
    apps: [
      {
        name: "Hiddify",
        desc: "Рекомендуемое приложение для macOS",
        url: "https://github.com/hiddify/hiddify-app/releases/latest",
        urlLabel: "Скачать с GitHub",
        steps: [
          "Скачайте Hiddify с официальной страницы (файл .dmg для macOS)",
          "Откройте .dmg файл и перетащите Hiddify в папку Applications",
          "Запустите Hiddify из Launchpad или папки Applications",
          "Нажмите «Новый профиль» → «Добавить из буфера обмена»",
          "Скопируйте ваш ключ на странице «Устройства»",
          "Нажмите кнопку подключения",
          "Разрешите установку конфигурации при появлении запроса macOS",
        ],
      },
      {
        name: "Streisand",
        desc: "Альтернативный клиент (App Store)",
        url: "https://apps.apple.com/app/streisand/id6450534064",
        urlLabel: "Скачать из App Store",
        steps: [
          "Скачайте Streisand из Mac App Store",
          "Откройте приложение и нажмите «+»",
          "Выберите «Добавить из буфера обмена»",
          "Скопируйте ваш ключ и вернитесь в приложение",
          "Включите подключение переключателем",
        ],
      },
    ],
  },
  tv: {
    title: "Настройка на Android TV / Google TV",
    apps: [
      {
        name: "V2RayTun",
        desc: "Рекомендуемое приложение для ТВ",
        url: "https://play.google.com/store/apps/details?id=com.v2raytun.android",
        urlLabel: "Скачать из Google Play на ТВ",
        steps: [
          "На телевизоре откройте Google Play Store",
          "Найдите и установите приложение «V2RayTun»",
          "Если приложения нет в TV-версии Google Play — скачайте APK через браузер на ТВ или установите через флешку",
          "Откройте V2RayTun на ТВ",
          "На телефоне: откройте Atlas Secure → «Устройства» → скопируйте ключ",
          "На ТВ: нажмите «+» → «Ручной ввод» и введите данные, или используйте способ ниже",
          "Быстрый способ: отправьте ключ себе в Telegram на телефоне, откройте Telegram на ТВ и скопируйте ключ оттуда",
          "Нажмите кнопку подключения (▶) и разрешите соединение",
        ],
      },
      {
        name: "Hiddify (через APK)",
        desc: "Альтернатива через установку APK",
        url: "https://github.com/hiddify/hiddify-app/releases/latest",
        urlLabel: "Скачать APK с GitHub",
        steps: [
          "Скачайте Hiddify APK с GitHub на флешку или через браузер ТВ",
          "В настройках ТВ разрешите установку из неизвестных источников",
          "Установите APK через файловый менеджер",
          "Откройте Hiddify → «Новый профиль» → введите ключ вручную",
          "Совет: отправьте ключ через Telegram и скопируйте на ТВ",
          "Нажмите кнопку подключения",
        ],
      },
    ],
  },
  huawei: {
    title: "Настройка на Huawei (без Google Play)",
    apps: [
      {
        name: "V2RayTun",
        desc: "Доступен в AppGallery",
        url: "https://appgallery.huawei.com/app/C107584337",
        urlLabel: "Скачать из AppGallery",
        steps: [
          "Откройте AppGallery на вашем Huawei устройстве",
          "Найдите «V2RayTun» в поиске и установите",
          "Если приложение не найдено — скачайте APK напрямую с сайта",
          "Откройте V2RayTun и нажмите «+»",
          "Выберите «Импортировать из буфера обмена»",
          "Скопируйте ваш ключ на странице «Устройства» в Atlas Secure",
          "Нажмите кнопку подключения (▶)",
          "Разрешите создание подключения",
        ],
      },
      {
        name: "Hiddify (APK)",
        desc: "Установка через APK файл",
        url: "https://github.com/hiddify/hiddify-app/releases/latest",
        urlLabel: "Скачать APK с GitHub",
        steps: [
          "Скачайте Hiddify APK файл с GitHub через браузер",
          "В настройках → «Безопасность» → включите «Установка из неизвестных источников» для браузера",
          "Откройте скачанный файл и установите приложение",
          "Откройте Hiddify → «Новый профиль» → «Добавить из буфера обмена»",
          "Скопируйте ваш ключ и вернитесь в Hiddify",
          "Нажмите кнопку подключения",
        ],
      },
    ],
  },
};

function PlatformIcon({ id, size = 20 }: { id: string; size?: number }) {
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
    case "macos":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
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
    case "huawei":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
      );
    default:
      return null;
  }
}

export default function HelpModal({ open, onClose }: HelpModalProps) {
  const [selected, setSelected] = useState<Platform>(null);

  if (!open) return null;

  const info = selected ? instructions[selected] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-card border border-border/50 rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[85dvh] overflow-hidden animate-scale-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-2">
            {selected && (
              <button
                onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-card-hover transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            )}
            <h2 className="font-bold text-base sm:text-lg">
              {selected ? info?.title : "Как подключиться"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-card-hover transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-5">
          {!selected ? (
            <div className="space-y-3">
              <p className="text-muted text-sm mb-4">Выберите ваше устройство:</p>
              <div className="grid grid-cols-2 gap-2.5">
                {platforms.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelected(p.id)}
                    className="h-14 rounded-xl bg-card-hover border border-border hover:border-primary/40 hover:bg-primary/10 transition-all btn-press flex items-center justify-center gap-2.5 text-sm font-medium"
                  >
                    <PlatformIcon id={p.icon} size={18} />
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="mt-5 bg-primary/10 border border-primary/20 rounded-xl p-3.5">
                <p className="text-xs sm:text-sm text-muted leading-relaxed">
                  <b className="text-foreground">Совет:</b> Скопируйте ваш ключ на странице «Устройства» перед установкой приложения. После установки просто вставьте ключ из буфера обмена.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {info?.apps.map((app, appIdx) => (
                <div key={appIdx} className="bg-background border border-border/50 rounded-xl overflow-hidden">
                  {/* App header */}
                  <div className="bg-primary/8 px-4 py-3 border-b border-border/30">
                    <h3 className="font-bold text-sm sm:text-base">{app.name}</h3>
                    <p className="text-xs text-muted">{app.desc}</p>
                  </div>

                  {/* Steps */}
                  <div className="px-4 py-3 space-y-2.5">
                    {app.steps.map((step, i) => (
                      <div key={i} className="flex gap-2.5 items-start">
                        <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-light leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>

                  {/* Download */}
                  <div className="px-4 pb-3">
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-10 rounded-lg bg-foreground text-background font-medium text-sm transition-all btn-press flex items-center justify-center gap-2 hover:bg-foreground/90"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      {app.urlLabel}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
