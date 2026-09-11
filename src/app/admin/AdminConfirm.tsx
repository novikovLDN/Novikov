"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

/**
 * Подтверждения и верхний слой админки.
 *
 * Раньше опасные действия спрашивали через window.confirm — системное окно
 * без оформления и без русских кнопок на части браузеров. Теперь тот же
 * вопрос задаёт диалог корпуса (.ak-dialog), а поток в карточках прежний:
 * `if (!(await confirm({...}))) return;` — действие не уходит, пока не
 * нажата кнопка подтверждения.
 *
 * Диалог и модальные окна карточек рисуются в <main className="ak">, но
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

interface Ctx {
  confirm: (o: ConfirmOptions) => Promise<boolean>;
  layer: HTMLElement | null;
  ask: ConfirmOptions | null;
  close: (v: boolean) => void;
  setLayer: (el: HTMLElement | null) => void;
}

const AdminCtx = createContext<Ctx>({
  // Вне провайдера (не должно случаться) — честный системный вопрос.
  confirm: async (o) => window.confirm([o.title, o.text].filter(Boolean).join("\n\n")),
  layer: null,
  ask: null,
  close: () => {},
  setLayer: () => {},
});

export const useAdminConfirm = () => useContext(AdminCtx).confirm;
export const useAdminLayer = () => useContext(AdminCtx).layer;

export function AdminConfirmProvider({ children }: { children: React.ReactNode }) {
  const [ask, setAsk] = useState<ConfirmOptions | null>(null);
  const [layer, setLayer] = useState<HTMLElement | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

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

  useEffect(() => {
    if (!ask) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [ask, close]);

  return <AdminCtx.Provider value={{ confirm, layer, ask, close, setLayer }}>{children}</AdminCtx.Provider>;
}

/**
 * Место диалога и модальных окон. Ставится ВНУТРИ <main className="ak">:
 * токены --ak-* и размеры кнопок (.ak .a-btn) объявлены на .ak, и вне
 * его кнопка опасного действия теряет фон.
 */
export function AdminConfirmOutlet() {
  const { ask, close, setLayer } = useContext(AdminCtx);
  return (
    <>
      <div ref={setLayer} className="adm-layer" />
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
