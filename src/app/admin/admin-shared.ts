/**
 * Общие для админки типы, подписи и форматирование.
 *
 * Формы ответов повторяют route-файлы src/app/api/admin/** один в один —
 * при правке API правится и этот файл. Даты показываются по Москве:
 * админ и поддержка работают по одному времени, где бы ни стоял сервер.
 */

import { formatRub } from "@/lib/plans";
import { plural } from "@/lib/locations";

/* ─── Пользователи: GET /api/admin/users ─────────────────────────── */

export interface UserInfo {
  id: string;
  email: string;
  createdAt: string;
  subscriptionEnd: string;
  subscriptionPlan: string;
  telegramLinked: boolean;
  registrationIp: string | null;
  accountsOnIp: number;
  referrals: number;
  paidReferrals: number;
  isActive: boolean;
  publicId: string | null;
  panelId: string | null;
  panelUsername: string | null;
  remnawaveUserUuid: string | null;
  subscriptionUrl: string | null;
  happCryptoLink: string | null;
}

export interface UsersStats {
  total: number;
  active: number;
  expired: number;
  telegramLinked: number;
}

export interface AuditLogItem {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  details: string | null;
  ip: string | null;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  target: string;
  createdAt: string;
}

/* ─── Сводка: GET /api/admin/overview ────────────────────────────── */

export type BlockErr = { error: string };
export type Unwrapped<T> = { ok: true; data: T } | { ok: false; error: string };

export interface PanelNodeInfo {
  uuid: string;
  name: string;
  address: string | null;
  countryCode: string | null;
  isConnected: boolean;
  isDisabled: boolean;
  isConnecting: boolean;
  lastStatusMessage: string | null;
  usersOnline: number | null;
  trafficUsedBytes: number | null;
  xrayUptime: string | number | null;
  versions: { xray: string | null; node: string | null } | null;
}

export type TagBlock = { total: number; byStatus: Record<string, number>; onlineLast5m: number; truncated: boolean } | BlockErr;

export interface OverviewPanel {
  reachable: boolean;
  latencyMs: number;
  health: Unwrapped<Record<string, unknown>>;
  stats: Unwrapped<Record<string, unknown>>;
  bandwidth: Unwrapped<Record<string, unknown>>;
  nodes:
    | { ok: true; total: number; connected: number; disabled: number; usersOnline: number; list: PanelNodeInfo[] }
    | { ok: false; error: string };
  siteUsersByTag: Record<string, TagBlock>;
}

export interface OverviewDb {
  latencyMs: number;
  pool: { total: number; idle: number; waiting: number };
}

export interface SyncErrorRow {
  id: string;
  email: string;
  public_id: string | null;
  panel_sync_error: string | null;
  panel_sync_attempts: number | null;
  panel_next_sync_at: string | null;
}

export interface OverviewSync {
  byState: Record<string, number>;
  oldestQueuedAt: string | null;
  lastSuccessfulSyncAt: string | null;
  recentErrors: SyncErrorRow[];
}

export interface OverviewRevenue {
  gross: { today: number; d7: number; d30: number; all_time: number; count30: number };
  refunds30d: { n: number; amount: number };
  byPlan30d: Array<{ plan: string; period: number; n: number; amount: number }>;
  currency: string;
}

export interface OverviewFunnel {
  trials30d: number;
  trialsConverted30d: number;
  trialConversionRate: number | null;
  renewals30d: number;
  users: { total: number; live: number; live_trial: number; live_paid: number; expired_7d: number; expired_30d: number; new_7d: number };
  note: string;
}

export interface Overview {
  generatedAt: string;
  panel: OverviewPanel | BlockErr;
  db: OverviewDb | BlockErr;
  sync: OverviewSync | BlockErr;
  revenue: OverviewRevenue | BlockErr;
  funnel: OverviewFunnel | BlockErr;
  ledger30d: Record<string, number> | BlockErr;
}

/** Блок сводки упал целиком (Promise.allSettled → { error }). */
export function isErr(v: unknown): v is BlockErr {
  return !!v && typeof v === "object" && typeof (v as { error?: unknown }).error === "string";
}

/** Одна точка истории замеров, копится с каждым обновлением сводки. */
export interface Probe {
  t: number;
  panel: number | null;
  db: number | null;
}

/* ─── Тоны ───────────────────────────────────────────────────────── */

/** ok — кобальт (успех показывается набором, зелёного в корпусе нет). */
export type Tone = "ok" | "warn" | "off" | "idle";

export const TONE_WORD: Record<Tone, string> = {
  ok: "Работает",
  warn: "Внимание",
  off: "Сбой",
  idle: "Нет данных",
};

export function worst(...tones: Tone[]): Tone {
  if (tones.includes("off")) return "off";
  if (tones.includes("warn")) return "warn";
  if (tones.every((t) => t === "idle")) return "idle";
  return "ok";
}

/* ─── Подписи ────────────────────────────────────────────────────── */

export const PLAN_LABELS: Record<string, string> = {
  trial: "Пробный",
  basic: "Basic",
  plus: "Plus",
  expired: "Истёк",
};

/** Тон метки тарифа: Basic — кобальт, Plus — чернила, истёк — красный. */
export function planTone(planKey: string): "ink" | "off" | "mute" | undefined {
  if (planKey === "plus") return "ink";
  if (planKey === "expired") return "off";
  if (planKey === "basic") return undefined;
  return "mute";
}

