"use client";

import type { CSSProperties } from "react";
import Icon from "@/components/pixel/Icon";
import { Spin } from "@/app/admin/AdminConfirm";
import {
  SYNC_STATE_LABELS,
  TONE_WORD,
  ago,
  bytes,
  formatClock,
  formatShort,
  isErr,
  money,
  num,
  pct,
  pick,
  pickNum,
  pickStr,
  span,
  worst,
  type Overview,
  type OverviewDb,
  type OverviewPanel,
  type OverviewSync,
  type PanelNodeInfo,
  type Probe,
  type Tone,
} from "@/app/admin/admin-shared";
import { BlockError, Dot, Skel, Spark, Stack, Status, Tile } from "./Viz";

/**
 * «Состояние» — жива ли панель Remnawave, ноды, база и очередь
 * синхронизации. Источник — GET /api/admin/overview (каждый блок
 * считается отдельно: сбой панели не прячет цифры базы).
 *
 * Тёмная плита — вердикт одним словом и четыре живые точки; под ней
 * три бизнес-числа, чтобы первый экран отвечал на «всё ли в порядке».
 * Спарклайны задержки — история замеров этой вкладки (копится с каждым
 * автообновлением), а не выдумка: истории в API нет.
 */

const at = (i: number) => ({ "--i": i }) as CSSProperties;

/* ─── Оценки ─────────────────────────────────────────────────────── */

export function panelTone(p: Overview["panel"] | undefined): Tone {
  if (!p) return "idle";
  if (isErr(p) || !p.reachable) return "off";
  return p.latencyMs > 1500 ? "warn" : "ok";
}

export function nodesTone(p: Overview["panel"] | undefined): Tone {
  if (!p) return "idle";
  if (isErr(p)) return "off";
  if (!p.nodes.ok) return p.reachable ? "warn" : "off";
  const live = p.nodes.total - p.nodes.disabled;
  if (live === 0) return "warn";
  if (p.nodes.connected === 0) return "off";
  return p.nodes.connected < live ? "warn" : "ok";
}

export function dbTone(d: Overview["db"] | undefined): Tone {
  if (!d) return "idle";
  if (isErr(d)) return "off";
  return d.latencyMs > 250 || d.pool.waiting > 0 ? "warn" : "ok";
}

const QUEUE_STALE_MS = 15 * 60 * 1000;

export function syncTone(s: Overview["sync"] | undefined, now = Date.now()): Tone {
  if (!s) return "idle";
  if (isErr(s)) return "off";
  const errors = s.byState.error || 0;
  const pending = s.byState.pending || 0;
  const stale = s.oldestQueuedAt ? now - new Date(s.oldestQueuedAt).getTime() > QUEUE_STALE_MS : false;
  return errors > 0 || (pending > 0 && stale) ? "warn" : "ok";
}

export function overallTone(ov: Overview | null): Tone {
  if (!ov) return "idle";
  return worst(panelTone(ov.panel), nodesTone(ov.panel), dbTone(ov.db), syncTone(ov.sync));
}

const VERDICT: Record<Tone, string> = {
  ok: "Всё работает",
  warn: "Есть предупреждения",
  off: "Есть сбой",
  idle: "Проверяем…",
};

/** Строки трафика панели приходят как «1.23 GB» — переводим единицы. */
const UNIT_RU: Record<string, string> = { B: "Б", KB: "КБ", MB: "МБ", GB: "ГБ", TB: "ТБ", PB: "ПБ" };
function sizeRu(s: string | null): string {
  if (!s) return "—";
  const m = /^(-?[\d.,]+)\s*([KMGTP]?)i?B$/i.exec(s.trim());
  if (!m) return /^-?\d+$/.test(s.trim()) ? bytes(Math.abs(Number(s))) : s;
  const n = Number(m[1].replace(",", "."));
  const u = UNIT_RU[`${m[2].toUpperCase()}B`] || m[2];
  return `${n.toLocaleString("ru-RU", { maximumFractionDigits: n < 10 ? 2 : 1 })} ${u}`;
}

function nodeTone(n: PanelNodeInfo): Tone {
  if (n.isDisabled) return "idle";
  if (n.isConnected) return "ok";
  return n.isConnecting ? "warn" : "off";
}
const NODE_WORD: Record<Tone, string> = { ok: "В сети", warn: "Подключается", off: "Не в сети", idle: "Выключена" };

/* ─── Секция ─────────────────────────────────────────────────────── */

