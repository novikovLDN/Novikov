"use client";

import type { CSSProperties, ReactNode } from "react";
import type { Tone } from "@/app/admin/admin-shared";

/**
 * Мелкая графика админки — без библиотек: SVG и CSS-переменные.
 * Стили — admin-atlas.css («Графика»). Цвет — только у измеренного:
 * кобальт у живых показаний, янтарь и красный — у предупреждений.
 */

/** Живая точка статуса: пульсирует у «работает», мигает у «сбой». */
export function Dot({ tone, label }: { tone: Tone; label?: string }) {
  return <span className="adm-dot" data-tone={tone} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} />;
}

/** Метка статуса — точка и слово (как .ak-status кабинета). */
export function Status({ tone, children }: { tone: Tone; children: ReactNode }) {
  const t = tone === "ok" ? undefined : tone === "idle" ? "mute" : tone;
  return (
    <span className="ak-status adm-status" data-tone={t}>
      <i />
      {children}
    </span>
  );
}

/**
 * Спарклайн по истории замеров этой вкладки. Меньше двух точек —
 * линия не рисуется, вместо неё подпись, что история копится.
 */
export function Spark({ values, label, height = 56 }: { values: Array<number | null>; label: string; height?: number }) {
  const pts = values.map((v, i) => ({ v, i })).filter((p): p is { v: number; i: number } => p.v !== null);
  if (pts.length < 2) {
    return <p className="adm-spark-empty">История замеров копится с каждым обновлением.</p>;
  }
  const max = Math.max(...pts.map((p) => p.v)) * 1.15 || 1;
  const n = Math.max(values.length - 1, 1);
  const xy = pts.map((p) => [(p.i / n) * 100, 100 - (p.v / max) * 100] as const);
  const line = xy.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `0,100 ${line} ${xy[xy.length - 1][0].toFixed(2)},100`;
  const last = xy[xy.length - 1];
  return (
    <div className="adm-spark" style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={label}>
        <polygon className="adm-spark-area" points={area} />
        <polyline className="adm-spark-line" points={line} />
      </svg>
      <i className="adm-spark-dot" style={{ left: `${last[0]}%`, top: `${last[1]}%` } as CSSProperties} aria-hidden />
    </div>
  );
}

/** Горизонтальная доля 0…1. Растёт слева при входе панели в кадр. */
export function Meter({ p, tone, label }: { p: number; tone?: Tone; label?: string }) {
  const v = Math.max(0, Math.min(1, Number.isFinite(p) ? p : 0));
  return (
    <span
      className="adm-meter"
      data-tone={tone}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ "--p": v } as CSSProperties}
    >
      <i />
    </span>
  );
}

/** Составная полоса: доли складываются в 100 %. */
export function Stack({ parts, label }: { parts: Array<{ value: number; tone: "ok" | "ink" | "warn" | "off" | "mute" }>; label: string }) {
  const total = parts.reduce((s, p) => s + Math.max(0, p.value), 0);
  return (
    <span className="adm-stack" role="img" aria-label={label}>
      {total > 0 &&
        parts.map((p, k) =>
          p.value > 0 ? <i key={k} data-tone={p.tone} style={{ "--p": p.value / total, "--k": k } as CSSProperties} /> : null,
        )}
    </span>
  );
}

export interface BarItem {
  key: string;
  label: ReactNode;
  value: number;
  shown: ReactNode;
  note?: ReactNode;
  tone?: "warn" | "off";
}

/** Список полос: ширина — доля от наибольшего значения. */
export function Bars({ items, label }: { items: BarItem[]; label: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="adm-bars" aria-label={label}>
      {items.map((it, k) => (
        <li key={it.key} className="adm-bar" data-tone={it.tone} style={{ "--p": it.value / max, "--k": k } as CSSProperties}>
          <span className="adm-bar-label">{it.label}</span>
          <span className="adm-bar-val a-num">{it.shown}</span>
          <span className="adm-bar-track" aria-hidden><i /></span>
          {it.note && <span className="adm-bar-note a-num">{it.note}</span>}
        </li>
      ))}
    </ul>
  );
}

/** Плитка показателя: подпись и число. */
export function Tile({ label, value, note, tone }: { label: ReactNode; value: ReactNode; note?: ReactNode; tone?: "ok" | "warn" | "off" | "mute" }) {
  return (
    <li className="adm-tile" data-tone={tone}>
      <span>{label}</span>
      <b className="a-num">{value}</b>
      {note && <small className="a-num">{note}</small>}
    </li>
  );
}

/** Заглушка блока, пока сводка не пришла. */
export function Skel({ rows = 3 }: { rows?: number }) {
  return (
    <div className="adm-skel" aria-hidden>
      {Array.from({ length: rows }, (_, k) => (
        <i key={k} style={{ "--k": k } as CSSProperties} />
      ))}
    </div>
  );
}

/** Ошибка блока: сбой одного источника не прячет остальные. */
export function BlockError({ title, text }: { title: string; text?: string }) {
  return (
    <div className="adm-note adm-block-err" data-tone="off" role="alert">
      <b>{title}</b>
      {text && <span className="adm-break">{text}</span>}
    </div>
  );
}
