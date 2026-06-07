"use client";

import { useState } from "react";

interface ReconcileResult {
  scanned: number;
  applied: number;
  canceled: number;
  still_pending: number;
  failed: number;
  details: Array<{ payment_id: string; user_id: string; outcome: string }>;
}

interface ReconciliationResult {
  scanned: number;
  ok: number;
  needed_fix: number;
  fixed: number;
  failed: number;
  by_kind: {
    missing_panel_user: number;
    stale_uuid: number;
    expire_drift: number;
    no_sub_url: number;
  };
  issues: Array<{
    userId: string;
    email: string;
    publicId: string | null;
    telegramId: string | null;
    kind: "missing_panel_user" | "stale_uuid" | "expire_drift" | "no_sub_url";
    localEnd: string;
    panelEnd: string | null;
    panelUsername?: string | null;
    fixed: boolean;
    fixAction: "skip" | "patched" | "created" | "adopted" | "failed" | null;
    fixError?: string;
  }>;
  durationMs: number;
}

const KIND_LABEL: Record<ReconciliationResult["issues"][number]["kind"], string> = {
  missing_panel_user: "нет в панели",
  stale_uuid: "uuid протух",
  expire_drift: "расх. срок",
  no_sub_url: "нет URL",
};

const ACTION_LABEL: Record<NonNullable<ReconciliationResult["issues"][number]["fixAction"]>, string> = {
  created: "создан",
  adopted: "усыновлён",
  patched: "обновлён",
  skip: "пропущен",
  failed: "ошибка",
};

/**
 * Admin operations card. Two workflows kept after cleanup:
 *   - Reconcile site ↔ Remnawave panel state (verify + fix in one pass).
 *   - Reconcile pending YooKassa payments (poll for missed webhooks).
 * Everything else (bulk migration, sync-all, read-only verify, nuclear
 * reset, duplicate cleanup) was removed once reconcile covered the
 * day-to-day need.
 */