interface Props {
  ov: Overview | null;
  ovError: string | null;
  history: Probe[];
  auto: boolean;
  onAuto: (v: boolean) => void;
  refreshing: boolean;
  onRefresh: () => void;
  intervalMs: number;
  onOpenUser: (id: string) => void;
}

export default function HealthSection({ ov, ovError, history, auto, onAuto, refreshing, onRefresh, intervalMs, onOpenUser }: Props) {
  const tones = {
    panel: panelTone(ov?.panel),
    nodes: nodesTone(ov?.panel),
    db: dbTone(ov?.db),
    sync: syncTone(ov?.sync),
  };
  const overall = ov ? overallTone(ov) : ovError ? "off" : "idle";
  const panel = ov && !isErr(ov.panel) ? ov.panel : null;
  const db = ov && !isErr(ov.db) ? ov.db : null;
  const sync = ov && !isErr(ov.sync) ? ov.sync : null;
  const revenue = ov && !isErr(ov.revenue) ? ov.revenue : null;
  const funnel = ov && !isErr(ov.funnel) ? ov.funnel : null;

  const signals: Array<{ id: string; name: string; tone: Tone; value: string }> = [
    {
      id: "adm-h-panel",
      name: "Панель",
      tone: tones.panel,
      value: !ov ? "—" : panel ? (panel.reachable ? `${num(panel.latencyMs)} мс` : "недоступна") : "ошибка",
    },
    {
      id: "adm-h-nodes",
      name: "Ноды",
      tone: tones.nodes,
      value: panel && panel.nodes.ok ? `${panel.nodes.connected} из ${panel.nodes.total - panel.nodes.disabled}` : ov ? "нет данных" : "—",
    },
    { id: "adm-h-db", name: "База", tone: tones.db, value: db ? `${num(db.latencyMs)} мс` : ov ? "недоступна" : "—" },
    {
      id: "adm-h-sync",
      name: "Очередь",
      tone: tones.sync,
      value: sync ? `${num((sync.byState.pending || 0) + (sync.byState.error || 0))} в очереди` : ov ? "ошибка" : "—",
    },
  ];

  return (
    <div className="adm-grid adm-health">
      {/* ── Вердикт ─────────────────────────────────────────────── */}
      <section className="ak-card ak-dark adm-verdict" data-sheet="24" style={at(1)} aria-labelledby="adm-verdict-h">
        <div className="ak-card-head">
          <h2 id="adm-verdict-h" className="ak-eyebrow">Состояние сервиса</h2>
          <Status tone={overall}>{TONE_WORD[overall]}</Status>
        </div>
        <p className="ak-value adm-verdict-v" aria-live="polite">{ovError && !ov ? "Сводка не загрузилась" : VERDICT[overall]}</p>
        {ovError && <p className="adm-verdict-err adm-break">{ovError}</p>}

        <ul className="adm-signals">
          {signals.map((s, k) => (
            <li key={s.id} style={{ "--k": k } as CSSProperties}>
              <a href={`#${s.id}`} className="adm-signal">
                <Dot tone={s.tone} />
                <span className="adm-signal-name">{s.name}</span>
                <span className="adm-signal-v a-num">{s.value}</span>
                <span className="b-sr">— {TONE_WORD[s.tone]}</span>
              </a>
            </li>
          ))}
        </ul>

        <ul className="adm-verdict-kpi">
          <li>
            <span>Выручка сегодня</span>
            <b className="a-num">{revenue ? money(revenue.gross.today) : "—"}</b>
          </li>
          <li>
            <span>Активных подписок</span>
            <b className="a-num">{funnel ? num(funnel.users.live) : "—"}</b>
          </li>
          <li>
            <span>Новых за 7 дней</span>
            <b className="a-num">{funnel ? num(funnel.users.new_7d) : "—"}</b>
          </li>
        </ul>

        <div className="adm-auto">
          <button type="button" role="switch" aria-checked={auto} className="ak-switch" onClick={() => onAuto(!auto)} aria-label="Автообновление раз в минуту" />
          <span className="adm-auto-copy">
            {ov ? <>Обновлено <span className="a-num">{formatClock(ov.generatedAt)}</span> по Москве</> : "Ждём первую сводку"}
            <small>{auto ? `автообновление раз в ${Math.round(intervalMs / 1000)} с, на паузе в фоне` : "автообновление выключено"}</small>
          </span>
          {auto && ov && !refreshing && (
            <span key={ov.generatedAt} className="adm-ring" style={{ "--dur": `${intervalMs}ms` } as CSSProperties} aria-hidden>
              <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" /></svg>
            </span>
          )}
          {refreshing && <Spin />}
          <button type="button" className="ak-icon adm-auto-now" onClick={onRefresh} disabled={refreshing} aria-label="Обновить сводку сейчас">
            <Icon name="refresh" size={16} />
          </button>
        </div>
      </section>

      <PanelCard panel={ov ? ov.panel : null} tone={tones.panel} history={history} />
      <DbCard db={ov ? ov.db : null} tone={tones.db} history={history} />
      <NodesCard panel={ov ? ov.panel : null} tone={tones.nodes} />
      <SyncCard sync={ov ? ov.sync : null} tone={tones.sync} onOpenUser={onOpenUser} />
      <TrafficCard panel={ov ? ov.panel : null} />
      <SiteUsersCard panel={ov ? ov.panel : null} />
    </div>
  );
}

