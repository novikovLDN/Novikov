"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageContainer from "@/components/PageContainer";

// ─── Floating Squares Background ────────────────────────────────

function FloatingSquares() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-xl opacity-0"
          style={{
            width: `${40 + i * 12}px`,
            height: `${40 + i * 12}px`,
            left: `${10 + (i * 37) % 80}%`,
            top: `${5 + (i * 29) % 85}%`,
            background: `rgba(${30 + i * 8}, ${50 + i * 12}, ${180 - i * 10}, 0.06)`,
            boxShadow: `0 0 ${20 + i * 5}px rgba(59, 130, 246, ${0.03 + i * 0.005})`,
            animation: `floatSquare ${12 + i * 3}s ease-in-out infinite, fadeInSquare 1.5s ease-out ${i * 0.3}s forwards`,
            transform: `rotate(${i * 15}deg)`,
          }}
        />
      ))}
      <style>{`
        @keyframes floatSquare {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-20px) rotate(5deg); }
          50% { transform: translateY(-8px) rotate(-3deg); }
          75% { transform: translateY(-25px) rotate(4deg); }
        }
        @keyframes fadeInSquare {
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Animated Stat Card ─────────────────────────────────────────

function StatCard({ icon, value, label, type }: { icon: string; value: string; label: string; type: "speed" | "uptime" | "partners" | "monitoring" }) {
  const [animating, setAnimating] = useState(false);
  const [animValue, setAnimValue] = useState("");
  const [pressed, setPressed] = useState(false);
  const rafRef = useRef<number>(0);

  const startAnimation = useCallback(() => {
    if (animating) return;
    setAnimating(true);

    const duration = 3000;
    const start = Date.now();

    if (type === "speed") {
      const animate = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const val = Math.round(eased * 75000);
        setAnimValue(`${val.toLocaleString()} Мб/с`);
        if (progress < 1) { rafRef.current = requestAnimationFrame(animate); }
        else { setTimeout(() => { setAnimating(false); setAnimValue(""); }, 800); }
      };
      rafRef.current = requestAnimationFrame(animate);
    }

    if (type === "uptime") {
      const animate = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const val = (eased * 99.9).toFixed(1);
        setAnimValue(`${val}%`);
        if (progress < 1) { rafRef.current = requestAnimationFrame(animate); }
        else { setTimeout(() => { setAnimating(false); setAnimValue(""); }, 800); }
      };
      rafRef.current = requestAnimationFrame(animate);
    }

    if (type === "partners") {
      const animate = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const val = Math.round(eased * 30);
        setAnimValue(`${val}+`);
        if (progress < 1) { rafRef.current = requestAnimationFrame(animate); }
        else { setTimeout(() => { setAnimating(false); setAnimValue(""); }, 800); }
      };
      rafRef.current = requestAnimationFrame(animate);
    }

    if (type === "monitoring") {
      setTimeout(() => { setAnimating(false); setAnimValue(""); }, 6500);
    }

    return () => cancelAnimationFrame(rafRef.current);
  }, [animating, type]);

  return (
    <button
      onClick={startAnimation}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className="bg-card border border-border/50 rounded-2xl p-4 text-center transition-transform duration-200 active:scale-[0.95] relative overflow-hidden"
      style={{ transform: pressed ? "scale(0.95)" : "scale(1)" }}
    >
      {/* Monitoring radar animation */}
      {type === "monitoring" && animating && (
        <div className="absolute inset-0 flex items-center justify-center">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute rounded-full border border-primary/30"
              style={{
                animation: `radarPulse 2s ease-out ${i * 2}s forwards`,
                width: "10px", height: "10px",
              }}
            />
          ))}
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <style>{`
            @keyframes radarPulse {
              0% { width: 10px; height: 10px; opacity: 0.8; }
              100% { width: 120px; height: 120px; opacity: 0; }
            }
          `}</style>
        </div>
      )}

      <div className={`transition-opacity duration-500 ${animating ? "opacity-0" : "opacity-100"}`}>
        <span className="text-lg mb-1 block">{icon}</span>
        <p className="text-lg sm:text-xl font-bold tabular-nums">{value}</p>
        <p className="text-[11px] sm:text-xs text-muted mt-0.5">{label}</p>
      </div>

      {animating && type !== "monitoring" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center animate-fade-in">
          {type === "speed" && (
            <>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1">
                <path d="M12 12m-9 0a9 9 0 1 0 18 0" />
                <path d="M12 12l4-4" />
                <circle cx="12" cy="12" r="1" fill="#3b82f6" />
              </svg>
              <p className="text-sm sm:text-base font-bold text-primary tabular-nums">{animValue}</p>
            </>
          )}
          {type === "uptime" && (
            <p className="text-xl sm:text-2xl font-bold text-success tabular-nums">{animValue}</p>
          )}
          {type === "partners" && (
            <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">{animValue}</p>
          )}
        </div>
      )}
    </button>
  );
}

// ─── Feature Card ───────────────────────────────────────────────

function FeatureBlock({ title, desc, icon, color, delay }: { title: string; desc: string; icon: React.ReactNode; color: string; delay: number }) {
  const [pressed, setPressed] = useState(false);

  return (
    <div
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className="bg-card border border-border/50 rounded-2xl p-4 sm:p-5 animate-fade-in-up cursor-default transition-transform duration-200"
      style={{ animationDelay: `${delay}s`, transform: pressed ? "scale(0.97)" : "scale(1)" }}
    >
      <div className="flex items-start gap-3.5">
        <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-sm sm:text-base mb-1">{title}</h3>
          <p className="text-xs sm:text-sm text-muted leading-relaxed">{desc}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-dvh flex flex-col relative">
      <FloatingSquares />
      <Header showBack onBack={() => router.push("/dashboard")} />

      <PageContainer className="relative z-[1]">
        {/* Hero */}
        <div className="text-center pt-4 sm:pt-6 mb-8 sm:mb-10 animate-fade-in-up">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-[#8b5cf6]/20 flex items-center justify-center mx-auto mb-5">
            <svg width="44" height="44" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="ag" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="50%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <path d="M50 8 L85 88 L72 88 L62 64 L38 64 L28 88 L15 88 Z M50 28 L40 56 L60 56 Z" fill="url(#ag)" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-3">Atlas Secure</h1>
          <p className="text-muted text-sm sm:text-base leading-relaxed max-w-sm mx-auto">
            Платформа безопасного доступа в интернет корпоративного класса для частных пользователей и бизнеса
          </p>
        </div>

        {/* Animated Stats */}
        <div className="grid grid-cols-2 gap-2.5 mb-6 sm:mb-8 animate-fade-in-up animate-delay-1">
          <StatCard icon="⚡" value="75 Гбит/с" label="Пропускная способность" type="speed" />
          <StatCard icon="🛡" value="99.9%" label="Аптайм серверов" type="uptime" />
          <StatCard icon="🤝" value="30+" label="Бизнес-партнёров" type="partners" />
          <StatCard icon="📡" value="24/7" label="Мониторинг" type="monitoring" />
        </div>

        {/* Features */}
        <div className="space-y-3 mb-6 sm:mb-8">
          <FeatureBlock
            title="Enterprise Spectrum Protection"
            desc="Наивысший класс защиты от DDoS-атак и сетевых угроз. Многоуровневая фильтрация трафика с интеллектуальным анализом в реальном времени."
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" stroke="#3b82f6" strokeWidth="2" /></svg>}
            color="bg-primary/10" delay={0.2}
          />
          <FeatureBlock
            title="Выделенные серверы"
            desc="Инфраструктура премиум-класса с каналами до 75 Гбит/с. Оптимизированная маршрутизация для минимальной задержки и максимальной стабильности."
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="7" rx="2" /><rect x="2" y="14" width="20" height="7" rx="2" /><circle cx="6" cy="6.5" r="1" fill="#8b5cf6" /><circle cx="6" cy="17.5" r="1" fill="#8b5cf6" /><line x1="10" y1="6.5" x2="18" y2="6.5" /><line x1="10" y1="17.5" x2="18" y2="17.5" /></svg>}
            color="bg-[#8b5cf6]/10" delay={0.3}
          />
          <FeatureBlock
            title="Непрерывная доступность"
            desc="Резервные каналы и автоматическое переключение гарантируют стабильную работу даже в самых сложных сетевых условиях."
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /><circle cx="12" cy="12" r="1" fill="#22c55e" /></svg>}
            color="bg-success/10" delay={0.4}
          />
          <FeatureBlock
            title="Конфиденциальность"
            desc="Политика нулевого логирования. Мы не храним и не анализируем сетевую активность. Шифрование военного класса на всех соединениях."
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /><circle cx="12" cy="16" r="1.5" fill="#f59e0b" /></svg>}
            color="bg-warning/10" delay={0.5}
          />
        </div>

        {/* Business */}
        <div
          className="bg-card border border-primary/20 rounded-2xl p-5 sm:p-6 mb-6 sm:mb-8 animate-fade-in-up animate-delay-4 transition-transform duration-200 active:scale-[0.98]"
        >
          <div className="flex items-start gap-3.5 mb-4">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                <line x1="12" y1="12" x2="12" y2="16" />
                <line x1="10" y1="14" x2="14" y2="14" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base mb-1">Корпоративный пакет</h3>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                Расширенное решение для бизнеса с индивидуальной разработкой, выделенной инфраструктурой и персональной поддержкой. Более 30 компаний уже выбрали Atlas Secure.
              </p>
            </div>
          </div>
          <a
            href="https://t.me/Atlas_SupportSecurity"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-11 sm:h-12 rounded-xl bg-primary text-white font-medium text-sm sm:text-base hover:bg-primary-hover transition-all btn-press flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            Связаться с нами
          </a>
        </div>

        {/* Trust */}
        <div className="text-center mb-6 animate-fade-in-up animate-delay-5">
          <p className="text-muted/50 text-[11px] sm:text-xs leading-relaxed">
            Atlas Secure — платформа нового поколения, которой доверяют пользователи в более чем 20 странах мира. Мы создаём технологии, которые работают тогда, когда это важнее всего.
          </p>
        </div>

        <div className="text-center pb-4">
          <p className="text-muted/30 text-[10px] font-mono">v2.0.0 · Atlas Secure Platform</p>
        </div>
      </PageContainer>

      <Footer />
    </div>
  );
}
