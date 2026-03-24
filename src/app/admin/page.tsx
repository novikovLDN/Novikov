"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import PageContainer from "@/components/PageContainer";
import LoadingSpinner from "@/components/LoadingSpinner";

interface UserInfo {
  id: string;
  email: string;
  createdAt: string;
  subscriptionEnd: string;
  subscriptionPlan: string;
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

const PLAN_LABELS: Record<string, string> = {
  trial: "Пробный",
  basic: "Basic",
  plus: "Plus",
  expired: "Истёк",
};

const PLAN_COLORS: Record<string, string> = {
  trial: "bg-muted/20 text-muted",
  basic: "bg-primary/15 text-primary",
  plus: "bg-purple-500/15 text-purple-400",
  expired: "bg-danger/15 text-danger",
};

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

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [tab, setTab] = useState<"analytics" | "users" | "notifications">("analytics");

  // Notification form (global)
  const [nTitle, setNTitle] = useState("");
  const [nMessage, setNMessage] = useState("");
  const [nTarget, setNTarget] = useState("all");
  const [nSending, setNSending] = useState(false);
  const [nSuccess, setNSuccess] = useState(false);

  // Search
  const [search, setSearch] = useState("");

  // Selected user
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);

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

  // Update selectedUser when users list refreshes
  useEffect(() => {
    if (selectedUser) {
      const updated = users.find((u) => u.id === selectedUser.id);
      if (updated) setSelectedUser(updated);
    }
  }, [users]);

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

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
              onClick={() => { setTab(t); if (t !== "users") setSelectedUser(null); }}
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
            {/* Search */}
            <input
              type="text"
              placeholder="Поиск по email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-card border border-border text-foreground placeholder-muted focus:outline-none focus:border-primary transition-colors text-sm"
            />

            <p className="text-xs text-muted">Найдено: {filteredUsers.length}</p>

            {/* User Detail Panel */}
            {selectedUser && (
              <UserDetailPanel
                user={selectedUser}
                onClose={() => setSelectedUser(null)}
                onRefresh={fetchData}
                formatDateTime={formatDateTime}
              />
            )}

            {/* User List */}
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {filteredUsers.map((u) => {
                const planKey = u.isActive ? u.subscriptionPlan : "expired";
                return (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUser(selectedUser?.id === u.id ? null : u)}
                    className={`w-full text-left bg-card border rounded-xl p-3.5 transition-all ${
                      selectedUser?.id === u.id
                        ? "border-primary/40 bg-primary/5"
                        : "border-border/50 hover:border-border/80"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium truncate mr-2">{u.email}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${PLAN_COLORS[planKey] || PLAN_COLORS.trial}`}>
                        {PLAN_LABELS[planKey] || planKey}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted">
                      <span>До: {formatDate(u.subscriptionEnd)}</span>
                      <span>Реф: {u.referrals}</span>
                      {u.telegramLinked && <span className="text-telegram">TG</span>}
                    </div>
                  </button>
                );
              })}
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

// ─── User Detail Panel ─────────────────────────────────────────

interface UserDetailPanelProps {
  user: UserInfo;
  onClose: () => void;
  onRefresh: () => void;
  formatDateTime: (d: string) => string;
}

