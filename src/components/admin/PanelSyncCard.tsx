"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import Icon from "@/components/pixel/Icon";
import { useAdminConfirm, useAdminLayer, useAdminToast, Spin } from "@/app/admin/AdminConfirm";
import { num, postJson } from "@/app/admin/admin-shared";
import { Tile } from "./Viz";

/**
 * Сверка сайта с панелью — одна карточка вместо трёх прежних
 * (аудит, «сверить и починить», read-only verify).
 *
 *   «Проверить»       POST /api/admin/remnawave/audit — разбор каждого
 *                     пользователя: срок, статус, тег, ссылка.
 *   «Починить N»      тот же маршрут с apply: true, пачками по 25, после
 *                     проверки и подтверждения. Ничего не удаляет.
 *   «Плановая сверка» POST /api/admin/remnawave/reconcile — тот же проход,
 *                     что воркер делает раз в час; 409 — уже идёт.
 *
 * remnawave/verify из интерфейса убран: он повторял «Проверить» и видел
 * меньше (без статуса и тега).
 */

type AuditProblem = "no_uuid" | "missing_in_panel" | "url_missing" | "date_drift" | "status_mismatch" | "tag_mismatch" | "active_after_expiry" | "panel_error";

interface AuditRow {
  userId: string;
  email: string;
  publicId: string | null;
  panelUuid: string | null;
  localSubscriptionEnd: string;
  panelExpireAt: string | null;
  localPlan: string;
  panelTag: string | null;
  panelStatus: string | null;
  panelSubscriptionUrl: string | null;
  problems: AuditProblem[];
  fixApplied?: boolean;
  fixError?: string;
  fixSummary?: string;
}

interface AuditReport {
  scanned: number;
  ok: number;
  broken: number;
  fixed: number;
  fixFailed: number;
  byProblem: Record<AuditProblem, number>;
  rows: AuditRow[];
  hasMore?: boolean;
  nextOffset?: number;
}

interface ReconcileReport {
  scanned: number;
  ok: number;
  needed_fix: number;
  fixed: number;
  failed: number;
  by_kind: Record<string, number>;
  issues: Array<{ userId: string; email: string; kind: string; fixed: boolean; fixAction: string | null; fixError?: string }>;
  errors?: Array<{ userId: string; email: string; error: string }>;
  durationMs: number;
}

const PROBLEM_LABEL: Record<AuditProblem, string> = {
  no_uuid: "нет записи в панели",
  missing_in_panel: "потерян в панели",
  url_missing: "нет ссылки",
  date_drift: "срок не совпадает",
  status_mismatch: "статус не ACTIVE",
  tag_mismatch: "тег не по тарифу",
  active_after_expiry: "работает после окончания",
  panel_error: "панель не ответила",
};

const PROBLEM_TONE: Record<AuditProblem, "off" | "warn" | "mute"> = {
  no_uuid: "off",
  missing_in_panel: "off",
  url_missing: "warn",
  date_drift: "warn",
  status_mismatch: "warn",
  tag_mismatch: "mute",
  active_after_expiry: "off",
  panel_error: "warn",
};

const KIND_LABEL: Record<string, string> = {
  missing_panel_user: "нет в панели",
  stale_uuid: "запись устарела",
  expire_drift: "срок расходится",
  no_sub_url: "нет ссылки",
};

