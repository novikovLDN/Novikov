"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Icon from "@/components/pixel/Icon";
import AdminUserDetail from "@/app/admin/AdminUserDetail";
import {
  PLAN_LABELS,
  daysLeft,
  formatDate,
  num,
  planTone,
  type AuditLogItem,
  type UserInfo,
} from "@/app/admin/admin-shared";
import { BlockError } from "./Viz";

/**
 * «Пользователи» — поиск (email, ID, IP, имя в панели), фильтры по
 * статусу со счётчиками, сортировка и карточка пользователя. Источник —
 * GET /api/admin/users (весь список сразу), поэтому фильтры мгновенные;
 * строк рисуется по 60, дальше — «Показать ещё».
 *
 * Широкий экран: список слева, карточка справа (липкая). Телефон и
 * планшет: карточка над списком, после выбора экран подводит к ней.
 */

type Filter = "all" | "active" | "paid" | "trial" | "soon" | "expired" | "shared" | "nokey";

const FILTERS: Array<{ key: Filter; label: string; test: (u: UserInfo, now: number) => boolean }> = [
  { key: "all", label: "Все", test: () => true },
  { key: "active", label: "Активные", test: (u) => u.isActive },
  { key: "paid", label: "Платные", test: (u) => u.isActive && (u.subscriptionPlan === "basic" || u.subscriptionPlan === "plus") },
  { key: "trial", label: "Пробные", test: (u) => u.isActive && u.subscriptionPlan === "trial" },
  { key: "soon", label: "Истекают ≤ 3 дн", test: (u, now) => u.isActive && new Date(u.subscriptionEnd).getTime() - now < 3 * 864e5 },
  { key: "expired", label: "Истёкшие", test: (u) => !u.isActive },
  { key: "shared", label: "Общий IP", test: (u) => u.accountsOnIp > 1 },
  { key: "nokey", label: "Без ссылки", test: (u) => u.isActive && !u.subscriptionUrl },
];

type Sort = "new" | "soon" | "long";
const PAGE = 60;

interface Props {
  users: UserInfo[];
  usersError: string | null;
  loading: boolean;
  logs: AuditLogItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChanged: () => void;
}

export default function UsersSection({ users, usersError, loading, logs, selectedId, onSelect, onChanged }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("new");
  const [limit, setLimit] = useState(PAGE);
  const detailRef = useRef<HTMLDivElement>(null);
  const now = Date.now();

  const counts = useMemo(() => {
    const c = {} as Record<Filter, number>;
    for (const f of FILTERS) c[f.key] = users.filter((u) => f.test(u, now)).length;
    return c;
    // now меняется каждый рендер — счёт по списку достаточно пересчитывать при новом списке
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    const test = FILTERS.find((f) => f.key === filter)!.test;
    const out = users.filter(
      (u) =>
        test(u, now) &&
        (!q ||
          u.email.toLowerCase().includes(q) ||
          (u.publicId || "").toLowerCase().includes(q) ||
          u.id.toLowerCase() === q ||
          (u.registrationIp || "").includes(q) ||
          (u.panelUsername || "").toLowerCase().includes(q)),
    );
    if (sort === "soon") out.sort((a, b) => Number(b.isActive) - Number(a.isActive) || Date.parse(a.subscriptionEnd) - Date.parse(b.subscriptionEnd));
    if (sort === "long") out.sort((a, b) => Date.parse(b.subscriptionEnd) - Date.parse(a.subscriptionEnd));
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, search, filter, sort]);

  useEffect(() => setLimit(PAGE), [search, filter, sort]);

  const selected = selectedId ? users.find((u) => u.id === selectedId) || null : null;

  // Телефон и планшет: карточка стоит над списком — после выбора подводим к ней.
  useEffect(() => {
    if (!selected || !detailRef.current) return;
    if (window.matchMedia("(min-width: 1100px)").matches) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    detailRef.current.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    // только при смене выбранного
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  return (
    <div className="adm-users" data-split={selected ? "" : undefined}>
      {selected && (
        <div className="adm-detail-slot" ref={detailRef}>
          <AdminUserDetail
            key={selected.id}
            user={selected}
            logs={logs.filter((l) => l.userId === selected.id || (!!l.userEmail && l.userEmail === selected.email))}
            onClose={() => onSelect(null)}
            onChanged={onChanged}
          />
        </div>
      )}

      <section className="ak-card adm-list-card adm-still" data-sheet="24" style={{ "--i": 1 } as CSSProperties} aria-labelledby="adm-users-h">
        <div className="ak-card-head">
          <h2 id="adm-users-h" className="ak-eyebrow">Пользователи</h2>
          <p className="ak-plan a-num" aria-live="polite">Найдено: {num(list.length)} из {num(users.length)}</p>
        </div>

        {usersError && <BlockError title="Список не загрузился" text={usersError} />}

        <div className="adm-find">
          <label className="adm-search">
            <span className="b-sr">Поиск по email, ID, IP или имени в панели</span>
            <input
              type="search"
              placeholder="Email, ID, IP или имя в панели"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="adm-input"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <label className="adm-sort">
            <span className="b-sr">Порядок</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="adm-input adm-select">
              <option value="new">Новые сначала</option>
              <option value="soon">Скоро истекают</option>
              <option value="long">Дольше всех</option>
            </select>
          </label>
        </div>

        <div className="adm-filters" role="group" aria-label="Фильтр по статусу">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" className="adm-chip adm-filter" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
              {f.label}
              <span className="adm-chip-n a-num">{num(counts[f.key] || 0)}</span>
            </button>
          ))}
        </div>

        {loading && users.length === 0 ? (
          <div className="ak-skel adm-rows-skel" aria-hidden />
        ) : list.length === 0 ? (
          <p className="adm-empty">{users.length === 0 ? "Пользователей пока нет." : "Никого не нашли. Проверьте запрос или сбросьте фильтр."}</p>
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
              {list.slice(0, limit).map((u) => {
                const planKey = u.isActive ? u.subscriptionPlan : "expired";
                const on = selectedId === u.id;
                const d = daysLeft(u.subscriptionEnd, now);
                return (
                  <li key={u.id}>
                    <button type="button" className="adm-row" aria-pressed={on} onClick={() => onSelect(on ? null : u.id)}>
                      <span className="adm-c-id a-num">{u.publicId || "—"}</span>
                      <span className="adm-c-mail">{u.email}</span>
                      <span className="adm-c-plan">
                        <span className="adm-tag" data-tone={planTone(planKey)}>{PLAN_LABELS[planKey] || planKey}</span>
                      </span>
                      <span className="adm-c-end a-num" data-tone={u.isActive && d <= 3 ? "warn" : undefined}>
                        <i className="adm-k">До </i>
                        {formatDate(u.subscriptionEnd)}
                        {u.isActive && <small>{d} дн</small>}
                      </span>
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
            {list.length > limit && (
              <div className="adm-more">
                <button type="button" className="a-btn ak-btn-soft" onClick={() => setLimit((n) => n + PAGE)}>
                  Показать ещё {Math.min(PAGE, list.length - limit)} <span className="adm-muted a-num">· осталось {num(list.length - limit)}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