function UserDetailPanel({ user, onClose, onRefresh, formatDateTime }: UserDetailPanelProps) {
  const [grantPlan, setGrantPlan] = useState<"basic" | "plus">("basic");
  const [grantDuration, setGrantDuration] = useState("30d");
  const [granting, setGranting] = useState(false);
  const [grantSuccess, setGrantSuccess] = useState(false);

  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifSending, setNotifSending] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState(false);

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
      }
    } catch {
      // silent
    } finally {
      setGranting(false);
    }
  };

  const handleSendNotif = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;
    setNotifSending(true);
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
      }
    } catch {
      // silent
    } finally {
      setNotifSending(false);
    }
  };

  const planKey = user.isActive ? user.subscriptionPlan : "expired";
  const isExpired = !user.isActive;

  return (
    <div className="bg-card border border-primary/30 rounded-2xl overflow-hidden animate-fade-in-up">
      {/* Header */}
      <div className="bg-primary/8 px-4 sm:px-5 py-3.5 border-b border-primary/20 flex items-center justify-between">
        <div className="min-w-0">
          <h3 className="font-bold text-sm sm:text-base truncate">{user.email}</h3>
          <p className="text-xs text-muted mt-0.5">Регистрация: {formatDateTime(user.createdAt)}</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-card-hover transition-colors shrink-0 ml-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="px-4 sm:px-5 py-4 space-y-4">
        {/* Subscription Timer */}
        <div className="bg-background border border-border/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted font-medium">Текущий тариф</span>
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${PLAN_COLORS[planKey] || PLAN_COLORS.trial}`}>
              {PLAN_LABELS[planKey] || planKey}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <div className={`text-xl sm:text-2xl font-bold tabular-nums ${isExpired ? "text-danger" : "text-foreground"}`}>
              {timeLeft}
            </div>
          </div>

          <p className="text-[11px] text-muted mt-1.5">
            {isExpired ? "Подписка истекла" : `До: ${formatDateTime(user.subscriptionEnd)}`}
          </p>

          <div className="flex items-center gap-3 mt-2 text-xs text-muted">
            <span>Рефералы: {user.referrals}</span>
            <span>Оплат: {user.paidReferrals}</span>
            {user.telegramLinked && (
              <span className="text-telegram flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.94 8.13l-1.97 9.28c-.15.67-.55.83-1.12.52l-3.08-2.27-1.49 1.43c-.16.16-.3.3-.62.3l.22-3.15 5.72-5.17c.25-.22-.05-.34-.39-.13L8.44 13.7l-3.02-.94c-.66-.21-.67-.66.14-.97l11.8-4.55c.55-.2 1.03.13.85.97l-.27-.08z"/></svg>
                Привязан
              </span>
            )}
          </div>
        </div>

        {/* Grant Subscription */}
        <div className="bg-background border border-border/50 rounded-xl p-4">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
            Выдать подписку
          </h4>

          {/* Plan selector */}
          <div className="flex gap-2 mb-3">
            {(["basic", "plus"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setGrantPlan(p)}
                className={`flex-1 h-10 rounded-xl text-sm font-medium transition-all border ${
                  grantPlan === p
                    ? p === "plus"
                      ? "bg-purple-500/15 border-purple-500/40 text-purple-400"
                      : "bg-primary/15 border-primary/40 text-primary"
                    : "bg-card border-border hover:bg-card-hover"
                }`}
              >
                {p === "plus" ? "Plus" : "Basic"}
              </button>
            ))}
          </div>

          {/* Duration selector */}
          <div className="flex gap-1.5 flex-wrap mb-3">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setGrantDuration(opt.key)}
                className={`h-8 px-2.5 rounded-lg text-xs font-medium transition-all border ${
                  grantDuration === opt.key
                    ? "bg-foreground text-background border-foreground"
                    : "bg-card border-border hover:bg-card-hover"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleGrant}
            disabled={granting}
            className="w-full h-11 rounded-xl font-semibold text-sm transition-all btn-press flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary-hover disabled:opacity-40"
          >
            {granting ? (
              <>
                <LoadingSpinner size="sm" />
                Выдаю...
              </>
            ) : grantSuccess ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Подписка выдана!
              </>
            ) : (
              `Выдать ${grantPlan === "plus" ? "Plus" : "Basic"} на ${DURATION_OPTIONS.find((o) => o.key === grantDuration)?.label}`
            )}
          </button>
        </div>

        {/* Personal Notification */}
        <form onSubmit={handleSendNotif} className="bg-background border border-border/50 rounded-xl p-4 space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            Персональное уведомление
          </h4>

          <input
            type="text"
            placeholder="Заголовок"
            value={notifTitle}
            onChange={(e) => setNotifTitle(e.target.value)}
            className="w-full h-10 px-3 rounded-lg bg-card border border-border text-foreground placeholder-muted focus:outline-none focus:border-primary transition-colors text-sm"
            required
          />

          <textarea
            placeholder="Сообщение"
            value={notifMessage}
            onChange={(e) => setNotifMessage(e.target.value)}
            rows={2}
            className="w-full px-3 py-2.5 rounded-lg bg-card border border-border text-foreground placeholder-muted focus:outline-none focus:border-primary transition-colors text-sm resize-none"
            required
          />

          <button
            type="submit"
            disabled={notifSending}
            className="w-full h-10 rounded-xl font-semibold text-sm transition-all btn-press flex items-center justify-center gap-2 border border-border hover:bg-card-hover disabled:opacity-40"
          >
            {notifSending ? (
              <>
                <LoadingSpinner size="sm" />
                Отправка...
              </>
            ) : notifSuccess ? (
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
      </div>
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────

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
