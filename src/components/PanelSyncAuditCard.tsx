"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import Icon from "@/components/pixel/Icon";
import { useAdminConfirm, useAdminLayer, Spin } from "@/app/admin/AdminConfirm";

type AuditProblem =
  | "no_uuid"
  | "missing_in_panel"
  | "url_missing"
  | "date_drift"
  | "status_mismatch"
  | "tag_mismatch"
  | "active_after_expiry"
  | "panel_error";

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

const PROBLEM_LABEL: Record<AuditProblem, string> = {
  no_uuid: "нет UUID в панели",
  missing_in_panel: "потерян в панели",
  url_missing: "нет ссылки подписки",
  date_drift: "дата не совпадает",
  status_mismatch: "статус не ACTIVE",
  tag_mismatch: "тег не равен тарифу",
  active_after_expiry: "работает после окончания",
  panel_error: "панель не ответила",
};

/** Тон класса проблемы: потерянные — красный, расхождения — внимание. */
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

/**
 * PanelSyncAuditCard — admin utility to check every local user against
 * the Remnawave panel and, on demand, run syncSubscriptionToPanel on
 * every broken row.
 *
 * Two-step workflow:
 *   1. "Проверить" — POST /api/admin/remnawave/audit (dry-run). Shows
 *      summary counters + detailed per-user diff.
 *   2. "Починить всех" — POST /api/admin/remnawave/audit {apply:true}.
 *      Runs the fix pipeline (ghost-date repair + expireAt + status
 *      ACTIVE + tag), re-audits each user, reports what actually stuck.
 *
 * Any error surface (audit-level or per-user fix-level) fills an
 * error-log modal with a one-tap "Copy all" button so the admin can
 * ship the log to us verbatim.
 *
 * Модальное окно лога рисуется в слое админки (useAdminLayer), а не
 * внутри панели: transform у .ak-card ломает position: fixed.
 */
