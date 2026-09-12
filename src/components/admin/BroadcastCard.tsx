"use client";

import { useState, type CSSProperties } from "react";
import Icon from "@/components/pixel/Icon";
import { useAdminConfirm, useAdminToast, Spin } from "@/app/admin/AdminConfirm";
import { formatShort, getJson, postJson, type NotificationItem, type UserInfo } from "@/app/admin/admin-shared";
import { BlockError } from "./Viz";

/**
 * Рассылка всем — POST /api/admin/notifications (target: "all") и
 * отправленные с удалением (DELETE ?id=). Личное сообщение одному
 * человеку пишется из его карточки: прежний выпадающий список из всех
 * пользователей на тысячах записей был неюзабелен.
 *
 * Рассылка всем уходит и пушем — поэтому спрашиваем подтверждение.
 */
export default function BroadcastCard({
  i = 0,
  notifications,
  error,
  users,
  onChanged,
}: {
  i?: number;
  notifications: NotificationItem[];
  error: string | null;
  users: UserInfo[];
  onChanged: () => void;
}) {
  const confirm = useAdminConfirm();
  const toast = useAdminToast();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !text.trim()) return;
    const ok = await confirm({
      title: "Отправить всем?",
      text: `«${title.trim()}» получат все пользователи — в кабинете и пушем.`,
      confirmLabel: "Отправить всем",
      tone: "primary",
    });
    if (!ok) return;
    setSending(true);
    const r = await postJson("/api/admin/notifications", { title: title.trim(), message: text.trim(), target: "all" });
    setSending(false);
    if (!r.ok) {
      toast(`Не отправили: ${r.error}`, "off");
      return;
    }
    setTitle("");
    setText("");
    toast("Рассылка отправлена");
    onChanged();
  };

  const remove = async (n: NotificationItem) => {
    const ok = await confirm({
      title: "Удалить уведомление?",
      text: `«${n.title}» пропадёт у получателей. Вернуть его будет нельзя.`,
      confirmLabel: "Удалить",
    });
    if (!ok) return;
    setDeleting(n.id);
    const r = await getJson(`/api/admin/notifications?id=${encodeURIComponent(n.id)}`, { method: "DELETE" });
    setDeleting(null);
    if (!r.ok) {
      toast(`Не удалили: ${r.error}`, "off");
      return;
    }
    toast("Уведомление удалено");
    onChanged();
  };

  return (
    <section className="ak-card adm-s-cast adm-still" data-sheet="24" style={{ "--i": i } as CSSProperties} aria-labelledby="adm-cast-h">
      <div className="ak-card-head">
        <h2 id="adm-cast-h" className="ak-eyebrow">Рассылка</h2>
        <span className="ak-plan a-num">отправлено {notifications.length}</span>
      </div>
      <form onSubmit={send} className="adm-cast-form">
        <label className="adm-f">
          <span className="adm-f-label">Заголовок</span>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="adm-input" required maxLength={120} />
        </label>
        <label className="adm-f">
          <span className="adm-f-label">Сообщение всем пользователям</span>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className="adm-input adm-area" required />
        </label>
        <div className="adm-sub-actions">
          <button type="submit" disabled={sending} className="a-btn a-btn-primary">
            {sending ? <><Spin />Отправляем…</> : <><Icon name="send" size={16} />Отправить всем</>}
          </button>
        </div>
        <p className="ak-fine">Личное сообщение — из карточки пользователя.</p>
      </form>

      {error && <BlockError title="Список отправленных не загрузился" text={error} />}
      {notifications.length > 0 && (
        <details className="adm-details">
          <summary>Отправленные ({notifications.length})</summary>
          <ul className="adm-sent-list">
            {notifications.map((n) => (
              <li key={n.id} className="adm-sent-row">
                <div className="adm-sent-copy">
                  <p className="adm-sent-title">{n.title}</p>
                  <p className="adm-sent-text">{n.message}</p>
                  <p className="adm-sent-meta">
                    <span className="a-num">{formatShort(n.createdAt)}</span>
                    <span className="adm-tag" data-tone={n.target === "all" ? "ink" : "mute"}>
                      {n.target === "all" ? "Все" : users.find((u) => u.id === n.target)?.email || "Один пользователь"}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(n)}
                  disabled={deleting === n.id}
                  className="ak-icon adm-del"
                  aria-label={`Удалить уведомление «${n.title}»`}
                >
                  {deleting === n.id ? <Spin /> : <Icon name="close" size={16} />}
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
