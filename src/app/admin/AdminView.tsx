"use client";

import { useState, useEffect, useCallback, useRef, type CSSProperties, type KeyboardEvent } from "react";
import Link from "next/link";
import Icon, { type IconName } from "@/components/pixel/Icon";
import RemnawaveMigrationCard from "@/components/RemnawaveMigrationCard";
import BotSyncToggleCard from "@/components/BotSyncToggleCard";
import GhostDateCleanupCard from "@/components/GhostDateCleanupCard";
import PanelSyncAuditCard from "@/components/PanelSyncAuditCard";
import { AdminConfirmProvider, AdminConfirmOutlet, useAdminConfirm, Spin } from "./AdminConfirm";
import AdminUserDetail from "./AdminUserDetail";
import { PLAN_LABELS, planTone, formatDate, formatDateTime, type UserInfo } from "./admin-shared";
import "@/app/work-atlas.css";
import "./admin-atlas.css";

/**
 * Админ-панель на корпусе «Атлас-издание» — рабочий экран в стиле кабинета.
 *
 * Сверху сводка (шесть плиток), под ней доска с вкладками: операции,
 * пользователи, журнал, уведомления. Логика прежней страницы перенесена
 * без изменений: те же три запроса при загрузке, те же POST/DELETE,
 * та же проверка прав (API отвечает 403 → «Доступ запрещён»).
 *
 * Что добавлено поверх логики (только отображение): сводка «новых за
 * 7 дней» и «общий IP» из того же списка, фильтр по статусу рядом с
 * поиском, подтверждение удаления уведомления, ошибки у каждого действия.
 *
 * Движение — admin-atlas.css, раздел «Движение».
 */

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

interface AuditLogItem {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  details: string | null;
  ip: string | null;
  createdAt: string;
}

type Tone = "warn" | "off" | "ink" | "mute" | undefined;

const ACTION_LABELS: Record<string, { label: string; tone: Tone }> = {
  "user.register": { label: "Регистрация", tone: undefined },
  "user.login": { label: "Вход", tone: "mute" },
  "payment.success": { label: "Оплата", tone: "ink" },
  "payment.canceled": { label: "Оплата отменена", tone: "off" },
  "admin.grant": { label: "Выдача подписки", tone: undefined },
  "admin.revoke": { label: "Отзыв подписки", tone: "off" },
  "admin.regen": { label: "Обновление ключа", tone: "warn" },
};

type Tab = "analytics" | "users" | "logs" | "notifications";
/** short — подпись нижней панели на телефоне (четыре кнопки в 296px). */
const TABS: { key: Tab; label: string; short: string; icon: IconName }[] = [
  { key: "analytics", label: "Операции", short: "Операции", icon: "bolt" },
  { key: "users", label: "Пользователи", short: "Клиенты", icon: "users" },
  { key: "logs", label: "Журнал", short: "Журнал", icon: "clock" },
  { key: "notifications", label: "Уведомления", short: "Рассылка", icon: "bell" },
];

type Filter = "all" | "active" | "expired";

const at = (i: number) => ({ "--i": i }) as CSSProperties;
const WEEK = 7 * 864e5;

export default function AdminView() {
  return (
    <AdminConfirmProvider>
      <AdminScreen />
    </AdminConfirmProvider>
  );
}

