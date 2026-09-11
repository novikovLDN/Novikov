"use client";

import { useState, useEffect, useCallback, useRef, type CSSProperties } from "react";
import Icon from "@/components/pixel/Icon";
import { useAdminConfirm, Spin } from "./AdminConfirm";
import { PLAN_LABELS, planTone, type UserInfo } from "./admin-shared";

/**
 * Карточка пользователя в админке. Запросы прежние, один в один:
 *   POST /api/admin/users/manage  grant-subscription | revoke-subscription |
 *                                 regen-key | send-notification
 *   POST /api/admin/users/:id/resync
 * Отзыв подписки — как и раньше, только после подтверждения (теперь
 * диалогом). Обновление ключа тоже спрашивает: старый ключ у человека
 * перестаёт работать.
 */

const DURATION_OPTIONS = [
  { key: "30m", label: "30 мин" },
  { key: "1h", label: "1 час" },
  { key: "12h", label: "12 ч" },
  { key: "24h", label: "24 ч" },
  { key: "3d", label: "3 дн" },
  { key: "7d", label: "7 дн" },
  { key: "14d", label: "14 дн" },
  { key: "30d", label: "30 дн" },
  { key: "60d", label: "60 дн" },
  { key: "180d", label: "180 дн" },
  { key: "365d", label: "365 дн" },
];

interface ResyncResult {
  after: { publicId: string | null; remnawaveUserUuid: string | null; subscriptionUrl: string | null };
  sync: { action: string; ok: boolean; reason?: string; panelError?: string; panelUsername?: string | null };
  probes: Array<{ path: string; status: number | null; ok: boolean; body: unknown; error?: string }>;
}

interface Props {
  user: UserInfo;
  onClose: () => void;
  onRefresh: () => void;
  formatDateTime: (d: string) => string;
}

