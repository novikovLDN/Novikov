"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Spin } from "@/app/admin/AdminConfirm";
import { ACTION_LABELS, LEVEL_LABELS, formatShort, getJson, num, type AuditLogItem, type LogLevel } from "@/app/admin/admin-shared";
import { BlockError, Dot } from "./Viz";

/**
 * Журнал событий — GET /api/admin/logs?level=&limit=50[&cursor=]
 * → { data: AuditLogItem[], nextCursor }. Уровень (обычные / внимание /
 * ошибки) фильтрует сервер; «Показать ещё» — следующая страница по
 * курсору. Поиск по email / IP / подробностям — по уже загруженному.
 * Строка с пользователем открывает его карточку.
 */

const PAGE = 50;
type Level = "all" | LogLevel;
const LEVELS: Array<{ key: Level; label: string }> = [
  { key: "all", label: "Все" },
  { key: "info", label: LEVEL_LABELS.info },
  { key: "warn", label: LEVEL_LABELS.warn },
  { key: "error", label: LEVEL_LABELS.error },
];
const LEVEL_DOT: Record<LogLevel, "idle" | "warn" | "off"> = { info: "idle", warn: "warn", error: "off" };

export default function JournalCard({ i = 0, reloadKey = 0, onOpenUser }: { i?: number; reloadKey?: number; onOpenUser: (id: string) => void }) {
  const [level, setLevel] = useState<Level>("all");
  const [q, setQ] = useState("");
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);

  const url = (cursor?: string | null) => `/api/admin/logs?limit=${PAGE}${level !== "all" ? `&level=${level}` : ""}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;

  useEffect(() => {
    const my = ++seq.current;
    setLoading(true);
    getJson<AuditLogItem[]>(url()).then((r) => {
      if (my !== seq.current) return;
      setLoading(false);
      if (r.ok) {
        setLogs(r.data);
        setNext(typeof r.raw.nextCursor === "string" ? r.raw.nextCursor : null);
        setError(null);
      } else setError(r.error);
    });
    // url собирается из level
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, reloadKey]);

  const loadMore = async () => {
    if (!next) return;
    const my = seq.current;
    setMore(true);
    const r = await getJson<AuditLogItem[]>(url(next));
    setMore(false);
    if (my !== seq.current) return;
    if (r.ok) {
      setLogs((l) => [...l, ...r.data.filter((x) => !l.some((y) => y.id === x.id))]);
      setNext(typeof r.raw.nextCursor === "string" ? r.raw.nextCursor : null);
    } else setError(r.error);
  };

  const s = q.trim().toLowerCase();
  const list = s
    ? logs.filter((l) => (l.userEmail || "").toLowerCase().includes(s) || (l.ip || "").includes(s) || (l.details || "").toLowerCase().includes(s))
    : logs;

  return (
    <section className="ak-card adm-s-log adm-still" data-sheet="24" style={{ "--i": i } as CSSProperties} aria-labelledby="adm-log-h2">
      <div className="ak-card-head">
        <h2 id="adm-log-h2" className="ak-eyebrow">Журнал событий</h2>
        <span className="ak-plan a-num">
          {loading && <Spin />} {s ? `${num(list.length)} из ${num(logs.length)} загруженных` : `загружено ${num(logs.length)}${next ? "+" : ""}`}
        </span>
      </div>
      {error && <BlockError title="Журнал не загрузился" text={error} />}
      <div className="adm-find">
        <label className="adm-search">
          <span className="b-sr">Поиск по загруженному журналу</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Email, IP или подробности" className="adm-input" autoComplete="off" spellCheck={false} />
        </label>
      </div>
      <div className="adm-filters" role="group" aria-label="Уровень событий">
        {LEVELS.map((g) => (
          <button key={g.key} type="button" className="adm-chip adm-filter" aria-pressed={level === g.key} onClick={() => setLevel(g.key)}>
            {g.key !== "all" && <Dot tone={LEVEL_DOT[g.key]} />}
            {g.label}
          </button>
        ))}
      </div>
      {loading && logs.length === 0 ? (
        <div className="ak-skel adm-rows-skel" aria-hidden />
      ) : list.length === 0 ? (
        <p className="adm-empty">{logs.length === 0 ? (level === "all" ? "Событий пока нет." : "Событий этого уровня нет.") : "Под поиск ничего не попало."}</p>
      ) : (
        <div className="adm-rows-box adm-rows-short" aria-busy={loading}>
          <div className="adm-log-head" aria-hidden>
            <span>Событие</span>
            <span>Пользователь</span>
            <span>Подробности</span>
            <span>IP</span>
            <span>Время, МСК</span>
          </div>
          <ul className="adm-rows">
            {list.map((l) => {
              const m = ACTION_LABELS[l.action] || { label: l.action, tone: "mute" as const };
              const lv: LogLevel = l.level || "info";
              const inner = (
                <>
                  <span className="adm-l-act">
                    <Dot tone={LEVEL_DOT[lv]} label={LEVEL_LABELS[lv]} />
                    <span className="adm-tag" data-tone={lv === "error" ? "off" : m.tone}>{m.label}</span>
                  </span>
                  <span className="adm-l-user">{l.userEmail || "—"}</span>
                  <span className="adm-l-det" data-empty={l.details ? undefined : ""}>{l.details || <span className="adm-dash" aria-hidden>—</span>}</span>
                  <span className="adm-l-ip a-num" data-empty={l.ip ? undefined : ""}>{l.ip || <span className="adm-dash" aria-hidden>—</span>}</span>
                  <span className="adm-l-time a-num">{formatShort(l.createdAt)}</span>
                </>
              );
              return (
                <li key={l.id} data-level={lv}>
                  {l.userId ? (
                    <button type="button" className="adm-log" onClick={() => onOpenUser(l.userId!)}>{inner}</button>
                  ) : (
                    <div className="adm-log">{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
          {next && (
            <div className="adm-more">
              <button type="button" className="a-btn ak-btn-soft" onClick={loadMore} disabled={more}>
                {more ? <><Spin />Загружаем…</> : "Показать ещё"}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
