"use client";

import { useEffect, useRef, useState } from "react";
import { onlineAt } from "@/lib/online-counter";

/**
 * Live "Status of the network" card.
 *
 * The online figure is computed from a time-based deterministic
 * function (src/lib/online-counter.ts), so every visitor on the site
 * sees the same number at the same wall-clock second — no shared
 * server state required. As long as system clocks are roughly in
 * sync, all devices display in lockstep.
 *
 * The card also surfaces:
 *   • a soft green area sparkline that fills the empty top space and
 *     fades to transparent before the server pills at the bottom
 *   • a tiny ±delta indicator (last tick change)
 *   • 5 server pills (region codes) with phase-offset pulse dots
 */

const TICK_MS = 10_000;
const HISTORY_TICKS = 360; // 360 × 10s = 1 hour of history
const SERVER_REGIONS = [
  { code: "DE", label: "Германия · Frankfurt" },
  { code: "NL", label: "Нидерланды · Amsterdam" },
  { code: "AT", label: "Австрия · Vienna" },
  { code: "US", label: "США · New York" },
];

function formatNumber(n: number): string {
  return n.toLocaleString("ru-RU");
}

/** Snapshot of the last 15 minutes — 90 points sampled every 10s. */
function initialHistory(): number[] {
  const now = Math.floor(Date.now() / 1000);
  return Array.from({ length: HISTORY_TICKS }, (_, i) => {
    const t = now - (HISTORY_TICKS - 1 - i) * 10;
    return onlineAt(t);
  });
}

export default function ServerStatusCard() {
  const [online, setOnline] = useState<number>(() => onlineAt());
  const [delta, setDelta] = useState<number>(0);
  const [history, setHistory] = useState<number[]>(() => initialHistory());
  const onlineRef = useRef(online);

  useEffect(() => {
    onlineRef.current = online;
  }, [online]);

  useEffect(() => {
    const id = setInterval(() => {
      const next = onlineAt();
      const d = next - onlineRef.current;
      setOnline(next);
      setDelta(d);
      setHistory((prev) => [...prev.slice(1), next]);
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  const trendColor = delta > 0 ? "#2AC153" : delta < 0 ? "#FF7350" : "rgba(255,255,255,0.4)";
  const trendArrow = delta > 0 ? "↗" : delta < 0 ? "↘" : "·";

  // Sparkline normalization across actual range, not min/max bounds.
  const hMin = Math.min(...history);
  const hMax = Math.max(...history);
  const range = Math.max(1, hMax - hMin);

  // SVG geometry — use viewBox stretched along the card width.
  // Line is constrained to the central band of the viewbox so the
  // stroke never grazes the top of its container (preventing visual
  // overlap with the "человек подключены прямо сейчас" hint text).
  const W = 240;
  const H = 100;
  const TOP_PAD = 28; // line cannot rise above this y
  const BOT_PAD = 24; // line cannot fall below this y
  const pathPoints = history.map((v, i) => {
    const x = (i / (history.length - 1)) * W;
    const norm = (v - hMin) / range; // 0..1
    const y = (H - BOT_PAD) - norm * (H - TOP_PAD - BOT_PAD);
    return { x, y };
  });
  const linePath = pathPoints
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${W},${H} L0,${H} Z`;

  return (
    <section className="dv2-card relative overflow-hidden rounded-[28px] h-full flex flex-col">
      {/* Backdrop accent */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute -top-16 -right-16 h-56 w-56 rounded-full blur-3xl opacity-40"
          style={{ background: "radial-gradient(closest-side, rgba(52,211,153,0.22), transparent 70%)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.6) 1px, transparent 0)",
            backgroundSize: "18px 18px",
          }}
        />
      </div>

      {/* Background sparkline fills the empty middle.
          Inset positioning leaves a generous gap above the chart so
          its top stroke never collides with the "человек подключены
          прямо сейчас" hint text, and a gap below for the server
          pills. The negative-space gradient fades both ends. */}
      <div className="pointer-events-none absolute left-0 right-0 top-[180px] bottom-[110px] sm:top-[200px] sm:bottom-[120px]" aria-hidden>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="sparkArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#2AC153" stopOpacity="0" />
              <stop offset="22%" stopColor="#2AC153" stopOpacity="0.22" />
              <stop offset="70%" stopColor="#2AC153" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#2AC153" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="sparkLine" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#2AC153" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#2AC153" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#sparkArea)" className="transition-[d] duration-700 ease-out" />
          <path
            d={linePath}
            fill="none"
            stroke="url(#sparkLine)"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-[d] duration-700 ease-out"
          />
        </svg>
      </div>

      <div className="relative p-6 sm:p-7 flex flex-col h-full">
        {/* Top row */}
        <div className="flex items-center justify-between mb-5">
          <div className="dv2-eyebrow">Статус сети</div>
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#2AC153]/10 border border-[#2AC153]/20">
            <span className="relative h-1.5 w-1.5 rounded-full bg-[#2AC153]" style={{ boxShadow: "0 0 8px #2AC153" }}>
              <span
                className="absolute inset-0 rounded-full bg-[#2AC153]"
                style={{
                  animation: "heroPing 2s cubic-bezier(0, 0, 0.2, 1) infinite",
                  opacity: 0.6,
                }}
              />
            </span>
            <span className="text-[11px] font-medium text-[#2AC153]">Все онлайн</span>
          </div>
        </div>

        {/* Online counter */}
        <div className="mb-1">
          <div className="flex items-baseline gap-2">
            <div className="text-[40px] sm:text-[44px] font-light tracking-tight leading-none text-white tabular-nums">
              {formatNumber(online)}
            </div>
            <div className="text-[11px] font-mono tabular-nums" style={{ color: trendColor }}>
              {trendArrow} {delta !== 0 ? (delta > 0 ? "+" : "") + delta : ""}
            </div>
          </div>
          <div className="text-[12px] text-white/45 mt-1.5">человек подключены прямо сейчас</div>
        </div>

        {/* Server pills at the bottom */}
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mts-wide text-[11px] uppercase tracking-[0.14em] text-white/40">Сервера</span>
            <span className="font-mts-wide text-[12px] text-[#2AC153]/85 font-medium">Активны</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {SERVER_REGIONS.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-center gap-2 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08]"
                title={s.label}
              >
                <span
                  className="relative h-1.5 w-1.5 rounded-full bg-[#2AC153] shrink-0"
                  style={{
                    boxShadow: "0 0 6px #2AC153",
                    animation: `serverPulse ${1.8 + i * 0.4}s ease-in-out infinite`,
                  }}
                />
                <span className="font-mts-wide text-[12px] font-semibold text-white/85 tracking-[0.06em]">{s.code}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes serverPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </section>
  );
}
