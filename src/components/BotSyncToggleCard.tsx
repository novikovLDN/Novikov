"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useAdminConfirm, Spin } from "@/app/admin/AdminConfirm";

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
 *
 * Оформление — корпус «Атлас-издание» (admin-atlas.css): вся строка —
 * переключатель role="switch", оба направления спрашивают подтверждение,
 * как и раньше.
 */
export default function BotSyncToggleCard({ i = 0 }: { i?: number }) {
  const confirm = useAdminConfirm();
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
    const ok = await confirm(
      next
        ? { title: "Включить синхронизацию с ботом?", confirmLabel: "Включить", tone: "primary" }
        : {
            title: "Выключить синхронизацию с ботом?",
            text: "Бот не сможет создавать, продлевать и привязывать подписки, пока вы не включите её обратно.",
            confirmLabel: "Выключить",
          },
    );
    if (!ok) return;

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
    <section className="ak-card adm-bot" data-sheet="24" style={{ "--i": i } as CSSProperties} aria-labelledby="adm-bot-h">
      <div className="ak-card-head">
        <h2 id="adm-bot-h" className="ak-eyebrow">Синхронизация с ботом</h2>
        {enabled !== null && (
          <span className="ak-status" data-tone={enabled ? undefined : "off"}>
            <i />
            {enabled ? "Включена" : "Выключена"}
          </span>
        )}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled === true}
        aria-describedby="adm-bot-t"
        onClick={toggle}
        disabled={busy || enabled === null}
        className="adm-toggle"
      >
        <span className="adm-toggle-copy">
          <span className="ak-h3">Бот может менять подписки</span>
          <span className="adm-toggle-state" aria-live="polite">
            {busy ? (
              <><Spin />Применяем…</>
            ) : enabled === null ? (
              "Загружаем состояние…"
            ) : enabled ? (
              "Сейчас включено"
            ) : (
              "Сейчас выключено"
            )}
          </span>
        </span>
        <span className="ak-switch" aria-hidden />
      </button>

      <p id="adm-bot-t" className="ak-fine">
        Когда выключено — бот не может создавать, продлевать или менять подписки на сайте. Запросы только на чтение
        (статус, поиск пользователя) продолжают работать. Рубильник общий для всех.
      </p>

      {error && <p className="ak-err" role="alert">{error}</p>}
    </section>
  );
}
