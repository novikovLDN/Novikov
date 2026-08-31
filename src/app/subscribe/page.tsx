"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";
import LandingFooter from "@/components/LandingFooter";

/**
 * /subscribe — payment funnel in the v4 light shell.
 *
 * Business logic (state machine, prices, API endpoints, polling) is
 * preserved 1:1 from the previous dashboard-v2 implementation. Only
 * the visual language is rebuilt to match /pricing and /about —
 * MTS Wide typography on an off-white ground, white rounded cards,
 * orange accent for Plus.
 */

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

export default function SubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="bg-[#101010] min-h-dvh flex items-center justify-center">
          <LoadingSpinner size="lg" className="text-black" />
        </div>
      }
    >
      <SubscribeContent />
    </Suspense>
  );
}

function SubscribeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<PageStep>("plans");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const handleBack = () => {
    if (step === "payment-methods") {
      setStep("periods");
    } else if (step === "periods") {
      setStep("plans");
      setSelectedPlan(null);
    } else if (step === "plans") {
      router.push("/pricing");
    } else {
      router.push("/dashboard");
    }
  };

  // Step progress (1..3) for the visible indicator
  const stepNum = step === "plans" ? 1 : step === "periods" ? 2 : step === "payment-methods" ? 3 : 3;
  const showSteps = step === "plans" || step === "periods" || step === "payment-methods";

  return (
    <div className="bg-[#101010] min-h-dvh flex flex-col text-black">
      <TopBar
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        onBack={handleBack}
        backLabel={
          step === "plans"
            ? "К тарифам"
            : step === "periods" || step === "payment-methods"
            ? "Назад"
            : "В кабинет"
        }
      />

      {showSteps && (
        <div className="max-w-[900px] w-full mx-auto px-5 sm:px-8 mt-4">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-500 ease-out ${
                  i <= stepNum ? "flex-1 bg-black/85" : "w-8 bg-black/10"
                }`}
              />
            ))}
          </div>
          <div className="font-mts-wide text-[11px] tracking-[0.14em] uppercase text-black/45 mt-3">
            Шаг {stepNum} из 3 —{" "}
            {step === "plans" ? "Тариф" : step === "periods" ? "Срок" : "Оплата"}
          </div>
        </div>
      )}

      <main className="flex-1 w-full">
        {/* ═══ Plan Selection ═══ */}
        {step === "plans" && (
          <section className="max-w-[900px] mx-auto w-full px-5 sm:px-8 pt-8 sm:pt-12 pb-16">
            <div className="mb-10 sm:mb-12">
              <h1 className="font-mts-wide text-[36px] sm:text-[48px] lg:text-[56px] leading-[1.02] tracking-tight font-bold">
                Выберите<br />
                <span className="text-black/45">тариф</span>
              </h1>
              <p className="font-mts-wide text-[15px] sm:text-[17px] leading-[1.6] text-black/70 mt-6 max-w-[52ch]">
                Два тарифа, одинаковая инфраструктура. Plus добавляет приоритетную полосу и резервные каналы.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <PlanCard plan="plus" onSelect={() => handleSelectPlan("plus")} highlighted />
              <PlanCard plan="basic" onSelect={() => handleSelectPlan("basic")} />
            </div>
          </section>
        )}

        {/* ═══ Period Selection ═══ */}
        {step === "periods" && selectedPlan && (
          <section className="max-w-[900px] mx-auto w-full px-5 sm:px-8 pt-8 sm:pt-12 pb-16">
            <div className="mb-10 sm:mb-12">
              <PlanChip plan={selectedPlan} />
              <h1 className="font-mts-wide text-[36px] sm:text-[48px] lg:text-[56px] leading-[1.02] tracking-tight font-bold mt-5">
                Выберите<br />
                <span className="text-black/45">срок</span>
              </h1>
              <p className="font-mts-wide text-[15px] sm:text-[17px] leading-[1.6] text-black/70 mt-6 max-w-[52ch]">
                Чем дольше срок — тем ниже цена за месяц. Отмена в один клик из личного кабинета.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {PRICES[selectedPlan].map((opt) => (
                <PeriodCard
                  key={opt.months}
                  opt={opt}
                  featured={opt.months === 12}
                  disabled={loading}
                  onSelect={() => handleSelectPeriod(opt)}
                />
              ))}
            </div>

            {error && <ErrorNote>{error}</ErrorNote>}

            {loading && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <LoadingSpinner size="sm" className="text-black" />
                <p className="font-mts-wide text-black/60 text-[13px]">Создаём платёж…</p>
              </div>
            )}

            <p className="font-mts-wide text-black/45 text-[12px] text-center mt-8 leading-[1.6]">
              Оплата через защищённую платёжную систему · 15 минут на оплату
            </p>
          </section>
        )}

        {/* ═══ Payment Methods ═══ */}
        {step === "payment-methods" && selectedPlan && selectedPeriod && (
          <section className="max-w-[900px] mx-auto w-full px-5 sm:px-8 pt-8 sm:pt-12 pb-16">
            <div className="mb-8 sm:mb-10">
              <h1 className="font-mts-wide text-[36px] sm:text-[48px] lg:text-[56px] leading-[1.02] tracking-tight font-bold">
                Способ<br />
                <span className="text-black/45">оплаты</span>
              </h1>
            </div>

            {/* Order summary */}
            <div
              className={`rounded-3xl p-6 sm:p-8 mb-4 ${
                selectedPlan === "plus"
                  ? "bg-[#FF7350] text-black"
                  : "bg-black text-white"
              }`}
            >
              <div
                className={`font-mts-wide text-[11px] tracking-[0.14em] uppercase mb-4 ${
                  selectedPlan === "plus" ? "text-black/55" : "text-white/55"
                }`}
              >
                К оплате
              </div>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="font-mts-wide text-[15px] sm:text-[17px] font-medium">
                    {PLANS[selectedPlan].name} · {selectedPeriod.label}
                  </div>
                  <div
                    className={`font-mts-wide text-[13px] mt-1 ${
                      selectedPlan === "plus" ? "text-black/60" : "text-white/60"
                    }`}
                  >
                    {selectedPeriod.perMonth} ₽/мес
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mts-wide text-[36px] sm:text-[44px] font-bold leading-none tabular-nums tracking-tight">
                    {selectedPeriod.price}{" "}
                    <span
                      className={`text-[18px] font-medium ${
                        selectedPlan === "plus" ? "text-black/55" : "text-white/55"
                      }`}
                    >
                      ₽
                    </span>
                  </div>
                  {selectedPeriod.discount && (
                    <div
                      className={`inline-flex mt-2 font-mts-wide text-[11px] font-semibold tracking-[0.06em] px-2.5 py-1 rounded-full ${
                        selectedPlan === "plus"
                          ? "bg-black/15 text-black"
                          : "bg-white/15 text-white"
                      }`}
                    >
                      экономия {selectedPeriod.discount}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment methods */}
            <div className="space-y-3">
              <button
                onClick={handlePayYooKassa}
                disabled={loading}
                className="w-full text-left bg-[color:var(--px-surface)] border border-black/[0.06] rounded-3xl p-6 sm:p-7 flex items-center gap-5 transition-colors hover:border-black/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center shrink-0">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-mts-wide text-[16px] sm:text-[17px] font-semibold text-black">
                    Карта или СБП
                  </div>
                  <div className="font-mts-wide text-[13px] text-black/60 mt-1">
                    Visa, Mastercard, МИР, СБП
                  </div>
                </div>
                {loading ? (
                  <LoadingSpinner size="sm" className="text-black shrink-0" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black/45 shrink-0">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                )}
              </button>
            </div>

            {error && <ErrorNote>{error}</ErrorNote>}

            <div className="mt-8 flex items-center gap-2 justify-center text-black/45">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              <p className="font-mts-wide text-[12px]">
                Безопасная оплата через защищённый платёжный шлюз
              </p>
            </div>
          </section>
        )}

        {/* ═══ Processing ═══ */}
        {step === "processing" && (
          <section className="max-w-[720px] mx-auto w-full px-5 sm:px-8 pt-16 sm:pt-24 pb-16 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[color:var(--px-surface)] border border-black/[0.06] mb-8">
              <LoadingSpinner size="lg" className="text-black" />
            </div>
            <h1 className="font-mts-wide text-[36px] sm:text-[48px] leading-[1.02] tracking-tight font-bold">
              Проверяем оплату
            </h1>
            <p className="font-mts-wide text-[15px] sm:text-[17px] leading-[1.6] text-black/70 mt-6 max-w-[48ch] mx-auto">
              Пожалуйста, подождите. Проверяем статус вашего платежа…
            </p>
          </section>
        )}

        {/* ═══ Success ═══ */}
        {step === "success" && (
          <section className="max-w-[720px] mx-auto w-full px-5 sm:px-8 pt-16 sm:pt-24 pb-16 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-emerald-500 text-white mb-8">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="font-mts-wide text-[40px] sm:text-[56px] leading-[1.02] tracking-tight font-bold">
              Оплата принята
            </h1>
            <p className="font-mts-wide text-[15px] sm:text-[17px] leading-[1.6] text-black/70 mt-6 max-w-[48ch] mx-auto mb-10">
              Подписка успешно продлена. Ключ активен и готов к использованию.
            </p>
            <Link
              href="/dashboard"
              className="px-btn px-btn-md px-btn-primary"
            >
              Перейти в кабинет
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </section>
        )}

        {/* ═══ Failed ═══ */}
        {step === "failed" && (
          <section className="max-w-[720px] mx-auto w-full px-5 sm:px-8 pt-16 sm:pt-24 pb-16 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-red-500 text-white mb-8">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <h1 className="font-mts-wide text-[40px] sm:text-[56px] leading-[1.02] tracking-tight font-bold">
              Оплата<br />
              <span className="text-black/45">не прошла</span>
            </h1>
            <p className="font-mts-wide text-[15px] sm:text-[17px] leading-[1.6] text-black/70 mt-6 max-w-[48ch] mx-auto mb-10">
              Платёж отклонён или отменён. Попробуйте ещё раз или используйте другую карту.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  setStep("plans");
                  setSelectedPlan(null);
                  setError("");
                }}
                className="px-btn px-btn-md px-btn-secondary"
              >
                Попробовать снова
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
              <Link
                href="/dashboard"
                className="px-btn px-btn-md px-btn-secondary"
              >
                Вернуться в кабинет
              </Link>
            </div>
          </section>
        )}

        {/* ═══ Expired ═══ */}
        {step === "expired" && (
          <section className="max-w-[720px] mx-auto w-full px-5 sm:px-8 pt-16 sm:pt-24 pb-16 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-500 text-white mb-8">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h1 className="font-mts-wide text-[40px] sm:text-[56px] leading-[1.02] tracking-tight font-bold">
              Время<br />
              <span className="text-black/45">истекло</span>
            </h1>
            <p className="font-mts-wide text-[15px] sm:text-[17px] leading-[1.6] text-black/70 mt-6 max-w-[48ch] mx-auto mb-10">
              Платёж не был оплачен в течение 15 минут и аннулирован. Создайте новый.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  setStep("plans");
                  setSelectedPlan(null);
                  setError("");
                }}
                className="px-btn px-btn-md px-btn-secondary"
              >
                Создать новый платёж
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
              <Link
                href="/dashboard"
                className="px-btn px-btn-md px-btn-secondary"
              >
                Вернуться в кабинет
              </Link>
            </div>
          </section>
        )}
      </main>

      <LandingFooter />
    </div>
  );
}

// ─── TopBar ─────────────────────────────────────────────────────

function TopBar({
  menuOpen,
  setMenuOpen,
  onBack,
  backLabel,
}: {
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
  onBack: () => void;
  backLabel: string;
}) {
  const links = [
    { label: "Тарифы", href: "/pricing" },
    { label: "Устройства", href: "/devices" },
    { label: "Кабинет", href: "/dashboard" },
    { label: "Поддержка", href: "/contact" },
  ];
  return (
    <>
      <div className="flex items-center justify-between px-5 sm:px-8 pt-6 sm:pt-8">
        <div className="flex items-center gap-3 sm:gap-5">
          <Link href="/" className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M5 5 L1 1 M5 5 L5 1 M5 5 L1 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M19 5 L23 1 M19 5 L19 1 M19 5 L23 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 19 L1 23 M5 19 L5 23 M5 19 L1 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M19 19 L23 23 M19 19 L19 23 M19 19 L23 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-mts-wide text-[13px] tracking-[0.16em] uppercase text-black/85">
              atlas.secure
            </span>
          </Link>
          <button
            onClick={onBack}
            className="hidden sm:inline-flex items-center gap-1.5 font-mts-wide text-[13px] text-black/60 hover:text-black transition-colors pl-3 border-l border-black/15"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {backLabel}
          </button>
        </div>

        <nav className="hidden md:flex items-center gap-6 font-mts-wide text-[14px] text-black/60">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-black transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>

        <button
          className="md:hidden w-11 h-11 rounded-full bg-[color:var(--px-surface)] border border-black/10 flex items-center justify-center active:scale-[0.95] transition-transform"
          onClick={() => setMenuOpen(true)}
          aria-label="Меню"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
      </div>

      {/* Mobile back button — visible on mobile only, right under top bar */}
      <div className="sm:hidden px-5 pt-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 font-mts-wide text-[13px] text-black/60"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          {backLabel}
        </button>
      </div>

      {menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8 font-mts-wide"
          onClick={() => setMenuOpen(false)}
        >
          <button
            className="absolute top-6 right-6 w-11 h-11 rounded-full bg-white/10 border border-white/15 flex items-center justify-center active:scale-[0.95] transition-transform"
            onClick={() => setMenuOpen(false)}
            aria-label="Закрыть"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-white text-2xl"
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/auth"
            className="mt-4 px-6 py-3 rounded-full bg-white text-black text-base"
            onClick={() => setMenuOpen(false)}
          >
            Войти
          </Link>
        </div>
      )}
    </>
  );
}

// ─── Plan card ──────────────────────────────────────────────────

function PlanCard({
  plan,
  onSelect,
  highlighted,
}: {
  plan: Plan;
  onSelect: () => void;
  highlighted?: boolean;
}) {
  const cheapestPerMonth = Math.min(...PRICES[plan].map((p) => p.perMonth));
  const cardBg = highlighted
    ? "bg-[#FF7350] text-black"
    : "bg-white text-black border border-black/[0.06]";
  const bodyText = highlighted ? "text-black/75" : "text-black/70";
  const muted = highlighted ? "text-black/60" : "text-black/55";
  const divider = highlighted ? "bg-black/15" : "bg-black/[0.08]";

  return (
    <button
      onClick={onSelect}
      className={`text-left rounded-3xl p-6 sm:p-8 flex flex-col transition-transform active:scale-[0.99] ${cardBg}`}
    >
      <div className="flex items-center justify-between">
        <div className={`font-mts-wide text-[13px] tracking-[0.14em] uppercase font-semibold ${muted}`}>
          {PLANS[plan].name}
        </div>
        {highlighted && (
          <span className="font-mts-wide text-[10px] font-bold uppercase tracking-[0.14em] text-black/70 bg-black/10 px-2.5 py-1 rounded-full">
            Популярный
          </span>
        )}
      </div>

      <p className={`font-mts-wide text-[14px] sm:text-[15px] leading-[1.55] mt-3 ${bodyText}`}>
        {plan === "basic"
          ? "Стабильное соединение для повседневного использования"
          : "Всегда на связи — даже когда другие сервисы не работают"}
      </p>

      <div className="mt-6 flex items-baseline gap-2">
        <span className="font-mts-wide text-[44px] sm:text-[52px] font-bold leading-none tabular-nums tracking-tight">
          от {cheapestPerMonth}
        </span>
        <span className={`font-mts-wide text-[16px] font-medium ${muted}`}>₽/мес</span>
      </div>

      <div className={`h-px my-6 sm:my-7 ${divider}`} />

      <ul className="space-y-3 mb-8">
        {PLANS[plan].features.map((f) => (
          <li
            key={f.text}
            className={`flex items-start gap-3 font-mts-wide text-[14px] sm:text-[15px] leading-[1.4] ${
              highlighted ? "text-black/85" : "text-black/85"
            }`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`mt-0.5 shrink-0 ${highlighted ? "text-black/70" : "text-black/50"}`}
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {f.text}
          </li>
        ))}
      </ul>

      <div className="px-btn px-btn-md px-btn-primary px-btn-block mt-auto">
        Выбрать {PLANS[plan].name}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}

// ─── Period card ────────────────────────────────────────────────

function PeriodCard({
  opt,
  featured,
  disabled,
  onSelect,
}: {
  opt: PeriodOption;
  featured?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={`text-left rounded-3xl p-6 sm:p-7 flex flex-col transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${
        featured
          ? "bg-black text-white hover:bg-neutral-800"
          : "bg-white text-black border border-black/[0.06] hover:border-black/30"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div
          className={`font-mts-wide text-[13px] tracking-[0.14em] uppercase font-semibold ${
            featured ? "text-white/60" : "text-black/55"
          }`}
        >
          {opt.label}
        </div>
        {opt.discount && (
          <span
            className={`font-mts-wide text-[11px] font-semibold px-2.5 py-1 rounded-full ${
              featured ? "bg-white/15 text-white" : "bg-emerald-500/15 text-emerald-700"
            }`}
          >
            {opt.discount}
          </span>
        )}
      </div>

      <div className="mt-5 flex items-baseline gap-2">
        <span className="font-mts-wide text-[36px] sm:text-[42px] font-bold leading-none tabular-nums tracking-tight">
          {opt.price}
        </span>
        <span
          className={`font-mts-wide text-[16px] font-medium ${
            featured ? "text-white/60" : "text-black/55"
          }`}
        >
          ₽
        </span>
      </div>

      <div
        className={`font-mts-wide text-[13px] mt-2 ${
          featured ? "text-white/60" : "text-black/55"
        }`}
      >
        {opt.perMonth} ₽/мес
      </div>

      <div
        className={`mt-6 font-mts-wide inline-flex items-center gap-2 text-[14px] font-medium ${
          featured ? "text-white" : "text-black/85"
        }`}
      >
        Выбрать
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}

// ─── PlanChip (used in periods header) ──────────────────────────

function PlanChip({ plan }: { plan: Plan }) {
  const isPlus = plan === "plus";
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 font-mts-wide text-[12px] font-semibold tracking-[0.08em] uppercase ${
        isPlus ? "bg-[#FF7350] text-black" : "bg-black text-white"
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
      {PLANS[plan].name}
    </div>
  );
}

// ─── ErrorNote ──────────────────────────────────────────────────

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 bg-red-50 border border-red-200 rounded-2xl p-4">
      <p className="font-mts-wide text-red-700 text-[13px] text-center leading-[1.6]">
        {children}
      </p>
    </div>
  );
}
