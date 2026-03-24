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

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay to avoid closing on the same click that opens
    const timer = setTimeout(() => document.addEventListener("mousedown", handler), 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handler);
    };
  }, [open, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

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
    <div
      ref={panelRef}
      className={`fixed top-14 sm:top-16 right-2 sm:right-4 z-50 w-[calc(100vw-1rem)] sm:w-80 md:w-96 transition-all duration-200 ease-out origin-top-right ${
        visible && open
          ? "opacity-100 scale-100 translate-y-0"
          : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
      }`}
    >
      <div className="bg-card border border-border/50 rounded-2xl shadow-xl shadow-black/20 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
          <h3 className="font-bold text-sm">Уведомления</h3>
          {hasNotifications && (
            <span className="text-[10px] text-muted bg-background px-2 py-0.5 rounded-full">
              {notifications.length}
            </span>
          )}
        </div>

        {/* Content — scrollable, max 60vh */}
        <div
          className="overflow-y-auto overscroll-contain"
          style={{ maxHeight: "min(60vh, 60dvh)" }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !hasNotifications ? (
            <div className="text-center py-8 px-4">
              <div className="w-10 h-10 rounded-full bg-card-hover flex items-center justify-center mx-auto mb-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <p className="text-muted text-xs">Нет уведомлений</p>
            </div>
          ) : (
            <div className="p-2.5 space-y-1.5">
              {notifications.map((n, i) => (
                <div
                  key={n.id}
                  style={{ animationDelay: `${i * 0.05}s` }}
                  className={`p-3 rounded-xl border transition-colors animate-fade-in-up opacity-0 ${
                    n.read
                      ? "bg-background/50 border-border/20"
                      : "bg-primary/5 border-primary/15"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <h4 className="font-semibold text-xs leading-snug">{n.title}</h4>
                    {!n.read && (
                      <span className="w-1.5 h-1.5 bg-primary rounded-full shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-muted/50 mt-1.5">{formatTime(n.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