/* ─── Панель ─────────────────────────────────────────────────────── */

function PanelCard({ panel, tone, history }: { panel: Overview["panel"] | null; tone: Tone; history: Probe[] }) {
  const p = panel && !isErr(panel) ? panel : null;
  const stats = p && p.stats.ok ? p.stats.data : null;
  const memTotal = pickNum(stats, "memory.total");
  const memUsed = pickNum(stats, "memory.used");
  const uptime = pickNum(stats, "uptime");
  const statusCounts = (pick(stats, "users.statusCounts") || {}) as Record<string, number>;
  const healthErr = p && !p.health.ok ? p.health.error : null;
  const runtime = p && p.health.ok ? (pick(p.health.data, "runtimeMetrics") as Array<Record<string, unknown>> | undefined) : undefined;
  const loopP99 = Array.isArray(runtime) && runtime.length ? Math.max(...runtime.map((r) => Number(r.eventLoopP99Ms) || 0)) : null;

  return (
    <section id="adm-h-panel" className="ak-card adm-h-panel" data-sheet="24" style={at(2)} aria-labelledby="adm-hp-h">
      <div className="ak-card-head">
        <h2 id="adm-hp-h" className="ak-eyebrow">Панель Remnawave</h2>
        <Status tone={tone}>{panel === null ? "Проверяем" : !p?.reachable ? "Недоступна" : tone === "warn" ? "Медленно" : "На связи"}</Status>
      </div>
      {panel === null ? (
        <Skel />
      ) : isErr(panel) ? (
        <BlockError title="Блок панели не посчитался" text={panel.error} />
      ) : (
        <>
          <p className="ak-value adm-live-v">
            {p!.reachable ? <><span className="a-num">{num(p!.latencyMs)}</span><small>мс ответ</small></> : "Не отвечает"}
          </p>
          {healthErr && <BlockError title="Проверка здоровья не прошла" text={healthErr} />}
          <Spark values={history.map((h) => h.panel)} label="Задержка ответа панели по последним замерам" />
          {stats ? (
            <ul className="adm-tiles">
              <Tile label="Пользователей в панели" value={num(pickNum(stats, "users.totalUsers"))} note={statusCounts.ACTIVE != null ? `активных ${num(statusCounts.ACTIVE)}` : undefined} />
              <Tile label="В сети сейчас" value={num(pickNum(stats, "onlineStats.onlineNow"))} tone="ok" note={`за сутки ${num(pickNum(stats, "onlineStats.lastDay"))}`} />
              <Tile
                label="Память сервера"
                value={memTotal && memUsed != null ? `${Math.round(pct(memUsed, memTotal))} %` : "—"}
                tone={memTotal && memUsed != null && memUsed / memTotal > 0.9 ? "warn" : undefined}
                note={memTotal ? `из ${bytes(memTotal)}` : undefined}
              />
              <Tile label="Без перезапуска" value={uptime != null ? span(uptime * 1000) : "—"} note={loopP99 != null ? `задержка цикла ${Math.round(loopP99)} мс` : undefined} />
            </ul>
          ) : (
            p!.reachable && !p!.stats.ok && <BlockError title="Статистика панели не пришла" text={p!.stats.error} />
          )}
          <p className="ak-fine">Счётчики — вся панель, вместе с пользователями бота.</p>
        </>
      )}
    </section>
  );
}

/* ─── База ───────────────────────────────────────────────────────── */