function AdminScreen() {
  const confirm = useAdminConfirm();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [tab, setTab] = useState<Tab>("analytics");
  const [refreshing, setRefreshing] = useState(false);

  // Notification form (global)
  const [nTitle, setNTitle] = useState("");
  const [nMessage, setNMessage] = useState("");
  const [nTarget, setNTarget] = useState("all");
  const [nSending, setNSending] = useState(false);
  const [nSuccess, setNSuccess] = useState(false);
  const [nError, setNError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Search
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  // Selected user
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ analytics: null, users: null, logs: null, notifications: null });

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, notifRes, logsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/notifications"),
        fetch("/api/admin/logs"),
      ]);

      const usersData = await usersRes.json();
      const notifData = await notifRes.json();
      const logsData = await logsRes.json();

      if (!usersData.success) {
        setError(usersData.error || "Доступ запрещён");
        return;
      }

      setUsers(usersData.data.users);
      setStats(usersData.data.stats);
      setAuditLogs(logsData.success ? logsData.data : []);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);

  // Телефон и планшет: карточка пользователя стоит над списком — после
  // выбора подводим к ней, иначе выбор выглядит как «ничего не случилось».
  useEffect(() => {
    if (!selectedUser || !detailRef.current) return;
    if (window.matchMedia("(min-width: 1100px)").matches) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    detailRef.current.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    // только при смене выбранного
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser?.id]);

  const refresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const selectTab = (t: Tab) => {
    setTab(t);
    if (t !== "users") setSelectedUser(null);
  };

  // Нижняя панель на телефоне: после смены раздела — к началу доски,
  // иначе новый раздел открывается где-то под прокрученным старым.
  const selectFromBar = (t: Tab) => {
    selectTab(t);
    const board = boardRef.current;
    if (!board) return;
    const head = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--a-head-h")) || 64;
    const top = board.getBoundingClientRect().top + window.scrollY - head - 12;
    if (window.scrollY > top) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
    }
  };

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const n = TABS.length;
    const next = e.key === "Home" ? 0 : e.key === "End" ? n - 1 : (idx + (e.key === "ArrowRight" ? 1 : -1) + n) % n;
    selectTab(TABS[next].key);
    tabRefs.current[TABS[next].key]?.focus();
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nTitle.trim() || !nMessage.trim()) return;

    setNSending(true);
    setNError(null);
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
      } else {
        setNError(result.error || "Не удалось отправить");
      }
    } catch {
      setNError("Ошибка сети");
    } finally {
      setNSending(false);
    }
  };

  const handleDeleteNotification = async (n: NotificationItem) => {
    const ok = await confirm({
      title: "Удалить уведомление?",
      text: `«${n.title}» пропадёт у получателей. Вернуть его будет нельзя.`,
      confirmLabel: "Удалить",
    });
    if (!ok) return;
    setDeletingId(n.id);
    setDeleteError(null);
    try {
      await fetch(`/api/admin/notifications?id=${n.id}`, { method: "DELETE" });
      setNotifications((prev) => prev.filter((x) => x.id !== n.id));
    } catch {
      setDeleteError("Не удалось удалить — ошибка сети");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <main id="main" className="a-main ak adm" aria-busy="true">
        <div className="a-field">
          <p className="b-sr" aria-live="polite">Загружаем админ-панель…</p>
          <div className="adm-skels" aria-hidden>
            <div className="ak-skel adm-skel-top" />
            <div className="ak-skel" />
            <div className="ak-skel" />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main id="main" className="a-main ak adm">
        <div className="a-field">
          <section className="ak-card adm-denied" data-sheet="24" style={at(0)} aria-labelledby="adm-denied-h">
            <div className="ak-card-head">
              <p className="ak-eyebrow">Админ-панель</p>
              <span className="ak-status" data-tone="off"><i />Нет доступа</span>
            </div>
            <span className="adm-denied-ico" aria-hidden><Icon name="lock" size={24} /></span>
            <h1 id="adm-denied-h" className="ak-h1 adm-denied-h">{error}</h1>
            <p className="ak-text">Эта страница доступна только администратору.</p>
            <div className="ak-actions">
              <Link href="/dashboard" className="a-btn a-btn-primary">
                В кабинет
                <Icon name="arrow-right" size={16} />
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const q = search.toLowerCase();
  const filteredUsers = users.filter(
    (u) =>
      (!search || u.email.toLowerCase().includes(q)) &&
      (filter === "all" || (filter === "active" ? u.isActive : !u.isActive)),
  );

  const now = Date.now();
  const newThisWeek = users.filter((u) => now - new Date(u.createdAt).getTime() < WEEK).length;
  const sharedIp = users.filter((u) => u.accountsOnIp > 1).length;
  const activeShare = stats && stats.total > 0 ? stats.active / stats.total : 0;
  const counts: Record<Tab, number | null> = {
    analytics: null,
    users: users.length,
    logs: auditLogs.length,
    notifications: notifications.length,
  };

  return (
    <main id="main" className="a-main ak adm">
      <div className="a-field">
        {/* ── Верх ─────────────────────────────────────────────────── */}
        <section className="ak-top" data-sheet="24" style={at(0)} aria-label="Админ-панель">
          <div>
            <p className="ak-kicker a-wide">Atlas Secure · управление</p>
            <h1 className="ak-h1">Админ-панель</h1>
          </div>
          <div className="ak-tools">
            <button
              type="button"
              className="a-btn ak-btn-soft"
              onClick={refresh}
              disabled={refreshing}
              aria-label={refreshing ? "Обновляем данные" : "Обновить данные"}
            >
              {refreshing ? <Spin /> : <Icon name="refresh" size={16} />}
              <span className="ak-lbl">{refreshing ? "Обновляем…" : "Обновить данные"}</span>
            </button>
          </div>
        </section>

        <div className="ak-board" ref={boardRef}>
          <nav className="ak-bar" aria-label="Разделы админки">
            <span className="ak-avatar" aria-hidden><Icon name="shield" size={18} /></span>
            <div className="ak-pills" role="tablist" aria-label="Разделы админки">
              {TABS.map((t, idx) => (
                <button
                  key={t.key}
                  ref={(el) => { tabRefs.current[t.key] = el; }}
                  type="button"
                  role="tab"
                  id={`adm-tab-${t.key}`}
                  aria-selected={tab === t.key}
                  aria-controls={`adm-panel-${t.key}`}
                  tabIndex={tab === t.key ? 0 : -1}
                  className="ak-pill adm-pill"
                  onClick={() => selectTab(t.key)}
                  onKeyDown={(e) => onTabKey(e, idx)}
                >
                  {t.label}
                  {counts[t.key] !== null && <span className="adm-pill-n a-num">{counts[t.key]}</span>}
                </button>
              ))}
            </div>
            <span className="ak-bar-plan">Администратор</span>
          </nav>

          {/* ── Сводка ─────────────────────────────────────────────── */}
          {stats && (
            <section className="ak-card adm-summary" data-sheet="24" style={at(1)} aria-labelledby="adm-sum-h">
              <div className="ak-card-head">
                <h2 id="adm-sum-h" className="ak-eyebrow">Сводка</h2>
                <span className="ak-plan a-num">на {formatDateTime(new Date().toISOString())}</span>
              </div>
              <ul className="adm-stats">
                <li className="ak-stat">
                  <span>Всего</span>
                  <b className="a-num">{stats.total}</b>
                </li>
                <li className="ak-stat adm-stat-share" style={{ "--p": activeShare } as CSSProperties}>
                  <span>Активных</span>
                  <b className="a-num">{stats.active}</b>
                  <em className="adm-share" aria-label={`${Math.round(activeShare * 100)}% от всех`}>
                    <i />
                  </em>
                  <small className="a-num">{Math.round(activeShare * 100)}% от всех</small>
                </li>
                <li className="ak-stat" data-tone={stats.expired > 0 ? "off" : undefined}>
                  <span>Истёкших</span>
                  <b className="a-num">{stats.expired}</b>
                </li>
                <li className="ak-stat">
                  <span>С Telegram</span>
                  <b className="a-num">{stats.telegramLinked}</b>
                </li>
                <li className="ak-stat">
                  <span>Новых за 7 дней</span>
                  <b className="a-num">{newThisWeek}</b>
                </li>
                <li className="ak-stat" data-tone={sharedIp > 0 ? "warn" : undefined}>
                  <span>Общий IP</span>
                  <b className="a-num">{sharedIp}</b>
                </li>
              </ul>
            </section>
          )}

          {/* ── Операции ───────────────────────────────────────────── */}
          {tab === "analytics" && (
            <div id="adm-panel-analytics" role="tabpanel" aria-labelledby="adm-tab-analytics" className="adm-panel adm-grid">
              <BotSyncToggleCard i={2} />

              <section className="ak-card adm-recent" data-sheet="24" style={at(3)} aria-labelledby="adm-recent-h">
                <div className="ak-card-head">
                  <h2 id="adm-recent-h" className="ak-eyebrow">Последние регистрации</h2>
                  <button type="button" className="adm-link" onClick={() => selectTab("users")}>
                    Все пользователи
                    <Icon name="arrow-right" size={16} />
                  </button>
                </div>
                {users.length === 0 ? (
                  <p className="ak-fine">Пока никого нет.</p>
                ) : (
                  <ul className="adm-recent-list">
                    {users.slice(0, 5).map((u) => (
                      <li key={u.id}>
                        <button
                          type="button"
                          className="adm-recent-row"
                          onClick={() => {
                            setTab("users");
                            setSelectedUser(u);
                          }}
                        >
                          <span className="adm-recent-mail">{u.email}</span>
                          <span className="adm-recent-date a-num">{formatDate(u.createdAt)}</span>
                          <Icon name="arrow-right" size={16} className="adm-recent-arrow" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <PanelSyncAuditCard i={4} />
              <GhostDateCleanupCard i={5} />
              <RemnawaveMigrationCard i={6} />
            </div>
          )}

          {/* ── Пользователи ───────────────────────────────────────── */}
          {tab === "users" && (
            <div id="adm-panel-users" role="tabpanel" aria-labelledby="adm-tab-users" className="adm-panel adm-users" data-split={selectedUser ? "" : undefined}>
              {selectedUser && (
                <div className="adm-detail-slot" ref={detailRef}>
                  <AdminUserDetail
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                    onRefresh={fetchData}
                    formatDateTime={formatDateTime}
                  />
                </div>
              )}

              <section className="ak-card adm-list-card adm-still" data-sheet="24" style={at(2)} aria-labelledby="adm-users-h">
                <div className="ak-card-head">
                  <h2 id="adm-users-h" className="ak-eyebrow">Пользователи</h2>
                  <p className="ak-plan a-num" aria-live="polite">Найдено: {filteredUsers.length}</p>
                </div>

                <div className="adm-find">
                  <label className="adm-search">
                    <span className="b-sr">Поиск по email</span>
                    <input
                      type="search"
                      placeholder="Поиск по email"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="adm-input"
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </label>
                  <div className="adm-seg" role="group" aria-label="Статус подписки">
                    {(["all", "active", "expired"] as const).map((f) => (
                      <button key={f} type="button" className="adm-seg-btn" aria-pressed={filter === f} onClick={() => setFilter(f)}>
                        {f === "all" ? "Все" : f === "active" ? "Активные" : "Истёкшие"}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredUsers.length === 0 ? (
                  <p className="adm-empty">Никого не нашли. Проверьте запрос или сбросьте фильтр.</p>
                ) : (
                  <div className="adm-rows-box">
                    <div className="adm-rows-head" aria-hidden>
                      <span>ID</span>
                      <span>Email</span>
                      <span>Тариф</span>
                      <span>До</span>
                      <span>Реф.</span>
                      <span>TG</span>
                      <span>IP регистрации</span>
                    </div>
                    <ul className="adm-rows">
                      {filteredUsers.map((u) => {
                        const planKey = u.isActive ? u.subscriptionPlan : "expired";
                        const on = selectedUser?.id === u.id;
                        return (
                          <li key={u.id}>
                            <button
                              type="button"
                              className="adm-row"
                              aria-pressed={on}
                              onClick={() => setSelectedUser(on ? null : u)}
                            >
                              <span className="adm-c-id a-num">{u.publicId || "—"}</span>
                              <span className="adm-c-mail">{u.email}</span>
                              <span className="adm-c-plan">
                                <span className="adm-tag" data-tone={planTone(planKey)}>{PLAN_LABELS[planKey] || planKey}</span>
                              </span>
                              <span className="adm-c-end a-num"><i className="adm-k">До </i>{formatDate(u.subscriptionEnd)}</span>
                              <span className="adm-c-ref a-num"><i className="adm-k">Реф. </i>{u.referrals}</span>
                              <span className="adm-c-tg">
                                {u.telegramLinked ? <><Icon name="send" size={14} /><i className="adm-k"> Telegram</i></> : <span className="adm-dash" aria-hidden>—</span>}
                              </span>
                              <span className="adm-c-ip a-num" data-tone={u.accountsOnIp > 2 ? "off" : u.accountsOnIp > 1 ? "warn" : undefined}>
                                {u.registrationIp ? (
                                  <>
                                    <i className="adm-k">IP </i>
                                    <span className="adm-ip">{u.registrationIp}</span>
                                    {u.accountsOnIp > 1 && <b> · {u.accountsOnIp} акк.</b>}
                                  </>
                                ) : (
                                  <span className="adm-dash" aria-hidden>—</span>
                                )}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ── Журнал ─────────────────────────────────────────────── */}
          {tab === "logs" && (
            <div id="adm-panel-logs" role="tabpanel" aria-labelledby="adm-tab-logs" className="adm-panel">
              <section className="ak-card adm-list-card adm-still" data-sheet="24" style={at(2)} aria-labelledby="adm-logs-h">
                <div className="ak-card-head">
                  <h2 id="adm-logs-h" className="ak-eyebrow">Журнал событий</h2>
                  <p className="ak-plan a-num">Последние {auditLogs.length}</p>
                </div>
                {auditLogs.length === 0 ? (
                  <p className="adm-empty">Событий пока нет.</p>
                ) : (
                  <div className="adm-rows-box">
                    <div className="adm-log-head" aria-hidden>
                      <span>Событие</span>
                      <span>Пользователь</span>
                      <span>Подробности</span>
                      <span>IP</span>
                      <span>Время</span>
                    </div>
                    <ul className="adm-rows">
                      {auditLogs.map((log) => {
                        const meta = ACTION_LABELS[log.action] || { label: log.action, tone: "mute" as Tone };
                        return (
                          <li key={log.id} className="adm-log">
                            <span className="adm-l-act"><span className="adm-tag" data-tone={meta.tone}>{meta.label}</span></span>
                            <span className="adm-l-user">{log.userEmail || "—"}</span>
                            <span className="adm-l-det" data-empty={log.details ? undefined : ""}>{log.details || <span className="adm-dash" aria-hidden>—</span>}</span>
                            <span className="adm-l-ip a-num" data-empty={log.ip ? undefined : ""}>{log.ip || <span className="adm-dash" aria-hidden>—</span>}</span>
                            <span className="adm-l-time a-num">
                              {new Date(log.createdAt).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ── Уведомления ────────────────────────────────────────── */}
          {tab === "notifications" && (
            <div id="adm-panel-notifications" role="tabpanel" aria-labelledby="adm-tab-notifications" className="adm-panel adm-grid">
              <form onSubmit={handleSendNotification} className="ak-card adm-compose adm-still" data-sheet="24" style={at(2)} aria-labelledby="adm-new-h">
                <div className="ak-card-head">
                  <h2 id="adm-new-h" className="ak-eyebrow">Новое уведомление</h2>
                  <Icon name="bell" size={18} className="adm-head-ico" />
                </div>

                <label className="adm-f">
                  <span className="adm-f-label">Заголовок</span>
                  <input type="text" value={nTitle} onChange={(e) => setNTitle(e.target.value)} className="adm-input" required />
                </label>

                <label className="adm-f">
                  <span className="adm-f-label">Сообщение</span>
                  <textarea value={nMessage} onChange={(e) => setNMessage(e.target.value)} rows={4} className="adm-input adm-area" required />
                </label>

                <label className="adm-f">
                  <span className="adm-f-label">Кому</span>
                  <select value={nTarget} onChange={(e) => setNTarget(e.target.value)} className="adm-input adm-select">
                    <option value="all">Всем пользователям</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.email}</option>
                    ))}
                  </select>
                </label>

                {nError && <p className="ak-err" role="alert">{nError}</p>}

                <div className="ak-actions">
                  <button type="submit" disabled={nSending} className="a-btn a-btn-primary" data-state={nSuccess ? "ok" : undefined}>
                    {nSending ? (
                      <><Spin />Отправляем…</>
                    ) : nSuccess ? (
                      <><Icon name="check" size={16} />Отправлено</>
                    ) : (
                      <><Icon name="send" size={16} />Отправить уведомление</>
                    )}
                  </button>
                </div>
              </form>

              <section className="ak-card adm-sent adm-still" data-sheet="24" style={at(3)} aria-labelledby="adm-sent-h">
                <div className="ak-card-head">
                  <h2 id="adm-sent-h" className="ak-eyebrow">Отправленные</h2>
                  <span className="ak-plan a-num">{notifications.length}</span>
                </div>
                {deleteError && <p className="ak-err" role="alert">{deleteError}</p>}
                {notifications.length === 0 ? (
                  <p className="adm-empty">Уведомлений пока нет.</p>
                ) : (
                  <ul className="adm-sent-list">
                    {notifications.map((n) => (
                      <li key={n.id} className="adm-sent-row">
                        <div className="adm-sent-copy">
                          <p className="adm-sent-title">{n.title}</p>
                          <p className="adm-sent-text">{n.message}</p>
                          <p className="adm-sent-meta">
                            <span className="a-num">{formatDate(n.createdAt)}</span>
                            <span className="adm-tag" data-tone={n.target === "all" ? "ink" : "mute"}>
                              {n.target === "all" ? "Все" : users.find((u) => u.id === n.target)?.email || "Пользователь"}
                            </span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteNotification(n)}
                          disabled={deletingId === n.id}
                          className="ak-icon adm-del"
                          aria-label={`Удалить уведомление «${n.title}»`}
                        >
                          {deletingId === n.id ? <Spin /> : <Icon name="close" size={16} />}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </div>
      </div>

      <AdminConfirmOutlet />

      {/* Телефон: пилюли разделов скрыты (work-atlas.css), разделы — внизу. */}
      <nav className="ak-tabbar adm-tabbar" aria-label="Разделы админки">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className="ak-tab adm-tab"
            aria-current={tab === t.key ? "true" : undefined}
            aria-label={counts[t.key] !== null ? `${t.label}: ${counts[t.key]}` : t.label}
            onClick={() => selectFromBar(t.key)}
          >
            <Icon name={t.icon} size={18} />
            <span className="adm-tab-lbl">{t.short}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}
