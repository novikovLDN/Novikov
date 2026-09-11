"use client";

import { useState, type CSSProperties } from "react";
import Icon from "@/components/pixel/Icon";
import { Spin } from "@/app/admin/AdminConfirm";

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
  stale_uuid: "uuid устарел",
  expire_drift: "срок расходится",
  no_sub_url: "нет ссылки",
};

const ACTION_LABEL: Record<NonNullable<ReconciliationResult["issues"][number]["fixAction"]>, string> = {
  created: "создан",
  adopted: "привязан",
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
 *
 * Обе операции ничего не удаляют — подтверждения у них не было и нет.
 */
export default function RemnawaveMigrationCard({ i = 0 }: { i?: number }) {
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

  const pr = panelReconcileResult;

  return (
    <section className="ak-card adm-remna" data-sheet="24" style={{ "--i": i } as CSSProperties} aria-labelledby="adm-remna-h">
      <div className="ak-card-head">
        <h2 id="adm-remna-h" className="ak-eyebrow">Операции с Remnawave и оплатами</h2>
      </div>

      {error && <p className="ak-err" role="alert">{error}</p>}

      <div className="adm-ops">
        {/* ── Panel reconciliation (verify + fix) ── */}
        <div className="adm-op">
          <h3 className="adm-block-title"><Icon name="refresh" size={16} />Сверить и починить с панелью</h3>
          <p className="ak-text">
            Один проход «сверь и почини»: для каждого активного пользователя проверяет панель и, если профиль не создан,
            UUID устарел или срок разъехался, — создаёт или обновляет. Безопасно: ничего не удаляет.
          </p>
          <div className="adm-sub-actions">
            <button type="button" onClick={runPanelReconcile} disabled={reconcilingPanel} className="a-btn ak-btn-soft">
              {reconcilingPanel ? <><Spin />Сверяем с панелью…</> : <><Icon name="refresh" size={16} />Сверить всех</>}
            </button>
          </div>

          {pr && (
            <div className="adm-report">
              <ul className="adm-tiles">
                <li className="adm-tile"><span>Проверено</span><b className="a-num">{pr.scanned}</b></li>
                <li className="adm-tile"><span>В порядке</span><b className="a-num">{pr.ok}</b></li>
                <li className="adm-tile" data-tone={pr.needed_fix > 0 ? "warn" : undefined}><span>К правке</span><b className="a-num">{pr.needed_fix}</b></li>
                <li className="adm-tile" data-tone="ok"><span>Починено</span><b className="a-num">{pr.fixed}</b></li>
                <li className="adm-tile" data-tone={pr.failed > 0 ? "off" : undefined}><span>Ошибки</span><b className="a-num">{pr.failed}</b></li>
              </ul>

              {pr.needed_fix > 0 && (
                <ul className="adm-tiles adm-tiles-sm">
                  <li className="adm-tile"><span>нет в панели</span><b className="a-num">{pr.by_kind.missing_panel_user}</b></li>
                  <li className="adm-tile"><span>uuid устарел</span><b className="a-num">{pr.by_kind.stale_uuid}</b></li>
                  <li className="adm-tile"><span>срок расходится</span><b className="a-num">{pr.by_kind.expire_drift}</b></li>
                  <li className="adm-tile"><span>нет ссылки</span><b className="a-num">{pr.by_kind.no_sub_url}</b></li>
                </ul>
              )}

              {pr.issues.length > 0 ? (
                <details className="adm-details">
                  <summary>Изменения ({pr.issues.length}) · <span className="a-num">{pr.durationMs} мс</span></summary>
                  <ul className="adm-issues">
                    {pr.issues.map((iss) => (
                      <li key={iss.userId}>
                        <div className="adm-result-row">
                          <span className="adm-issue-mail">{iss.email}</span>
                          <span className="adm-tag" data-tone={iss.fixed ? undefined : "off"}>
                            {iss.fixAction ? ACTION_LABEL[iss.fixAction] : "—"}
                          </span>
                        </div>
                        <div className="adm-result-row adm-result-line">
                          <span className="a-num">
                            {iss.publicId || "—"}
                            {iss.telegramId ? ` · TG:${iss.telegramId}` : ""}
                          </span>
                          <span>{KIND_LABEL[iss.kind]}</span>
                        </div>
                        {(iss.kind === "expire_drift" || iss.panelEnd) && (
                          <p className="adm-result-line a-num">
                            сайт: {iss.localEnd.slice(0, 16)} · панель: {iss.panelEnd?.slice(0, 16) || "—"}
                          </p>
                        )}
                        {iss.fixError && <p className="adm-result-line adm-break" data-tone="off">{iss.fixError}</p>}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : (
                <p className="adm-note" data-tone="ok">Все {pr.scanned} пользователей уже в порядке.</p>
              )}
            </div>
          )}
        </div>

        {/* ── Reconcile pending YooKassa payments ── */}
        <div className="adm-op">
          <h3 className="adm-block-title"><Icon name="check" size={16} />Подтянуть оплаченные подписки</h3>
          <p className="ak-text">
            Опрашивает YooKassa по всем ожидающим платежам за последние 7 дней. Если оплата прошла, а уведомление от кассы
            не дошло, — подписка будет выдана сейчас.
          </p>
          <div className="adm-sub-actions">
            <button type="button" onClick={runReconcile} disabled={reconciling} className="a-btn ak-btn-soft">
              {reconciling ? <><Spin />Опрашиваем YooKassa…</> : <><Icon name="check" size={16} />Подтянуть оплаты</>}
            </button>
          </div>

          {reconcileResult && (
            <div className="adm-report">
              <ul className="adm-tiles">
                <li className="adm-tile"><span>Опрошено</span><b className="a-num">{reconcileResult.scanned}</b></li>
                <li className="adm-tile" data-tone="ok"><span>Выдано</span><b className="a-num">{reconcileResult.applied}</b></li>
                <li className="adm-tile"><span>В ожидании</span><b className="a-num">{reconcileResult.still_pending}</b></li>
                <li className="adm-tile" data-tone={reconcileResult.failed > 0 ? "off" : undefined}><span>Ошибки</span><b className="a-num">{reconcileResult.failed}</b></li>
              </ul>
              {reconcileResult.details.length > 0 && (
                <details className="adm-details">
                  <summary>Детали ({reconcileResult.details.length})</summary>
                  <ul className="adm-issues">
                    {reconcileResult.details.map((d) => (
                      <li key={d.payment_id} className="adm-result-row">
                        <span className="a-num">{d.payment_id.slice(0, 8)}…</span>
                        <span className="adm-muted">{d.outcome}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