export default function AdminUserDetail({ user, onClose, onRefresh, formatDateTime }: Props) {
  const confirm = useAdminConfirm();
  const [grantPlan, setGrantPlan] = useState<"basic" | "plus">("basic");
  const [grantDuration, setGrantDuration] = useState("30d");
  const [granting, setGranting] = useState(false);
  const [grantSuccess, setGrantSuccess] = useState(false);
  const [grantError, setGrantError] = useState<string | null>(null);

  const [revoking, setRevoking] = useState(false);
  const [revokeSuccess, setRevokeSuccess] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  const [regenLoading, setRegenLoading] = useState(false);
  const [regenSuccess, setRegenSuccess] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);

  const [keyCopied, setKeyCopied] = useState(false);
  const [nameCopied, setNameCopied] = useState(false);

  const [resyncing, setResyncing] = useState(false);
  const [resyncResult, setResyncResult] = useState<ResyncResult | null>(null);
  const [resyncError, setResyncError] = useState<string | null>(null);

  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifSending, setNotifSending] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);

  // Live timer
  const [timeLeft, setTimeLeft] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);

  const calcTimeLeft = useCallback(() => {
    const now = new Date();
    const end = new Date(user.subscriptionEnd);
    const ms = Math.max(0, end.getTime() - now.getTime());

    if (ms === 0) return "Истёк";

    const totalMin = Math.floor(ms / 60000);
    const totalHr = Math.floor(totalMin / 60);
    const d = Math.floor(totalHr / 24);
    const h = totalHr % 24;
    const m = totalMin % 60;

    if (d > 0) return `${d} дн ${h} ч ${m} мин`;
    if (h > 0) return `${h} ч ${m} мин`;
    return `${m} мин`;
  }, [user.subscriptionEnd]);

  useEffect(() => {
    setTimeLeft(calcTimeLeft());
    timerRef.current = setInterval(() => setTimeLeft(calcTimeLeft()), 10000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [calcTimeLeft]);

  const handleGrant = async () => {
    setGranting(true);
    setGrantError(null);
    try {
      const res = await fetch("/api/admin/users/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "grant-subscription", userId: user.id, plan: grantPlan, duration: grantDuration }),
      });
      const data = await res.json();
      if (data.success) {
        setGrantSuccess(true);
        setTimeout(() => setGrantSuccess(false), 3000);
        onRefresh();
      } else {
        setGrantError(data.error || "Не удалось выдать подписку");
      }
    } catch {
      setGrantError("Ошибка сети");
    } finally {
      setGranting(false);
    }
  };

  const handleRevoke = async () => {
    const ok = await confirm({
      title: "Отозвать подписку?",
      text: `${user.email}\n\nПодписка будет деактивирована, ключ удалён с сервера и у пользователя.`,
      confirmLabel: "Отозвать и удалить ключ",
    });
    if (!ok) return;
    setRevoking(true);
    setRevokeError(null);
    try {
      const res = await fetch("/api/admin/users/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke-subscription", userId: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        setRevokeSuccess(true);
        setTimeout(() => setRevokeSuccess(false), 3000);
        onRefresh();
      } else {
        setRevokeError(data.error || "Не удалось отозвать подписку");
      }
    } catch {
      setRevokeError("Ошибка сети");
    } finally {
      setRevoking(false);
    }
  };

  const handleRegen = async () => {
    const ok = await confirm({
      title: "Обновить ключ пользователя?",
      text: "Выдадим новый ключ. Старый перестанет работать — пользователю придётся заново подключить устройства.",
      confirmLabel: "Обновить ключ",
    });
    if (!ok) return;
    setRegenLoading(true);
    setRegenError(null);
    try {
      const res = await fetch("/api/admin/users/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "regen-key", userId: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        setRegenSuccess(true);
        setTimeout(() => setRegenSuccess(false), 3000);
        onRefresh();
      } else {
        setRegenError(data.error || "Не удалось обновить ключ");
      }
    } catch {
      setRegenError("Ошибка сети");
    } finally {
      setRegenLoading(false);
    }
  };

  const handleResync = async () => {
    setResyncing(true);
    setResyncResult(null);
    setResyncError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/resync`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setResyncResult(data.data as ResyncResult);
        onRefresh();
      } else {
        setResyncError(data.error || "Ошибка");
      }
    } catch {
      setResyncError("Ошибка сети");
    } finally {
      setResyncing(false);
    }
  };

  const handleSendNotif = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;
    setNotifSending(true);
    setNotifError(null);
    try {
      const res = await fetch("/api/admin/users/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send-notification", userId: user.id, title: notifTitle, message: notifMessage }),
      });
      const data = await res.json();
      if (data.success) {
        setNotifTitle("");
        setNotifMessage("");
        setNotifSuccess(true);
        setTimeout(() => setNotifSuccess(false), 3000);
      } else {
        setNotifError(data.error || "Не удалось отправить");
      }
    } catch {
      setNotifError("Ошибка сети");
    } finally {
      setNotifSending(false);
    }
  };

  const copyText = (text: string, done: (v: boolean) => void) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    done(true);
    setTimeout(() => done(false), 2000);
  };

  const planKey = user.isActive ? user.subscriptionPlan : "expired";
  const isExpired = !user.isActive;
  const ipTone = user.accountsOnIp > 2 ? "off" : user.accountsOnIp > 1 ? "warn" : undefined;
  const nameMatches = !!user.panelUsername && user.panelUsername === user.publicId;
  const durationLabel = DURATION_OPTIONS.find((o) => o.key === grantDuration)?.label;

  return (
    <section className="ak-card adm-detail adm-still" data-sheet="24" style={{ "--i": 0 } as CSSProperties} aria-labelledby="adm-u-h">
      {/* Шапка карточки */}
      <div className="adm-detail-head">
        <div className="adm-detail-who">
          <p className="ak-eyebrow">Пользователь{user.publicId ? <> · <span className="a-num">{user.publicId}</span></> : null}</p>
          <h2 id="adm-u-h" className="ak-h3 adm-detail-mail">{user.email}</h2>
          <p className="ak-fine a-num">Регистрация: {formatDateTime(user.createdAt)}</p>
        </div>
        <button type="button" onClick={onClose} className="ak-icon" aria-label="Закрыть карточку пользователя">
          <Icon name="close" size={18} />
        </button>
      </div>

      {/* Подписка */}
      <div className="adm-block adm-block-sub" data-off={isExpired ? "" : undefined}>
        <div className="adm-block-head">
          <h3 className="adm-block-title"><Icon name="clock" size={16} />Подписка</h3>
          <span className="adm-tag" data-tone={planTone(planKey)}>{PLAN_LABELS[planKey] || planKey}</span>
        </div>
        <p className="adm-left a-num" aria-live="polite">{timeLeft}</p>
        <p className="ak-fine a-num">{isExpired ? "Подписка истекла" : `До: ${formatDateTime(user.subscriptionEnd)}`}</p>
        <ul className="adm-facts">
          <li><span>Рефералы</span><b className="a-num">{user.referrals}</b></li>
          <li><span>Оплатили</span><b className="a-num">{user.paidReferrals}</b></li>
          <li><span>Telegram</span><b>{user.telegramLinked ? "Привязан" : "Нет"}</b></li>
        </ul>
        {user.registrationIp && (
          <p className="adm-ipline" data-tone={ipTone}>
            <Icon name="globe" size={16} />
            <span className="adm-ip a-num">{user.registrationIp}</span>
            <b className="a-num">{user.accountsOnIp > 1 ? `${user.accountsOnIp} акк.` : "1 акк."}</b>
          </p>
        )}
      </div>

      {/* Ключ подписки */}
      <div className="adm-block">
        <div className="adm-block-head">
          <h3 className="adm-block-title"><Icon name="lock" size={16} />Ключ подписки (Remnawave)</h3>
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
                  data-tone={nameMatches ? undefined : "warn"}
                  onClick={() => copyText(user.panelUsername || "", setNameCopied)}
                  aria-label={`Скопировать имя в панели ${user.panelUsername}${nameMatches ? ", совпадает с Public ID" : ", не совпадает с Public ID"}`}
                >
                  <span className="a-num">{user.panelUsername}</span>
                  <Icon name={nameCopied ? "check" : "copy"} size={14} />
                </button>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt>UUID в Remnawave</dt>
            <dd className="adm-break a-num">{user.remnawaveUserUuid || "—"}</dd>
          </div>
        </dl>

        {user.subscriptionUrl ? (
          <div className="adm-url">
            <p className="adm-f-label">Ссылка подписки</p>
            <div className="adm-url-row">
              <code className="adm-code">{user.subscriptionUrl}</code>
              <button
                type="button"
                onClick={() => copyText(user.subscriptionUrl || "", setKeyCopied)}
                className="ak-icon adm-copy"
                data-state={keyCopied ? "ok" : undefined}
                aria-label={keyCopied ? "Ссылка скопирована" : "Скопировать ссылку подписки"}
              >
                <Icon name={keyCopied ? "check" : "copy"} size={16} />
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
          <p className="adm-note" data-tone="warn">
            Подписка ещё не выдана в Remnawave. Появится при первом входе пользователя в кабинет или после массовой сверки.
          </p>
        )}

        <div className="adm-sub-actions">
          <button type="button" onClick={handleResync} disabled={resyncing} className="a-btn ak-btn-soft">
            {resyncing ? <><Spin />Синхронизируем…</> : <><Icon name="refresh" size={16} />Синхронизировать с панелью</>}
          </button>
        </div>

        {resyncError && <p className="ak-err" role="alert">{resyncError}</p>}

        {resyncResult && (
          <div className="adm-result">
            <div className="adm-result-row">
              <span>Результат синхронизации</span>
              <span className="adm-tag" data-tone={resyncResult.sync.ok ? undefined : "off"}>{resyncResult.sync.action}</span>
            </div>
            {resyncResult.sync.reason && <p className="adm-result-line">Причина: {resyncResult.sync.reason}</p>}
            {resyncResult.sync.panelError && <p className="adm-result-line" data-tone="off">{resyncResult.sync.panelError}</p>}
            {resyncResult.sync.panelUsername !== undefined && (
              <p className="adm-result-line">
                Панель видит пользователя как:{" "}
                <b data-tone={resyncResult.sync.panelUsername === resyncResult.after.publicId ? undefined : "warn"}>
                  {resyncResult.sync.panelUsername || "—"}
                </b>
              </p>
            )}
            <p className="adm-result-line adm-break a-num">UUID: {resyncResult.after.remnawaveUserUuid || "—"}</p>

            <details className="adm-details">
              <summary>Ответы панели ({resyncResult.probes.length})</summary>
              <ul className="adm-probes">
                {resyncResult.probes.map((p, i) => (
                  <li key={`${p.path}-${i}`}>
                    <div className="adm-result-row">
                      <span className="adm-break">{p.path}</span>
                      <span className="adm-tag a-num" data-tone={p.ok ? undefined : "off"}>{p.status ?? "—"}</span>
                    </div>
                    <p className="adm-result-line adm-break">
                      {p.error
                        ? `error: ${p.error}`
                        : typeof p.body === "string"
                          ? p.body.slice(0, 200)
                          : JSON.stringify(p.body).slice(0, 200)}
                    </p>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        )}
      </div>

      {/* Выдать подписку */}
      <div className="adm-block">
        <div className="adm-block-head">
          <h3 className="adm-block-title"><Icon name="shield" size={16} />Выдать подписку</h3>
        </div>
        <div className="adm-seg adm-seg-plan" role="group" aria-label="Тариф">
          {(["basic", "plus"] as const).map((p) => (
            <button key={p} type="button" className="adm-seg-btn" aria-pressed={grantPlan === p} onClick={() => setGrantPlan(p)}>
              {p === "plus" ? "Plus" : "Basic"}
            </button>
          ))}
        </div>
        <div className="adm-chips" role="group" aria-label="Срок">
          {DURATION_OPTIONS.map((opt) => (
            <button key={opt.key} type="button" className="adm-chip" aria-pressed={grantDuration === opt.key} onClick={() => setGrantDuration(opt.key)}>
              {opt.label}
            </button>
          ))}
        </div>
        {grantError && <p className="ak-err" role="alert">{grantError}</p>}
        <div className="adm-sub-actions">
          <button type="button" onClick={handleGrant} disabled={granting} className="a-btn a-btn-primary" data-state={grantSuccess ? "ok" : undefined}>
            {granting ? (
              <><Spin />Выдаём…</>
            ) : grantSuccess ? (
              <><Icon name="check" size={16} />Подписка выдана</>
            ) : (
              `Выдать ${grantPlan === "plus" ? "Plus" : "Basic"} на ${durationLabel}`
            )}
          </button>
        </div>
      </div>

      {/* Персональное уведомление */}
      <form onSubmit={handleSendNotif} className="adm-block">
        <div className="adm-block-head">
          <h3 className="adm-block-title"><Icon name="bell" size={16} />Персональное уведомление</h3>
        </div>
        <label className="adm-f">
          <span className="adm-f-label">Заголовок</span>
          <input type="text" value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} className="adm-input" required />
        </label>
        <label className="adm-f">
          <span className="adm-f-label">Сообщение</span>
          <textarea value={notifMessage} onChange={(e) => setNotifMessage(e.target.value)} rows={3} className="adm-input adm-area" required />
        </label>
        {notifError && <p className="ak-err" role="alert">{notifError}</p>}
        <div className="adm-sub-actions">
          <button type="submit" disabled={notifSending} className="a-btn ak-btn-soft" data-state={notifSuccess ? "ok" : undefined}>
            {notifSending ? <><Spin />Отправляем…</> : notifSuccess ? <><Icon name="check" size={16} />Отправлено</> : <><Icon name="send" size={16} />Отправить</>}
          </button>
        </div>
      </form>

      {/* Опасная зона: ключ и отзыв */}
      {user.isActive && (
        <div className="adm-block adm-danger">
          <div className="adm-block-head">
            <h3 className="adm-block-title">Опасные действия</h3>
          </div>
          <p className="ak-fine">Оба действия спрашивают подтверждение. Отзыв деактивирует подписку и удаляет ключ с сервера.</p>
          {(regenError || revokeError) && <p className="ak-err" role="alert">{regenError || revokeError}</p>}
          <div className="adm-sub-actions">
            <button type="button" onClick={handleRegen} disabled={regenLoading} className="a-btn ak-btn-soft" data-state={regenSuccess ? "ok" : undefined}>
              {regenSuccess ? (
                <><Icon name="check" size={16} />Ключ обновлён</>
              ) : regenLoading ? (
                <><Spin />Обновляем…</>
              ) : (
                <><Icon name="refresh" size={16} />Обновить ключ</>
              )}
            </button>
            <button type="button" onClick={handleRevoke} disabled={revoking} className="a-btn ak-btn-danger">
              {revoking ? <><Spin />Отзываем…</> : revokeSuccess ? "Подписка отозвана" : "Отозвать подписку"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