function DbCard({ db, tone, history }: { db: Overview["db"] | null; tone: Tone; history: Probe[] }) {
  const d: OverviewDb | null = db && !isErr(db) ? db : null;
  return (
    <section id="adm-h-db" className="ak-card adm-h-db" data-sheet="24" style={at(3)} aria-labelledby="adm-hd-h">
      <div className="ak-card-head">
        <h2 id="adm-hd-h" className="ak-eyebrow">База данных</h2>
        <Status tone={tone}>{db === null ? "Проверяем" : !d ? "Недоступна" : tone === "warn" ? "Медленно" : "На связи"}</Status>
      </div>
      {db === null ? (
        <Skel />
      ) : !d ? (
        <>
          <p className="ak-value adm-live-v">Не отвечает</p>
          <BlockError title="Запрос к базе упал" text={isErr(db) ? db.error : undefined} />
        </>
      ) : (
        <>
          <p className="ak-value adm-live-v"><span className="a-num">{num(d.latencyMs)}</span><small>мс на запрос</small></p>
          <Spark values={history.map((h) => h.db)} label="Задержка базы по последним замерам" />
          <ul className="adm-tiles">
            <Tile label="Соединений" value={num(d.pool.total)} />
            <Tile label="Свободно" value={num(d.pool.idle)} />
            <Tile label="Ждут соединения" value={num(d.pool.waiting)} tone={d.pool.waiting > 0 ? "warn" : undefined} />
          </ul>
        </>
      )}
    </section>
  );
}

/* ─── Ноды ───────────────────────────────────────────────────────── */

