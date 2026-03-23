"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageContainer from "@/components/PageContainer";
import LoadingSpinner from "@/components/LoadingSpinner";

type Plan = "basic" | "plus";

interface PeriodOption {
  months: number;
  label: string;
  price: number;
  perMonth: number;
  discount?: string;
}

const PLANS: Record<Plan, { name: string; features: { icon: string; text: string }[]; badge?: string }> = {
  basic: {
    name: "Basic",
    features: [
      { icon: "⚡", text: "Стабильная скорость" },
      { icon: "🔒", text: "Надёжное шифрование" },
      { icon: "📱", text: "Безлимит устройств" },
      { icon: "🌐", text: "Доступ к заблокированным сайтам" },
    ],
  },
  plus: {
    name: "Plus",
    badge: "Популярный",
    features: [
      { icon: "⚡", text: "Приоритетная скорость для стримов и игр" },
      { icon: "🛡", text: "Обход любых блокировок включая белые списки" },
      { icon: "🌍", text: "Выделенные серверы в нескольких странах" },
      { icon: "🔄", text: "Резервные каналы — VPN работает всегда" },
    ],
  },
};

const PRICES: Record<Plan, PeriodOption[]> = {
  basic: [
    { months: 1, label: "1 месяц", price: 149, perMonth: 149 },
    { months: 3, label: "3 месяца", price: 399, perMonth: 133, discount: "-11%" },
    { months: 6, label: "6 месяцев", price: 749, perMonth: 125, discount: "-16%" },
    { months: 12, label: "12 месяцев", price: 1399, perMonth: 117, discount: "-22%" },
  ],
  plus: [
    { months: 1, label: "1 месяц", price: 299, perMonth: 299 },
    { months: 3, label: "3 месяца", price: 699, perMonth: 233, discount: "-22%" },
    { months: 6, label: "6 месяцев", price: 1199, perMonth: 200, discount: "-33%" },
    { months: 12, label: "12 месяцев", price: 2299, perMonth: 192, discount: "-36%" },
  ],
};

