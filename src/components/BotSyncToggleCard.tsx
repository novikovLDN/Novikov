"use client";

import { useEffect, useState } from "react";

/**
 * Admin kill switch for bot → site synchronization.
 *
 * When OFF, every mutating bot endpoint (/api/bot/sync, /extend,
 * /sync-referrals, /sync-balance, /link, /unlink, /register) responds
 * with 503 and the bot can't change anything in our DB. Read-only bot
 * endpoints keep working so the bot can still answer "do you know
 * about this user?" without writing.
 *
 * Use this when sync is causing damage (e.g. wrong dates being pushed)
 * and you need a stable baseline before investigating.
 */
export default function BotSyncToggleCard() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/bot-sync")
      .then((r) => r.json())
      .then((d) => {
        if (active && d.success) setEnabled(d.data.enabled);
      })
      .catch(() => {
        if (active) setError("Не удалось загрузить состояние");
      });
    return () => {
      active = false;
    };
  }, []);

  const toggle = async () => {
    if (enabled === null) return;
    const next = !enabled;
    const action = next
      ? "Включить синхронизацию с ботом?"
      : "ВЫКЛЮЧИТЬ синхронизацию с ботом? Бот не сможет создавать/продлевать/привязывать пока ты не включишь обратно.";
    if (!confirm(action)) return;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/bot-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      const data = await res.json();
      if (data.success) setEnabled(data.data.enabled);
      else setError(data.error || "Ошибка");
    } catch {
      setError("Ошибка сети");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <h3 className="font-semibold text-sm">Синхронизация с ботом</h3>
          <p className="text-xs text-muted leading-relaxed mt-1">
            Когда выключено — бот не может создавать, продлевать или менять подписки на сайте.
            Read-only запросы (статус, поиск юзера) продолжают работать. Глобально, общий рубильник.
          </p>
        </div>
        {enabled !== null && (
          <span
            className={`shrink-0 px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide ${
              enabled
                ? "bg-success/15 text-success border border-success/30"
                : "bg-danger/15 text-danger border border-danger/30"
            }`}
          >
            {enabled ? "ON" : "OFF"}
          </span>
        )}
      </div>

      <button
        onClick={toggle}
        disabled={busy || enabled === null}
        className={`w-full h-11 rounded-xl font-semibold text-sm btn-press disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
          enabled
            ? "bg-danger/10 border border-danger/30 text-danger hover:bg-danger/15"
            : "bg-success/10 border border-success/30 text-success hover:bg-success/15"
        }`}
      >
        {busy ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
              <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
            </svg>
            Применяем…
          </>
        ) : enabled === null ? (
          <>Загрузка…</>
        ) : enabled ? (
          <>⏸ Выключить синхронизацию с ботом</>
        ) : (
          <>▶ Включить синхронизацию с ботом</>
        )}
      </button>

      {error && (
        <div className="mt-3 p-2 rounded-lg bg-danger/10 border border-danger/20">
          <p className="text-danger text-xs">{error}</p>
        </div>
      )}
    </div>
  );
}
