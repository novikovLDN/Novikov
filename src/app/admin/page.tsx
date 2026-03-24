"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import PageContainer from "@/components/PageContainer";
import LoadingSpinner from "@/components/LoadingSpinner";

interface UserInfo {
  id: string;
  email: string;
  createdAt: string;
  subscriptionEnd: string;
  telegramLinked: boolean;
  referrals: number;
  paidReferrals: number;
  isActive: boolean;
}

interface Stats {
  total: number;
  active: number;
  expired: number;
  telegramLinked: number;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  target: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [tab, setTab] = useState<"analytics" | "users" | "notifications">("analytics");

  // Notification form
  const [nTitle, setNTitle] = useState("");
  const [nMessage, setNMessage] = useState("");
  const [nTarget, setNTarget] = useState("all");
  const [nSending, setNSending] = useState(false);
  const [nSuccess, setNSuccess] = useState(false);

  // Search
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, notifRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/notifications"),
      ]);

      const usersData = await usersRes.json();
      const notifData = await notifRes.json();

      if (!usersData.success) {
        setError(usersData.error || "Доступ запрещён");
        return;
      }

      setUsers(usersData.data.users);
      setStats(usersData.data.stats);
      setNotifications(notifData.success ? notifData.data : []);
    } catch {
      setError("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nTitle.trim() || !nMessage.trim()) return;

    setNSending(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: nTitle, message: nMessage, target: nTarget }),
      });
      const result = await res.json();
      if (result.success) {
        setNTitle("");
        setNMessage("");
        setNTarget("all");
        setNSuccess(true);
        setTimeout(() => setNSuccess(false), 3000);
        fetchData();
      }
    } catch {
      // silent
    } finally {
      setNSending(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await fetch(`/api/admin/notifications?id=${id}`, { method: "DELETE" });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // silent
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex flex-col">
        <Header showBack onBack={() => router.push("/dashboard")} />
        <PageContainer className="flex items-center justify-center">
          <LoadingSpinner size="lg" className="text-primary" />
        </PageContainer>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-dvh flex flex-col">
        <Header showBack onBack={() => router.push("/dashboard")} />
        <PageContainer className="flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-danger/15 flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className="text-danger font-semibold mb-1">{error}</p>
            <p className="text-muted text-sm">Эта страница доступна только администратору</p>
          </div>
        </PageContainer>
      </div>
    );
  }

  const filteredUsers = search
    ? users.filter((u) => u.email.toLowerCase().includes(search.toLowerCase()))
    : users;

  return (
    <div className="min-h-dvh flex flex-col">
      <Header showBack onBack={() => router.push("/dashboard")} />

      <PageContainer className="space-y-4">
        <h1 className="text-2xl font-bold animate-fade-in-up">Админ-панель</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-card border border-border/50 rounded-xl p-1 animate-fade-in-up">
          {(["analytics", "users", "notifications"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t ? "bg-foreground text-background" : "text-muted hover:text-foreground"
              }`}
            >
              {t === "analytics" ? "Аналитика" : t === "users" ? "Пользователи" : "Уведомления"}
            </button>
          ))}
        </div>

        {/* Analytics Tab */}
        {tab === "analytics" && stats && (
          <div className="space-y-3 animate-fade-in-up">
            <div className="grid grid-cols-2 gap-2.5">
              <StatCard label="Всего" value={stats.total} color="primary" />
              <StatCard label="Активных" value={stats.active} color="success" />
              <StatCard label="Истекших" value={stats.expired} color="danger" />
              <StatCard label="Telegram" value={stats.telegramLinked} color="telegram" />
            </div>

            <div className="bg-card border border-border/50 rounded-2xl p-4">
              <h3 className="font-semibold text-sm mb-3">Последние регистрации</h3>
              <div className="space-y-2">
                {users.slice(0, 5).map((u) => (
                  <div key={u.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/30 last:border-0">
                    <span className="text-muted-light truncate mr-2">{u.email}</span>
                    <span className="text-xs text-muted shrink-0">{formatDate(u.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {tab === "users" && (
          <div className="space-y-3 animate-fade-in-up">
            <input
              type="text"
              placeholder="Поиск по email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-card border border-border text-foreground placeholder-muted focus:outline-none focus:border-primary transition-colors text-sm"
            />

            <p className="text-xs text-muted">Найдено: {filteredUsers.length}</p>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {filteredUsers.map((u) => (
                <div key={u.id} className="bg-card border border-border/50 rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium truncate mr-2">{u.email}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      u.isActive ? "bg-success-light text-success" : "bg-danger/15 text-danger"
                    }`}>
                      {u.isActive ? "Активен" : "Истёк"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted">
                    <span>До: {formatDate(u.subscriptionEnd)}</span>
                    <span>Реф: {u.referrals}</span>
                    {u.telegramLinked && <span className="text-telegram">TG</span>}
                  </div>
                  <button
                    onClick={() => { setTab("notifications"); setNTarget(u.id); }}
                    className="mt-2 text-xs text-primary hover:text-primary-hover transition-colors"
                  >
                    Отправить уведомление
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {tab === "notifications" && (
          <div className="space-y-4 animate-fade-in-up">
            {/* Send form */}
            <form onSubmit={handleSendNotification} className="bg-card border border-border/50 rounded-2xl p-4 space-y-3">
              <h3 className="font-semibold text-sm">Новое уведомление</h3>

              <input
                type="text"
                placeholder="Заголовок"
                value={nTitle}
                onChange={(e) => setNTitle(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-background border border-border text-foreground placeholder-muted focus:outline-none focus:border-primary transition-colors text-sm"
                required
              />

              <textarea
                placeholder="Сообщение"
                value={nMessage}
                onChange={(e) => setNMessage(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder-muted focus:outline-none focus:border-primary transition-colors text-sm resize-none"
                required
              />

              <div className="flex items-center gap-2">
                <label className="text-xs text-muted">Кому:</label>
                <select
                  value={nTarget}
                  onChange={(e) => setNTarget(e.target.value)}
                  className="flex-1 h-9 px-3 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
                >
                  <option value="all">Всем пользователям</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.email}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={nSending}
                className="w-full h-11 rounded-xl bg-foreground text-background font-semibold text-sm hover:bg-foreground/90 disabled:opacity-40 transition-all btn-press flex items-center justify-center gap-2"
              >
                {nSending ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Отправка...
                  </>
                ) : nSuccess ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Отправлено!
                  </>
                ) : (
                  "Отправить уведомление"
                )}
              </button>
            </form>

            {/* Sent notifications */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Отправленные</h3>
              {notifications.length === 0 ? (
                <p className="text-muted text-sm text-center py-4">Нет уведомлений</p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="bg-card border border-border/50 rounded-xl p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm truncate">{n.title}</h4>
                        <p className="text-xs text-muted mt-0.5 line-clamp-2">{n.message}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-muted/60">{formatDate(n.createdAt)}</span>
                          <span className="text-[10px] bg-card-hover px-1.5 py-0.5 rounded">
                            {n.target === "all" ? "Все" : users.find((u) => u.id === n.target)?.email || "Пользователь"}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteNotification(n.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-danger/15 transition-colors shrink-0"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </PageContainer>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    primary: "bg-primary/10 text-primary border-primary/20",
    success: "bg-success-light text-success border-success/20",
    danger: "bg-danger/10 text-danger border-danger/20",
    telegram: "bg-telegram/10 text-telegram border-telegram/20",
  };

  return (
    <div className={`rounded-xl border p-4 text-center ${colorMap[color] || ""}`}>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs mt-0.5 opacity-80">{label}</p>
    </div>
  );
}