export default function RemnawaveMigrationCard() {
  const [reconciling, setReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState<ReconcileResult | null>(null);
  const [reconcilingPanel, setReconcilingPanel] = useState(false);
  const [panelReconcileResult, setPanelReconcileResult] = useState<ReconciliationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runReconcile = async () => {
    setReconciling(true);
    setReconcileResult(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/payments/reconcile-pending", { method: "POST" });
      const data = await res.json();
      if (data.success) setReconcileResult(data.data as ReconcileResult);
      else setError(data.error || "Ошибка reconcile");
    } catch {
      setError("Ошибка сети");
    } finally {
      setReconciling(false);
    }
  };

  const runPanelReconcile = async () => {
    setReconcilingPanel(true);
    setPanelReconcileResult(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/remnawave/reconcile", { method: "POST" });
      const data = await res.json();
      if (data.success) setPanelReconcileResult(data.data as ReconciliationResult);
      else setError(data.error || "Ошибка сверки");
    } catch {
      setError("Ошибка сети");
    } finally {
      setReconcilingPanel(false);
    }
  };

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 space-y-4">
      <h3 className="font-semibold text-sm">Операции с Remnawave</h3>

      {error && (
        <div className="p-3 rounded-lg bg-danger/10 border border-danger/20">
          <p className="text-danger text-xs">{error}</p>
        </div>
      )}

      {/* ── Panel reconciliation (verify + fix) ── */}
      <div>
        <p className="text-xs text-muted mb-3 leading-relaxed">
          Один проход «сверь и почини»: для каждого активного юзера проверяет панель, и если профиль не создан / uuid протух / expireAt разъехался — создаёт или патчит. Безопасно: ничего не удаляет.
        </p>
        <button
          onClick={runPanelReconcile}
          disabled={reconcilingPanel}
          className="w-full h-10 rounded-xl bg-primary/10 border border-primary/30 text-primary font-semibold text-xs btn-press disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-primary/15"
        >
          {reconcilingPanel ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
              </svg>
              Сверка с панелью…
            </>
          ) : (
            <>⚙ Сверить и починить всех с панелью</>
          )}
        </button>

        {panelReconcileResult && (
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-5 gap-2 text-center text-[10px]">
              <div className="bg-card-hover rounded-lg p-2">
                <div className="text-base font-bold tabular-nums">{panelReconcileResult.scanned}</div>
                <div className="text-muted">Просм.</div>
              </div>
              <div className="bg-success/10 rounded-lg p-2">
                <div className="text-base font-bold tabular-nums text-success">{panelReconcileResult.ok}</div>
                <div className="text-muted">OK</div>
              </div>
              <div className="bg-warning/10 rounded-lg p-2">
                <div className="text-base font-bold tabular-nums text-warning">{panelReconcileResult.needed_fix}</div>
                <div className="text-muted">К правке</div>
              </div>
              <div className="bg-success/10 rounded-lg p-2">
                <div className="text-base font-bold tabular-nums text-success">{panelReconcileResult.fixed}</div>
                <div className="text-muted">Починено</div>
              </div>
              <div className="bg-danger/10 rounded-lg p-2">
                <div className="text-base font-bold tabular-nums text-danger">{panelReconcileResult.failed}</div>
                <div className="text-muted">Ошибки</div>
              </div>
            </div>

            {panelReconcileResult.needed_fix > 0 && (
              <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                <div className="bg-card-hover rounded-lg p-2">
                  <div className="text-sm font-bold tabular-nums">{panelReconcileResult.by_kind.missing_panel_user}</div>
                  <div className="text-muted">нет в панели</div>
                </div>
                <div className="bg-card-hover rounded-lg p-2">
                  <div className="text-sm font-bold tabular-nums">{panelReconcileResult.by_kind.stale_uuid}</div>
                  <div className="text-muted">uuid протух</div>
                </div>
                <div className="bg-card-hover rounded-lg p-2">
                  <div className="text-sm font-bold tabular-nums">{panelReconcileResult.by_kind.expire_drift}</div>
                  <div className="text-muted">расх. срок</div>
                </div>
                <div className="bg-card-hover rounded-lg p-2">
                  <div className="text-sm font-bold tabular-nums">{panelReconcileResult.by_kind.no_sub_url}</div>
                  <div className="text-muted">нет URL</div>
                </div>
              </div>
            )}

            {panelReconcileResult.issues.length > 0 ? (
              <details>
                <summary className="text-xs text-muted cursor-pointer hover:text-foreground">
                  Изменения ({panelReconcileResult.issues.length}) · {panelReconcileResult.durationMs}мс
                </summary>
                <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
                  {panelReconcileResult.issues.map((iss) => (
                    <div key={iss.userId} className="text-[11px] p-2 bg-card-hover rounded">
                      <div className="flex justify-between gap-2">
                        <span className="truncate font-medium">{iss.email}</span>
                        <span className={`shrink-0 ${iss.fixed ? "text-success" : "text-danger"}`}>
                          {iss.fixAction ? ACTION_LABEL[iss.fixAction] : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2 mt-0.5 text-[10px] text-muted">
                        <span>
                          {iss.publicId || "—"}
                          {iss.telegramId ? ` · TG:${iss.telegramId}` : ""}
                        </span>
                        <span>{KIND_LABEL[iss.kind]}</span>
                      </div>
                      {(iss.kind === "expire_drift" || iss.panelEnd) && (
                        <div className="text-[10px] text-muted mt-0.5 font-mono">
                          лок: {iss.localEnd.slice(0, 16)} · панель: {iss.panelEnd?.slice(0, 16) || "—"}
                        </div>
                      )}
                      {iss.fixError && (
                        <div className="text-[10px] text-danger mt-0.5">{iss.fixError}</div>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            ) : (
              <p className="text-xs text-success text-center">Все {panelReconcileResult.scanned} юзеров уже в порядке.</p>
            )}
          </div>
        )}
      </div>

      {/* ── Reconcile pending YooKassa payments ── */}
      <div className="pt-3 border-t border-border/30">
        <p className="text-xs text-muted mb-3 leading-relaxed">
          Опросить YooKassa по всем pending-платежам за последние 7 дней. Если оплата прошла, но webhook не дошёл — подписка будет выдана сейчас.
        </p>
        <button
          onClick={runReconcile}
          disabled={reconciling}
          className="w-full h-10 rounded-xl bg-success/10 border border-success/30 text-success font-semibold text-xs btn-press disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-success/15"
        >
          {reconciling ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
              </svg>
              Опрос YooKassa…
            </>
          ) : (
            <>✓ Подтянуть оплаченные подписки</>
          )}
        </button>

        {reconcileResult && (
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
              <div className="bg-card-hover rounded-lg p-2">
                <div className="text-base font-bold tabular-nums">{reconcileResult.scanned}</div>
                <div className="text-muted">Опрошено</div>
              </div>
              <div className="bg-success/10 rounded-lg p-2">
                <div className="text-base font-bold tabular-nums text-success">{reconcileResult.applied}</div>
                <div className="text-muted">Выдано</div>
              </div>
              <div className="bg-card-hover rounded-lg p-2">
                <div className="text-base font-bold tabular-nums">{reconcileResult.still_pending}</div>
                <div className="text-muted">В ожидании</div>
              </div>
              <div className="bg-danger/10 rounded-lg p-2">
                <div className="text-base font-bold tabular-nums text-danger">{reconcileResult.failed}</div>
                <div className="text-muted">Ошибки</div>
              </div>
            </div>
            {reconcileResult.details.length > 0 && (
              <details>
                <summary className="text-xs text-muted cursor-pointer hover:text-foreground">
                  Детали ({reconcileResult.details.length})
                </summary>
                <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                  {reconcileResult.details.map((d) => (
                    <div key={d.payment_id} className="text-[11px] py-1 px-2 bg-card-hover rounded flex justify-between gap-2">
                      <span className="truncate font-mono">{d.payment_id.slice(0, 8)}…</span>
                      <span className="text-muted shrink-0">{d.outcome}</span>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
