"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import Icon, { type IconName } from "@/components/pixel/Icon";
import { DEVICE_LIMIT } from "@/lib/plans";
import { useAdminConfirm, useAdminToast, Spin } from "./AdminConfirm";
import {
  ACTION_LABELS,
  PLAN_LABELS,
  ago,
  formatDateTime,
  formatShort,
  getJson,
  leftWords,
  num,
  planTone,
  postJson,
  type AuditLogItem,
  type UserInfo,
} from "./admin-shared";

/**
 * Карточка пользователя. Всё, ради чего админ её открывает:
 *
 *   подписка          сколько осталось (тёмная плита), выдать дни и тариф,
 *                     забрать подписку — POST /api/admin/users/manage
 *                     grant-subscription | revoke-subscription
 *   устройства        HWID из панели — GET /api/admin/users/:id/devices
 *                     (только чтение: удаления в API нет)
 *   IP-адреса         POST /api/admin/users/:id/ips → jobId, затем
 *                     GET …/ips?jobId= раз в 1,5 с до готовности
 *   ссылка и панель   новая ссылка (regen-key), ресинк (…/resync)
 *   история           события журнала по этому пользователю
 *   сообщение         send-notification
 *
 * Необратимое спрашивает подтверждение; итог — тостом.
 */

const DURATIONS = [
  { key: "1h", label: "1 ч", min: 60 },
  { key: "24h", label: "24 ч", min: 1440 },
  { key: "3d", label: "3 дн", min: 4320 },
  { key: "7d", label: "7 дн", min: 10080 },
  { key: "14d", label: "14 дн", min: 20160 },
  { key: "30d", label: "30 дн", min: 43200 },
  { key: "60d", label: "60 дн", min: 86400 },
  { key: "180d", label: "180 дн", min: 259200 },
  { key: "365d", label: "365 дн", min: 525600 },
];

const SYNC_ACTION: Record<string, string> = {
  created: "Создан в панели",
  patched: "Панель обновлена",
  adopted: "Привязан к записи панели",
  disabled: "Отключён в панели",
  enabled: "Включён в панели",
  skip: "Без изменений",
  noop: "Без изменений",
  failed: "Ошибка",
};

interface HwidDevice {
  hwid: string;
  platform: string | null;
  osVersion: string | null;
  deviceModel: string | null;
  userAgent: string | null;
  requestIp: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}
interface DevicesData {
  panelUserId: number | null;
  total: number;
  devices: HwidDevice[];
  limit: number | null;
  siteLimit?: number;
}
interface IpJob {
  isCompleted: boolean;
  isFailed: boolean;
  progress: unknown;
  result: { nodes: Array<{ nodeUuid: string; nodeName: string; countryCode: string | null; ips: Array<{ ip: string; lastSeen: string | null }> }> } | null;
}
interface ResyncResult {
  after: { publicId: string | null; remnawaveUserUuid: string | null; subscriptionUrl: string | null; panelSyncState?: string | null; panelSyncError?: string | null };
  sync: { action: string; ok: boolean; reason?: string; panelError?: string; panelUsername?: string | null };
  probes: Array<{ path: string; status: number | null; ok: boolean; body: unknown; error?: string }>;
}

function platformIcon(d: HwidDevice): IconName {
  const s = `${d.platform || ""} ${d.deviceModel || ""} ${d.userAgent || ""}`.toLowerCase();
  if (/iphone|ipad|ios/.test(s)) return "iphone";
  if (/android ?tv|tizen|webos|tvos|apple ?tv/.test(s)) return "tv";
  if (/android/.test(s)) return "android";
  if (/mac|darwin/.test(s)) return "macos";
  if (/windows|win32|win64/.test(s)) return "windows";
  return "devices";
}

interface Props {
  user: UserInfo;
  logs: AuditLogItem[];
  onClose: () => void;
  onChanged: () => void;
}

