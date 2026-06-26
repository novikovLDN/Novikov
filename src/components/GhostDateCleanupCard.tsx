"use client";

import { useState } from "react";

interface PerUserReport {
  userId: string;
  email: string;
  publicId: string | null;
  telegramId: string | null;
  oldSubscriptionEnd: string;
  newSubscriptionEnd: string;
  panelTarget: string;
  action: "expired_no_payment" | "expired_payment_too_old" | "corrected_from_payment";
  confirmedPayments: number;
  latestPaidAt: string | null;
  latestPlan: string | null;
  latestPeriodMonths: number | null;
  panelPushOk: boolean | null;
  panelPushError?: string;
  dbWritten: boolean;
}

interface CleanupResult {
  dryRun: boolean;
  scanned: number;
  expired_no_payment: number;
  expired_payment_too_old: number;
  corrected_from_payment: number;
  panel_pushed: number;
  panel_failed: number;
  db_written: number;
  users: PerUserReport[];
}

const ACTION_LABEL: Record<PerUserReport["action"], string> = {
  expired_no_payment: "истекаем (не платил)",
  expired_payment_too_old: "истекаем (платил давно)",
  corrected_from_payment: "по оплате",
};

const ACTION_COLOR: Record<PerUserReport["action"], string> = {
  expired_no_payment: "text-danger",
  expired_payment_too_old: "text-warning",
  corrected_from_payment: "text-success",
};

/**
 * Cleans up users with subscription_end > NOW + 400 days. Honest
 * re-grant: latest confirmed payment → use that period, else expire.
 * Always preview first via dry-run.
 */
export default function GhostDateCleanupCard() {
  const [loading, setLoading] = useState<"dry" | "apply" | null>(null);
  const [result, setResult] = useState<CleanupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (dryRun: boolean) => {
    if (!dryRun) {
      const ok = confirm(
        result
          ? `Применить ${result.scanned} изменений?\n\n• ${result.expired_no_payment} истекут (не платили)\n• ${result.expired_payment_too_old} истекут (платили давно)\n• ${result.corrected_from_payment} получат корректную дату по оплате`
          : "Применить cleanup? Это запишет новые subscription_end в БД и проставит expireAt в панели."
      );
      if (!ok) return;
    }

    setLoading(dryRun ? "dry" : "apply");
    setError(null);
    if (dryRun) setResult(null);
    try {
      const res = await fetch("/api/admin/users/cleanup-ghost-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun }),
      });
      const data = await res.json();
      if (data.success) setResult(data.data as CleanupResult);
      else setError(data.error || "Ошибка");
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 space-y-3">
      <div>
        <h3 className="font-semibold text-sm">Очистка ghost-дат (10-летние)</h3>
        <p className="text-xs text-muted mt-1 leading-relaxed">
          Находит юзеров с subscription_end &gt; NOW+400 дней. По каждому смотрит последнюю подтверждённую оплату:
          если есть — выставляет paid_at + период тарифа; если нет — истекаем (NOW-1с локально, NOW+1д в панели).
        </p>
      </div>

      {error && (
        <div className="p-2 rounded-lg bg-danger/10 border border-danger/20">
          <p className="text-danger text-xs">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => run(true)}
          disabled={loading !== null}
          className="h-10 rounded-xl bg-card-hover border border-border text-foreground font-medium text-xs btn-press disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading === "dry" ? "Считаем…" : "🔍 Превью (dry-run)"}
        </button>
        <button
          onClick={() => run(false)}
          disabled={loading !== null || !result?.dryRun}
          title={!result?.dryRun ? "Сначала запусти превью" : ""}
          className="h-10 rounded-xl bg-warning/10 border border-warning/30 text-warning font-semibold text-xs btn-press disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-warning/15"
        >
          {loading === "apply" ? "Применяем…" : "⚠ Применить"}
        </button>
      </div>

      {result && (
        <div className="space-y-2">
          <div className="text-[11px] text-muted">
            {result.dryRun ? "Превью (изменений в БД нет)" : "Применено"} · сканировано {result.scanned}
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
            <div className="bg-success/10 rounded-lg p-2">
              <div className="text-base font-bold tabular-nums text-success">{result.corrected_from_payment}</div>
              <div className="text-muted">по оплате</div>
            </div>
            <div className="bg-warning/10 rounded-lg p-2">
              <div className="text-base font-bold tabular-nums text-warning">{result.expired_payment_too_old}</div>
              <div className="text-muted">истекли (старая)</div>
            </div>
            <div className="bg-danger/10 rounded-lg p-2">
              <div className="text-base font-bold tabular-nums text-danger">{result.expired_no_payment}</div>
              <div className="text-muted">не платил</div>
            </div>
          </div>

          {!result.dryRun && (
            <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
              <div className="bg-card-hover rounded-lg p-2">
                <div className="text-sm font-bold tabular-nums">{result.db_written}</div>
                <div className="text-muted">БД обновлено</div>
              </div>
              <div className="bg-card-hover rounded-lg p-2">
                <div className="text-sm font-bold tabular-nums">
                  {result.panel_pushed}
                  {result.panel_failed > 0 && <span className="text-danger"> · {result.panel_failed} fail</span>}
                </div>
                <div className="text-muted">в панель</div>
              </div>
            </div>
          )}

          {result.users.length > 0 && (
            <details>
              <summary className="text-xs text-muted cursor-pointer hover:text-foreground">
                Детали по юзерам ({result.users.length})
              </summary>
              <div className="mt-2 space-y-1 max-h-72 overflow-y-auto">
                {result.users.map((u) => (
                  <div key={u.userId} className="text-[11px] p-2 bg-card-hover rounded">
                    <div className="flex justify-between gap-2">
                      <span className="truncate font-medium">{u.email}</span>
                      <span className={`shrink-0 ${ACTION_COLOR[u.action]}`}>{ACTION_LABEL[u.action]}</span>
                    </div>
                    <div className="text-[10px] text-muted mt-0.5">
                      {u.publicId || "—"}
                      {u.telegramId ? ` · TG:${u.telegramId}` : ""}
                      {u.confirmedPayments > 0 && ` · оплат: ${u.confirmedPayments}`}
                    </div>
                    <div className="text-[10px] text-muted mt-0.5 font-mono">
                      было: {u.oldSubscriptionEnd.slice(0, 16)} → стало: {u.newSubscriptionEnd.slice(0, 16)}
                    </div>
                    {u.latestPaidAt && (
                      <div className="text-[10px] text-muted mt-0.5 font-mono">
                        посл. платёж: {u.latestPaidAt.slice(0, 16)} · {u.latestPlan} ({u.latestPeriodMonths} мес)
                      </div>
                    )}
                    {!result.dryRun && (
                      <div className="text-[10px] mt-0.5">
                        {u.dbWritten && <span className="text-success">БД ✓ </span>}
                        {u.panelPushOk === true && <span className="text-success">панель ✓</span>}
                        {u.panelPushOk === false && <span className="text-danger">панель ✗ {u.panelPushError || ""}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
