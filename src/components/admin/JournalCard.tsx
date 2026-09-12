"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { ACTION_LABELS, formatShort, num, type AuditLogItem } from "@/app/admin/admin-shared";
import { BlockError } from "./Viz";

/**
 * Журнал событий — GET /api/admin/logs (последние 200). Фильтр по
 * группе и поиск по email / IP / подробностям. Строка с пользователем
 * открывает его карточку.
 */

type Group = "all" | "pay" | "admin" | "user" | "system";
const GROUPS: Array<{ key: Group; label: string; test: (a: string) => boolean }> = [
  { key: "all", label: "Все", test: () => true },
  { key: "pay", label: "Оплаты", test: (a) => a.startsWith("payment.") },
  { key: "admin", label: "Админ", test: (a) => a.startsWith("admin.") || a.startsWith("bot_sync.") },
  { key: "user", label: "Пользователи", test: (a) => a.startsWith("user.") || a.startsWith("telegram.") },
  { key: "system", label: "Бот и сверка", test: (a) => a.startsWith("sync.") || a.startsWith("bot") },
];
const PAGE = 50;

export default function JournalCard({
  i = 0,
  logs,
  error,
  onOpenUser,
}: {
  i?: number;
  logs: AuditLogItem[];
  error: string | null;
  onOpenUser: (id: string) => void;
}) {
  const [group, setGroup] = useState<Group>("all");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(PAGE);

  const list = useMemo(() => {
    const test = GROUPS.find((g) => g.key === group)!.test;
    const s = q.trim().toLowerCase();
    return logs.filter(
      (l) =>
        test(l.action) &&
        (!s || (l.userEmail || "").toLowerCase().includes(s) || (l.ip || "").includes(s) || (l.details || "").toLowerCase().includes(s)),
    );
  }, [logs, group, q]);

  return (
    <section className="ak-card adm-s-log adm-still" data-sheet="24" style={{ "--i": i } as CSSProperties} aria-labelledby="adm-log-h2">
      <div className="ak-card-head">
        <h2 id="adm-log-h2" className="ak-eyebrow">Журнал событий</h2>
        <span className="ak-plan a-num">{num(list.length)} из {num(logs.length)}</span>
      </div>
      {error && <BlockError title="Журнал не загрузился" text={error} />}
      <div className="adm-find">
        <label className="adm-search">
          <span className="b-sr">Поиск по журналу</span>
          <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }} placeholder="Email, IP или подробности" className="adm-input" autoComplete="off" spellCheck={false} />
        </label>
      </div>
      <div className="adm-filters" role="group" aria-label="Группа событий">
        {GROUPS.map((g) => (
          <button key={g.key} type="button" className="adm-chip adm-filter" aria-pressed={group === g.key} onClick={() => { setGroup(g.key); setLimit(PAGE); }}>
            {g.label}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <p className="adm-empty">{logs.length === 0 ? "Событий пока нет." : "Под фильтр ничего не попало."}</p>
      ) : (
        <div className="adm-rows-box adm-rows-short">
          <div className="adm-log-head" aria-hidden>
            <span>Событие</span>
            <span>Пользователь</span>
            <span>Подробности</span>
            <span>IP</span>
            <span>Время, МСК</span>
          </div>
          <ul className="adm-rows">
            {list.slice(0, limit).map((l) => {
              const m = ACTION_LABELS[l.action] || { label: l.action, tone: "mute" as const };
              const Row = l.userId ? "button" : "div";
              return (
                <li key={l.id}>
                  <Row
                    {...(l.userId ? { type: "button" as const, onClick: () => onOpenUser(l.userId!) } : {})}
                    className="adm-log"
                  >
                    <span className="adm-l-act"><span className="adm-tag" data-tone={m.tone}>{m.label}</span></span>
                    <span className="adm-l-user">{l.userEmail || "—"}</span>
                    <span className="adm-l-det" data-empty={l.details ? undefined : ""}>{l.details || <span className="adm-dash" aria-hidden>—</span>}</span>
                    <span className="adm-l-ip a-num" data-empty={l.ip ? undefined : ""}>{l.ip || <span className="adm-dash" aria-hidden>—</span>}</span>
                    <span className="adm-l-time a-num">{formatShort(l.createdAt)}</span>
                  </Row>
                </li>
              );
            })}
          </ul>
          {list.length > limit && (
            <div className="adm-more">
              <button type="button" className="a-btn ak-btn-soft" onClick={() => setLimit((n) => n + PAGE)}>Показать ещё</button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
