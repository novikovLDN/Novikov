"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { onlineAt } from "@/lib/online-counter";
import { COUNTRY_COUNT, LOCATIONS, citiesLabel, plural } from "@/lib/locations";
import Corner from "./Corner";

/**
 * Кабинет · сеть сейчас. Логика — из прежней ServerStatusCard: число
 * на связи считает детерминированная функция времени
 * (src/lib/online-counter.ts), поэтому у всех посетителей в одну секунду
 * одно и то же значение; история — последний час с шагом 10 с.
 *
 * ТРЕБУЕТ ПОДТВЕРЖДЕНИЯ ВЛАДЕЛЬЦЕМ: число «на связи» — не замер, а
 * расчётная кривая (правило CLAUDE.md о числах). Перенесено как было.
 */
const TICK_MS = 10_000;
const HISTORY_TICKS = 360;
const PILL_LIMIT = 8;
const REGIONS = LOCATIONS.slice(0, PILL_LIMIT).map((l) => ({ code: l.code, label: `${l.country} · ${citiesLabel(l)}` }));
const HIDDEN = COUNTRY_COUNT - REGIONS.length;

function initialHistory(): number[] {
  const now = Math.floor(Date.now() / 1000);
  return Array.from({ length: HISTORY_TICKS }, (_, k) => onlineAt(now - (HISTORY_TICKS - 1 - k) * 10));
}

export default function CabinetNetwork({ i }: { i: number }) {
  const [online, setOnline] = useState<number>(() => onlineAt());
  const [delta, setDelta] = useState(0);
  const [history, setHistory] = useState<number[]>(() => initialHistory());
  const last = useRef(online);

  useEffect(() => {
    last.current = online;
  }, [online]);

  useEffect(() => {
    const id = setInterval(() => {
      const next = onlineAt();
      setDelta(next - last.current);
      setOnline(next);
      setHistory((prev) => [...prev.slice(1), next]);
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  const lo = Math.min(...history);
  const range = Math.max(1, Math.max(...history) - lo);
  const W = 240;
  const H = 64;
  const line = history
    .map((v, k) => `${k ? "L" : "M"}${((k / (history.length - 1)) * W).toFixed(1)},${(H - 6 - ((v - lo) / range) * (H - 14)).toFixed(1)}`)
    .join(" ");

  return (
    <section className="ak-card ak-net" data-sheet="20" style={{ "--i": i } as CSSProperties} aria-labelledby="ak-net-h">
      <Corner href="/infrastructure" label="Как устроена сеть" />
      <div className="ak-card-head">
        <h2 id="ak-net-h" className="ak-eyebrow">Сеть сейчас</h2>
        <span className="ak-status"><i />Серверы работают</span>
      </div>

      <p className="ak-value">
        <span className="a-num">{online.toLocaleString("ru-RU")}</span>
        <small>подключены прямо сейчас</small>
        {delta !== 0 && (
          <span className="ak-delta" data-dir={delta > 0 ? "up" : "down"}>
            {delta > 0 ? "+" : ""}
            {delta}
          </span>
        )}
      </p>

      <svg className="ak-spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden focusable="false">
        <path className="ak-spark-area" d={`${line} L${W},${H} L0,${H} Z`} />
        <path className="ak-spark-line" d={line} />
      </svg>

      <div className="ak-codes">
        {REGIONS.map((r, k) => (
          <span key={r.code} className="ak-code" title={r.label} style={{ "--k": k } as CSSProperties}>
            <i />
            {r.code}
          </span>
        ))}
      </div>
      {HIDDEN > 0 && (
        <p className="ak-fine">
          Всего {COUNTRY_COUNT} {plural(COUNTRY_COUNT, ["страна", "страны", "стран"])}: ещё {HIDDEN} — от Дубая до Токио.
        </p>
      )}
    </section>
  );
}
