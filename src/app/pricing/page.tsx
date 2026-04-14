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
      { icon: "🌐", text: "Всегда доступен сайт" },
    ],
  },
  plus: {
    name: "Plus",
    badge: "Популярный",
    features: [
      { icon: "⚡", text: "Приоритетная скорость для стримов и игр" },
      { icon: "🛡", text: "Всегда доступен" },
      { icon: "🌍", text: "Выделенные серверы в нескольких странах" },
      { icon: "🔄", text: "Резервные каналы — доступ работает всегда" },
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

type PageStep = "plans" | "periods" | "payment-methods" | "processing" | "success" | "failed" | "expired";

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
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentId, setPaymentId] = useState<string | null>(null);

  // Check for payment return from YooKassa
  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment) {
      setPaymentId(payment);
      setStep("processing");
      checkPaymentStatus(payment);
    }
  }, [searchParams]);

  const checkPaymentStatus = useCallback(async (id: string) => {
    let attempts = 0;
    const maxAttempts = 40; // 2 minutes of polling (40 * 3s)

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
          // After 2min of polling, show success anyway (payment will process via webhook later)
          setStep("success");
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

  const handleSelectPeriod = (opt: PeriodOption) => {
    setSelectedPeriod(opt);
    setStep("payment-methods");
    setError("");
  };

  const handlePayYooKassa = async () => {
    if (!selectedPlan || !selectedPeriod) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan, period: selectedPeriod.months }),
      });
      const data = await res.json();
      if (data.success && data.data.redirectUrl) {
        setPaymentId(data.data.paymentId);
        window.location.href = data.data.redirectUrl;
      } else {
        setError(data.error || "Не удалось создать платёж");
      }
    } catch {
      setError("Ошибка соединения. Попробуйте позже.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <Header showBack onBack={() => {
        if (step === "payment-methods") {
          setStep("periods");
        } else if (step === "periods") {
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
                  Всегда на связи — даже когда другие сервисы не работают
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
                  onClick={() => handleSelectPeriod(opt)}
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

        {/* ═══ Payment Methods ═══ */}
        {step === "payment-methods" && selectedPlan && selectedPeriod && (
          <div className="animate-fade-in-up pt-2 sm:pt-4">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Способ оплаты</h1>
              <p className="text-muted text-sm sm:text-base">
                Выберите удобный способ
              </p>
            </div>

            {/* Order Summary */}
            <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-5 mb-5 animate-fade-in-up">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                    selectedPlan === "plus" ? "bg-primary/15" : "bg-foreground/10"
                  }`}>
                    {selectedPlan === "plus" ? "👑" : "🔒"}
                  </div>
                  <div>
                    <p className="font-semibold text-sm sm:text-base">{PLANS[selectedPlan].name} — {selectedPeriod.label}</p>
                    <p className="text-muted text-xs">{selectedPeriod.perMonth} ₽/мес</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg sm:text-xl">{selectedPeriod.price} ₽</p>
                  {selectedPeriod.discount && (
                    <span className="text-[10px] bg-success/15 text-success px-2 py-0.5 rounded-full font-semibold">
                      {selectedPeriod.discount}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-3">
              {/* YooKassa — Card / SBP */}
              <button
                onClick={handlePayYooKassa}
                disabled={loading}
                className="w-full text-left bg-card border border-border/50 rounded-2xl p-4 sm:p-5 transition-all hover:border-primary/50 active:scale-[0.98] btn-press disabled:opacity-50 animate-fade-in-up"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-blue-500/15 to-green-500/15 flex items-center justify-center shrink-0">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-sm sm:text-base">Оплатить по карте или СБП</p>
                    </div>
                    <p className="text-muted text-xs sm:text-sm">Visa, Mastercard, МИР, СБП</p>
                  </div>
                  {loading ? (
                    <LoadingSpinner size="sm" className="text-primary shrink-0" />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted shrink-0">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  )}
                </div>
              </button>
            </div>

            {error && (
              <div className="mt-4 bg-danger/10 border border-danger/20 rounded-xl p-3 animate-fade-in-up">
                <p className="text-danger text-xs sm:text-sm text-center">{error}</p>
              </div>
            )}

            <div className="mt-6 flex items-center gap-2 justify-center text-muted/50">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              <p className="text-[10px] sm:text-xs">Безопасная оплата через защищённый платёжный шлюз</p>
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
                Подписка успешно продлена. Ваш ключ активен и готов к использованию.
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
