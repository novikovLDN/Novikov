"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import Link from "next/link";
import Icon, { type IconName } from "@/components/pixel/Icon";
import HealthSection, { overallTone } from "@/components/admin/HealthSection";
import BusinessSection from "@/components/admin/BusinessSection";
import UsersSection from "@/components/admin/UsersSection";
import ServiceSection from "@/components/admin/ServiceSection";
import { Dot } from "@/components/admin/Viz";
import { AdminConfirmProvider, AdminConfirmOutlet, Spin } from "./AdminConfirm";
import {
  formatClock,
  getJson,
  isErr,
  num,
  type AuditLogItem,
  type NotificationItem,
  type Overview,
  type Probe,
  type Tone,
  type UserInfo,
  type UsersStats,
} from "./admin-shared";
import "@/app/work-atlas.css";
import "./admin-atlas.css";

/**
 * Админ-панель на корпусе «Атлас» — рабочий экран в языке кабинета:
 * доска, белые панели на сером поле, одна тёмная плита на раздел,
 * пилюли разделов сверху, на телефоне — вкладки внизу.
 *
 * Четыре раздела вместо прежних четырёх вкладок «про всё сразу»:
 *   Состояние     — жива ли панель, ноды, база, очередь (по умолчанию)
 *   Бизнес        — выручка, тарифы, воронка, аудитория, события
 *   Пользователи  — поиск, фильтры, карточка: выдать / забрать,
 *                   устройства, IP-адреса, история
 *   Сервис        — сверки, оплаты, бот, диагностика, рассылка, журнал
 *
 * Загрузка — пять независимых запросов; у каждого своя ошибка, и сбой
 * одного не прячет остальные. Сводка обновляется раз в минуту и стоит
 * на паузе, пока вкладка браузера скрыта. Раздел — в адресе (#users),
 * перезагрузка возвращает туда же.
 *
 * Права проверяют API (verifyAdmin → 403): первый ответ 403 — экран
 * «Нет доступа», интерфейс админки чужому не показывается.
 */

type Tab = "health" | "business" | "users" | "service";
const TABS: { key: Tab; label: string; short: string; icon: IconName }[] = [
  { key: "health", label: "Состояние", short: "Состояние", icon: "shield" },
  { key: "business", label: "Бизнес", short: "Бизнес", icon: "bolt" },
  { key: "users", label: "Пользователи", short: "Клиенты", icon: "users" },
  { key: "service", label: "Сервис", short: "Сервис", icon: "refresh" },
];
const isTab = (v: string): v is Tab => TABS.some((t) => t.key === v);

const INTERVAL = 60_000;
const HISTORY = 30;
const STATE_SHORT: Record<Tone, string> = { ok: "Всё работает", warn: "Есть предупреждения", off: "Есть сбой", idle: "Проверяем" };

export default function AdminView() {
  return (
    <AdminConfirmProvider>
      <AdminScreen />
    </AdminConfirmProvider>
  );
}