export default function PanelSyncCard({ i = 0, onOpenUser }: { i?: number; onOpenUser: (id: string) => void }) {
  const confirm = useAdminConfirm();
  const toast = useAdminToast();
  const layer = useAdminLayer();
  const [loading, setLoading] = useState<"audit" | "apply" | "reconcile" | null>(null);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [rec, setRec] = useState<ReconcileReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  useEffect(() => {
    if (!logOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setLogOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [logOpen]);

  const audit = async () => {
    setLoading("audit");
    setError(null);
    setReport(null);
    const r = await postJson<AuditReport>("/api/admin/remnawave/audit", { apply: false });
    setLoading(null);
    if (!r.ok) {
      setError(r.error);
      toast(`Проверка не прошла: ${r.error}`, "off");
      return;
    }
    setReport(r.data);
    toast(r.data.broken > 0 ? `Расхождений: ${r.data.broken}` : "Всё сходится", r.data.broken > 0 ? "warn" : "ok");
  };

  const apply = async () => {
    if (!report) return;
    const ok = await confirm({
      title: `Починить ${report.broken} ${report.broken === 1 ? "пользователя" : "пользователей"}?`,
      text: `Панель приведём к данным сайта: срок, статус, тег, ссылка. Ничего не удаляется.\n\nПачками по 25 — около ${Math.max(1, Math.ceil((report.broken / 25) * 40 / 60))} мин.`,
      confirmLabel: "Починить",
      tone: "primary",
    });
    if (!ok) return;
    setLoading("apply");
    setError(null);
    let offset = 0;
    const total = report.broken;
    let last: AuditReport | null = null;
    for (let iter = 0; iter < 40; iter++) {
      setProgress({ done: offset, total });
      const step = await postJson<AuditReport>("/api/admin/remnawave/audit", { apply: true, offset, chunk: 25 });
      if (!step.ok) {
        setError(step.error);
        toast(`Починка остановилась: ${step.error}`, "off");
        break;
      }
      last = step.data;
      setReport(last);
      offset = last.nextOffset ?? offset + 25;
      if (!last.hasMore) break;
    }
    setProgress({ done: total, total });
    setLoading(null);
    setTimeout(() => setProgress(null), 2000);
    if (last) toast(`Починено: ${last.fixed}${last.fixFailed ? `, не вышло: ${last.fixFailed}` : ""}`, last.fixFailed ? "warn" : "ok");
  };

  const reconcile = async () => {
    setLoading("reconcile");
    setError(null);
    setRec(null);
    const r = await postJson<ReconcileReport>("/api/admin/remnawave/reconcile");
    setLoading(null);
    if (!r.ok) {
      toast(r.error, r.status === 409 ? "warn" : "off");
      if (r.status !== 409) setError(r.error);
      return;
    }
    setRec(r.data);
    toast(`Сверка: проверено ${r.data.scanned}, исправлено ${r.data.fixed}${r.data.failed ? `, ошибок ${r.data.failed}` : ""}`, r.data.failed ? "warn" : "ok");
  };

  const buildLog = (): string => {
    const lines: string[] = [`Panel-sync audit — ${new Date().toISOString()}`, ""];
    if (error) lines.push(`ERROR: ${error}`, "");
    if (report) {
      lines.push(`Scanned: ${report.scanned}`, `OK: ${report.ok}`, `Broken: ${report.broken}`, `Fixed: ${report.fixed}`, `Fix failed: ${report.fixFailed}`, "");
      (Object.keys(report.byProblem) as AuditProblem[]).forEach((k) => lines.push(`  ${k}: ${report.byProblem[k]}`));
      for (const r of report.rows.filter((x) => x.problems.length > 0 || x.fixError)) {
        lines.push("", `[${r.email}] ${r.publicId || "—"} panel=${r.panelUuid || "—"}`);
        lines.push(`  local end=${r.localSubscriptionEnd} plan=${r.localPlan}`);
        lines.push(`  panel end=${r.panelExpireAt || "—"} status=${r.panelStatus || "—"} tag=${r.panelTag || "—"} url=${r.panelSubscriptionUrl ? "yes" : "no"}`);
        lines.push(`  problems: ${r.problems.join(", ") || "none"}`);
        if (r.fixSummary) lines.push(`  fix: ${r.fixSummary}`);
        if (r.fixError) lines.push(`  fixError: ${r.fixError}`);
      }
    }
    return lines.join("\n");
  };

  const copyLog = async () => {
    try {
      await navigator.clipboard.writeText(buildLog());
    } catch {
      /* буфер недоступен — лог виден в окне */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const broken = report ? report.rows.filter((r) => r.problems.length > 0 || r.fixError) : [];
  const share = progress && progress.total > 0 ? Math.min(1, progress.done / progress.total) : 0;

  const modal = logOpen ? (
    <div className="ak-dialog adm-dialog" role="dialog" aria-modal="true" aria-labelledby="adm-log-h">
      <div className="ak-dialog-veil" onClick={() => setLogOpen(false)} />
      <div className="ak-dialog-card adm-modal">
        <div className="adm-modal-head">
          <div>
            <h2 id="adm-log-h" className="ak-h3">Лог сверки</h2>
            <p className="ak-fine">Скопируйте и отправьте разработке.</p>
          </div>
          <button type="button" onClick={() => setLogOpen(false)} className="ak-icon" aria-label="Закрыть лог">
            <Icon name="close" size={18} />
          </button>
        </div>
        <pre className="adm-log-pre" tabIndex={0}>{buildLog()}</pre>
        <div className="ak-actions">
          <button type="button" onClick={copyLog} autoFocus className="a-btn a-btn-primary" data-state={copied ? "ok" : undefined}>
            <Icon name={copied ? "check" : "copy"} size={16} />
            {copied ? "Скопировано" : "Скопировать всё"}
          </button>
          <button type="button" onClick={() => setLogOpen(false)} className="a-btn ak-btn-soft">Закрыть</button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <section className="ak-card adm-s-sync" data-sheet="24" style={{ "--i": i } as CSSProperties} aria-labelledby="adm-sync-h">
      <div className="ak-card-head">
        <h2 id="adm-sync-h" className="ak-eyebrow">Сверка с панелью</h2>
        {report && (
          <span className="ak-status" data-tone={report.broken > 0 ? "warn" : undefined}>
            <i />
            {report.broken > 0 ? `Расхождений: ${report.broken}` : "Всё сходится"}
          </span>
        )}
      </div>
      <p className="ak-text adm-lead">Сравнивает каждого пользователя сайта с панелью и чинит расхождения. Ничего не удаляет.</p>

      {error && <p className="ak-err adm-break" role="alert">{error}</p>}

      <div className="adm-sub-actions">
        <button type="button" onClick={audit} disabled={loading !== null} className="a-btn ak-btn-soft">
          {loading === "audit" ? <><Spin />Проверяем…</> : <><Icon name="shield" size={16} />Проверить</>}
        </button>
        {report && report.broken > 0 && (
          <button type="button" onClick={apply} disabled={loading !== null} className="a-btn a-btn-primary">
            {loading === "apply" ? <><Spin />Чиним…</> : <><Icon name="refresh" size={16} />Починить {report.broken}</>}
          </button>
        )}
        <button type="button" onClick={reconcile} disabled={loading !== null} className="a-btn ak-btn-soft">
          {loading === "reconcile" ? <><Spin />Сверяем…</> : <><Icon name="clock" size={16} />Плановая сверка</>}
        </button>
      </div>
      <p className="ak-fine">«Плановая сверка» — то, что сервер делает сам раз в час: живые и недавно истёкшие подписки.</p>

      {progress && progress.total > 0 && (
        <div className="adm-progress-box">
          <p className="adm-result-row">
            <span>Прогресс починки</span>
            <span className="a-num">{progress.done} / {progress.total}</span>
          </p>
          <div className="adm-progress" role="progressbar" aria-label="Прогресс починки" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.done} style={{ "--p": share } as CSSProperties}>
            <i />
          </div>
        </div>
      )}

      {report && (
        <div className="adm-report">
          <ul className="adm-tiles">
            <Tile label="Проверено" value={num(report.scanned)} />
            <Tile label="В порядке" value={num(report.ok)} tone="ok" />
            <Tile label="С расхождениями" value={num(report.broken)} tone={report.broken > 0 ? "warn" : undefined} />
            {report.fixed > 0 && <Tile label="Починено" value={num(report.fixed)} tone="ok" />}
            {report.fixFailed > 0 && <Tile label="Не вышло" value={num(report.fixFailed)} tone="off" />}
          </ul>
          {report.broken > 0 && (
            <div className="adm-tagrow adm-gap">
              {(Object.keys(report.byProblem) as AuditProblem[])
                .filter((k) => report.byProblem[k] > 0)
                .map((k) => (
                  <span key={k} className="adm-tag" data-tone={PROBLEM_TONE[k]}>
                    {PROBLEM_LABEL[k] || k} · <span className="a-num">{report.byProblem[k]}</span>
                  </span>
                ))}
            </div>
          )}
          {broken.length > 0 && (
            <details className="adm-details">
              <summary>Кто расходится ({broken.length})</summary>
              <ul className="adm-issues">
                {broken.map((r) => (
                  <li key={r.userId}>
                    <button type="button" className="adm-issue-btn" onClick={() => onOpenUser(r.userId)}>
                      <span className="adm-result-row">
                        <span className="adm-issue-mail">{r.email}</span>
                        <span className="a-num adm-muted">{r.publicId || "—"}</span>
                      </span>
                      <span className="adm-tagrow">
                        {r.problems.map((p) => (
                          <span key={p} className="adm-tag" data-tone={PROBLEM_TONE[p]}>{PROBLEM_LABEL[p] || p}</span>
                        ))}
                      </span>
                      {r.fixError && <span className="adm-result-line adm-break" data-tone="off">Ошибка: {r.fixError}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          )}
          {(broken.length > 0 || error) && (
            <button type="button" className="adm-link" onClick={() => setLogOpen(true)}>
              Полный лог для разработки
              <Icon name="arrow-right" size={16} />
            </button>
          )}
        </div>
      )}

      {rec && (
        <div className="adm-result">
          <div className="adm-result-row">
            <span>Плановая сверка</span>
            <span className="a-num adm-muted">{(rec.durationMs / 1000).toLocaleString("ru-RU", { maximumFractionDigits: 1 })} с</span>
          </div>
          <ul className="adm-tiles adm-tiles-sm">
            <Tile label="Проверено" value={num(rec.scanned)} />
            <Tile label="К правке" value={num(rec.needed_fix)} tone={rec.needed_fix > 0 ? "warn" : undefined} />
            <Tile label="Исправлено" value={num(rec.fixed)} tone="ok" />
            <Tile label="Ошибок" value={num(rec.failed + (rec.errors?.length || 0))} tone={rec.failed + (rec.errors?.length || 0) > 0 ? "off" : undefined} />
          </ul>
          {rec.issues.length > 0 && (
            <details className="adm-details">
              <summary>Что исправлено ({rec.issues.length})</summary>
              <ul className="adm-issues">
                {rec.issues.map((x) => (
                  <li key={x.userId}>
                    <button type="button" className="adm-issue-btn" onClick={() => onOpenUser(x.userId)}>
                      <span className="adm-result-row">
                        <span className="adm-issue-mail">{x.email}</span>
                        <span className="adm-tag" data-tone={x.fixed ? undefined : "off"}>{x.fixed ? "исправлен" : "ошибка"}</span>
                      </span>
                      <span className="adm-result-line">{KIND_LABEL[x.kind] || x.kind}{x.fixError ? ` · ${x.fixError}` : ""}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {modal && (layer ? createPortal(modal, layer) : modal)}
    </section>
  );
}
