"use client";

import { useState } from "react";

interface MigrationResult {
  eligible: number;
  migrated: number;
  failed: number;
  skipped: number;
  failures: Array<{ email: string; reason: string }>;
}

interface CleanupResult {
  scanned: number;
  canonical_repaired: number;
  duplicates_deleted: number;
  failed: number;
  failures: Array<{ email: string; reason: string }>;
}

interface ResetResult {
  total: number;
  created: number;
  failed: number;
  users: Array<{
    email: string;
    panel_id: string | null;
    deleted: number;
    uuid: string | null;
    subscription_url: string | null;
    error: string | null;
  }>;
}

/**
 * Admin-only utility card. Single-button trigger for the bulk
 * migration of every locally-active subscriber into Remnawave.
 * Safe to re-run — the endpoint picks only users without a
 * remnawave_user_uuid.
 */
export default function RemnawaveMigrationCard() {
  const [running, setRunning] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);
  const [resetResult, setResetResult] = useState<ResetResult | null>(null);
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

  const runReset = async () => {
    if (!confirm("ПОЛНЫЙ СБРОС: для каждого активного юзера удалит ВСЕХ его панель-юзеров и создаст одного нового с username=panel_id. Локальные subscription_url пересохранятся. Действие необратимо. Продолжить?")) return;
    setResetting(true);
    setResetResult(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/users/full-reset-remnawave", { method: "POST" });
      const data = await res.json();
      if (data.success) setResetResult(data.data as ResetResult);
      else setError(data.error || "Ошибка сброса");
    } catch {
      setError("Ошибка сети");
    } finally {
      setResetting(false);
    }
  };

  const runCleanup = async () => {
    if (!confirm("Удалить все дубликаты в Remnawave для активных юзеров? Это безопасно — оставляет одного канонического (по panel_id) и удаляет остальных.")) return;
    setCleaning(true);
    setCleanupResult(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/users/cleanup-remnawave-duplicates", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setCleanupResult(data.data as CleanupResult);
      } else {
        setError(data.error || "Ошибка очистки");
      }
    } catch {
      setError("Ошибка сети");
    } finally {
      setCleaning(false);
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

      {/* ── NUCLEAR full reset ── */}
      <div className="mt-4 pt-4 border-t border-danger/30">
        <p className="text-xs text-muted mb-3 leading-relaxed">
          <span className="text-danger font-medium">⚠️ Полный сброс:</span> для каждого активного юзера удалит всех его панель-юзеров (по email) и создаст ОДНОГО нового с <code className="font-mono text-[10px]">username = panel_id</code>. Чинит любое предыдущее состояние.
        </p>
        <button
          onClick={runReset}
          disabled={resetting}
          className="w-full h-10 rounded-xl bg-danger/10 border border-danger/30 text-danger font-semibold text-xs btn-press disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-danger/15"
        >
          {resetting ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
              </svg>
              Полный сброс…
            </>
          ) : (
            <>⚠️ Пересоздать ВСЕХ в Remnawave с нуля</>
          )}
        </button>

        {resetResult && (
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-card-hover rounded-lg p-2">
                <div className="text-lg font-bold tabular-nums">{resetResult.total}</div>
                <div className="text-[10px] text-muted">Всего</div>
              </div>
              <div className="bg-success/10 rounded-lg p-2">
                <div className="text-lg font-bold tabular-nums text-success">{resetResult.created}</div>
                <div className="text-[10px] text-muted">Создано</div>
              </div>
              <div className="bg-danger/10 rounded-lg p-2">
                <div className="text-lg font-bold tabular-nums text-danger">{resetResult.failed}</div>
                <div className="text-[10px] text-muted">Ошибки</div>
              </div>
            </div>
            <details>
              <summary className="text-xs text-muted cursor-pointer hover:text-foreground">
                Детали по юзерам ({resetResult.users.length})
              </summary>
              <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
                {resetResult.users.map((u, i) => (
                  <div key={`${u.email}-${i}`} className="text-[11px] p-2 bg-card-hover rounded">
                    <div className="flex justify-between gap-2 mb-0.5">
                      <span className="truncate font-medium">{u.email}</span>
                      <span className="text-muted shrink-0 font-mono">{u.panel_id || "—"}</span>
                    </div>
                    <div className="text-muted text-[10px]">
                      {u.error ? (
                        <span className="text-danger">✗ {u.error}</span>
                      ) : (
                        <>✓ удалено: {u.deleted}, новый uuid: {u.uuid?.slice(0, 8) || "—"}…</>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>

      {/* ── Cleanup duplicates ── */}
      <div className="mt-4 pt-4 border-t border-border/30">
        <p className="text-xs text-muted mb-3 leading-relaxed">
          Если в панели образовались дубликаты от прошлых запусков — нажмите чтобы оставить одного канонического (по panel_id) и удалить остальных.
        </p>
        <button
          onClick={runCleanup}
          disabled={cleaning}
          className="w-full h-10 rounded-xl bg-card-hover border border-border text-foreground font-medium text-xs btn-press disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {cleaning ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
              </svg>
              Очистка дубликатов…
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
              </svg>
              Удалить дубликаты в панели
            </>
          )}
        </button>

        {cleanupResult && (
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-card-hover rounded-lg p-2">
                <div className="text-lg font-bold tabular-nums">{cleanupResult.scanned}</div>
                <div className="text-[10px] text-muted">Просмотрено</div>
              </div>
              <div className="bg-danger/10 rounded-lg p-2">
                <div className="text-lg font-bold tabular-nums text-danger">{cleanupResult.duplicates_deleted}</div>
                <div className="text-[10px] text-muted">Удалено</div>
              </div>
              <div className="bg-success/10 rounded-lg p-2">
                <div className="text-lg font-bold tabular-nums text-success">{cleanupResult.canonical_repaired}</div>
                <div className="text-[10px] text-muted">Исправлено</div>
              </div>
            </div>
            {cleanupResult.failures.length > 0 && (
              <details>
                <summary className="text-xs text-muted cursor-pointer hover:text-foreground">
                  Подробности ошибок ({cleanupResult.failures.length})
                </summary>
                <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                  {cleanupResult.failures.map((f, i) => (
                    <div key={`${f.email}-${i}`} className="text-[11px] py-1 px-2 bg-card-hover rounded flex justify-between gap-2">
                      <span className="truncate">{f.email}</span>
                      <span className="text-muted shrink-0">{f.reason}</span>
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
