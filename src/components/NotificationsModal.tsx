"use client";

import { useEffect, useState, useCallback, useRef, type CSSProperties } from "react";
import Icon from "@/components/pixel/Icon";

export interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

interface NotificationsModalProps {
  open: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

/**
 * Шторка уведомлений кабинета — стиль кабинета (work-atlas.css,
 * .ak-sheet). Телефон: шторка снизу у большого пальца; шире — панель
 * под колокольчиком.
 *
 * Логика прежняя: загрузка /api/user/notifications, при открытии всё
 * отмечается прочитанным (/api/user/notifications/read), Esc и клик
 * мимо закрывают, прокрутка страницы на время шторки заперта.
 *
 * Новое — «Очистить» и крестик у записи. Удаления в API нет, а общие
 * рассылки (target = 'all') — одна строка на всех: удалять её нельзя.
 * Поэтому очищенные скрываются на клиенте: список id в localStorage
 * этого браузера (не больше 200 последних). Серверные данные не
 * меняются; об этом шторка говорит прямо.
 */
const CLEARED_KEY = "atlas_notifications_cleared";
const CLEARED_MAX = 200;

function readCleared(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(CLEARED_KEY) || "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeCleared(ids: string[]) {
  try {
    localStorage.setItem(CLEARED_KEY, JSON.stringify(ids.slice(-CLEARED_MAX)));
  } catch {
    // хранилище недоступно — скрытие проживёт до перезагрузки
  }
}

export default function NotificationsModal({ open, onClose, onUnreadCountChange }: NotificationsModalProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [cleared, setCleared] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/user/notifications");
      const result = await res.json();
      if (result.success) {
        const hidden = new Set(readCleared());
        setCleared([...hidden]);
        setNotifications(result.data);
        const unread = result.data.filter((n: Notification) => !n.read && !hidden.has(n.id)).length;
        onUnreadCountChange?.(unread);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [onUnreadCountChange]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Animate in/out
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  // Фокус — на «Закрыть»: Esc и Tab работают сразу.
  useEffect(() => {
    if (open && visible) closeRef.current?.focus({ preventScroll: true });
  }, [open, visible]);

  // Mark as read on open
  useEffect(() => {
    if (!open) return;
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;

    const markRead = async () => {
      try {
        await fetch("/api/user/notifications/read", { method: "POST" });
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        onUnreadCountChange?.(0);
      } catch {
        // silent
      }
    };
    markRead();
  }, [open, notifications, onUnreadCountChange]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock body scroll when open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open && !visible) return null;

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return "Только что";
    if (mins < 60) return `${mins} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    if (days < 7) return `${days} дн назад`;
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
  };

  const hiddenSet = new Set(cleared);
  const list = notifications.filter((n) => !hiddenSet.has(n.id));
  const clearedHere = notifications.length - list.length;
  const shown = visible && open;

  const hide = (ids: string[]) => {
    const next = [...new Set([...cleared, ...ids])];
    writeCleared(next);
    setCleared(next);
    const nextSet = new Set(next);
    onUnreadCountChange?.(notifications.filter((n) => !n.read && !nextSet.has(n.id)).length);
    // Фокус не теряется вместе с убранной записью.
    closeRef.current?.focus({ preventScroll: true });
  };

  return (
    <>
      {/* Подложка: клик мимо шторки закрывает её. */}
      <div className="ak-sheet-veil" data-open={shown ? "" : undefined} onClick={onClose} aria-hidden="true" />

      <div
        ref={panelRef}
        className="ak-sheet"
        data-open={shown ? "" : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ak-sheet-h"
      >
        <div className="ak-sheet-head">
          <h2 id="ak-sheet-h" className="ak-h3">Уведомления</h2>
          {list.length > 0 && <span className="ak-sheet-count a-num" aria-label={`Всего: ${list.length}`}>{list.length}</span>}
          <span className="ak-sheet-tools">
            {list.length > 0 && (
              <button type="button" className="a-btn ak-btn-soft" onClick={() => hide(list.map((n) => n.id))}>
                Очистить
              </button>
            )}
            <button ref={closeRef} type="button" className="ak-icon" onClick={onClose} aria-label="Закрыть">
              <Icon name="close" size={18} />
            </button>
          </span>
        </div>

        <div className="ak-sheet-body">
          {loading ? (
            <div className="ak-sheet-empty" role="status">
              <span className="ak-sheet-spin" aria-hidden />
              <span className="b-sr">Загружаем уведомления…</span>
            </div>
          ) : list.length === 0 ? (
            <div className="ak-sheet-empty">
              <span className="ak-sheet-empty-ico" aria-hidden><Icon name="bell" size={20} /></span>
              <p className="ak-h3">Нет уведомлений</p>
              <p className="ak-fine">
                {clearedHere > 0 ? "Очищенные скрыты на этом устройстве. Новые появятся здесь." : "Новые появятся здесь."}
              </p>
            </div>
          ) : (
            <ul className="ak-notes">
              {list.map((n, i) => (
                <li key={n.id} className="ak-note" data-unread={!n.read ? "" : undefined} style={{ "--k": Math.min(i, 8) } as CSSProperties}>
                  <div className="ak-note-copy">
                    <p className="ak-note-title">
                      {n.title}
                      {!n.read && <span className="b-sr"> — новое</span>}
                    </p>
                    <p className="ak-note-text">{n.message}</p>
                    <p className="ak-note-time">{formatTime(n.createdAt)}</p>
                  </div>
                  <button type="button" className="ak-note-x" onClick={() => hide([n.id])} aria-label={`Убрать уведомление «${n.title}»`}>
                    <Icon name="close" size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {list.length > 0 && <p className="ak-fine ak-sheet-foot">Очистка скрывает уведомления на этом устройстве.</p>}
      </div>
    </>
  );
}
