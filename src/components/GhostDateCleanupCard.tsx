"use client";

import { useState, type CSSProperties } from "react";
import Icon from "@/components/pixel/Icon";
import { useAdminConfirm, Spin } from "@/app/admin/AdminConfirm";

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

const ACTION_TONE: Record<PerUserReport["action"], "off" | "warn" | undefined> = {
  expired_no_payment: "off",
  expired_payment_too_old: "warn",
  corrected_from_payment: undefined,
};

/**
 * Cleans up users with subscription_end > NOW + 400 days. Honest
 * re-grant: latest confirmed payment → use that period, else expire.
 * Always preview first via dry-run.
 *
 * «Применить» — только после превью и после подтверждения (тот же
 * текст, что был в window.confirm), кнопка опасного действия.
 */
export default function GhostDateCleanupCard({ i = 0 }: { i?: number }) {
  const confirm = useAdminConfirm();
  const [loading, setLoading] = useState<"dry" | "apply" | null>(null);
  const [result, setResult] = useState<CleanupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (dryRun: boolean) => {
    if (!dryRun) {
      const ok = await confirm(
        result
          ? {
              title: `Применить ${result.scanned} изменений?`,
              text: `• ${result.expired_no_payment} истекут (не платили)\n• ${result.expired_payment_too_old} истекут (платили давно)\n• ${result.corrected_from_payment} получат корректную дату по оплате`,
              confirmLabel: "Применить",
            }
          : {
              title: "Применить очистку?",
              text: "Это запишет новые subscription_end в БД и проставит expireAt в панели.",
              confirmLabel: "Применить",
            },
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
    <section className="ak-card adm-ghost" data-sheet="24" style={{ "--i": i } as CSSProperties} aria-labelledby="adm-ghost-h">
      <div className="ak-card-head">
        <h2 id="adm-ghost-h" className="ak-eyebrow">Очистка ghost-дат</h2>
        {result && (
          <span className="ak-status" data-tone={result.dryRun ? "warn" : undefined}>
            <i />
            {result.dryRun ? "Превью" : "Применено"}
          </span>
        )}
      </div>
      <p className="ak-text">
        Находит пользователей со сроком больше чем через 400 дней (десятилетние даты). По каждому смотрит последнюю
        подтверждённую оплату: если она есть — ставит дату оплаты плюс период тарифа; если нет — подписка истекает.
      </p>

      {error && <p className="ak-err" role="alert">{error}</p>}

      <div className="adm-sub-actions">
        <button type="button" onClick={() => run(true)} disabled={loading !== null} className="a-btn ak-btn-soft">
          {loading === "dry" ? <><Spin />Считаем…</> : <><Icon name="clock" size={16} />Превью без записи</>}
        </button>
        <button
          type="button"
          onClick={() => run(false)}
          disabled={loading !== null || !result?.dryRun}
          title={!result?.dryRun ? "Сначала запустите превью" : ""}
          className="a-btn ak-btn-danger"
        >
          {loading === "apply" ? <><Spin />Применяем…</> : "Применить"}
        </button>
      </div>
      {!result?.dryRun && loading === null && <p className="ak-fine">«Применить» доступно только после превью.</p>}

      {result && (
        <div className="adm-report">
          <p className="adm-f-label">
            {result.dryRun ? "Превью — в базе ничего не изменено" : "Применено"} · проверено <span className="a-num">{result.scanned}</span>
          </p>
          <ul className="adm-tiles">
            <li className="adm-tile" data-tone="ok"><span>По оплате</span><b className="a-num">{result.corrected_from_payment}</b></li>
            <li className="adm-tile" data-tone={result.expired_payment_too_old > 0 ? "warn" : undefined}><span>Истекут: оплата давно</span><b className="a-num">{result.expired_payment_too_old}</b></li>
            <li className="adm-tile" data-tone={result.expired_no_payment > 0 ? "off" : undefined}><span>Истекут: не платили</span><b className="a-num">{result.expired_no_payment}</b></li>
          </ul>

          {!result.dryRun && (
            <ul className="adm-tiles adm-tiles-sm">
              <li className="adm-tile"><span>Записано в БД</span><b className="a-num">{result.db_written}</b></li>
              <li className="adm-tile" data-tone={result.panel_failed > 0 ? "off" : undefined}>
                <span>Отправлено в панель</span>
                <b className="a-num">
                  {result.panel_pushed}
                  {result.panel_failed > 0 && <small> · {result.panel_failed} с ошибкой</small>}
                </b>
              </li>
            </ul>
          )}

          {result.users.length > 0 && (
            <details className="adm-details">
              <summary>Подробно по пользователям ({result.users.length})</summary>
              <ul className="adm-issues">
                {result.users.map((u) => (
                  <li key={u.userId}>
                    <div className="adm-result-row">
                      <span className="adm-issue-mail">{u.email}</span>
                      <span className="adm-tag" data-tone={ACTION_TONE[u.action]}>{ACTION_LABEL[u.action]}</span>
                    </div>
                    <p className="adm-result-line a-num">
                      {u.publicId || "—"}
                      {u.telegramId ? ` · TG:${u.telegramId}` : ""}
                      {u.confirmedPayments > 0 && ` · оплат: ${u.confirmedPayments}`}
                    </p>
                    <p className="adm-result-line a-num">
                      было: {u.oldSubscriptionEnd.slice(0, 16)} → стало: {u.newSubscriptionEnd.slice(0, 16)}
                    </p>
                    {u.latestPaidAt && (
                      <p className="adm-result-line a-num">
                        последний платёж: {u.latestPaidAt.slice(0, 16)} · {u.latestPlan} ({u.latestPeriodMonths} мес)
                      </p>
                    )}
                    {!result.dryRun && (
                      <p className="adm-result-line">
                        {u.dbWritten && <span data-tone="ok">БД записана </span>}
                        {u.panelPushOk === true && <span data-tone="ok">· панель обновлена</span>}
                        {u.panelPushOk === false && <span data-tone="off">· панель: ошибка {u.panelPushError || ""}</span>}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </section>
  );
}
