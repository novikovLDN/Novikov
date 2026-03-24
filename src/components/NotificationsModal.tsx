"use client";

import { useEffect, useState, useCallback } from "react";

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

  if (!open) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-card border border-border/50 rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[85dvh] overflow-hidden animate-scale-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-border/50 shrink-0">
          <h2 className="font-bold text-base sm:text-lg">Уведомления</h2>
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
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-card-hover flex items-center justify-center mx-auto mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <p className="text-muted text-sm">Нет уведомлений</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-xl border transition-colors ${
                    n.read
                      ? "bg-background border-border/30"
                      : "bg-primary/5 border-primary/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{n.title}</h3>
                    {!n.read && (
                      <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-muted leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-muted/60 mt-2">{formatTime(n.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
