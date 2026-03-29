"use client";

import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageContainer from "@/components/PageContainer";

const STATS = [
  { value: "75 Гбит/с", label: "Пропускная способность", icon: "⚡" },
  { value: "99.9%", label: "Аптайм серверов", icon: "🛡" },
  { value: "30+", label: "Бизнес-партнёров", icon: "🤝" },
  { value: "24/7", label: "Мониторинг", icon: "📡" },
];

const FEATURES = [
  {
    title: "Enterprise Spectrum Protection",
    desc: "Наивысший класс защиты от DDoS-атак и сетевых угроз. Многоуровневая фильтрация трафика с интеллектуальным анализом в реальном времени.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    color: "bg-primary/10",
  },
  {
    title: "Выделенные серверы",
    desc: "Инфраструктура премиум-класса с каналами до 75 Гбит/с. Оптимизированная маршрутизация для минимальной задержки и максимальной стабильности.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
        <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
        <line x1="6" y1="6" x2="6.01" y2="6" />
        <line x1="6" y1="18" x2="6.01" y2="18" />
      </svg>
    ),
    color: "bg-accent-light",
  },
  {
    title: "Непрерывная доступность",
    desc: "Резервные каналы и автоматическое переключение гарантируют стабильную работу даже в самых сложных сетевых условиях. Ваше соединение не прервётся.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    color: "bg-success-light",
  },
  {
    title: "Конфиденциальность",
    desc: "Политика нулевого логирования. Мы не записываем, не храним и не анализируем вашу сетевую активность. Шифрование военного класса на всех соединениях.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    ),
    color: "bg-warning-light",
  },
];

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-dvh flex flex-col">
      <Header showBack onBack={() => router.push("/dashboard")} />

      <PageContainer>
        {/* Hero */}
        <div className="text-center pt-4 sm:pt-6 mb-8 sm:mb-10 animate-fade-in-up">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-5">
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

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2.5 mb-6 sm:mb-8 animate-fade-in-up animate-delay-1">
          {STATS.map((s, i) => (
            <div key={i} className="bg-card border border-border/50 rounded-2xl p-4 text-center">
              <span className="text-lg mb-1 block">{s.icon}</span>
              <p className="text-lg sm:text-xl font-bold tabular-nums">{s.value}</p>
              <p className="text-[11px] sm:text-xs text-muted mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="space-y-3 mb-6 sm:mb-8">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="bg-card border border-border/50 rounded-2xl p-4 sm:p-5 animate-fade-in-up"
              style={{ animationDelay: `${(i + 2) * 0.1}s` }}
            >
              <div className="flex items-start gap-3.5">
                <div className={`w-11 h-11 rounded-xl ${f.color} flex items-center justify-center shrink-0`}>
                  {f.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base mb-1">{f.title}</h3>
                  <p className="text-xs sm:text-sm text-muted leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Business */}
        <div className="bg-card border border-primary/20 rounded-2xl p-5 sm:p-6 mb-6 sm:mb-8 animate-fade-in-up animate-delay-4">
          <div className="flex items-start gap-3.5 mb-4">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 7h-9" />
                <path d="M14 17H5" />
                <circle cx="17" cy="17" r="3" />
                <circle cx="7" cy="7" r="3" />
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

        {/* Trust line */}
        <div className="text-center mb-6 animate-fade-in-up animate-delay-5">
          <p className="text-muted/50 text-[11px] sm:text-xs leading-relaxed">
            Atlas Secure — платформа нового поколения, которой доверяют пользователи в более чем 20 странах мира. Мы создаём технологии, которые работают тогда, когда это важнее всего.
          </p>
        </div>

        {/* Version */}
        <div className="text-center pb-4">
          <p className="text-muted/30 text-[10px] font-mono">v2.0.0 · Atlas Secure Platform</p>
        </div>
      </PageContainer>

      <Footer />
    </div>
  );
}