function NodesCard({ panel, tone }: { panel: Overview["panel"] | null; tone: Tone }) {
  const p: OverviewPanel | null = panel && !isErr(panel) ? panel : null;
  const nodes = p?.nodes;
  const list = nodes && nodes.ok ? [...nodes.list].sort((a, b) => Number(b.isConnected) - Number(a.isConnected) || (b.usersOnline || 0) - (a.usersOnline || 0)) : [];
  return (
    <section id="adm-h-nodes" className="ak-card adm-h-nodes" data-sheet="24" style={at(4)} aria-labelledby="adm-hn-h">
      <div className="ak-card-head">
        <h2 id="adm-hn-h" className="ak-eyebrow">Ноды</h2>
        <Status tone={tone}>{nodes && nodes.ok ? nodes.total - nodes.disabled === 0 ? "Нод нет" : `${nodes.connected} из ${nodes.total - nodes.disabled} в сети` : panel === null ? "Проверяем" : "Нет данных"}</Status>
      </div>
      {panel === null ? (
        <Skel rows={4} />
      ) : !nodes ? (
        <BlockError title="Ноды не посчитались" text={isErr(panel) ? panel.error : undefined} />
      ) : !nodes.ok ? (
        <BlockError title="Панель не отдала список нод" text={nodes.error} />
      ) : (
        <>
          <ul className="adm-tiles adm-tiles-row">
            <Tile
              label="В сети"
              value={`${nodes.connected} / ${nodes.total - nodes.disabled}`}
              note={nodes.disabled > 0 ? `всего ${nodes.total}` : undefined}
              tone={tone === "ok" ? "ok" : tone === "idle" ? undefined : tone}
            />
            <Tile label="Пользователей онлайн" value={num(nodes.usersOnline)} tone="ok" />
            <Tile label="Выключены" value={num(nodes.disabled)} tone={nodes.disabled > 0 ? "mute" : undefined} />
          </ul>
          {list.length === 0 ? (
            <p className="adm-empty">Нод в панели нет.</p>
          ) : (
            <ul className="adm-nodes">
              {list.map((n, k) => {
                const t = nodeTone(n);
                return (
                  <li key={n.uuid} className="adm-node" data-tone={t} style={{ "--k": k } as CSSProperties}>
                    <Dot tone={t} />
                    <span className="adm-node-name">
                      <b>{n.name || "Без имени"}</b>
                      {n.countryCode && <span className="adm-tag" data-tone="mute">{n.countryCode}</span>}
                      <span className="b-sr">— {NODE_WORD[t]}</span>
                    </span>
                    <span className="adm-node-m a-num"><i>онлайн</i>{num(n.usersOnline)}</span>
                    <span className="adm-node-m a-num"><i>трафик</i>{n.trafficUsedBytes != null ? bytes(n.trafficUsedBytes) : "—"}</span>
                    <span className="adm-node-m a-num"><i>xray</i>{n.versions?.xray || "—"}</span>
                    {!n.isConnected && !n.isDisabled && n.lastStatusMessage && <span className="adm-node-msg adm-break">{n.lastStatusMessage}</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

/* ─── Очередь синхронизации ──────────────────────────────────────── */

function SyncCard({ sync, tone, onOpenUser }: { sync: Overview["sync"] | null; tone: Tone; onOpenUser: (id: string) => void }) {
  const s: OverviewSync | null = sync && !isErr(sync) ? sync : null;
  const ok = s?.byState.ok || 0;
  const pending = s?.byState.pending || 0;
  const errors = s?.byState.error || 0;
  const other = s ? Object.entries(s.byState).filter(([k]) => !["ok", "pending", "error"].includes(k)) : [];
  return (
    <section id="adm-h-sync" className="ak-card adm-h-sync" data-sheet="24" style={at(5)} aria-labelledby="adm-hs-h">
      <div className="ak-card-head">
        <h2 id="adm-hs-h" className="ak-eyebrow">Синхронизация с панелью</h2>
        <Status tone={tone}>{sync === null ? "Проверяем" : !s ? "Ошибка" : errors > 0 ? `${num(errors)} с ошибкой` : pending > 0 ? "Идёт отправка" : "Очередь пуста"}</Status>
      </div>
      {sync === null ? (
        <Skel />
      ) : !s ? (
        <BlockError title="Очередь не посчиталась" text={isErr(sync) ? sync.error : undefined} />
      ) : (
        <>
          <p className="ak-value adm-live-v"><span className="a-num">{num(pending + errors)}</span><small>в очереди</small></p>
          <Stack
            label={`Сверено ${ok}, ждут ${pending}, с ошибкой ${errors}`}
            parts={[{ value: ok, tone: "ok" }, { value: pending, tone: "warn" }, { value: errors, tone: "off" }]}
          />
          <ul className="adm-legend">
            {(["ok", "pending", "error"] as const).map((k) => (
              <li key={k} data-tone={k === "ok" ? "ok" : k === "pending" ? "warn" : "off"}>
                <i aria-hidden />
                {SYNC_STATE_LABELS[k]} <b className="a-num">{num(s.byState[k] || 0)}</b>
              </li>
            ))}
            {other.map(([k, v]) => (
              <li key={k}>
                <i aria-hidden />
                {k} <b className="a-num">{num(v)}</b>
              </li>
            ))}
          </ul>
          <dl className="adm-dl">
            <div>
              <dt>Самая старая в очереди</dt>
              <dd className="a-num" data-tone={tone === "warn" && s.oldestQueuedAt ? "warn" : undefined}>{s.oldestQueuedAt ? ago(s.oldestQueuedAt) : "нет"}</dd>
            </div>
            <div>
              <dt>Последняя удачная</dt>
              <dd className="a-num">{s.lastSuccessfulSyncAt ? ago(s.lastSuccessfulSyncAt) : "—"}</dd>
            </div>
          </dl>
          {s.recentErrors.length > 0 && (
            <details className="adm-details" open={errors > 0 && errors <= 3}>
              <summary>Последние ошибки ({s.recentErrors.length})</summary>
              <ul className="adm-errs">
                {s.recentErrors.map((e) => (
                  <li key={e.id}>
                    <button type="button" className="adm-err-row" onClick={() => onOpenUser(e.id)}>
                      <span className="adm-err-who">
                        <b>{e.email}</b>
                        <span className="a-num">{e.public_id || "—"} · попыток {num(e.panel_sync_attempts)}</span>
                      </span>
                      <span className="adm-err-text adm-break">{e.panel_sync_error || "без текста"}</span>
                      {e.panel_next_sync_at && <span className="adm-err-next a-num">повтор {formatShort(e.panel_next_sync_at)}</span>}
                      <Icon name="arrow-right" size={16} className="adm-err-arrow" />
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </section>
  );
}

/* ─── Трафик ─────────────────────────────────────────────────────── */

const BW: Array<{ key: string; label: string; prev: string }> = [
  { key: "bandwidthLastTwoDays", label: "Сегодня", prev: "вчера" },
  { key: "bandwidthLastSevenDays", label: "7 дней", prev: "прошлые 7" },
  { key: "bandwidthLast30Days", label: "30 дней", prev: "прошлые 30" },
  { key: "bandwidthCalendarMonth", label: "Этот месяц", prev: "прошлый" },
  { key: "bandwidthCurrentYear", label: "Этот год", prev: "прошлый" },
];

function TrafficCard({ panel }: { panel: Overview["panel"] | null }) {
  const p = panel && !isErr(panel) ? panel : null;
  const bw = p && p.bandwidth.ok ? p.bandwidth.data : null;
  const total = p && p.stats.ok ? pickStr(p.stats.data, "nodes.totalBytesLifetime") : null;
  return (
    <section className="ak-card adm-h-traffic" data-sheet="24" style={at(6)} aria-labelledby="adm-ht-h">
      <div className="ak-card-head">
        <h2 id="adm-ht-h" className="ak-eyebrow">Трафик</h2>
        {total && <span className="ak-plan a-num">за всё время {bytes(Number(total))}</span>}
      </div>
      {panel === null ? (
        <Skel />
      ) : !p ? (
        <BlockError title="Нет данных панели" />
      ) : !bw ? (
        <BlockError title="Панель не отдала трафик" text={!p.bandwidth.ok ? p.bandwidth.error : undefined} />
      ) : (
        <ul className="adm-bw">
          {BW.map((b, k) => {
            const cur = pickStr(bw, `${b.key}.current`);
            const prev = pickStr(bw, `${b.key}.previous`);
            const diff = pickStr(bw, `${b.key}.difference`);
            const down = diff?.trim().startsWith("-");
            return (
              <li key={b.key} style={{ "--k": k } as CSSProperties}>
                <span className="adm-bw-l">{b.label}</span>
                <b className="a-num">{sizeRu(cur)}</b>
                <span className="adm-bw-p a-num">{b.prev}: {sizeRu(prev)}</span>
                {diff && !/^-?0(\.0+)?\s/.test(diff.trim()) && <span className="adm-bw-d a-num" data-dir={down ? "down" : "up"}>{down ? "−" : "+"}{sizeRu(diff.replace(/^[-+]/, ""))}</span>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ─── Клиенты сайта в панели ─────────────────────────────────────── */

const TAG_LABEL: Record<string, string> = { SITE_TRIAL: "Пробный", SITE_BASIC: "Basic", SITE_PLUS: "Plus" };

function SiteUsersCard({ panel }: { panel: Overview["panel"] | null }) {
  const p = panel && !isErr(panel) ? panel : null;
  const tags = p ? Object.entries(p.siteUsersByTag) : [];
  const site = tags.filter(([k]) => k.startsWith("SITE_"));
  const legacy = tags.filter(([k]) => !k.startsWith("SITE_"));
  const legacyTotal = legacy.reduce((s, [, v]) => s + (isErr(v) ? 0 : v.total), 0);
  return (
    <section className="ak-card adm-h-site" data-sheet="24" style={at(7)} aria-labelledby="adm-hu-h">
      <div className="ak-card-head">
        <h2 id="adm-hu-h" className="ak-eyebrow">Клиенты сайта в панели</h2>
        <span className="ak-plan">по тегам SITE_*</span>
      </div>
      {panel === null ? (
        <Skel />
      ) : !p ? (
        <BlockError title="Нет данных панели" />
      ) : (
        <>
          <ul className="adm-tags">
            {site.map(([tag, v], k) => (
              <li key={tag} style={{ "--k": k } as CSSProperties}>
                <span className="adm-tags-h">
                  <b>{TAG_LABEL[tag] || tag}</b>
                  <span className="a-num adm-muted">{tag}</span>
                </span>
                {isErr(v) ? (
                  <span className="adm-tags-err adm-break">{v.error}</span>
                ) : (
                  <>
                    <span className="adm-tags-n a-num">{num(v.total)}{v.truncated && <small> +</small>}</span>
                    <Stack
                      label={`Активных ${v.byStatus.ACTIVE || 0} из ${v.total}`}
                      parts={[
                        { value: v.byStatus.ACTIVE || 0, tone: "ok" },
                        { value: v.byStatus.LIMITED || 0, tone: "warn" },
                        { value: (v.byStatus.EXPIRED || 0) + (v.byStatus.DISABLED || 0), tone: "mute" },
                      ]}
                    />
                    <span className="adm-tags-m a-num">
                      активных {num(v.byStatus.ACTIVE || 0)} · <span className="adm-on"><Dot tone={v.onlineLast5m > 0 ? "ok" : "idle"} />{num(v.onlineLast5m)} онлайн</span>
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
          {site.some(([, v]) => !isErr(v) && v.truncated) && <p className="ak-fine">«+» — панель отдала не всех: счёт по первым страницам.</p>}
          {legacyTotal > 0 && (
            <p className="adm-note" data-tone="warn">
              Со старыми тегами (TRIAL / BASIC / PLUS): <b className="a-num">{num(legacyTotal)}</b>. Переведутся при следующей синхронизации.
            </p>
          )}
        </>
      )}
    </section>
  );
}