type PageStep = "plans" | "periods" | "payment-stub" | "processing" | "success" | "failed" | "expired";

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center">
        <LoadingSpinner size="lg" className="text-primary" />
      </div>
    }>
      <PricingContent />
    </Suspense>
  );
}

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<PageStep>("plans");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentId, setPaymentId] = useState<string | null>(null);

  // Check for payment return from Platega
  useEffect(() => {
    const payment = searchParams.get("payment");
    const status = searchParams.get("status");
    if (payment && status) {
      setPaymentId(payment);
      if (status === "success") {
        setStep("processing");
        checkPaymentStatus(payment);
      } else {
        setStep("failed");
      }
    }
  }, [searchParams]);

  const checkPaymentStatus = useCallback(async (id: string) => {
    let attempts = 0;
    const maxAttempts = 10;

    const poll = async () => {
      try {
        const res = await fetch(`/api/payments/status?id=${id}`);
        const data = await res.json();

        if (data.success) {
          if (data.data.status === "confirmed") {
            setStep("success");
            return;
          }
          if (data.data.status === "canceled") {
            setStep("failed");
            return;
          }
          if (data.data.status === "expired") {
            setStep("expired");
            return;
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 3000);
        } else {
          // After 30s of polling, check one more time
          setStep("processing");
        }
      } catch {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 3000);
        }
      }
    };

    poll();
  }, []);

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setStep("periods");
    setError("");
  };

  const handleSelectPeriod = async () => {
    setStep("payment-stub");
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <Header showBack onBack={() => {
        if (step === "periods") {
          setStep("plans");
          setSelectedPlan(null);
        } else {
          router.push("/dashboard");
        }
      }} />

      <PageContainer>
        {/* ═══ Plan Selection ═══ */}
        {step === "plans" && (
          <div className="animate-fade-in-up pt-2 sm:pt-4">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Выберите тариф</h1>
              <p className="text-muted text-sm sm:text-base">
                Максимальная свобода в интернете
              </p>
            </div>

            <div className="space-y-4">
              {/* Plus Plan — Featured */}
              <button
                onClick={() => handleSelectPlan("plus")}
                className="w-full text-left bg-card border-2 border-primary/50 rounded-2xl sm:rounded-3xl p-5 sm:p-6 relative overflow-hidden transition-all hover:border-primary active:scale-[0.98] btn-press animate-fade-in-up"
              >
                <div className="absolute top-0 right-0 bg-primary text-white text-[10px] sm:text-xs font-bold px-3 py-1 rounded-bl-xl">
                  Популярный
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-primary/15 flex items-center justify-center text-xl">
                    👑
                  </div>
                  <div>
                    <h3 className="font-bold text-lg sm:text-xl">Plus</h3>
                    <p className="text-muted text-xs sm:text-sm">от 192 ₽/мес</p>
                  </div>
                </div>

                <p className="text-muted text-xs sm:text-sm mb-4 leading-relaxed">
                  Всегда на связи — даже когда другие VPN не работают
                </p>

                <div className="space-y-2">
                  {PLANS.plus.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm">
                      <span className="text-base shrink-0">{f.icon}</span>
                      <span className="text-foreground/90">{f.text}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                  <span className="text-primary font-semibold text-sm sm:text-base">Выбрать Plus</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </button>

              {/* Basic Plan */}
              <button
                onClick={() => handleSelectPlan("basic")}
                className="w-full text-left bg-card border border-border/50 rounded-2xl sm:rounded-3xl p-5 sm:p-6 transition-all hover:border-border active:scale-[0.98] btn-press animate-fade-in-up animate-delay-1"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-foreground/10 flex items-center justify-center text-xl">
                    🔒
                  </div>
                  <div>
                    <h3 className="font-bold text-lg sm:text-xl">Basic</h3>
                    <p className="text-muted text-xs sm:text-sm">от 117 ₽/мес</p>
                  </div>
                </div>

                <p className="text-muted text-xs sm:text-sm mb-4 leading-relaxed">
                  Надёжная защита и стабильное соединение для повседневного использования
                </p>

                <div className="space-y-2">
                  {PLANS.basic.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm">
                      <span className="text-base shrink-0">{f.icon}</span>
                      <span className="text-foreground/90">{f.text}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                  <span className="text-foreground font-semibold text-sm sm:text-base">Выбрать Basic</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ═══ Period Selection ═══ */}
        {step === "periods" && selectedPlan && (
          <div className="animate-fade-in-up pt-2 sm:pt-4">
            <div className="text-center mb-6 sm:mb-8">
              <div className="inline-flex items-center gap-2 bg-card border border-border/50 rounded-full px-4 py-1.5 mb-4">
                <span className="text-base">{selectedPlan === "plus" ? "👑" : "🔒"}</span>
                <span className="font-semibold text-sm">{PLANS[selectedPlan].name}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Выберите срок</h1>
              <p className="text-muted text-sm sm:text-base">
                Чем дольше срок — тем выгоднее
              </p>
            </div>

            <div className="space-y-2.5 sm:space-y-3">
              {PRICES[selectedPlan].map((opt, index) => (
                <button
                  key={opt.months}
                  onClick={() => handleSelectPeriod()}
                  disabled={loading}
                  className={`w-full text-left bg-card border rounded-2xl p-4 sm:p-5 transition-all hover:border-primary/50 active:scale-[0.98] btn-press disabled:opacity-50 disabled:cursor-not-allowed animate-fade-in-up ${
                    opt.months === 12
                      ? "border-primary/40 ring-1 ring-primary/20"
                      : "border-border/50"
                  }`}
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-bold text-sm ${
                        opt.months === 12
                          ? "bg-primary/15 text-primary"
                          : "bg-foreground/10 text-foreground"
                      }`}>
                        {opt.months}м
                      </div>
                      <div>
                        <p className="font-semibold text-sm sm:text-base">{opt.label}</p>
                        <p className="text-muted text-xs sm:text-sm">{opt.perMonth} ₽/мес</p>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-2">
                      {opt.discount && (
                        <span className="text-[10px] sm:text-xs bg-success/15 text-success px-2 py-0.5 rounded-full font-semibold">
                          {opt.discount}
                        </span>
                      )}
                      <div>
                        <p className="font-bold text-base sm:text-lg">{opt.price} ₽</p>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {error && (
              <div className="mt-4 bg-danger/10 border border-danger/20 rounded-xl p-3">
                <p className="text-danger text-xs sm:text-sm text-center">{error}</p>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <LoadingSpinner size="sm" className="text-primary" />
                <p className="text-muted text-sm">Создаём платёж...</p>
              </div>
            )}

            <p className="text-muted/60 text-[10px] sm:text-xs text-center mt-6 leading-relaxed">
              Оплата через защищённую платёжную систему. Время на оплату — 15 минут.
            </p>
          </div>
        )}

        {/* ═══ Processing ═══ */}
        {step === "payment-stub" && (
          <div className="animate-fade-in-up pt-8 sm:pt-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-warning/15 flex items-center justify-center mb-6 animate-scale-in">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold mb-3">Платежи на доработке</h1>
              <p className="text-muted text-sm sm:text-base max-w-xs leading-relaxed mb-8">
                Пожалуйста, для оплаты подписки перейдите в наш Telegram-бот
              </p>

              <div className="w-full max-w-xs space-y-3">
                <a
                  href="https://t.me/atlassecure_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-13 sm:h-14 rounded-2xl bg-telegram text-white font-semibold text-base sm:text-lg hover:bg-telegram-hover transition-all btn-press flex items-center justify-center gap-2.5"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                  </svg>
                  Перейти в бот
                </a>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full h-13 sm:h-14 rounded-2xl bg-card border border-border text-foreground font-semibold text-sm sm:text-base hover:bg-card-hover transition-all btn-press"
                >
                  Вернуться в кабинет
                </button>
              </div>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="animate-fade-in-up pt-8 sm:pt-12">
            <div className="flex flex-col items-center text-center">
              <div className="mb-6">
                <LoadingSpinner size="lg" className="text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-3">Проверяем оплату</h1>
              <p className="text-muted text-sm sm:text-base max-w-xs leading-relaxed">
                Пожалуйста, подождите. Мы проверяем статус вашего платежа...
              </p>
            </div>
          </div>
        )}

        {/* ═══ Success ═══ */}
        {step === "success" && (
          <div className="animate-fade-in-up pt-8 sm:pt-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center mb-6 animate-scale-in">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold mb-3">Оплата прошла!</h1>
              <p className="text-muted text-sm sm:text-base max-w-xs leading-relaxed mb-8">
                Подписка успешно продлена. Ваш VPN-ключ активен и готов к использованию.
              </p>

              <button
                onClick={() => router.push("/dashboard")}
                className="w-full max-w-xs h-13 sm:h-14 rounded-2xl bg-foreground text-background font-semibold text-base sm:text-lg hover:bg-foreground/90 transition-all btn-press"
              >
                Перейти в кабинет
              </button>
            </div>
          </div>
        )}

        {/* ═══ Failed ═══ */}
        {step === "failed" && (
          <div className="animate-fade-in-up pt-8 sm:pt-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-danger/15 flex items-center justify-center mb-6 animate-scale-in">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold mb-3">Оплата не прошла</h1>
              <p className="text-muted text-sm sm:text-base max-w-xs leading-relaxed mb-8">
                Платёж был отклонён или отменён. Попробуйте ещё раз или используйте другую карту.
              </p>

              <div className="w-full max-w-xs space-y-3">
                <button
                  onClick={() => { setStep("plans"); setSelectedPlan(null); setError(""); }}
                  className="w-full h-13 sm:h-14 rounded-2xl bg-foreground text-background font-semibold text-base sm:text-lg hover:bg-foreground/90 transition-all btn-press"
                >
                  Попробовать снова
                </button>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full h-13 sm:h-14 rounded-2xl bg-card border border-border text-foreground font-semibold text-sm sm:text-base hover:bg-card-hover transition-all btn-press"
                >
                  Вернуться в кабинет
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Expired ═══ */}
        {step === "expired" && (
          <div className="animate-fade-in-up pt-8 sm:pt-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-warning/15 flex items-center justify-center mb-6 animate-scale-in">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold mb-3">Время истекло</h1>
              <p className="text-muted text-sm sm:text-base max-w-xs leading-relaxed mb-8">
                Платёж не был оплачен в течение 15 минут и был аннулирован. Создайте новый платёж.
              </p>

              <div className="w-full max-w-xs space-y-3">
                <button
                  onClick={() => { setStep("plans"); setSelectedPlan(null); setError(""); }}
                  className="w-full h-13 sm:h-14 rounded-2xl bg-foreground text-background font-semibold text-base sm:text-lg hover:bg-foreground/90 transition-all btn-press"
                >
                  Создать новый платёж
                </button>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full h-13 sm:h-14 rounded-2xl bg-card border border-border text-foreground font-semibold text-sm sm:text-base hover:bg-card-hover transition-all btn-press"
                >
                  Вернуться в кабинет
                </button>
              </div>
            </div>
          </div>
        )}
      </PageContainer>

      <Footer />
    </div>
  );
}
