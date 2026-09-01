"use client";

import { useEffect, useState, useCallback, useRef } from "react";

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

export default function NotificationsModal({ open, onClose, onUnreadCountChange }: NotificationsModalProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/user/notifications");
      const result = await res.json();
      if (result.success) {
        setNotifications(result.data);
        const unread = result.data.filter((n: Notification) => !n.read).length;
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

  const hasNotifications = notifications.length > 0;

  return (
    <>
      {/* Backdrop — click anywhere outside to close */}
      <div
        className={`fixed inset-0 z-[90] transition-opacity duration-200 ${
          visible && open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — anchored under the bell on the top-right.
          On mobile: full-width minus 16px margin each side; on
          tablet+: fixed 380px panel aligned to the header's right
          padding. Animates from the top-right origin (where the
          bell sits) for a natural pop-out. */}
      <div
        ref={panelRef}
        className={`fixed z-[100] transition-all duration-200 ease-out origin-top-right
          top-[64px] sm:top-[72px]
          right-3 sm:right-5
          left-3 sm:left-auto
          sm:w-[380px]
          ${
            visible && open
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
          }`}
      >
        {/* Панель светлая, как и весь кабинет. Тёмная подложка с
            белым текстом осталась от прежней тёмной темы: на светлом
            корпусе заголовки уведомлений наследовали тёмные чернила и
            становились нечитаемыми на почти чёрном фоне. */}
        <div className="rounded-[20px] border border-[color:var(--px-line)] bg-[color:var(--px-surface)] shadow-[var(--px-lift-3)] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--px-line)]">
            <h3 className="font-medium text-[13px] text-[color:var(--px-text)]">Уведомления</h3>
            <div className="flex items-center gap-2">
              {hasNotifications && (
                <span className="text-[9px] sm:text-[10px] text-[color:var(--px-text-3)] bg-[color:var(--px-surface-2)] px-1.5 sm:px-2 py-0.5 rounded-full">
                  {notifications.length}
                </span>
              )}
              <button
                onClick={onClose}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[color:var(--px-text-3)] hover:bg-[color:var(--px-surface-2)] hover:text-[color:var(--px-text)] transition-colors"
                aria-label="Закрыть"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-4 sm:h-4">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content — scrollable */}
          <div
            className="overflow-y-auto overscroll-contain"
            style={{ maxHeight: "min(55vh, 55dvh)" }}
          >
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-[color:var(--px-accent)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !hasNotifications ? (
              <div className="text-center py-8 px-4">
                <div className="w-10 h-10 rounded-full bg-[color:var(--px-surface-2)] flex items-center justify-center mx-auto mb-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[color:var(--px-text-4)]">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <p className="text-[color:var(--px-text-3)] text-[11px] sm:text-xs">Нет уведомлений</p>
              </div>
            ) : (
              <div className="p-2 sm:p-2.5 space-y-1 sm:space-y-1.5">
                {notifications.map((n, i) => (
                  <div
                    key={n.id}
                    style={{ animationDelay: `${i * 0.05}s` }}
                    className={`p-2.5 sm:p-3 rounded-xl border transition-colors animate-fade-in-up opacity-0 ${
                      n.read
                        ? "bg-[color:var(--px-surface-2)] border-[color:var(--px-line)]"
                        : "bg-[color:var(--px-accent-dim)] border-[color:var(--px-accent-line)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5 sm:gap-2 mb-0.5">
                      <h4 className="font-semibold text-[11px] sm:text-xs leading-snug line-clamp-2 break-words min-w-0 text-[color:var(--px-text)]">{n.title}</h4>
                      {!n.read && (
                        <span className="w-1.5 h-1.5 bg-[color:var(--px-accent)] rounded-full shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-[10px] sm:text-[11px] md:text-xs text-[color:var(--px-text-2)] leading-relaxed break-words">{n.message}</p>
                    <p className="text-[9px] sm:text-[10px] text-[color:var(--px-text-4)] mt-1 sm:mt-1.5">{formatTime(n.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
