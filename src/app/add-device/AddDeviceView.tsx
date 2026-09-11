"use client";

import { useState, useEffect, useCallback, useRef, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import Icon, { type IconName } from "@/components/pixel/Icon";
import { DEVICE_LIMIT } from "@/lib/plans";
import { plural } from "@/lib/ru-words";
import "@/app/work-atlas.css";
import "./add-device-atlas.css";

/**
 * /add-device — лист 23 «Атлас-издания», рабочий экран на классах
 * кабинета (work-atlas.css, ak-*). Своё — add-device-atlas.css, aad-*.
 *
 * Логика прежнего экрана перенесена один в один: три шага
 * platform → app → instruction (шаг app — только если у платформы
 * больше одного приложения), APPS со ссылками и форматом json, ссылка
 * ключа с `format=json` для Happ, QR с той же ссылкой, копирование с
 * запасным путём через textarea, «Назад» с платформы и «Готово» — в
 * кабинет. Запрос один: /api/user/subscription, ошибка — молча.
 *
 * Что добавлено для удобства (без новых запросов и переходов):
 *   · пилюли шагов — пройденные нажимаются и возвращают на свой шаг;
 *   · подсказка платформы по userAgent — только подсказка с кнопкой
 *     «Да», молча ничего не выбирается;
 *   · на телефоне первым идёт действие (установить, скопировать), QR —
 *     последним и подписан «для другого устройства»; на широком экране
 *     QR крупно слева и сразу;
 *   · при смене шага фокус и прокрутка — на заголовок шага.
 *
 * Панели появляются при входе в кадр (MotionController ставит data-seen
 * на [data-sheet], панели нового шага подхватывает MutationObserver).
 * Всё движение — add-device-atlas.css, раздел «Движение».
 */

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
// Ссылки и форматы — как были. В текстах «код ниже» заменено на «код на
// этой странице»: на широком экране QR стоит слева, а не ниже.

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
        qrHint: "Откройте Happ → нажмите «+» → «Сканировать QR-код» → наведите камеру на этот код",
        steps: [
          "Откройте приложение Happ на iPhone или iPad",
          "Нажмите «+» в нижней панели",
          "Выберите «Сканировать QR-код»",
          "Наведите камеру на QR-код на этой странице",
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
        qrHint: "Откройте Happ → нажмите «+» → «Сканировать QR-код» → наведите камеру на этот код",
        steps: [
          "Откройте приложение Happ на вашем Android",
          "Нажмите «+» в нижней панели",
          "Выберите «Сканировать QR-код»",
          "Наведите камеру на QR-код на этой странице",
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
        qrHint: "Откройте V2RayTun → нажмите «+» → «Сканировать QR» → наведите камеру на этот код",
        steps: [
          "Откройте приложение V2RayTun на Android",
          "Нажмите «+» в верхней панели",
          "Выберите «Сканировать QR-код»",
          "Наведите камеру на QR-код на этой странице",
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
        qrHint: "Откройте Happ → нажмите «+» → «Сканировать QR-код с экрана» → выделите этот QR-код",
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
        qrHint: "Откройте Happ → «+» → «Сканировать QR с экрана» → выделите этот QR-код",
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

const PLATFORMS: { id: Platform; name: string; detail: string; icon: IconName }[] = [
  { id: "ios",     name: "iPhone / iPad", detail: "iOS 16+",    icon: "iphone" },
  { id: "android", name: "Android",       detail: "10+",        icon: "android" },
  { id: "macos",   name: "macOS",         detail: "M1 / Intel", icon: "macos" },
  { id: "windows", name: "Windows",       detail: "10 / 11",    icon: "windows" },
  { id: "tv",      name: "Android TV",    detail: "Google TV",  icon: "tv" },
];

const DEVICE_WORD = plural(DEVICE_LIMIT, ["устройстве", "устройствах", "устройствах"]);

/** Подсказка по userAgent. Только подсказка: выбирает человек. */
function detectPlatform(): Platform | null {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  // iPadOS 13+ представляется Mac'ом, но с сенсорным экраном.
  if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return "ios";
  if (/Android/i.test(ua)) return /\bTV\b|AFT|BRAVIA|SMART-TV|GoogleTV/i.test(ua) ? "tv" : "android";
  if (/Macintosh|Mac OS X/i.test(ua)) return "macos";
  if (/Windows/i.test(ua)) return "windows";
  return null;
}

const at = (i: number) => ({ "--i": i }) as CSSProperties;
const k = (n: number) => ({ "--k": n }) as CSSProperties;

// ─── Main Component ─────────────────────────────────────────

export default function AddDeviceView() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("platform");
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [appIndex, setAppIndex] = useState(0);
  const [vpnKey, setVpnKey] = useState<string | null>(null);
  const [keyLoaded, setKeyLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [detected, setDetected] = useState<Platform | null>(null);
  const headRef = useRef<HTMLHeadingElement>(null);
  const pillsRef = useRef<HTMLOListElement>(null);
  const firstStep = useRef(true);

  const fetchKey = useCallback(async () => {
    try {
      const res = await fetch("/api/user/subscription");
      const r = await res.json();
      if (r.success && r.data.vpnKey) setVpnKey(r.data.vpnKey);
    } catch { /* silent */ }
    finally { setKeyLoaded(true); }
  }, []);

  useEffect(() => { fetchKey(); }, [fetchKey]);
  useEffect(() => { setDetected(detectPlatform()); }, []);

  // Смена шага: глаз и чтец экрана — на заголовок нового шага.
  useEffect(() => {
    if (firstStep.current) { firstStep.current = false; return; }
    const still =
      document.documentElement.hasAttribute("data-static") ||
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: still ? "auto" : "smooth" });
    headRef.current?.focus({ preventScroll: true });
    // Телефон: ряд пилюль листается вбок — текущий шаг в кадре.
    const row = pillsRef.current;
    const now = row?.querySelector<HTMLElement>('[data-state="now"]');
    if (row && now) row.scrollLeft = Math.max(0, now.offsetLeft - row.offsetLeft - 8);
  }, [step]);

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

  const stepNo = step === "platform" ? 1 : step === "app" ? 2 : 3;
  const platformMeta = PLATFORMS.find((p) => p.id === platform) ?? null;
  const detectedMeta = PLATFORMS.find((p) => p.id === detected) ?? null;
  const keyUrl = step === "instruction" ? getKeyUrl() : null;

  const title =
    step === "platform" ? "На каком устройстве?"
    : step === "app"    ? "В какое приложение?"
    :                     currentApp?.instructions.title ?? "";

  // Пилюли шагов. Пройденный шаг нажимается — это тот же «Назад».
  // Шаг «Приложение» у платформы с одним приложением проходится сам.
  const singleApp = platform !== null && apps.length === 1;
  const pills: { n: number; label: string; state: "done" | "now" | "next"; go?: () => void }[] = [
    {
      n: 1,
      label: platformMeta && step !== "platform" ? platformMeta.name : "Устройство",
      state: step === "platform" ? "now" : "done",
      go: step !== "platform" ? () => setStep("platform") : undefined,
    },
    {
      n: 2,
      label: currentApp && step === "instruction" ? currentApp.name : "Приложение",
      state: step === "app" ? "now" : step === "instruction" ? "done" : "next",
      go: step === "instruction" && !singleApp ? () => setStep("app") : undefined,
    },
    { n: 3, label: "Подключение", state: step === "instruction" ? "now" : "next" },
  ];

  const keyStatus = !keyLoaded
    ? { tone: undefined, text: "Проверяем ключ" }
    : vpnKey
      ? { tone: undefined, text: "Ключ готов" }
      : { tone: "warn" as const, text: "Ключ не найден" };

  /** Правая плита шагов 1–2: что будет дальше и готов ли ключ. */
  const routeCard = (
    <section className="ak-card ak-dark aad-route" data-sheet="23" style={at(2)} aria-labelledby="aad-route-h">
      <div className="ak-card-head">
        <h2 id="aad-route-h" className="ak-eyebrow">Ваш ключ</h2>
        <span className="ak-status" data-tone={keyStatus.tone}><i />{keyStatus.text}</span>
      </div>
      <p className="ak-value aad-route-value">
        <span className="a-num">{DEVICE_LIMIT}</span>
        <small>{DEVICE_WORD} на одной подписке</small>
      </p>
      <ol className="aad-route-list">
        {["Выберите устройство", "Выберите приложение", "Добавьте ключ по QR-коду"].map((t, i) => (
          <li key={t} data-state={i + 1 < stepNo ? "done" : i + 1 === stepNo ? "now" : undefined} style={k(i)}>
            <span className="aad-route-n a-num" aria-hidden>{i + 1 < stepNo ? <Icon name="check" size={14} /> : i + 1}</span>
            {t}
          </li>
        ))}
      </ol>
      {keyLoaded && !vpnKey ? (
        <p className="ak-fine">Без ключа QR-кода не будет. Проверьте подписку в кабинете.</p>
      ) : (
        <p className="ak-fine">Одна ссылка на все устройства. Приложение бесплатное.</p>
      )}
      {keyLoaded && !vpnKey && (
        <div className="ak-actions">
          <Link href="/dashboard" className="a-btn ak-btn-soft">Открыть кабинет</Link>
        </div>
      )}
    </section>
  );

  return (
    <main id="main" className="a-main ak aad" data-step={step}>
      <div className="a-field">
        {/* ── Верх: шаг, заголовок, назад ─────────────────────────── */}
        <section className="ak-top aad-top" data-sheet="23" style={at(0)} aria-label="Новое устройство">
          <div className="aad-top-copy">
            <p className="ak-kicker a-wide">Новое устройство · шаг {stepNo} из 3</p>
            <h1 key={step + (currentApp?.id ?? "")} ref={headRef} tabIndex={-1} className="ak-h1 aad-h1">
              {title}
            </h1>
          </div>
          <div className="ak-tools aad-tools">
            <button type="button" onClick={handleBack} className="a-btn ak-btn-soft aad-back">
              <Icon name="arrow-right" size={16} className="aad-back-ico" />
              Назад · {backLabel}
            </button>
          </div>
        </section>

        <div className="ak-board">
          {/* ── Пилюли шагов ──────────────────────────────────────── */}
          <nav className="ak-bar aad-bar" data-sheet="23" aria-label="Шаги подключения">
            <ol ref={pillsRef} className="ak-pills aad-pills">
              {pills.map((p) => (
                <li key={p.n} className="aad-pill-li">
                  {p.go ? (
                    <button type="button" className="ak-pill aad-pill" data-state={p.state} onClick={p.go}>
                      <span className="aad-pill-n" aria-hidden><Icon name="check" size={12} /></span>
                      {p.label}
                      <span className="b-sr"> — вернуться к шагу {p.n}</span>
                    </button>
                  ) : (
                    <span
                      className="ak-pill aad-pill"
                      data-state={p.state}
                      aria-current={p.state === "now" ? "step" : undefined}
                    >
                      <span className="aad-pill-n" aria-hidden>
                        {p.state === "done" ? <Icon name="check" size={12} /> : p.n}
                      </span>
                      {p.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
            <span className="ak-bar-plan a-num">Шаг {stepNo} из 3</span>
          </nav>

          {/* ── 1 · Устройство ───────────────────────────────────── */}
          {step === "platform" && (
            <div className="ak-grid aad-grid" key="platform">
              <section className="ak-card aad-pick" data-sheet="23" style={at(1)} aria-labelledby="aad-pick-h">
                <div className="ak-card-head">
                  <h2 id="aad-pick-h" className="ak-eyebrow">Устройство, которое подключаем</h2>
                </div>

                {detectedMeta && (
                  <div className="aad-hint">
                    <span className="aad-hint-ico"><Icon name={detectedMeta.icon} size={20} /></span>
                    <p className="aad-hint-text">
                      Похоже, у вас <b>{detectedMeta.name}</b>. Подключаем его?
                    </p>
                    <button
                      type="button"
                      className="a-btn a-btn-primary aad-hint-btn"
                      onClick={() => handleSelectPlatform(detectedMeta.id)}
                    >
                      Да, {detectedMeta.name}
                      <Icon name="arrow-right" size={16} />
                    </button>
                  </div>
                )}

                <ul className="aad-tiles">
                  {PLATFORMS.map((p, i) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        className="aad-tile"
                        style={k(i)}
                        data-hint={p.id === detected ? "" : undefined}
                        onClick={() => handleSelectPlatform(p.id)}
                      >
                        <span className="aad-tile-ico"><Icon name={p.icon} size={28} /></span>
                        <span className="aad-tile-copy">
                          <span className="aad-tile-name">{p.name}</span>
                          <span className="aad-tile-detail">
                            {p.id === detected ? "похоже, это оно · " : ""}{p.detail}
                          </span>
                        </span>
                        <Icon name="arrow-right" size={18} className="aad-tile-arrow" />
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="ak-fine">
                  Нет вашего устройства? <Link href="/support" className="aad-inline">Напишите нам</Link> — поможем.
                </p>
              </section>

              {routeCard}
            </div>
          )}

          {/* ── 2 · Приложение ───────────────────────────────────── */}
          {step === "app" && platform && (
            <div className="ak-grid aad-grid" key="app">
              <section className="ak-card aad-pick" data-sheet="23" style={at(1)} aria-labelledby="aad-app-h">
                <div className="ak-card-head">
                  <h2 id="aad-app-h" className="ak-eyebrow">Приложение для {platformMeta?.name}</h2>
                </div>
                <p className="ak-text aad-lead">
                  Подойдёт любое из них. Выберите одно — покажем, как добавить туда подписку.
                </p>
                <ul className="aad-apps">
                  {apps.map((app, i) => (
                    <li key={app.id}>
                      <button
                        type="button"
                        className="aad-app"
                        style={k(i)}
                        onClick={() => { setAppIndex(i); setStep("instruction"); }}
                      >
                        <span className="aad-app-mark" aria-hidden>{app.name[0]}</span>
                        <span className="aad-tile-copy">
                          <span className="aad-app-name">{app.name}</span>
                          <span className="aad-tile-detail">{app.storeLabel}</span>
                        </span>
                        <Icon name="arrow-right" size={18} className="aad-tile-arrow" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>

              {routeCard}
            </div>
          )}

          {/* ── 3 · Подключение ──────────────────────────────────── */}
          {step === "instruction" && currentApp && (
            <div
              className="ak-grid aad-grid aad-grid-go"
              key={`go-${currentApp.id}`}
              data-nokey={keyUrl ? undefined : ""}
            >
              {/* Действие: на телефоне — первым. */}
              <section className="ak-card ak-dark aad-act" data-sheet="23" style={at(1)} aria-labelledby="aad-act-h">
                <div className="ak-card-head">
                  <h2 id="aad-act-h" className="ak-eyebrow">
                    {platformMeta?.name} · {currentApp.name}
                  </h2>
                  {keyUrl ? (
                    <span className="ak-status"><i />Ключ готов</span>
                  ) : (
                    <span className="ak-status" data-tone="warn"><i />{keyLoaded ? "Ключ не найден" : "Проверяем ключ"}</span>
                  )}
                </div>

                <div className="aad-act-row">
                  <span className="aad-app-mark aad-app-mark-lg" aria-hidden>{currentApp.name[0]}</span>
                  <div>
                    <p className="ak-h3">Нет {currentApp.name}? Установите</p>
                    <p className="ak-fine">Приложение бесплатное · {currentApp.storeLabel}</p>
                  </div>
                </div>

                {keyUrl && (
                  <div className="ak-key-strip aad-key">
                    <span title={keyUrl}>{keyUrl}</span>
                    <span className="ak-key-dots" aria-hidden>
                      {[0, 1, 2, 3, 4].map((n) => <i key={n} style={k(n)} />)}
                    </span>
                  </div>
                )}

                {keyLoaded && !keyUrl && (
                  <p className="ak-fine">
                    Ключ подписки не найден — QR-кода не будет. Проверьте подписку в кабинете.
                  </p>
                )}

                <div className="ak-actions aad-act-btns">
                  <a
                    href={currentApp.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="a-btn a-btn-primary"
                  >
                    <Icon name="arrow-right" size={16} className="aad-down-ico" />
                    Установить {currentApp.name} · {currentApp.storeLabel}
                    <span className="b-sr"> (откроется в новой вкладке)</span>
                  </a>
                  {keyUrl && (
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="a-btn ak-btn-soft"
                      data-state={copied ? "ok" : undefined}
                    >
                      <Icon name={copied ? "check" : "copy"} size={16} />
                      {copied ? "Скопировано" : "Скопировать ключ"}
                    </button>
                  )}
                </div>
                <p className="b-sr" role="status" aria-live="polite">{copied ? "Ключ скопирован" : ""}</p>

                {keyUrl && (
                  <p className="ak-fine aad-only-m">
                    Настраиваете этот же телефон? QR-код с него не отсканировать — скопируйте ключ и
                    добавьте его в {currentApp.name} из буфера обмена.
                  </p>
                )}
                {keyUrl && (
                  <details className="aad-full">
                    <summary>Показать ключ целиком</summary>
                    <code>{keyUrl}</code>
                  </details>
                )}
              </section>

              {/* QR: на широком экране — крупно и сразу, на телефоне — в конце. */}
              {keyUrl && (
                <section className="ak-card aad-qrcard" data-sheet="23" style={at(2)} aria-labelledby="aad-qr-h">
                  <div className="ak-card-head">
                    <h2 id="aad-qr-h" className="ak-eyebrow">
                      <span className="aad-only-d">QR-код подписки</span>
                      <span className="aad-only-m">QR-код для другого устройства</span>
                    </h2>
                    <span className="aad-qr-tag"><Icon name="qr" size={14} />Импорт</span>
                  </div>
                  <p className="ak-text">{currentApp.instructions.qrHint}</p>
                  <div className="aad-qr-wrap">
                    <div className="ak-qr aad-qr">
                      <QRCodeSVG value={keyUrl} size={220} level="M" bgColor="#ffffff" fgColor="#000000" />
                      <span className="aad-qr-c" data-c="tl" aria-hidden />
                      <span className="aad-qr-c" data-c="tr" aria-hidden />
                      <span className="aad-qr-c" data-c="bl" aria-hidden />
                      <span className="aad-qr-c" data-c="br" aria-hidden />
                    </div>
                  </div>
                  <p className="ak-fine aad-qr-note">Код — это ваш ключ. Не показывайте его посторонним.</p>
                </section>
              )}

              {/* Шаги — крупно, по одному действию на строку. */}
              <section className="ak-card aad-steps" data-sheet="23" style={at(3)} aria-labelledby="aad-steps-h">
                <div className="ak-card-head">
                  <h2 id="aad-steps-h" className="ak-eyebrow">Как добавить подписку</h2>
                  <span className="ak-plan a-num">{currentApp.instructions.steps.length} шагов</span>
                </div>
                <ol className="aad-ol">
                  {currentApp.instructions.steps.map((s, i) => (
                    <li key={i} style={k(i)}>
                      <span className="aad-n a-num" aria-hidden>{i + 1}</span>
                      <span className="aad-ol-text">{s}</span>
                    </li>
                  ))}
                </ol>
                <div className="ak-actions">
                  <button type="button" onClick={() => router.push("/dashboard")} className="a-btn a-btn-primary aad-done">
                    <Icon name="check" size={16} />
                    Готово — вернуться в кабинет
                  </button>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