function AdminScreen() {
  const [tab, setTab] = useState<Tab>("health");
  const [denied, setDenied] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const [ov, setOv] = useState<Overview | null>(null);
  const [ovError, setOvError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState<Probe[]>([]);
  const [auto, setAuto] = useState(true);
  const lastOv = useRef(0);

  const [users, setUsers] = useState<UserInfo[]>([]);
  const [, setStats] = useState<UsersStats | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [usersLoading, setUsersLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [notifError, setNotifError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ health: null, business: null, users: null, service: null });

  /* ── Загрузка ─────────────────────────────────────────────────── */
  const loadOverview = useCallback(async () => {
    lastOv.current = Date.now();
    const r = await getJson<Overview>("/api/admin/overview");
    if (r.ok) {
      setOv(r.data);
      setOvError(null);
      setReady(true);
      const p = r.data.panel;
      const d = r.data.db;
      setHistory((h) => [
        ...h.slice(-(HISTORY - 1)),
        { t: Date.now(), panel: !isErr(p) && p.reachable ? p.latencyMs : null, db: !isErr(d) ? d.latencyMs : null },
      ]);
    } else if (r.status === 403 || r.status === 401) {
      setDenied(r.error || "Доступ запрещён");
    } else {
      setOvError(r.error);
      setReady(true);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    const r = await getJson<{ users: UserInfo[]; stats: UsersStats }>("/api/admin/users");
    setUsersLoading(false);
    if (r.ok) {
      setUsers(r.data.users);
      setStats(r.data.stats);
      setUsersError(null);
      setReady(true);
    } else if (r.status === 403 || r.status === 401) {
      setDenied(r.error || "Доступ запрещён");
    } else {
      setUsersError(r.error);
      setReady(true);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    const r = await getJson<AuditLogItem[]>("/api/admin/logs");
    if (r.ok) {
      setLogs(r.data);
      setLogsError(null);
    } else if (r.status !== 403) setLogsError(r.error);
  }, []);

  const loadNotifs = useCallback(async () => {
    const r = await getJson<NotificationItem[]>("/api/admin/notifications");
    if (r.ok) {
      setNotifs(r.data);
      setNotifError(null);
    } else if (r.status !== 403) setNotifError(r.error);
  }, []);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadOverview(), loadUsers(), loadLogs(), loadNotifs()]);
    setRefreshing(false);
  }, [loadOverview, loadUsers, loadLogs, loadNotifs]);

  const refreshOverview = useCallback(async () => {
    setRefreshing(true);
    await loadOverview();
    setRefreshing(false);
  }, [loadOverview]);

  // После действия в карточке — свежий список, журнал и сводка.
  const onChanged = useCallback(() => {
    loadUsers();
    loadLogs();
    loadOverview();
  }, [loadUsers, loadLogs, loadOverview]);

  useEffect(() => {
    // Раздел из адреса и сохранённое автообновление.
    const h = window.location.hash.replace("#", "");
    if (isTab(h)) setTab(h);
    try {
      if (localStorage.getItem("adm-auto") === "0") setAuto(false);
    } catch {
      /* хранилище недоступно — по умолчанию включено */
    }
    refreshAll();
    // Ссылка на раздел (#users) внутри страницы и «назад/вперёд».
    const onHash = () => {
      const t = window.location.hash.replace("#", "");
      if (isTab(t)) setTab(t);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [refreshAll]);

  // Автообновление сводки: раз в минуту, на паузе в фоне; при возврате
  // во вкладку — сразу, если данные устарели.
  useEffect(() => {
    if (!auto || denied) return;
    const tick = () => {
      if (document.hidden) return;
      if (Date.now() - lastOv.current >= INTERVAL - 500) refreshOverview();
    };
    const t = window.setInterval(tick, 5000);
    const onVis = () => !document.hidden && tick();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [auto, denied, refreshOverview]);

  const setAutoSaved = (v: boolean) => {
    setAuto(v);
    try {
      localStorage.setItem("adm-auto", v ? "1" : "0");
    } catch {
      /* не критично */
    }
  };

  /* ── Разделы ──────────────────────────────────────────────────── */
  const toBoard = () => {
    const board = boardRef.current;
    if (!board) return;
    const head = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--a-head-h")) || 64;
    const top = board.getBoundingClientRect().top + window.scrollY - head - 12;
    if (window.scrollY > top) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
    }
  };

  const selectTab = (t: Tab, scroll = false) => {
    setTab(t);
    try {
      history_replace(t);
    } catch {
      /* адрес не обязателен */
    }
    if (scroll) toBoard();
  };

  const openUser = (id: string) => {
    setSelectedId(id);
    selectTab("users", true);
  };

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const n = TABS.length;
    const next = e.key === "Home" ? 0 : e.key === "End" ? n - 1 : (idx + (e.key === "ArrowRight" ? 1 : -1) + n) % n;
    selectTab(TABS[next].key);
    tabRefs.current[TABS[next].key]?.focus();
  };

  /* ── Экраны ───────────────────────────────────────────────────── */
  if (denied) {
    return (
      <main id="main" className="a-main ak adm">
        <div className="a-field">
          <section className="ak-card adm-denied" data-sheet="24" style={{ "--i": 0 } as CSSProperties} aria-labelledby="adm-denied-h">
            <div className="ak-card-head">
              <p className="ak-eyebrow">Админ-панель</p>
              <span className="ak-status" data-tone="off"><i />Нет доступа</span>
            </div>
            <span className="adm-denied-ico" aria-hidden><Icon name="lock" size={24} /></span>
            <h1 id="adm-denied-h" className="ak-h1 adm-denied-h">{denied}</h1>
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

  if (!ready) {
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

  const tone: Tone = ov ? overallTone(ov) : ovError ? "off" : "idle";

  return (
    <main id="main" className="a-main ak adm">
      <div className="a-field">
        {/* ── Верх ─────────────────────────────────────────────────── */}
        <section className="ak-top" data-sheet="24" style={{ "--i": 0 } as CSSProperties} aria-label="Админ-панель">
          <div>
            <p className="ak-kicker a-wide">Atlas Secure · управление</p>
            <h1 className="ak-h1">Админ-панель</h1>
          </div>
          <div className="ak-tools">
            <p className="adm-top-state" aria-live="polite">
              <Dot tone={tone} />
              <span className="adm-top-copy">
                {STATE_SHORT[tone]}
                {ov && <span className="adm-top-time a-num"> · {formatClock(ov.generatedAt)}</span>}
              </span>
            </p>
            <button type="button" className="a-btn ak-btn-soft" onClick={refreshAll} disabled={refreshing} aria-label={refreshing ? "Обновляем данные" : "Обновить всё"}>
              {refreshing ? <Spin /> : <Icon name="refresh" size={16} />}
              <span className="ak-lbl">{refreshing ? "Обновляем…" : "Обновить всё"}</span>
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
                  ref={(el) => {
                    tabRefs.current[t.key] = el;
                  }}
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
                  {t.key === "health" && <Dot tone={tone} />}
                  {t.label}
                  {t.key === "users" && users.length > 0 && <span className="adm-pill-n a-num">{num(users.length)}</span>}
                </button>
              ))}
            </div>
            <span className="ak-bar-plan adm-bar-state">
              <Dot tone={tone} />
              {STATE_SHORT[tone]}
            </span>
          </nav>

          <div id={`adm-panel-${tab}`} role="tabpanel" aria-labelledby={`adm-tab-${tab}`} className="adm-panel" key={tab}>
            {tab === "health" && (
              <HealthSection
                ov={ov}
                ovError={ovError ? (ov ? `Последнее обновление не прошло: ${ovError}` : ovError) : null}
                history={history}
                auto={auto}
                onAuto={setAutoSaved}
                refreshing={refreshing}
                onRefresh={refreshOverview}
                intervalMs={INTERVAL}
                onOpenUser={openUser}
              />
            )}
            {tab === "business" && <BusinessSection ov={ov} ovError={ovError} />}
            {tab === "users" && (
              <UsersSection
                users={users}
                usersError={usersError}
                loading={usersLoading}
                logs={logs}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onChanged={onChanged}
              />
            )}
            {tab === "service" && (
              <ServiceSection
                users={users}
                logs={logs}
                logsError={logsError}
                notifications={notifs}
                notifError={notifError}
                onReload={() => {
                  loadNotifs();
                  loadLogs();
                }}
                onOpenUser={openUser}
              />
            )}
          </div>
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
            aria-label={t.key === "users" ? `${t.label}: ${users.length}` : t.label}
            onClick={() => selectTab(t.key, true)}
          >
            <span className="adm-tab-ico">
              <Icon name={t.icon} size={18} />
              {t.key === "health" && tone !== "ok" && tone !== "idle" && <i className="adm-tab-flag" data-tone={tone} aria-hidden />}
            </span>
            <span className="adm-tab-lbl">{t.short}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}

/** Раздел в адресе без записи в историю: «Назад» уводит со страницы, а не по вкладкам. */
function history_replace(t: Tab) {
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${t}`);
}
