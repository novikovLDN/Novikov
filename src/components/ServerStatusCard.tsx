"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Realistic online-user counter.
 *
 * Starts around 45k. Every 10s ticks +/- 1-10. With small probability
 * larger "events" pile on:
 *   ~ every minute   : ±10..30
 *   ~ every 5 min    : ±50..150
 *   ~ every hour     : ±10k..20k
 *   ~ every 24 hours : ±30k spike (clamped to 23..70k bounds)
 *
 * Persists between renders via a ref so the counter doesn't reset on
 * state updates.
 */

const MIN = 23_000;
const MAX = 70_000;
const TICK_MS = 10_000;

function clampOnline(n: number): number {
  return Math.max(MIN, Math.min(MAX, n));
}

function nextValue(current: number): { value: number; delta: number } {
  // Baseline drift ±10
  let delta = Math.floor(Math.random() * 21) - 10;

  // ~1/6 chance per tick = ~1 per minute event
  if (Math.random() < 1 / 6) {
    delta += Math.round((Math.random() < 0.5 ? -1 : 1) * (10 + Math.random() * 20));
  }
  // ~1/30 chance per tick = ~1 per 5 min event
  if (Math.random() < 1 / 30) {
    delta += Math.round((Math.random() < 0.5 ? -1 : 1) * (50 + Math.random() * 100));
  }
  // ~1/360 chance per tick = ~1 per hour event
  if (Math.random() < 1 / 360) {
    delta += Math.round((Math.random() < 0.5 ? -1 : 1) * (10_000 + Math.random() * 10_000));
  }
  // ~1/8640 chance per tick = ~1 per 24h megaspike
  if (Math.random() < 1 / 8640) {
    delta += Math.round((Math.random() < 0.5 ? -1 : 1) * (20_000 + Math.random() * 15_000));
  }

  const next = clampOnline(current + delta);
  return { value: next, delta: next - current };
}

function formatNumber(n: number): string {
  return n.toLocaleString("ru-RU");
}

const SERVER_REGIONS = [
  { code: "NL", label: "Нидерланды" },
  { code: "DE", label: "Германия" },
  { code: "DE", label: "Германия" },
  { code: "RU", label: "Россия" },
  { code: "NL", label: "Нидерланды" },
];

export default function ServerStatusCard() {
  const [online, setOnline] = useState<number>(() => 40_000 + Math.floor(Math.random() * 15_000));
  const [delta, setDelta] = useState<number>(0);
  const [sparkline, setSparkline] = useState<number[]>(() =>
    Array.from({ length: 24 }, (_, i) => 0.35 + Math.sin(i / 3) * 0.15 + Math.random() * 0.2)
  );
  const onlineRef = useRef(online);

  useEffect(() => {
    onlineRef.current = online;
  }, [online]);

  useEffect(() => {
    const id = setInterval(() => {
      const { value, delta: d } = nextValue(onlineRef.current);
      setOnline(value);
      setDelta(d);
      setSparkline((prev) => {
        const norm = (value - MIN) / (MAX - MIN);
        return [...prev.slice(1), norm];
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  const trendColor = delta > 0 ? "#34D399" : delta < 0 ? "#F59E0B" : "rgba(255,255,255,0.4)";
  const trendArrow = delta > 0 ? "↗" : delta < 0 ? "↘" : "·";

  // Sparkline path
  const W = 140;
  const H = 32;
  const pathD = sparkline
    .map((v, i) => {
      const x = (i / (sparkline.length - 1)) * W;
      const y = H - v * H;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

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

        {/* Sparkline */}
        <div className="mt-4 mb-5 relative h-[32px]">
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
            <defs>
              <linearGradient id="sparkGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#34D399" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`${pathD} L${W},${H} L0,${H} Z`} fill="url(#sparkGrad)" />
            <path
              d={pathD}
              fill="none"
              stroke="#34D399"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-[d] duration-700 ease-out"
            />
          </svg>
        </div>

        {/* Servers list */}
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-white/35">Сервера</span>
            <span className="text-[11px] text-white/50 tabular-nums">{SERVER_REGIONS.length} активны</span>
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
