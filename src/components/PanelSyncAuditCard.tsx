"use client";

import { useState } from "react";

type AuditProblem =
  | "no_uuid"
  | "missing_in_panel"
  | "url_missing"
  | "date_drift"
  | "status_mismatch"
  | "tag_mismatch";

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
  url_missing: "нет subscription URL",
  date_drift: "дата не совпадает",
  status_mismatch: "статус ≠ ACTIVE",
  tag_mismatch: "тег ≠ плану",
};

const PROBLEM_COLOR: Record<AuditProblem, string> = {
  no_uuid: "#EF4444",
  missing_in_panel: "#EF4444",
  url_missing: "#F59E0B",
  date_drift: "#F59E0B",
  status_mismatch: "#F59E0B",
  tag_mismatch: "#6366F1",
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
 */
export default function PanelSyncAuditCard() {
  const [loading, setLoading] = useState<"audit" | "apply" | null>(null);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

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
      const ok = window.confirm(
        report
          ? `Починить ${report.broken} проблемных пользователей? Каждому запустится полный sync (repair ghost-даты + push expireAt + ACTIVE + tag). Действие не деструктивное — только приведение панели в соответствие с локальной БД.\n\nОбработка идёт батчами по 25 — займёт около ${Math.ceil(report.broken / 25 * 40 / 60)} мин.`
          : "Запустить починку? Сначала лучше запустить проверку."
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

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 space-y-3">
      <div>
        <h3 className="font-semibold text-sm">Аудит панели (Remnawave 3.x)</h3>
        <p className="text-xs text-muted mt-1 leading-relaxed">
          Сверяет каждого локального пользователя с панелью — expireAt, status,
          tag, subscription URL. По кнопке «Починить всех» запускает полный
          sync (repair ghost + PATCH ACTIVE + tag) для проблемных.
        </p>
      </div>

      {error && !errorModalOpen && (
        <div className="p-2 rounded-lg bg-danger/10 border border-danger/20">
          <p className="text-danger text-xs">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => run(false)}
          disabled={loading !== null}
          className="h-10 rounded-xl bg-card-hover border border-border text-foreground font-medium text-xs btn-press disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading === "audit" ? "Проверяем…" : "Проверить"}
        </button>
        <button
          onClick={() => run(true)}
          disabled={loading !== null || !report || report.broken === 0}
          title={!report ? "Сначала запустите проверку" : report.broken === 0 ? "Проблем не найдено" : ""}
          className="h-10 rounded-xl bg-warning/10 border border-warning/30 text-warning font-semibold text-xs btn-press disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-warning/15"
        >
          {loading === "apply" ? "Чиним…" : "Починить всех"}
        </button>
      </div>

      {progress && progress.total > 0 && (
        <div>
          <div className="flex items-center justify-between text-[10px] text-muted mb-1">
            <span>Прогресс починки</span>
            <span className="font-mono">
              {progress.done} / {progress.total}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-card-hover overflow-hidden">
            <div
              className="h-full bg-warning transition-all duration-300"
              style={{ width: `${Math.min(100, Math.round((progress.done / Math.max(1, progress.total)) * 100))}%` }}
            />
          </div>
        </div>
      )}

      {report && (
        <div className="space-y-2">
          <div className="text-[11px] text-muted">
            Scanned: {report.scanned} · OK: {report.ok} · Broken: {report.broken}
            {report.fixed > 0 && ` · Fixed: ${report.fixed}`}
            {report.fixFailed > 0 && (
              <span className="text-danger"> · Fix failed: {report.fixFailed}</span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
            {(Object.keys(report.byProblem) as AuditProblem[]).map((k) => (
              <div
                key={k}
                className="rounded-lg p-2"
                style={{ background: `${PROBLEM_COLOR[k]}18`, border: `1px solid ${PROBLEM_COLOR[k]}30` }}
              >
                <div className="text-base font-bold tabular-nums" style={{ color: PROBLEM_COLOR[k] }}>
                  {report.byProblem[k]}
                </div>
                <div className="text-muted mt-0.5">{PROBLEM_LABEL[k]}</div>
              </div>
            ))}
          </div>

          {(brokenRows.length > 0 || errorRows.length > 0) && (
            <button
              onClick={() => setErrorModalOpen(true)}
              className="w-full h-9 rounded-lg bg-card-hover border border-border text-foreground text-[11px] font-medium hover:bg-card-active transition-colors"
            >
              Показать лог ({brokenRows.length} проблем
              {errorRows.length > 0 && ` · ${errorRows.length} ошибок починки`})
            </button>
          )}

          {brokenRows.length > 0 && (
            <details className="pt-1">
              <summary className="text-xs text-muted cursor-pointer hover:text-foreground">
                Список проблемных ({brokenRows.length})
              </summary>
              <div className="mt-2 space-y-1 max-h-64 overflow-y-auto">
                {brokenRows.map((r) => (
                  <div key={r.userId} className="text-[11px] p-2 bg-card-hover rounded">
                    <div className="flex justify-between gap-2">
                      <span className="truncate font-medium">{r.email}</span>
                      <span className="shrink-0 text-muted text-[10px]">{r.publicId || "—"}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {r.problems.map((p) => (
                        <span
                          key={p}
                          className="text-[9px] px-1.5 py-0.5 rounded"
                          style={{ background: `${PROBLEM_COLOR[p]}18`, color: PROBLEM_COLOR[p] }}
                        >
                          {PROBLEM_LABEL[p]}
                        </span>
                      ))}
                    </div>
                    {r.fixError && (
                      <div className="text-[10px] text-danger mt-1 font-mono break-all">
                        ✗ {r.fixError}
                      </div>
                    )}
                    {r.fixSummary && !r.fixError && (
                      <div className="text-[10px] text-success mt-1 font-mono break-all">
                        ✓ {r.fixSummary}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {errorModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60"
          onClick={() => setErrorModalOpen(false)}
        >
          <div
            className="relative bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex items-center justify-between gap-3">
              <div>
                <h4 className="font-semibold text-sm">Полный лог аудита</h4>
                <p className="text-[11px] text-muted mt-0.5">
                  Нажмите «Скопировать всё» — вставьте в чат разработке.
                </p>
              </div>
              <button
                onClick={() => setErrorModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-card-hover text-muted hover:text-foreground flex items-center justify-center shrink-0"
                aria-label="Закрыть"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <pre className="flex-1 overflow-auto p-4 text-[11px] font-mono bg-background whitespace-pre-wrap break-all leading-relaxed">
              {buildErrorLog()}
            </pre>

            <div className="p-4 border-t border-border flex gap-2">
              <button
                onClick={copyLog}
                className={`flex-1 h-11 rounded-xl font-semibold text-sm transition-colors ${
                  copied
                    ? "bg-success/15 border border-success/30 text-success"
                    : "bg-foreground text-background hover:bg-foreground/90"
                }`}
              >
                {copied ? "✓ Скопировано" : "Скопировать всё"}
              </button>
              <button
                onClick={() => setErrorModalOpen(false)}
                className="h-11 px-5 rounded-xl border border-border text-foreground text-sm hover:bg-card-hover"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
