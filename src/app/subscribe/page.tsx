"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageContainer from "@/components/PageContainer";
import LoadingSpinner from "@/components/LoadingSpinner";
import CursorGlowTracker from "@/components/CursorGlowTracker";

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
    { months: 1, label: "1 месяц", price: 199, perMonth: 199 },
    { months: 3, label: "3 месяца", price: 499, perMonth: 166, discount: "-16%" },
    { months: 6, label: "6 месяцев", price: 899, perMonth: 150, discount: "-25%" },
    { months: 12, label: "12 месяцев", price: 1599, perMonth: 133, discount: "-33%" },
  ],
  plus: [
    { months: 1, label: "1 месяц", price: 349, perMonth: 349 },
    { months: 3, label: "3 месяца", price: 899, perMonth: 300, discount: "-14%" },
    { months: 6, label: "6 месяцев", price: 1499, perMonth: 250, discount: "-28%" },
    { months: 12, label: "12 месяцев", price: 2599, perMonth: 217, discount: "-38%" },
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

  // Step progress (1..3) for the visible indicator
  const stepNum = step === "plans" ? 1 : step === "periods" ? 2 : step === "payment-methods" ? 3 : 3;

  return (
    <div className="dashboard-v2 min-h-dvh flex flex-col">
      <CursorGlowTracker />
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

      {/* Step indicator (only on the 3 selection steps) */}
      {(step === "plans" || step === "periods" || step === "payment-methods") && (
        <div className="max-w-2xl w-full mx-auto px-4 sm:px-6 mt-1">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-500 ease-out ${
                  i <= stepNum ? "flex-1 bg-white/85" : "w-8 bg-white/15"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <PageContainer>
        {/* ═══ Plan Selection ═══ */}
        {step === "plans" && (
          <div className="pt-4 sm:pt-8 max-w-2xl mx-auto w-full">
            <div className="dv2-rise mb-7 sm:mb-9">
              <div className="dv2-eyebrow mb-2">ШАГ 1 — ТАРИФ</div>
              <h1 className="text-[32px] sm:text-[40px] font-light leading-[1.05] tracking-tight text-white">
                Выберите<br />
                <span className="text-white/50">тариф</span>
              </h1>
              <p className="text-[13px] text-white/45 mt-3">
                Максимальная свобода в интернете
              </p>
            </div>

            {/* Plus — featured floating card */}
            <button
              onClick={() => handleSelectPlan("plus")}
              className="dv2-rise dv2-rise-1 dv2-elevate-accent dv2-glow w-full text-left rounded-[28px] p-6 sm:p-7 relative overflow-hidden mb-3 group"
            >
              <div className="absolute top-4 right-4 z-[2]">
                <span className="text-[10px] font-mono uppercase tracking-[0.14em] bg-[#5E6AD2] text-white px-2.5 py-1 rounded-full">
                  Популярный
                </span>
              </div>

              <div className="flex items-center gap-3.5 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-[#5E6AD2]/20 border border-[#5E6AD2]/30 flex items-center justify-center text-[24px]">
                  👑
                </div>
                <div>
                  <div className="text-[20px] sm:text-[22px] font-medium text-white">Plus</div>
                  <div className="text-[12px] text-white/50">от 217 ₽/мес</div>
                </div>
              </div>

              <p className="text-[13px] text-white/65 mb-5 leading-relaxed">
                Всегда на связи — даже когда другие сервисы не работают
              </p>

              <div className="space-y-2.5">
                {PLANS.plus.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 text-[13px]">
                    <span className="text-[15px] shrink-0">{f.icon}</span>
                    <span className="text-white/85">{f.text}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-5 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[#8F8FD9] font-medium text-[14px]">Выбрать Plus</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8F8FD9] transition-transform group-hover:translate-x-0.5">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </button>

            {/* Basic — calm secondary card */}
            <button
              onClick={() => handleSelectPlan("basic")}
              className="dv2-rise dv2-rise-2 dv2-card dv2-glow w-full text-left rounded-[28px] p-6 sm:p-7 group"
            >
              <div className="flex items-center gap-3.5 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[24px]">
                  🔒
                </div>
                <div>
                  <div className="text-[20px] sm:text-[22px] font-medium text-white">Basic</div>
                  <div className="text-[12px] text-white/50">от 133 ₽/мес</div>
                </div>
              </div>

              <p className="text-[13px] text-white/65 mb-5 leading-relaxed">
                Надёжная защита и стабильное соединение для повседневного использования
              </p>

              <div className="space-y-2.5">
                {PLANS.basic.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 text-[13px]">
                    <span className="text-[15px] shrink-0">{f.icon}</span>
                    <span className="text-white/85">{f.text}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-5 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-white/85 font-medium text-[14px]">Выбрать Basic</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/40 transition-transform group-hover:translate-x-0.5">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </button>
          </div>
        )}

        {/* ═══ Period Selection ═══ */}
        {step === "periods" && selectedPlan && (
          <div className="pt-4 sm:pt-8 max-w-2xl mx-auto w-full">
            <div className="dv2-rise mb-6">
              <div className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-full px-3 py-1 mb-4">
                <span className="text-[14px]">{selectedPlan === "plus" ? "👑" : "🔒"}</span>
                <span className="text-[12px] font-medium text-white/85">{PLANS[selectedPlan].name}</span>
              </div>
              <div className="dv2-eyebrow mb-2">ШАГ 2 — СРОК</div>
              <h1 className="text-[32px] sm:text-[40px] font-light leading-[1.05] tracking-tight text-white">
                Выберите<br /><span className="text-white/50">срок</span>
              </h1>
              <p className="text-[13px] text-white/45 mt-3">
                Чем дольше срок — тем выгоднее
              </p>
            </div>

            <div className="space-y-2.5">
              {PRICES[selectedPlan].map((opt, index) => (
                <button
                  key={opt.months}
                  onClick={() => handleSelectPeriod(opt)}
                  disabled={loading}
                  className={`dv2-rise dv2-glow w-full text-left rounded-[22px] p-5 sm:p-6 group disabled:opacity-50 disabled:cursor-not-allowed ${
                    opt.months === 12
                      ? "dv2-elevate-accent"
                      : "dv2-card"
                  }`}
                  style={{ animationDelay: `${(index + 1) * 70}ms` }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-medium text-[14px] shrink-0 ${
                        opt.months === 12
                          ? "bg-[#5E6AD2]/20 border border-[#5E6AD2]/30 text-[#8F8FD9]"
                          : "bg-white/[0.04] border border-white/[0.06] text-white/85"
                      }`}>
                        {opt.months}м
                      </div>
                      <div className="min-w-0">
                        <div className="text-[15px] font-medium text-white truncate">{opt.label}</div>
                        <div className="text-[12px] text-white/50">{opt.perMonth} ₽/мес</div>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-2 shrink-0">
                      {opt.discount && (
                        <span className="text-[10px] font-medium bg-[#34D399]/15 text-[#34D399] px-2 py-0.5 rounded-full">
                          {opt.discount}
                        </span>
                      )}
                      <div className="text-[18px] sm:text-[20px] font-light text-white tabular-nums">
                        {opt.price} <span className="text-white/40">₽</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {error && (
              <div className="dv2-rise mt-4 bg-[#EF4444]/10 border border-[#EF4444]/25 rounded-2xl p-3">
                <p className="text-[#EF4444] text-[13px] text-center">{error}</p>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <LoadingSpinner size="sm" className="text-[#8F8FD9]" />
                <p className="text-white/50 text-[13px]">Создаём платёж…</p>
              </div>
            )}

            <p className="text-white/30 text-[11px] text-center mt-6 leading-relaxed">
              Оплата через защищённую платёжную систему · 15 минут на оплату
            </p>
          </div>
        )}

        {/* ═══ Payment Methods ═══ */}
        {step === "payment-methods" && selectedPlan && selectedPeriod && (
          <div className="pt-4 sm:pt-8 max-w-2xl mx-auto w-full">
            <div className="dv2-rise mb-6">
              <div className="dv2-eyebrow mb-2">ШАГ 3 — ОПЛАТА</div>
              <h1 className="text-[32px] sm:text-[40px] font-light leading-[1.05] tracking-tight text-white">
                Способ<br /><span className="text-white/50">оплаты</span>
              </h1>
            </div>

            {/* Order summary — featured floating card */}
            <div className="dv2-rise dv2-rise-1 dv2-elevate dv2-glow rounded-[24px] bg-[#0F0F12] border border-white/[0.06] p-5 sm:p-6 mb-4">
              <div className="dv2-eyebrow mb-3">К ОПЛАТЕ</div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-[22px] shrink-0 ${
                    selectedPlan === "plus" ? "bg-[#5E6AD2]/20 border border-[#5E6AD2]/30" : "bg-white/[0.04] border border-white/[0.06]"
                  }`}>
                    {selectedPlan === "plus" ? "👑" : "🔒"}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[15px] font-medium text-white truncate">{PLANS[selectedPlan].name} · {selectedPeriod.label}</div>
                    <div className="text-[12px] text-white/50">{selectedPeriod.perMonth} ₽/мес</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[28px] sm:text-[32px] font-light text-white tabular-nums leading-none">
                    {selectedPeriod.price} <span className="text-white/40 text-[18px]">₽</span>
                  </div>
                  {selectedPeriod.discount && (
                    <span className="inline-block mt-1.5 text-[10px] font-medium bg-[#34D399]/15 text-[#34D399] px-2 py-0.5 rounded-full">
                      экономия {selectedPeriod.discount}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Payment methods */}
            <div className="space-y-3">
              <button
                onClick={handlePayYooKassa}
                disabled={loading}
                className="dv2-rise dv2-rise-2 dv2-card dv2-glow w-full text-left rounded-[24px] p-5 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3b82f6]/20 to-[#10b981]/20 border border-white/[0.06] flex items-center justify-center shrink-0">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/90">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-medium text-white">Карта или СБП</div>
                    <div className="text-[12px] text-white/45 mt-0.5">Visa, Mastercard, МИР, СБП</div>
                  </div>
                  {loading ? (
                    <LoadingSpinner size="sm" className="text-[#8F8FD9] shrink-0" />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/40 shrink-0 transition-transform group-hover:translate-x-0.5">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  )}
                </div>
              </button>
            </div>

            {error && (
              <div className="dv2-rise mt-4 bg-[#EF4444]/10 border border-[#EF4444]/25 rounded-2xl p-3">
                <p className="text-[#EF4444] text-[13px] text-center">{error}</p>
              </div>
            )}

            <div className="mt-6 flex items-center gap-2 justify-center text-white/30">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              <p className="text-[11px]">Безопасная оплата через защищённый платёжный шлюз</p>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="pt-12 sm:pt-20 flex flex-col items-center text-center max-w-md mx-auto w-full">
            <div className="dv2-rise mb-6 relative">
              <div className="absolute inset-0 rounded-full bg-[#5E6AD2]/20 blur-2xl animate-pulse" />
              <LoadingSpinner size="lg" className="text-[#8F8FD9] relative" />
            </div>
            <h1 className="dv2-rise dv2-rise-1 text-[32px] sm:text-[40px] font-light tracking-tight text-white mb-3">
              Проверяем оплату
            </h1>
            <p className="dv2-rise dv2-rise-2 text-[14px] text-white/50 max-w-sm leading-relaxed">
              Пожалуйста, подождите. Проверяем статус вашего платежа…
            </p>
          </div>
        )}

        {/* ═══ Success ═══ */}
        {step === "success" && (
          <div className="pt-12 sm:pt-20 flex flex-col items-center text-center max-w-md mx-auto w-full">
            <div className="dv2-rise relative w-24 h-24 mb-6">
              <div className="absolute inset-0 rounded-full bg-[#34D399]/15 animate-ping" style={{ animationDuration: "2.4s" }} />
              <div className="relative w-full h-full rounded-full bg-gradient-to-br from-[#34D399]/30 to-[#34D399]/10 border border-[#34D399]/30 flex items-center justify-center">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>

            <h1 className="dv2-rise dv2-rise-1 text-[36px] sm:text-[44px] font-light tracking-tight leading-[1.05] text-white mb-3">
              Оплата прошла
            </h1>
            <p className="dv2-rise dv2-rise-2 text-[14px] text-white/50 max-w-sm leading-relaxed mb-8">
              Подписка успешно продлена. Ключ активен и готов к использованию.
            </p>

            <button
              onClick={() => router.push("/dashboard")}
              className="dv2-rise dv2-rise-3 w-full max-w-xs h-14 rounded-2xl bg-white text-black font-medium text-[15px] hover:bg-white/95 transition-all active:scale-[0.985]"
            >
              Перейти в кабинет
            </button>
          </div>
        )}

        {/* ═══ Failed ═══ */}
        {step === "failed" && (
          <div className="pt-12 sm:pt-20 flex flex-col items-center text-center max-w-md mx-auto w-full">
            <div className="dv2-rise relative w-24 h-24 mb-6">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-[#EF4444]/25 to-[#EF4444]/5 border border-[#EF4444]/30 flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
            </div>

            <h1 className="dv2-rise dv2-rise-1 text-[36px] sm:text-[44px] font-light tracking-tight leading-[1.05] text-white mb-3">
              Оплата<br /><span className="text-white/50">не прошла</span>
            </h1>
            <p className="dv2-rise dv2-rise-2 text-[14px] text-white/50 max-w-sm leading-relaxed mb-8">
              Платёж отклонён или отменён. Попробуйте ещё раз или используйте другую карту.
            </p>

            <div className="dv2-rise dv2-rise-3 w-full max-w-xs space-y-2.5">
              <button
                onClick={() => { setStep("plans"); setSelectedPlan(null); setError(""); }}
                className="w-full h-14 rounded-2xl bg-white text-black font-medium text-[15px] hover:bg-white/95 transition-all active:scale-[0.985]"
              >
                Попробовать снова
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white/85 font-medium text-[13px] hover:bg-white/[0.06] transition-all active:scale-[0.985]"
              >
                Вернуться в кабинет
              </button>
            </div>
          </div>
        )}

        {/* ═══ Expired ═══ */}
        {step === "expired" && (
          <div className="pt-12 sm:pt-20 flex flex-col items-center text-center max-w-md mx-auto w-full">
            <div className="dv2-rise relative w-24 h-24 mb-6">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-[#F59E0B]/25 to-[#F59E0B]/5 border border-[#F59E0B]/30 flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
            </div>

            <h1 className="dv2-rise dv2-rise-1 text-[36px] sm:text-[44px] font-light tracking-tight leading-[1.05] text-white mb-3">
              Время<br /><span className="text-white/50">истекло</span>
            </h1>
            <p className="dv2-rise dv2-rise-2 text-[14px] text-white/50 max-w-sm leading-relaxed mb-8">
              Платёж не был оплачен в течение 15 минут и аннулирован. Создайте новый.
            </p>

            <div className="dv2-rise dv2-rise-3 w-full max-w-xs space-y-2.5">
              <button
                onClick={() => { setStep("plans"); setSelectedPlan(null); setError(""); }}
                className="w-full h-14 rounded-2xl bg-white text-black font-medium text-[15px] hover:bg-white/95 transition-all active:scale-[0.985]"
              >
                Создать новый платёж
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white/85 font-medium text-[13px] hover:bg-white/[0.06] transition-all active:scale-[0.985]"
              >
                Вернуться в кабинет
              </button>
            </div>
          </div>
        )}
      </PageContainer>

      <Footer />
    </div>
  );
}
