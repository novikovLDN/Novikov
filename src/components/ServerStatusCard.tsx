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
const SERVER_REGIONS = [
  { code: "NL", label: "Нидерланды" },
  { code: "DE", label: "Германия" },
  { code: "DE", label: "Германия" },
  { code: "RU", label: "Россия" },
  { code: "NL", label: "Нидерланды" },
];

function formatNumber(n: number): string {
  return n.toLocaleString("ru-RU");
}

/** Snapshot of the last N ticks for the sparkline. */
function initialHistory(): number[] {
  const now = Math.floor(Date.now() / 1000);
  // Walk back 24 ticks (one every 10s) — total 4 minutes of history.
  return Array.from({ length: 24 }, (_, i) => {
    const t = now - (23 - i) * 10;
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

  const trendColor = delta > 0 ? "#34D399" : delta < 0 ? "#F59E0B" : "rgba(255,255,255,0.4)";
  const trendArrow = delta > 0 ? "↗" : delta < 0 ? "↘" : "·";

  // Sparkline normalization across actual range, not min/max bounds.
  const hMin = Math.min(...history);
  const hMax = Math.max(...history);
  const range = Math.max(1, hMax - hMin);

  // SVG geometry — use viewBox stretched along the card width.
  // The path is rendered into a tall area that fills the negative space
  // between the counter and the server pills.
  const W = 200;
  const H = 100;
  const pathPoints = history.map((v, i) => {
    const x = (i / (history.length - 1)) * W;
    // Map value into bottom-third of viewbox so the line "lives" higher
    // up and fades down to the pills row.
    const norm = (v - hMin) / range; // 0..1
    const y = H - 20 - norm * (H - 30); // line band sits in y=10..H-20
    return { x, y };
  });
  const linePath = pathPoints
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${W},${H} L0,${H} Z`;

  return (
    <section className="dv2-glow dv2-elevate relative overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#0F0F12] h-full flex flex-col">
      {/* Backdrop accent */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute -top-16 -right-16 h-56 w-56 rounded-full blur-3xl opacity-30"
          style={{ background: "radial-gradient(closest-side, rgba(52,211,153,0.18), transparent 70%)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.7) 1px, transparent 0)",
            backgroundSize: "18px 18px",
          }}
        />
      </div>

      {/* Background sparkline fills the empty middle. */}
      <div className="pointer-events-none absolute inset-x-0 top-[120px] bottom-[80px]" aria-hidden>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="sparkArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#34D399" stopOpacity="0.32" />
              <stop offset="60%" stopColor="#34D399" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="sparkLine" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#34D399" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#34D399" stopOpacity="0.25" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#sparkArea)" className="transition-[d] duration-700 ease-out" />
          <path
            d={linePath}
            fill="none"
            stroke="url(#sparkLine)"
            strokeWidth="1.6"
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
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#34D399]/10 border border-[#34D399]/20">
            <span className="relative h-1.5 w-1.5 rounded-full bg-[#34D399]" style={{ boxShadow: "0 0 8px #34D399" }}>
              <span
                className="absolute inset-0 rounded-full bg-[#34D399]"
                style={{
                  animation: "heroPing 2s cubic-bezier(0, 0, 0.2, 1) infinite",
                  opacity: 0.6,
                }}
              />
            </span>
            <span className="text-[11px] font-medium text-[#34D399]">Все онлайн</span>
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
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-white/35">Сервера</span>
            <span className="text-[11px] text-[#34D399]/85">Активны</span>
          </div>
          <div className="flex items-center gap-1.5">
            {SERVER_REGIONS.map((s, i) => (
              <div
                key={i}
                className="flex-1 min-w-0 flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05]"
                title={s.label}
              >
                <span
                  className="relative h-1 w-1 rounded-full bg-[#34D399] shrink-0"
                  style={{
                    boxShadow: "0 0 4px #34D399",
                    animation: `serverPulse ${1.8 + i * 0.4}s ease-in-out infinite`,
                  }}
                />
                <span className="text-[10px] font-mono text-white/65">{s.code}</span>
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