export default function AdminUserDetail({ user, logs, onClose, onChanged }: Props) {
  const confirm = useAdminConfirm();
  const toast = useAdminToast();
  const [busy, setBusy] = useState<null | "grant" | "revoke" | "regen" | "resync" | "notify">(null);
  const [grantPlan, setGrantPlan] = useState<"basic" | "plus">(user.subscriptionPlan === "plus" ? "plus" : "basic");
  const [grantDur, setGrantDur] = useState("30d");
  const [err, setErr] = useState<string | null>(null);
  const [resync, setResync] = useState<ResyncResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [nTitle, setNTitle] = useState("");
  const [nText, setNText] = useState("");

  // Часы карточки: «осталось» обновляется раз в 30 с.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  /* ── Устройства ─────────────────────────────────────────────── */
  const [dev, setDev] = useState<DevicesData | null>(null);
  const [devErr, setDevErr] = useState<string | null>(null);
  const [devLoading, setDevLoading] = useState(false);
  const loadDevices = useCallback(async () => {
    setDevLoading(true);
    setDevErr(null);
    const r = await getJson<DevicesData>(`/api/admin/users/${user.id}/devices`);
    if (r.ok) setDev(r.data);
    else setDevErr(r.error);
    setDevLoading(false);
  }, [user.id]);
  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  /* ── IP-адреса: задача панели ───────────────────────────────── */
  const [ip, setIp] = useState<{ state: "idle" | "run" | "done" | "fail"; job?: IpJob; error?: string; tries?: number }>({ state: "idle" });
  const ipRun = useRef(0);
  useEffect(() => () => void (ipRun.current += 1), []);
  const checkIps = async () => {
    const run = ++ipRun.current;
    setIp({ state: "run", tries: 0 });
    const start = await postJson<{ jobId: string }>(`/api/admin/users/${user.id}/ips`);
    if (run !== ipRun.current) return;
    if (!start.ok) {
      setIp({ state: "fail", error: start.error });
      return;
    }
    for (let k = 1; k <= 40; k++) {
      await new Promise((ok) => setTimeout(ok, 1500));
      if (run !== ipRun.current) return;
      const r = await getJson<IpJob>(`/api/admin/users/${user.id}/ips?jobId=${encodeURIComponent(start.data.jobId)}`);
      if (run !== ipRun.current) return;
      if (!r.ok) {
        setIp({ state: "fail", error: r.error });
        return;
      }
      if (r.data.isFailed) {
        setIp({ state: "fail", error: "Панель не смогла собрать адреса" });
        return;
      }
      if (r.data.isCompleted) {
        setIp({ state: "done", job: r.data });
        return;
      }
      setIp({ state: "run", tries: k });
    }
    setIp({ state: "fail", error: "Панель считает слишком долго — повторите через минуту" });
  };

  /* ── Действия ───────────────────────────────────────────────── */
  const manage = (body: Record<string, unknown>) => postJson<Record<string, unknown>>("/api/admin/users/manage", { userId: user.id, ...body });

  const grant = async () => {
    const d = DURATIONS.find((x) => x.key === grantDur)!;
    const base = Math.max(Date.now(), new Date(user.subscriptionEnd).getTime());
    const planName = grantPlan === "plus" ? "Plus" : "Basic";
    const ok = await confirm({
      title: `Выдать ${planName} на ${d.label}?`,
      text: `${user.email}\n\nПодписка продлится до ${formatDateTime(base + d.min * 60000)} (МСК). Пользователь получит уведомление.`,
      confirmLabel: "Выдать",
      tone: "primary",
    });
    if (!ok) return;
    setBusy("grant");
    setErr(null);
    const r = await manage({ action: "grant-subscription", plan: grantPlan, duration: grantDur });
    setBusy(null);
    if (!r.ok) {
      setErr(r.error);
      toast(`Не выдали: ${r.error}`, "off");
      return;
    }
    if (r.data?.panelSynced === false) toast(`${planName} выдан, но панель не обновилась — повторим автоматически. ${r.data.panelError ?? ""}`, "warn");
    else toast(`${planName} на ${d.label} выдан`);
    onChanged();
  };

  const revoke = async () => {
    const ok = await confirm({
      title: "Забрать подписку?",
      text: `${user.email}\n\nПодписка закончится сейчас, доступ в панели отключится. Пользователь получит уведомление. Вернуть — только новой выдачей.`,
      confirmLabel: "Забрать подписку",
    });
    if (!ok) return;
    setBusy("revoke");
    setErr(null);
    const r = await manage({ action: "revoke-subscription" });
    setBusy(null);
    if (!r.ok) {
      setErr(r.error);
      toast(`Не забрали: ${r.error}`, "off");
      return;
    }
    if (r.data?.panelSynced === false) toast(`Подписка закончена, но панель не отключила доступ — повторим автоматически. ${r.data.panelError ?? ""}`, "warn");
    else toast("Подписка забрана, доступ отключён");
    onChanged();
  };

  const regen = async () => {
    const ok = await confirm({
      title: "Выпустить новую ссылку?",
      text: "Старая ссылка подписки и ключи перестанут работать — пользователю придётся заново подключить устройства.",
      confirmLabel: "Выпустить",
    });
    if (!ok) return;
    setBusy("regen");
    setErr(null);
    const r = await manage({ action: "regen-key" });
    setBusy(null);
    if (!r.ok) {
      setErr(r.error);
      toast(r.error, "off");
      return;
    }
    toast("Новая ссылка выпущена");
    onChanged();
  };

  const runResync = async () => {
    setBusy("resync");
    setErr(null);
    setResync(null);
    const r = await postJson<ResyncResult>(`/api/admin/users/${user.id}/resync`);
    setBusy(null);
    if (!r.ok) {
      setErr(r.error);
      toast(`Синхронизация не прошла: ${r.error}`, "off");
      return;
    }
    setResync(r.data);
    toast(r.data.sync.ok ? `Синхронизировано: ${SYNC_ACTION[r.data.sync.action] || r.data.sync.action}` : "Панель ответила ошибкой — подробности в карточке", r.data.sync.ok ? "ok" : "warn");
    onChanged();
    loadDevices();
  };

  const notify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nTitle.trim() || !nText.trim()) return;
    setBusy("notify");
    const r = await manage({ action: "send-notification", title: nTitle, message: nText });
    setBusy(null);
    if (!r.ok) {
      toast(`Не отправили: ${r.error}`, "off");
      return;
    }
    setNTitle("");
    setNText("");
    toast("Сообщение отправлено");
  };

  const copy = (text: string, what: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(what);
    setTimeout(() => setCopied(null), 2000);
  };

  /* ── Вид ────────────────────────────────────────────────────── */
  const planKey = user.isActive ? user.subscriptionPlan : "expired";
  const endMs = new Date(user.subscriptionEnd).getTime();
  const dLeft = Math.max(0, Math.ceil((endMs - now) / 864e5));
  const filled = user.isActive ? Math.min(30, Math.max(1, dLeft)) : 0;
  const soon = user.isActive && endMs - now < 3 * 864e5;
  const limit = dev?.limit ?? dev?.siteLimit ?? DEVICE_LIMIT;
  const ipNodes = ip.job?.result?.nodes ?? [];
  const uniqIps = new Set(ipNodes.flatMap((n) => n.ips.map((x) => x.ip)));
  const dur = DURATIONS.find((x) => x.key === grantDur)!;

  return (
    <section className="ak-card adm-detail adm-still" data-sheet="24" style={{ "--i": 0 } as CSSProperties} aria-labelledby="adm-u-h">
      {/* Шапка */}
      <div className="adm-detail-head">
        <div className="adm-detail-who">
          <p className="ak-eyebrow">Пользователь{user.publicId ? <> · <span className="a-num">{user.publicId}</span></> : null}</p>
          <h2 id="adm-u-h" className="ak-h3 adm-detail-mail">{user.email}</h2>
          <p className="adm-tagrow">
            <span className="adm-tag" data-tone={planTone(planKey)}>{PLAN_LABELS[planKey] || planKey}</span>
            {user.telegramLinked && <span className="adm-tag" data-tone="mute"><Icon name="send" size={12} />Telegram</span>}
            {user.accountsOnIp > 1 && <span className="adm-tag" data-tone={user.accountsOnIp > 2 ? "off" : "warn"}>{user.accountsOnIp} акк. на IP</span>}
            {!user.subscriptionUrl && <span className="adm-tag" data-tone="warn">нет ссылки</span>}
          </p>
        </div>
        <button type="button" onClick={onClose} className="ak-icon" aria-label="Закрыть карточку пользователя">
          <Icon name="close" size={18} />
        </button>
      </div>

      {/* Подписка — тёмная плита */}
      <div className="ak-dark adm-u-sub">
        <div className="adm-block-head">
          <h3 className="adm-u-sub-t">Подписка</h3>
          <span className="ak-status" data-tone={!user.isActive ? "off" : soon ? "warn" : undefined}>
            <i />
            {!user.isActive ? "Истекла" : soon ? "Скоро закончится" : "Активна"}
          </span>
        </div>
        <p className="ak-value adm-u-left" aria-live="polite"><span className="a-num">{leftWords(user.subscriptionEnd, now)}</span>{user.isActive && <small>осталось</small>}</p>
        <div className="ak-days" data-tone={soon ? "warn" : undefined} aria-hidden>
          {Array.from({ length: 30 }, (_, k) => (
            <span key={k} className="ak-day" style={{ "--k": k } as CSSProperties} data-on={k < filled ? "" : undefined} data-last={k === filled - 1 ? "" : undefined} />
          ))}
        </div>
        <p className="ak-days-cap a-num">
          <span>{user.isActive ? "до" : "закончилась"} {formatDateTime(user.subscriptionEnd)} МСК</span>
          <span>с {formatDateTime(user.createdAt).slice(0, 10)}</span>
        </p>
        <ul className="adm-u-facts">
          <li><span>Рефералы</span><b className="a-num">{user.referrals}</b></li>
          <li><span>Оплатили</span><b className="a-num">{user.paidReferrals}</b></li>
          <li><span>Устройства</span><b className="a-num">{dev ? `${dev.total} / ${limit}` : "…"}</b></li>
        </ul>
      </div>

      {err && <p className="ak-err adm-break" role="alert">{err}</p>}

      {/* Выдать */}
      <div className="adm-block">
        <div className="adm-block-head">
          <h3 className="adm-block-title"><Icon name="bolt" size={16} />Выдать дни и тариф</h3>
        </div>
        <div className="adm-seg adm-seg-plan" role="group" aria-label="Тариф">
          {(["basic", "plus"] as const).map((p) => (
            <button key={p} type="button" className="adm-seg-btn" aria-pressed={grantPlan === p} onClick={() => setGrantPlan(p)}>
              {p === "plus" ? "Plus" : "Basic"}
            </button>
          ))}
        </div>
        <div className="adm-chips" role="group" aria-label="Срок">
          {DURATIONS.map((o) => (
            <button key={o.key} type="button" className="adm-chip" aria-pressed={grantDur === o.key} onClick={() => setGrantDur(o.key)}>
              {o.label}
            </button>
          ))}
        </div>
        <p className="ak-fine a-num">
          Продлится от {user.isActive ? "текущей даты окончания" : "сегодня"} до {formatDateTime(Math.max(now, endMs) + dur.min * 60000)}.
        </p>
        <div className="adm-sub-actions">
          <button type="button" onClick={grant} disabled={busy !== null} className="a-btn a-btn-primary">
            {busy === "grant" ? <><Spin />Выдаём…</> : <>Выдать {grantPlan === "plus" ? "Plus" : "Basic"} на {dur.label}</>}
          </button>
        </div>
      </div>

      {/* Устройства */}
      <div className="adm-block">
        <div className="adm-block-head">
          <h3 className="adm-block-title"><Icon name="devices" size={16} />Устройства</h3>
          <span className="adm-block-aside">
            {dev && <span className="adm-tag" data-tone={dev.total >= limit ? "warn" : "mute"}><span className="a-num">{dev.total} из {limit}</span></span>}
            <button type="button" className="ak-icon adm-icon-sm" onClick={loadDevices} disabled={devLoading} aria-label="Обновить список устройств">
              {devLoading ? <Spin /> : <Icon name="refresh" size={16} />}
            </button>
          </span>
        </div>
        {devErr ? (
          <p className="adm-note" data-tone="off">{devErr}</p>
        ) : !dev ? (
          <p className="ak-fine">Спрашиваем панель…</p>
        ) : dev.panelUserId === null ? (
          <p className="adm-note" data-tone="warn">У пользователя ещё нет записи в панели — устройств нет.</p>
        ) : dev.devices.length === 0 ? (
          <p className="ak-fine">Ни одно устройство ещё не подключалось.</p>
        ) : (
          <ul className="adm-devs">
            {dev.devices.map((d, k) => (
              <li key={d.hwid} className="adm-dev" style={{ "--k": k } as CSSProperties}>
                <span className="adm-dev-ico" aria-hidden><Icon name={platformIcon(d)} size={18} /></span>
                <span className="adm-dev-copy">
                  <b>{d.deviceModel || d.platform || "Устройство"}</b>
                  <span className="a-num">
                    {[d.platform, d.osVersion].filter(Boolean).join(" ") || "платформа неизвестна"}
                    {d.requestIp && <> · {d.requestIp}</>}
                  </span>
                </span>
                <span className="adm-dev-time a-num" title={d.updatedAt ? formatDateTime(d.updatedAt) : undefined}>{ago(d.updatedAt || d.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="ak-fine">Отвязать устройство можно в панели Remnawave: из админки — только просмотр.</p>
      </div>

      {/* IP-адреса */}
      <div className="adm-block">
        <div className="adm-block-head">
          <h3 className="adm-block-title"><Icon name="globe" size={16} />IP-адреса подключений</h3>
          {ip.state === "done" && <span className="adm-tag" data-tone={uniqIps.size > 5 ? "warn" : undefined}><span className="a-num">{uniqIps.size} IP · {ipNodes.length} нод</span></span>}
        </div>
        {user.registrationIp && (
          <p className="adm-ipline" data-tone={user.accountsOnIp > 2 ? "off" : user.accountsOnIp > 1 ? "warn" : undefined}>
            <span>При регистрации</span>
            <span className="adm-ip a-num">{user.registrationIp}</span>
            <b className="a-num">{user.accountsOnIp} акк.</b>
          </p>
        )}
        {ip.state === "run" && (
          <div className="adm-progress adm-progress-run" role="progressbar" aria-label="Панель собирает адреса" aria-busy="true"><i /></div>
        )}
        {ip.state === "fail" && <p className="adm-note" data-tone="off">{ip.error}</p>}
        {ip.state === "done" &&
          (ipNodes.length === 0 || uniqIps.size === 0 ? (
            <p className="ak-fine">Панель не видит подключений.</p>
          ) : (
            <ul className="adm-ipnodes">
              {ipNodes.filter((n) => n.ips.length > 0).map((n) => (
                <li key={n.nodeUuid}>
                  <p className="adm-result-row">
                    <span>{n.nodeName}{n.countryCode ? ` · ${n.countryCode}` : ""}</span>
                    <span className="a-num adm-muted">{n.ips.length}</span>
                  </p>
                  <ul className="adm-ips">
                    {n.ips.map((x) => (
                      <li key={x.ip}>
                        <span className="adm-ip a-num">{x.ip}</span>
                        <span className="a-num adm-muted">{x.lastSeen ? ago(x.lastSeen) : "—"}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          ))}
        {uniqIps.size > 5 && <p className="adm-note" data-tone="warn">Много адресов — возможно, ключом пользуются не только на своих устройствах.</p>}
        <div className="adm-sub-actions">
          <button type="button" onClick={checkIps} disabled={ip.state === "run" || !user.remnawaveUserUuid} className="a-btn ak-btn-soft">
            {ip.state === "run" ? <><Spin />Панель считает…</> : <><Icon name="globe" size={16} />{ip.state === "done" ? "Проверить снова" : "Проверить IP"}</>}
          </button>
        </div>
        {!user.remnawaveUserUuid && <p className="ak-fine">Нет записи в панели — адреса взять неоткуда.</p>}
      </div>

      {/* Ссылка и панель */}
      <div className="adm-block">
        <div className="adm-block-head">
          <h3 className="adm-block-title"><Icon name="lock" size={16} />Ссылка и панель</h3>
        </div>
        <dl className="adm-dl">
          <div>
            <dt>Public ID</dt>
            <dd className="adm-strong a-num">{user.publicId || "—"}</dd>
          </div>
          <div>
            <dt>Имя в панели</dt>
            <dd>
              {user.panelUsername ? (
                <button
                  type="button"
                  className="adm-chipbtn"
                  data-tone={user.panelUsername === user.publicId ? undefined : "warn"}
                  onClick={() => copy(user.panelUsername || "", "name")}
                  aria-label={`Скопировать имя в панели ${user.panelUsername}`}
                >
                  <span className="a-num">{user.panelUsername}</span>
                  <Icon name={copied === "name" ? "check" : "copy"} size={14} />
                </button>
              ) : "—"}
            </dd>
          </div>
          <div>
            <dt>ID в панели</dt>
            <dd className="adm-break a-num">{user.remnawaveUserUuid || "—"}</dd>
          </div>
        </dl>
        {user.subscriptionUrl ? (
          <div className="adm-url">
            <div className="adm-url-row">
              <code className="adm-code">{user.subscriptionUrl}</code>
              <button
                type="button"
                onClick={() => copy(user.subscriptionUrl || "", "url")}
                className="ak-icon adm-copy"
                data-state={copied === "url" ? "ok" : undefined}
                aria-label={copied === "url" ? "Ссылка скопирована" : "Скопировать ссылку подписки"}
              >
                <Icon name={copied === "url" ? "check" : "copy"} size={16} />
              </button>
            </div>
            {user.happCryptoLink && (
              <a href={user.happCryptoLink} className="adm-link">
                <Icon name="bolt" size={16} />
                Открыть в Happ
              </a>
            )}
          </div>
        ) : (
          <p className="adm-note" data-tone="warn">Ссылки ещё нет: появится после синхронизации с панелью.</p>
        )}
        <div className="adm-sub-actions">
          <button type="button" onClick={runResync} disabled={busy !== null} className="a-btn ak-btn-soft">
            {busy === "resync" ? <><Spin />Синхронизируем…</> : <><Icon name="refresh" size={16} />Синхронизировать</>}
          </button>
          {user.subscriptionUrl && (
            <button type="button" onClick={regen} disabled={busy !== null} className="a-btn ak-btn-soft">
              {busy === "regen" ? <><Spin />Выпускаем…</> : <><Icon name="share" size={16} />Новая ссылка</>}
            </button>
          )}
        </div>
        {resync && (
          <div className="adm-result">
            <div className="adm-result-row">
              <span>Итог синхронизации</span>
              <span className="adm-tag" data-tone={resync.sync.ok ? undefined : "off"}>{SYNC_ACTION[resync.sync.action] || resync.sync.action}</span>
            </div>
            {resync.sync.reason && <p className="adm-result-line">Причина: {resync.sync.reason}</p>}
            {resync.sync.panelError && <p className="adm-result-line adm-break" data-tone="off">{resync.sync.panelError}</p>}
            {resync.after.panelSyncError && <p className="adm-result-line adm-break" data-tone="off">Очередь: {resync.after.panelSyncError}</p>}
            {resync.sync.panelUsername !== undefined && (
              <p className="adm-result-line">
                Панель видит пользователя как <b data-tone={resync.sync.panelUsername === resync.after.publicId ? undefined : "warn"}>{resync.sync.panelUsername || "—"}</b>
              </p>
            )}
            <details className="adm-details">
              <summary>Ответы панели ({resync.probes.length})</summary>
              <ul className="adm-probes">
                {resync.probes.map((p, k) => (
                  <li key={`${p.path}-${k}`}>
                    <div className="adm-result-row">
                      <span className="adm-break">{p.path}</span>
                      <span className="adm-tag a-num" data-tone={p.ok ? undefined : "off"}>{p.status ?? "—"}</span>
                    </div>
                    <p className="adm-result-line adm-break">
                      {p.error ? p.error : typeof p.body === "string" ? p.body.slice(0, 240) : JSON.stringify(p.body).slice(0, 240)}
                    </p>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        )}
      </div>

      {/* История */}
      <div className="adm-block">
        <div className="adm-block-head">
          <h3 className="adm-block-title"><Icon name="clock" size={16} />История</h3>
          <span className="adm-muted a-num">{num(logs.length)}</span>
        </div>
        {logs.length === 0 ? (
          <p className="ak-fine">В последних 200 событиях журнала этого пользователя нет.</p>
        ) : (
          <ol className="adm-hist">
            {logs.slice(0, 12).map((l) => {
              const m = ACTION_LABELS[l.action] || { label: l.action, tone: "mute" as const };
              return (
                <li key={l.id}>
                  <span className="adm-tag" data-tone={m.tone}>{m.label}</span>
                  <span className="adm-hist-d adm-break">{l.details || ""}</span>
                  <span className="adm-hist-t a-num">{formatShort(l.createdAt)}</span>
                </li>
              );
            })}
          </ol>
        )}
        <p className="ak-fine">Из журнала событий (последние 200 по сайту). Платежей по пользователю API пока не отдаёт.</p>
      </div>

      {/* Сообщение */}
      <details className="adm-block adm-fold">
        <summary className="adm-block-title"><Icon name="bell" size={16} />Написать пользователю</summary>
        <form onSubmit={notify}>
          <label className="adm-f">
            <span className="adm-f-label">Заголовок</span>
            <input type="text" value={nTitle} onChange={(e) => setNTitle(e.target.value)} className="adm-input" required />
          </label>
          <label className="adm-f">
            <span className="adm-f-label">Сообщение</span>
            <textarea value={nText} onChange={(e) => setNText(e.target.value)} rows={3} className="adm-input adm-area" required />
          </label>
          <div className="adm-sub-actions">
            <button type="submit" disabled={busy !== null} className="a-btn ak-btn-soft">
              {busy === "notify" ? <><Spin />Отправляем…</> : <><Icon name="send" size={16} />Отправить</>}
            </button>
          </div>
        </form>
      </details>

      {/* Забрать */}
      {user.isActive && (
        <div className="adm-block adm-danger">
          <div className="adm-block-head">
            <h3 className="adm-block-title">Забрать подписку</h3>
          </div>
          <p className="ak-fine">Подписка закончится сейчас, доступ в панели отключится. Спросим подтверждение.</p>
          <div className="adm-sub-actions">
            <button type="button" onClick={revoke} disabled={busy !== null} className="a-btn ak-btn-danger">
              {busy === "revoke" ? <><Spin />Забираем…</> : "Забрать подписку"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