export const ACTION_LABELS: Record<string, { label: string; tone?: "warn" | "off" | "ink" | "mute" }> = {
  "user.register": { label: "Регистрация" },
  "user.login": { label: "Вход", tone: "mute" },
  "payment.success": { label: "Оплата", tone: "ink" },
  "payment.canceled": { label: "Оплата отменена", tone: "off" },
  "payment.refunded": { label: "Возврат", tone: "off" },
  "admin.grant": { label: "Выдача подписки" },
  "admin.revoke": { label: "Отзыв подписки", tone: "off" },
  "admin.regen": { label: "Новая ссылка", tone: "warn" },
  "telegram.link": { label: "Telegram привязан", tone: "mute" },
  "telegram.unlink": { label: "Telegram отвязан", tone: "mute" },
  "sync.overwrite": { label: "Перезапись ботом", tone: "warn" },
  "bot_sync.enabled": { label: "Бот включён", tone: "mute" },
  "bot_sync.disabled": { label: "Бот выключен", tone: "warn" },
};

export const LEDGER_LABELS: Record<string, string> = {
  trial: "Пробный период",
  payment: "Оплата",
  admin_grant: "Выдано вручную",
  admin_revoke: "Отозвано вручную",
  telegram_bonus: "Бонус за Telegram",
  bot_extend: "Продление ботом",
  bot_overwrite: "Перезапись ботом",
  refund: "Возврат",
  ghost_repair_manual: "Правка даты",
};

export const SYNC_STATE_LABELS: Record<string, string> = {
  ok: "Сверено",
  pending: "Ждут отправки",
  error: "С ошибкой",
};

/* ─── Форматирование ─────────────────────────────────────────────── */

const TZ = "Europe/Moscow";

export const formatDate = (d: string | number | Date) =>
  new Date(d).toLocaleDateString("ru-RU", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" });

export const formatDateTime = (d: string | number | Date) =>
  new Date(d).toLocaleString("ru-RU", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export const formatShort = (d: string | number | Date) =>
  new Date(d).toLocaleString("ru-RU", { timeZone: TZ, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export const formatClock = (d: string | number | Date) =>
  new Date(d).toLocaleTimeString("ru-RU", { timeZone: TZ, hour: "2-digit", minute: "2-digit", second: "2-digit" });

/** Рубли без копеек: суммы в сводке — ориентир, не бухгалтерия. */
export const money = (n: number | null | undefined) => `${formatRub(Math.round(Number(n) || 0))} ₽`;

export const num = (n: number | null | undefined) => (Number(n) || 0).toLocaleString("ru-RU");

export const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0);

/** Доля строкой по-русски: «53,9 %». */
export const pcs = (part: number, whole: number) => `${pct(part, whole).toLocaleString("ru-RU")} %`;

export function bytes(n: number | null | undefined): string {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return "0 Б";
  const units = ["Б", "КБ", "МБ", "ГБ", "ТБ", "ПБ"];
  const k = Math.min(units.length - 1, Math.floor(Math.log(v) / Math.log(1024)));
  const x = v / 1024 ** k;
  return `${x.toLocaleString("ru-RU", { maximumFractionDigits: x < 10 ? 1 : 0 })} ${units[k]}`;
}

/** «5 мин назад», «3 ч назад», «2 дн назад». */
export function ago(d: string | number | Date | null | undefined, now = Date.now()): string {
  if (!d) return "—";
  const ms = now - new Date(d).getTime();
  if (!Number.isFinite(ms)) return "—";
  if (ms < 0) return `через ${span(-ms)}`;
  if (ms < 45_000) return "только что";
  return `${span(ms)} назад`;
}

/** Длительность: «12 мин», «3 ч 20 мин», «4 дн 2 ч». */
export function span(ms: number): string {
  const min = Math.max(0, Math.floor(ms / 60000));
  if (min < 60) return `${min} мин`;
  const h = Math.floor(min / 60);
  if (h < 24) return min % 60 ? `${h} ч ${min % 60} мин` : `${h} ч`;
  const d = Math.floor(h / 24);
  return h % 24 && d < 10 ? `${d} дн ${h % 24} ч` : `${d} дн`;
}

/** Осталось до конца подписки — словами, для карточки пользователя. */
export function leftWords(end: string, now = Date.now()): string {
  const ms = new Date(end).getTime() - now;
  if (ms <= 0) return "Истекла";
  const days = Math.floor(ms / 864e5);
  if (days >= 1) {
    const h = Math.floor((ms % 864e5) / 36e5);
    return `${days} ${plural(days, ["день", "дня", "дней"])}${days < 10 && h ? ` ${h} ч` : ""}`;
  }
  return span(ms);
}

export const daysLeft = (end: string, now = Date.now()) => Math.ceil((new Date(end).getTime() - now) / 864e5);

export { plural };

/* ─── Безопасное чтение ответов панели (формы из Remnawave 3.4.3) ── */

export function pick(obj: unknown, path: string): unknown {
  let cur: unknown = obj;
  for (const k of path.split(".")) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[k];
  }
  return cur;
}

export const pickNum = (obj: unknown, path: string): number | null => {
  const v = pick(obj, path);
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
};

export const pickStr = (obj: unknown, path: string): string | null => {
  const v = pick(obj, path);
  return typeof v === "string" ? v : typeof v === "number" ? String(v) : null;
};

/** fetch + JSON, который не падает на HTML-странице ошибки сервера. */
export async function getJson<T = unknown>(
  url: string,
  init?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; error: string; status: number }> {
  try {
    const res = await fetch(url, init);
    const raw = await res.text();
    let json: { success?: boolean; data?: T; error?: string } | null = null;
    try {
      json = raw ? JSON.parse(raw) : null;
    } catch {
      json = null;
    }
    if (json?.success) return { ok: true, data: json.data as T };
    return { ok: false, status: res.status, error: json?.error || `Сервер ответил ${res.status}` };
  } catch {
    return { ok: false, status: 0, error: "Нет связи с сервером" };
  }
}

export const postJson = <T = unknown>(url: string, body?: unknown) =>
  getJson<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
