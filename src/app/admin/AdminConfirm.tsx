"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

/**
 * Подтверждения, тосты и верхний слой админки.
 *
 * Опасные действия спрашивают диалогом корпуса (.ak-dialog): поток в
 * карточках — `if (!(await confirm({...}))) return;`, действие не уходит,
 * пока не нажата кнопка подтверждения.
 *
 * Тосты — итог действия одной строкой (успех кобальтом, ошибка красным),
 * живут 4,5 с, читаются скринридером (aria-live). Ошибку, которую нужно
 * разобрать, карточка дополнительно держит у себя.
 *
 * Диалог, тосты и модальные окна рисуются в <main className="ak">, но
 * ВНЕ панелей: у .ak-card есть transform (вход и наведение), а transform
 * у предка делает position: fixed относительным к панели.
 */

export interface ConfirmOptions {
  title: string;
  text?: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** danger — необратимое или массовое изменение данных. */
  tone?: "danger" | "primary";
}

export type ToastTone = "ok" | "warn" | "off";
interface ToastItem {
  id: number;
  text: string;
  tone: ToastTone;
}

interface Ctx {
  confirm: (o: ConfirmOptions) => Promise<boolean>;
  toast: (text: string, tone?: ToastTone) => void;
  layer: HTMLElement | null;
  ask: ConfirmOptions | null;
  toasts: ToastItem[];
  close: (v: boolean) => void;
  dismiss: (id: number) => void;
  setLayer: (el: HTMLElement | null) => void;
}

const AdminCtx = createContext<Ctx>({
  // Вне провайдера (не должно случаться) — честный системный вопрос.
  confirm: async (o) => window.confirm([o.title, o.text].filter(Boolean).join("\n\n")),
  toast: () => {},
  layer: null,
  ask: null,
  toasts: [],
  close: () => {},
  dismiss: () => {},
  setLayer: () => {},
});

export const useAdminConfirm = () => useContext(AdminCtx).confirm;
export const useAdminToast = () => useContext(AdminCtx).toast;
export const useAdminLayer = () => useContext(AdminCtx).layer;

export function AdminConfirmProvider({ children }: { children: React.ReactNode }) {
  const [ask, setAsk] = useState<ConfirmOptions | null>(null);
  const [layer, setLayer] = useState<HTMLElement | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const resolver = useRef<((v: boolean) => void) | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const seq = useRef(0);

  const confirm = useCallback((o: ConfirmOptions) => {
    returnFocus.current = document.activeElement as HTMLElement | null;
    setAsk(o);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = useCallback((v: boolean) => {
    resolver.current?.(v);
    resolver.current = null;
    setAsk(null);
    returnFocus.current?.focus?.();
  }, []);

  const dismiss = useCallback((id: number) => setToasts((l) => l.filter((t) => t.id !== id)), []);

  const toast = useCallback(
    (text: string, tone: ToastTone = "ok") => {
      const id = ++seq.current;
      setToasts((l) => [...l.slice(-2), { id, text, tone }]);
      window.setTimeout(() => dismiss(id), tone === "ok" ? 4500 : 7000);
    },
    [dismiss],
  );

  useEffect(() => {
    if (!ask) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [ask, close]);

  return (
    <AdminCtx.Provider value={{ confirm, toast, layer, ask, toasts, close, dismiss, setLayer }}>{children}</AdminCtx.Provider>
  );
}

/**
 * Место диалога, тостов и модальных окон. Ставится ВНУТРИ <main className="ak">:
 * токены --ak-* и размеры кнопок (.ak .a-btn) объявлены на .ak, и вне
 * его кнопка опасного действия теряет фон.
 */
export function AdminConfirmOutlet() {
  const { ask, close, setLayer, toasts, dismiss } = useContext(AdminCtx);
  return (
    <>
      <div ref={setLayer} className="adm-layer" />
      <div className="adm-toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <p key={t.id} className="adm-toast" data-tone={t.tone}>
            <i aria-hidden />
            <span>{t.text}</span>
            <button type="button" className="adm-toast-x" onClick={() => dismiss(t.id)} aria-label="Скрыть сообщение">
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </p>
        ))}
      </div>
      {ask && (
        <div className="ak-dialog adm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="adm-ask-h" aria-describedby={ask.text ? "adm-ask-t" : undefined}>
          <div className="ak-dialog-veil" onClick={() => close(false)} />
          <div className="ak-dialog-card">
            <h2 id="adm-ask-h" className="ak-h3">{ask.title}</h2>
            {ask.text && <p id="adm-ask-t" className="ak-text adm-pre">{ask.text}</p>}
            <div className="ak-actions">
              <button type="button" autoFocus className="a-btn ak-btn-soft" onClick={() => close(false)}>
                {ask.cancelLabel || "Отмена"}
              </button>
              <button
                type="button"
                className={`a-btn ${ask.tone === "primary" ? "a-btn-primary" : "ak-btn-danger"}`}
                onClick={() => close(true)}
              >
                {ask.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Кольцо загрузки в кнопке: крутится только пока идёт запрос. */
export function Spin() {
  return <span className="adm-spin" aria-hidden />;
}