export default function PanelSyncAuditCard({ i = 0 }: { i?: number }) {
  const confirm = useAdminConfirm();
  const layer = useAdminLayer();
  const [loading, setLoading] = useState<"audit" | "apply" | null>(null);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  useEffect(() => {
    if (!errorModalOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setErrorModalOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [errorModalOpen]);

  const callOnce = async (body: object): Promise<{ ok: boolean; data?: AuditReport; error?: string; rawText?: string; status?: number }> => {
    const res = await fetch("/api/admin/remnawave/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    // Parse defensively — server crash returns HTML.
    const raw = await res.text();
    let json: { success?: boolean; data?: AuditReport; error?: string } | null = null;
    try { json = raw ? JSON.parse(raw) : null; } catch { json = null; }
    if (json?.success && json.data) return { ok: true, data: json.data };
    if (json?.error) return { ok: false, error: json.error };
    return { ok: false, rawText: raw, status: res.status };
  };

  const run = async (apply: boolean) => {
    if (apply) {
      const ok = await confirm(
        report
          ? {
              title: `Починить ${report.broken} проблемных пользователей?`,
              text: `Каждому запустится полный sync (repair ghost-даты + push expireAt + ACTIVE + tag). Действие не деструктивное — только приведение панели в соответствие с локальной БД.\n\nОбработка идёт батчами по 25 — займёт около ${Math.ceil(report.broken / 25 * 40 / 60)} мин.`,
              confirmLabel: "Починить",
              tone: "primary",
            }
          : { title: "Запустить починку?", text: "Сначала лучше запустить проверку.", confirmLabel: "Запустить", tone: "primary" },
      );
      if (!ok) return;
    }

    setLoading(apply ? "apply" : "audit");
    setError(null);
    setProgress(null);
    if (!apply) setReport(null);

    try {
      if (!apply) {
        const first = await callOnce({ apply: false });
        if (first.ok && first.data) {
          setReport(first.data);
        } else if (first.error) {
          setError(first.error);
          setErrorModalOpen(true);
        } else {
          setError(
            `HTTP ${first.status ?? "?"} — сервер вернул не-JSON:\n\n${(first.rawText || "").slice(0, 2000)}${(first.rawText || "").length > 2000 ? "\n… (обрезано)" : ""}`
          );
          setErrorModalOpen(true);
        }
        return;
      }

      // Apply — chunked loop. Server returns hasMore=true while more
      // broken rows remain past this offset; we keep calling with
      // updated offset until the chunk pass says we're done.
      let offset = 0;
      let lastData: AuditReport | null = null;
      const total = report?.broken ?? 0;
      // Hard cap on iterations so a server-side bug can't cause an
      // infinite loop from the browser.
      for (let iter = 0; iter < 40; iter++) {
        setProgress({ done: offset, total });
        const step = await callOnce({ apply: true, offset, chunk: 25 });
        if (!step.ok) {
          if (step.error) {
            setError(step.error);
          } else {
            setError(
              `HTTP ${step.status ?? "?"} — сервер вернул не-JSON:\n\n${(step.rawText || "").slice(0, 2000)}${(step.rawText || "").length > 2000 ? "\n… (обрезано)" : ""}`
            );
          }
          setErrorModalOpen(true);
          if (lastData) setReport(lastData);
          return;
        }
        lastData = step.data as AuditReport;
        setReport(lastData);
        offset = lastData.nextOffset ?? offset + 25;
        if (!lastData.hasMore) break;
      }
      setProgress({ done: total, total });
    } catch (err) {
      setError(err instanceof Error ? `${err.name}: ${err.message}` : String(err));
      setErrorModalOpen(true);
    } finally {
      setLoading(null);
      setTimeout(() => setProgress(null), 2500);
    }
  };

  /**
   * Build the full text log — everything the admin might want to send
   * for a support ticket: totals + per-user diff + any fix errors.
   */
  const buildErrorLog = (): string => {
    const lines: string[] = [];
    lines.push(`Panel-sync audit — ${new Date().toISOString()}`);
    lines.push("");
    if (error) {
      lines.push(`AUDIT ERROR: ${error}`);
      lines.push("");
    }
    if (report) {
      lines.push(`Scanned: ${report.scanned}`);
      lines.push(`OK: ${report.ok}`);
      lines.push(`Broken: ${report.broken}`);
      lines.push(`Fixed: ${report.fixed}`);
      lines.push(`Fix failed: ${report.fixFailed}`);
      lines.push("");
      lines.push("By problem class:");
      (Object.keys(report.byProblem) as AuditProblem[]).forEach((k) => {
        lines.push(`  ${k}: ${report.byProblem[k]}`);
      });
      lines.push("");
      const bad = report.rows.filter((r) => r.problems.length > 0 || r.fixError);
      if (bad.length > 0) {
        lines.push(`--- Details (${bad.length} rows) ---`);
        for (const r of bad) {
          lines.push("");
          lines.push(`[${r.email}] ${r.publicId || "—"}`);
          lines.push(`  panelUuid=${r.panelUuid || "—"}`);
          lines.push(`  local end=${r.localSubscriptionEnd} plan=${r.localPlan}`);
          lines.push(
            `  panel end=${r.panelExpireAt || "—"} status=${r.panelStatus || "—"} tag=${r.panelTag || "—"} url=${r.panelSubscriptionUrl ? "yes" : "no"}`
          );
          lines.push(`  problems: ${r.problems.length ? r.problems.join(", ") : "none"}`);
          if (r.fixApplied !== undefined) {
            lines.push(`  fixApplied=${r.fixApplied}`);
          }
          if (r.fixSummary) lines.push(`  fixSummary=${r.fixSummary}`);
          if (r.fixError) lines.push(`  fixError=${r.fixError}`);
        }
      }
    }
    return lines.join("\n");
  };

  const copyLog = async () => {
    const text = buildErrorLog();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const brokenRows = report ? report.rows.filter((r) => r.problems.length > 0) : [];
  const errorRows = report ? report.rows.filter((r) => r.fixError) : [];
  const share = progress && progress.total > 0 ? Math.min(1, progress.done / Math.max(1, progress.total)) : 0;

  const modal = errorModalOpen ? (
    <div className="ak-dialog adm-dialog" role="dialog" aria-modal="true" aria-labelledby="adm-log-h">
      <div className="ak-dialog-veil" onClick={() => setErrorModalOpen(false)} />
      <div className="ak-dialog-card adm-modal">
        <div className="adm-modal-head">
          <div>
            <h2 id="adm-log-h" className="ak-h3">Полный лог аудита</h2>
            <p className="ak-fine">Нажмите «Скопировать всё» и отправьте разработке.</p>
          </div>
          <button type="button" onClick={() => setErrorModalOpen(false)} className="ak-icon" aria-label="Закрыть лог">
            <Icon name="close" size={18} />
          </button>
        </div>
        <pre className="adm-log-pre" tabIndex={0}>{buildErrorLog()}</pre>
        <div className="ak-actions">
          <button type="button" onClick={copyLog} autoFocus className={`a-btn ${copied ? "ak-btn-soft" : "a-btn-primary"}`} data-state={copied ? "ok" : undefined}>
            <Icon name={copied ? "check" : "copy"} size={16} />
            {copied ? "Скопировано" : "Скопировать всё"}
          </button>
          <button type="button" onClick={() => setErrorModalOpen(false)} className="a-btn ak-btn-soft">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <section className="ak-card adm-audit" data-sheet="24" style={{ "--i": i } as CSSProperties} aria-labelledby="adm-audit-h">
      <div className="ak-card-head">
        <h2 id="adm-audit-h" className="ak-eyebrow">Аудит панели · Remnawave 3.x</h2>
        {report && (
          <span className="ak-status" data-tone={report.broken > 0 ? "warn" : undefined}>
            <i />
            {report.broken > 0 ? `Проблем: ${report.broken}` : "Всё сходится"}
          </span>
        )}
      </div>
      <p className="ak-text">
        Сверяет каждого пользователя с панелью: срок (expireAt), статус, тег и ссылку подписки. «Починить всех» запускает
        полный sync для проблемных — исправление ghost-даты, статус ACTIVE и тег.
      </p>

      {error && !errorModalOpen && <p className="ak-err adm-pre" role="alert">{error}</p>}

      <div className="adm-sub-actions">
        <button type="button" onClick={() => run(false)} disabled={loading !== null} className="a-btn ak-btn-soft">
          {loading === "audit" ? <><Spin />Проверяем…</> : <><Icon name="shield" size={16} />Проверить</>}
        </button>
        <button
          type="button"
          onClick={() => run(true)}
          disabled={loading !== null || !report || report.broken === 0}
          title={!report ? "Сначала запустите проверку" : report.broken === 0 ? "Проблем не найдено" : ""}
          className="a-btn a-btn-primary"
        >
          {loading === "apply" ? <><Spin />Чиним…</> : <><Icon name="refresh" size={16} />Починить всех</>}
        </button>
      </div>
      {!report && loading === null && <p className="ak-fine">«Починить всех» станет доступна после проверки.</p>}

      {progress && progress.total > 0 && (
        <div className="adm-progress-box">
          <p className="adm-result-row">
            <span>Прогресс починки</span>
            <span className="a-num">{progress.done} / {progress.total}</span>
          </p>
          <div
            className="adm-progress"
            role="progressbar"
            aria-label="Прогресс починки"
            aria-valuemin={0}
            aria-valuemax={progress.total}
            aria-valuenow={progress.done}
            style={{ "--p": share } as CSSProperties}
          >
            <i />
          </div>
        </div>
      )}

      {report && (
        <div className="adm-report">
          <ul className="adm-tiles">
            <li className="adm-tile"><span>Проверено</span><b className="a-num">{report.scanned}</b></li>
            <li className="adm-tile"><span>В порядке</span><b className="a-num">{report.ok}</b></li>
            <li className="adm-tile" data-tone={report.broken > 0 ? "warn" : undefined}><span>С проблемами</span><b className="a-num">{report.broken}</b></li>
            {report.fixed > 0 && <li className="adm-tile" data-tone="ok"><span>Починено</span><b className="a-num">{report.fixed}</b></li>}
            {report.fixFailed > 0 && <li className="adm-tile" data-tone="off"><span>Не починилось</span><b className="a-num">{report.fixFailed}</b></li>}
          </ul>

          <p className="adm-f-label adm-gap">По видам проблем</p>
          <ul className="adm-tiles adm-tiles-sm">
            {(Object.keys(report.byProblem) as AuditProblem[]).map((k) => (
              <li key={k} className="adm-tile" data-tone={report.byProblem[k] > 0 ? PROBLEM_TONE[k] : undefined}>
                <span>{PROBLEM_LABEL[k]}</span>
                <b className="a-num">{report.byProblem[k]}</b>
              </li>
            ))}
          </ul>

          {(brokenRows.length > 0 || errorRows.length > 0) && (
            <div className="adm-sub-actions">
              <button type="button" onClick={() => setErrorModalOpen(true)} className="a-btn ak-btn-soft">
                Показать лог ({brokenRows.length} проблем
                {errorRows.length > 0 && ` · ${errorRows.length} ошибок починки`})
              </button>
            </div>
          )}

          {brokenRows.length > 0 && (
            <details className="adm-details">
              <summary>Список проблемных ({brokenRows.length})</summary>
              <ul className="adm-issues">
                {brokenRows.map((r) => (
                  <li key={r.userId}>
                    <div className="adm-result-row">
                      <span className="adm-issue-mail">{r.email}</span>
                      <span className="a-num adm-muted">{r.publicId || "—"}</span>
                    </div>
                    <div className="adm-tagrow">
                      {r.problems.map((p) => (
                        <span key={p} className="adm-tag" data-tone={PROBLEM_TONE[p]}>{PROBLEM_LABEL[p]}</span>
                      ))}
                    </div>
                    {r.fixError && <p className="adm-result-line adm-break" data-tone="off">Ошибка: {r.fixError}</p>}
                    {r.fixSummary && !r.fixError && <p className="adm-result-line adm-break" data-tone="ok">Готово: {r.fixSummary}</p>}
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
