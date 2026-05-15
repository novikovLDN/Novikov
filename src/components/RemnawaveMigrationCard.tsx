"use client";

import { useState } from "react";

interface MigrationResult {
  eligible: number;
  migrated: number;
  failed: number;
  skipped: number;
  failures: Array<{ email: string; reason: string }>;
}

/**
 * Admin-only utility card. Single-button trigger for the bulk
 * migration of every locally-active subscriber into Remnawave.
 * Safe to re-run — the endpoint picks only users without a
 * remnawave_user_uuid.
 */
export default function RemnawaveMigrationCard() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setRunning(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/users/migrate-to-remnawave", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setResult(data.data as MigrationResult);
      } else {
        setError(data.error || "Ошибка миграции");
      }
    } catch {
      setError("Ошибка сети");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4">
      <h3 className="font-semibold text-sm mb-1">Миграция в Remnawave</h3>
      <p className="text-xs text-muted mb-3 leading-relaxed">
        Создаёт пользователей в Remnawave для всех с активной подпиской, у которых ещё нет UUID в панели. expireAt = текущий subscription_end. Безопасно запускать повторно.
      </p>

      <button
        onClick={run}
        disabled={running}
        className="w-full h-11 rounded-xl bg-foreground text-background font-semibold text-sm btn-press disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {running ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
              <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
            </svg>
            Миграция выполняется…
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 11-9-9c2.4 0 4.6 1 6.2 2.5" />
              <polyline points="21 4 21 9 16 9" />
            </svg>
            Создать всех активных в Remnawave
          </>
        )}
      </button>

      {error && (
        <div className="mt-3 p-3 rounded-lg bg-danger/10 border border-danger/20">
          <p className="text-danger text-xs">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-card-hover rounded-lg p-2">
              <div className="text-lg font-bold tabular-nums">{result.eligible}</div>
              <div className="text-[10px] text-muted">К обработке</div>
            </div>
            <div className="bg-success/10 rounded-lg p-2">
              <div className="text-lg font-bold tabular-nums text-success">{result.migrated}</div>
              <div className="text-[10px] text-muted">Создано</div>
            </div>
            <div className="bg-danger/10 rounded-lg p-2">
              <div className="text-lg font-bold tabular-nums text-danger">{result.failed}</div>
              <div className="text-[10px] text-muted">Ошибки</div>
            </div>
          </div>

          {result.failures.length > 0 && (
            <details className="mt-2">
              <summary className="text-xs text-muted cursor-pointer hover:text-foreground">
                Подробности ошибок ({result.failures.length})
              </summary>
              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {result.failures.map((f) => (
                  <div key={f.email} className="text-[11px] py-1 px-2 bg-card-hover rounded flex justify-between gap-2">
                    <span className="truncate">{f.email}</span>
                    <span className="text-muted shrink-0">{f.reason}</span>
                  </div>
                ))}
              </div>
            </details>
          )}

          {result.eligible === 0 && (
            <p className="text-xs text-muted text-center">Все активные подписки уже в Remnawave.</p>
          )}
        </div>
      )}
    </div>
  );
}
