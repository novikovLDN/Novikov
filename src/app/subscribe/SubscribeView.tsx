"use client";

import { Suspense, useState, useEffect, useCallback, useRef, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Icon, { type IconName } from "@/components/pixel/Icon";
import Corner from "@/components/atlas/Corner";
import OrbGL from "@/components/atlas/OrbGL";
import {
  PERIODS,
  PERIOD_LABEL,
  PLANS as PLAN_PRICES,
  PLAN_CONTENT,
  PLAN_SPEED,
  discountPercent,
  formatRub,
  pricePerMonth,
  savings,
  type Period,
  type PlanId,
} from "@/lib/plans";
import "@/app/work-atlas.css";
import "./subscribe-atlas.css";

/**
 * /subscribe — оплата на корпусе «Атлас-издание», лист 22.
 *
 * Логика прежней страницы перенесена один в один: машина состояний
 * (plans → periods → payment-methods; processing / success / failed /
 * expired), возврат из кассы по `?payment=<id>` с опросом
 * /api/payments/status (10 попыток раз в 3 с), создание платежа
 * POST /api/payments/create { plan, period } и переход на redirectUrl,
 * «Назад» по шагам и уход на /pricing и /dashboard.
 *
 * Цены — из src/lib/plans.ts, того же файла, по которому считает касса
 * (прежняя таблица на странице совпадала с ним до рубля и процента).
 *
 * Новое только в подаче:
 *   · индикатор шага над доской — общая полоса мастеров (.ak-stepper,
 *     work-atlas.css), как на входе; пройденный шаг можно открыть снова;
 *   · тариф и срок — карточки-переключатели (radiogroup): стрелки
 *     меняют выбор на месте, нажатие/Enter/Пробел — выбрать и дальше;
 *   · сводка заказа всегда видна — справа липкой плитой на широком
 *     экране, на телефоне итог и кнопка в нижней панели.
 *
 * Весь моушн — subscribe-atlas.css, раздел «Движение».
 *
 * suppressHydrationWarning у [data-sheet]: содержимое приезжает внутри
 * Suspense (useSearchParams), и MotionController успевает поставить
 * data-inview / data-seen на серверную разметку до гидратации. Иначе
 * React предупреждает о лишних атрибутах — на логику это не влияет.
 */

type Plan = PlanId;

interface PeriodOption {
  months: number;
  label: string;
  price: number;
  perMonth: number;
  discount?: string;
}

function periodOption(plan: Plan, p: Period): PeriodOption {
  const off = discountPercent(plan, p);
  return {
    months: p,
    label: PERIOD_LABEL[p].full,
    price: PLAN_PRICES[plan][p],
    perMonth: pricePerMonth(plan, p),
    discount: off > 0 ? `-${off}%` : undefined,
  };
}

const PRICES: Record<Plan, PeriodOption[]> = {
  basic: PERIODS.map((p) => periodOption("basic", p)),
  plus: PERIODS.map((p) => periodOption("plus", p)),
};

/** Порядок карточек — как на прежней странице: Plus первым. */
const PLAN_ORDER: Plan[] = ["plus", "basic"];

/** Иконки к составу тарифа из plans.ts — по порядку строк. */
const FEATURE_ICONS: Record<Plan, IconName[]> = {
  basic: ["bolt", "lock", "devices", "globe"],
  plus: ["bolt", "globe", "refresh", "check"],
};

const STEPS = ["Тариф", "Срок", "Оплата"] as const;

type PageStep = "plans" | "periods" | "payment-methods" | "processing" | "success" | "failed" | "expired";

const at = (i: number) => ({ "--i": i }) as CSSProperties;
const vars = (v: Record<string, string | number>) => v as CSSProperties;

/** Знак канала: толщина и скорость потока пропорциональны скорости тарифа. */
function lane(plan: Plan): CSSProperties {
  return vars({
    "--w": `${Math.max(3, Math.round((PLAN_SPEED[plan] / PLAN_SPEED.plus) * 8))}px`,
    "--flow": `${((2.4 * PLAN_SPEED.plus) / PLAN_SPEED[plan]).toFixed(2)}s`,
  });
}

function periodFor(plan: Plan, months: number): PeriodOption {
  return PRICES[plan].find((o) => o.months === months) ?? PRICES[plan][PRICES[plan].length - 1];
}

const cheapest = (plan: Plan) => Math.min(...PRICES[plan].map((p) => p.perMonth));

export default function SubscribeView() {
  return (
    <Suspense
      fallback={
        <main id="main" className="a-main ak asb" aria-busy="true">
          <div className="a-field">
            <p className="b-sr" aria-live="polite">Загружаем оплату…</p>
            <div className="asb-skel" aria-hidden>
              <div className="ak-skel" />
              <div className="ak-skel" />
            </div>
          </div>
        </main>
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
  // Только подача: какой тариф и срок отмечены до нажатия. На запросы
  // не влияет — в кассу уходят selectedPlan и selectedPeriod.
  const [draftPlan, setDraftPlan] = useState<Plan>("plus");
  const [draftMonths, setDraftMonths] = useState<number>(12);

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

  const restart = () => {
    setStep("plans");
    setSelectedPlan(null);
    setError("");
  };

  // ── Подача ─────────────────────────────────────────────────────────
  const commitPlan = (plan: Plan) => {
    setDraftPlan(plan);
    handleSelectPlan(plan);
  };
  const commitPeriod = (opt: PeriodOption) => {
    setDraftMonths(opt.months);
    handleSelectPeriod(opt);
  };

  // Пройденный шаг в индикаторе — те же переходы, что у «Назад».
  const goToStep = (n: number) => {
    if (n === 1) {
      setStep("plans");
      setSelectedPlan(null);
      setError("");
    } else if (n === 2) {
      setStep("periods");
    }
  };

  const inFunnel = step === "plans" || step === "periods" || step === "payment-methods";
  const stepNum = step === "plans" ? 1 : step === "periods" ? 2 : 3;

  // Сводка: тариф и срок — выбранные, а до выбора — отмеченные.
  const plan: Plan = selectedPlan ?? draftPlan;
  const months = step === "payment-methods" && selectedPeriod ? selectedPeriod.months : draftMonths;
  const order = periodFor(plan, months);
  const save = savings(plan, order.months as Period);

  const backLabel = step === "plans" ? "К тарифам" : inFunnel ? "Назад" : "В кабинет";
  const title =
    step === "plans" ? "Выберите тариф" : step === "periods" ? "Выберите срок" : step === "payment-methods" ? "Проверьте и оплатите" : "Оплата подписки";

  // Главное действие сводки и нижней панели.
  const primary =
    step === "plans"
      ? { label: "Дальше — срок", run: () => commitPlan(draftPlan), busy: false }
      : step === "periods"
        ? { label: "Дальше — оплата", run: () => commitPeriod(order), busy: loading }
        : { label: loading ? "Создаём платёж…" : `Оплатить ${formatRub(order.price)} ₽`, run: handlePayYooKassa, busy: loading };

  // Смена шага: заголовок получает фокус (чтец экрана слышит новый шаг),
  // а если верх страницы ушёл из кадра — страница возвращается к нему.
  const headRef = useRef<HTMLHeadingElement>(null);
  const firstStep = useRef(true);
  useEffect(() => {
    if (firstStep.current) {
      firstStep.current = false;
      return;
    }
    const h = headRef.current;
    if (!h) return;
    if (h.getBoundingClientRect().top < 0) {
      const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
      h.scrollIntoView({ block: "start", behavior: still ? "auto" : "smooth" });
    }
    h.focus({ preventScroll: true });
  }, [step]);

  return (
    <main id="main" className={`a-main ak asb${inFunnel ? " asb-has-dock" : ""}`} data-mode={inFunnel ? "funnel" : "result"}>
      <div className="a-field">
        {/* ── Верх: назад и шаг ─────────────────────────────────────── */}
        <section className="ak-top asb-top" data-sheet="22" suppressHydrationWarning style={at(0)} aria-label="Оплата подписки">
          <div className="asb-top-copy">
            <button type="button" className="asb-back" onClick={handleBack}>
              <Icon name="arrow-right" size={16} className="asb-back-ico" />
              {backLabel}
            </button>
            <h1 ref={headRef} tabIndex={-1} className="ak-h1 asb-h1">{title}</h1>
          </div>
          {inFunnel && (
            <p className="asb-safe">
              <Icon name="lock" size={16} className="asb-safe-ico" />
              Безопасная оплата через защищённый платёжный шлюз
            </p>
          )}
        </section>

        <div className="ak-board asb-board">
          {/* ── Индикатор шага ─────────────────────────────────────── */}
          {inFunnel && (
            <nav className="ak-bar asb-bar" data-sheet="22" suppressHydrationWarning aria-label="Шаги оплаты">
              <span className="ak-avatar ak-mark" aria-hidden>
                <Icon name="shield" size={18} />
              </span>
              <ol className="ak-stepper">
                {STEPS.map((label, k) => {
                  const n = k + 1;
                  const state = n < stepNum ? "done" : n === stepNum ? "now" : "next";
                  return (
                    <li key={label}>
                      {state === "done" ? (
                        <button
                          type="button"
                          className="ak-step"
                          data-state={state}
                          onClick={() => goToStep(n)}
                          aria-label={`Шаг ${n}: ${label}, пройден — изменить`}
                        >
                          <span className="ak-step-n" aria-hidden><Icon name="check" size={14} /></span>
                          <span className="ak-step-label">{label}</span>
                        </button>
                      ) : (
                        <span className="ak-step" data-state={state} aria-current={state === "now" ? "step" : undefined}>
                          <span className="ak-step-n">{n}</span>
                          <span className="ak-step-label">{label}</span>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
              <span className="ak-bar-plan">
                <span key={stepNum} className="a-num ak-kicker-step">Шаг {stepNum} из {STEPS.length}</span>
              </span>
            </nav>
          )}

          {inFunnel ? (
            <div className="asb-grid">
              <div className="asb-flow">
                {/* ── Шаг 1 · Тариф ───────────────────────────────────── */}
                {step === "plans" && (
                  <section key="plans" className="ak-card asb-panel" data-sheet="22" suppressHydrationWarning style={at(1)} aria-labelledby="asb-plans-h">
                    <div className="ak-card-head">
                      <h2 id="asb-plans-h" className="ak-eyebrow">Шаг 1 · Тариф</h2>
                    </div>
                    <p className="ak-text asb-lead">
                      Два тарифа на одной инфраструктуре. Plus быстрее и держит резервные каналы.
                    </p>
                    <div className="asb-cq">
                      <Choices
                        label="Тариф"
                        className="asb-choices asb-plans"
                        items={PLAN_ORDER}
                        value={draftPlan}
                        onPreview={setDraftPlan}
                        onCommit={commitPlan}
                        describe={(id) => `asb-plan-${id}-d`}
                        name={(id) => `asb-plan-${id}-n`}
                        render={(id) => <PlanFace plan={id} />}
                      />
                    </div>
                    <p className="ak-fine">Стрелками — сравнить, нажатием — выбрать и перейти к сроку.</p>
                  </section>
                )}

                {/* ── Шаг 2 · Срок ────────────────────────────────────── */}
                {step === "periods" && selectedPlan && (
                  <section key="periods" className="ak-card asb-panel" data-sheet="22" suppressHydrationWarning style={at(1)} aria-labelledby="asb-periods-h">
                    <div className="ak-card-head">
                      <h2 id="asb-periods-h" className="ak-eyebrow">Шаг 2 · Срок</h2>
                      <span className="ak-status"><i />Тариф {PLAN_CONTENT[selectedPlan].name}</span>
                    </div>
                    <p className="ak-text asb-lead">
                      Чем дольше срок — тем ниже цена за месяц. Отмена в один клик из личного кабинета.
                    </p>
                    <div className="asb-cq">
                      <Choices
                        label="Срок подписки"
                        className="asb-choices asb-periods"
                        items={PRICES[selectedPlan].map((o) => o.months)}
                        value={draftMonths}
                        disabled={loading}
                        onPreview={setDraftMonths}
                        onCommit={(m) => commitPeriod(periodFor(selectedPlan, m))}
                        describe={(m) => `asb-per-${m}-d`}
                        name={(m) => `asb-per-${m}-n`}
                        render={(m) => <PeriodFace opt={periodFor(selectedPlan, m)} best={periodFor(selectedPlan, m).perMonth === cheapest(selectedPlan)} />}
                      />
                    </div>

                    {error && <ErrorNote>{error}</ErrorNote>}
                    {loading && <p className="ak-fine" aria-live="polite">Создаём платёж…</p>}

                    <p className="ak-fine">Оплата через защищённую платёжную систему · 15 минут на оплату</p>
                  </section>
                )}

                {/* ── Шаг 3 · Оплата ──────────────────────────────────── */}
                {step === "payment-methods" && selectedPlan && selectedPeriod && (
                  <section key="pay" className="ak-card asb-panel" data-sheet="22" suppressHydrationWarning style={at(1)} aria-labelledby="asb-pay-h">
                    <div className="ak-card-head">
                      <h2 id="asb-pay-h" className="ak-eyebrow">Шаг 3 · Способ оплаты</h2>
                    </div>

                    <div role="radiogroup" aria-label="Способ оплаты" className="asb-methods">
                      <div role="radio" aria-checked="true" tabIndex={0} className="asb-method" style={at(0)}>
                        <span className="asb-method-ico" aria-hidden><Icon name="shield" size={20} /></span>
                        <span className="asb-method-copy">
                          <span className="asb-method-title">Карта или СБП</span>
                          <span className="asb-method-text">Visa, Mastercard, МИР, СБП</span>
                        </span>
                        <span className="asb-radio" aria-hidden />
                      </div>
                    </div>

                    <ol className="asb-next">
                      <li style={at(1)}>
                        <span className="asb-next-n" aria-hidden>1</span>
                        Откроется страница платёжной системы — на оплату 15 минут.
                      </li>
                      <li style={at(2)}>
                        <span className="asb-next-n" aria-hidden>2</span>
                        После оплаты вы вернётесь сюда, и мы проверим платёж.
                      </li>
                      <li style={at(3)}>
                        <span className="asb-next-n" aria-hidden>3</span>
                        Как только платёж пройдёт, подписка продлится — срок будет виден в кабинете.
                      </li>
                    </ol>

                    {error && <ErrorNote>{error}</ErrorNote>}
                  </section>
                )}
              </div>

              {/* ── Сводка заказа ─────────────────────────────────────── */}
              <aside className="ak-card ak-dark asb-sum" data-sheet="22" suppressHydrationWarning style={at(2)} aria-labelledby="asb-sum-h">
                <Corner href="/pricing" label="Сравнить тарифы" />
                <div className="ak-card-head">
                  <h2 id="asb-sum-h" className="ak-eyebrow">Ваш заказ</h2>
                  <span className="ak-status"><i />Шаг {stepNum} из {STEPS.length}</span>
                </div>

                <dl className="asb-sum-list">
                  <div className="asb-sum-row">
                    <dt>Тариф</dt>
                    <dd>
                      {PLAN_CONTENT[plan].name} · <span className="a-num">{PLAN_SPEED[plan]}</span> Гбит/с
                    </dd>
                  </div>
                  <div className="asb-sum-row">
                    <dt>Срок</dt>
                    <dd>{order.label}</dd>
                  </div>
                  <div className="asb-sum-row">
                    <dt>В месяц</dt>
                    <dd><span key={`${plan}${order.months}`} className="a-num asb-tick">{formatRub(order.perMonth)}</span> ₽</dd>
                  </div>
                  {save > 0 && (
                    <div className="asb-sum-row">
                      <dt>Экономия</dt>
                      <dd><span className="a-num">{formatRub(save)}</span> ₽</dd>
                    </div>
                  )}
                </dl>

                {/* Ядро — рядом с итогом: справа от суммы строки свободны,
                    значения списка выше выровнены вправо и под ним не лежат. */}
                <div className="asb-total-row">
                  <OrbGL className="ak-orb" theme="dark" state="active" />
                  <p className="ak-value ak-value-live asb-total">
                    <span key={order.price} className="a-num asb-tick">{formatRub(order.price)}</span>
                    <small>₽ к оплате</small>
                  </p>
                </div>
                <p className="ak-fine">
                  {step === "plans" ? "Срок можно поменять на следующем шаге. " : null}
                  Оплата сразу за весь срок, цена за месяц — для сравнения.
                </p>

                <div className="ak-actions asb-sum-cta">
                  <button type="button" className="a-btn a-btn-primary asb-go" onClick={primary.run} disabled={primary.busy}>
                    {primary.label}
                    {!primary.busy && <Icon name="arrow-right" size={16} />}
                  </button>
                </div>
              </aside>
            </div>
          ) : (
            <Result step={step} onRestart={restart} />
          )}
        </div>
      </div>

      {/* ── Нижняя панель телефона: итог и главное действие ─────────── */}
      {inFunnel && (
        <div className="asb-dock" role="region" aria-label="Итог и оплата">
          <p className="asb-dock-sum">
            <span className="asb-dock-cap">
              {PLAN_CONTENT[plan].name} · {PERIOD_LABEL[order.months as Period].short}
            </span>
            <b key={order.price} className="a-num asb-dock-total asb-tick">{formatRub(order.price)} ₽</b>
          </p>
          <button type="button" className="a-btn a-btn-primary asb-go" onClick={primary.run} disabled={primary.busy}>
            {primary.label}
            {!primary.busy && <Icon name="arrow-right" size={16} />}
          </button>
        </div>
      )}
    </main>
  );
}

// ─── Карточки-переключатели ──────────────────────────────────────────
// Роль radiogroup с перемещаемым фокусом: стрелки и Home/End меняют
// отмеченную карточку на месте, нажатие, Enter или Пробел — выбирают и
// ведут на следующий шаг (как прежние кнопки-карточки).

function Choices<T extends string | number>({
  label,
  className,
  items,
  value,
  disabled,
  onPreview,
  onCommit,
  render,
  name,
  describe,
}: {
  label: string;
  className: string;
  items: T[];
  value: T;
  disabled?: boolean;
  onPreview: (v: T) => void;
  onCommit: (v: T) => void;
  render: (v: T) => ReactNode;
  name: (v: T) => string;
  describe: (v: T) => string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = items.indexOf(value);

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const last = items.length - 1;
    let n = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") n = i === last ? 0 : i + 1;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = i === 0 ? last : i - 1;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = last;
    if (n < 0) return;
    e.preventDefault();
    onPreview(items[n]);
    refs.current[n]?.focus();
  };

  return (
    <div role="radiogroup" aria-label={label} className={className}>
      {items.map((it, i) => {
        const on = it === value;
        return (
          <button
            key={String(it)}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            aria-labelledby={name(it)}
            aria-describedby={describe(it)}
            tabIndex={on || (current < 0 && i === 0) ? 0 : -1}
            disabled={disabled}
            className="asb-choice"
            style={at(i)}
            onClick={() => onCommit(it)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {render(it)}
          </button>
        );
      })}
    </div>
  );
}

function PlanFace({ plan }: { plan: Plan }) {
  const c = PLAN_CONTENT[plan];
  return (
    <>
      <span className="asb-choice-top">
        <span className="asb-radio" aria-hidden />
        <span id={`asb-plan-${plan}-n`} className="asb-plan-name">{c.name}</span>
        <span className="asb-speed"><span className="a-num">{PLAN_SPEED[plan]}</span> Гбит/с</span>
      </span>
      <span className="asb-lane" style={lane(plan)} aria-hidden>
        <span className="asb-lane-flow" />
      </span>
      <span id={`asb-plan-${plan}-d`} className="asb-choice-body">
        <span className="asb-plan-tag">{c.tagline}.</span>
        <span className="asb-price">
          <span className="a-num">от {formatRub(cheapest(plan))}</span>
          <small>₽/мес</small>
        </span>
        <span className="asb-feats">
          {c.features.map((f, i) => (
            <span key={f} className="asb-feat">
              <Icon name={FEATURE_ICONS[plan][i] ?? "check"} size={16} />
              {f}
            </span>
          ))}
        </span>
      </span>
      <span className="asb-choice-cta" aria-hidden>
        Выбрать {c.name}
        <Icon name="arrow-right" size={14} />
      </span>
    </>
  );
}

function PeriodFace({ opt, best }: { opt: PeriodOption; best: boolean }) {
  const p = opt.months as Period;
  return (
    <>
      <span className="asb-choice-top">
        <span className="asb-radio" aria-hidden />
        <span id={`asb-per-${opt.months}-n`} className="asb-period-name">{opt.label}</span>
        {opt.discount && <span className="asb-off a-num">{opt.discount.replace("-", "−")}</span>}
      </span>
      <span id={`asb-per-${opt.months}-d`} className="asb-choice-body">
        <span className="asb-price">
          <span className="a-num">{formatRub(opt.perMonth)}</span>
          <small>₽/мес</small>
        </span>
        <span className="asb-period-total">
          <span className="a-num">{formatRub(opt.price)}</span> ₽ за {PERIOD_LABEL[p].accusative}
        </span>
        {best && (
          <span className="asb-best">
            <i aria-hidden />
            Дешевле всего в месяц
          </span>
        )}
      </span>
      <span className="asb-choice-cta" aria-hidden>
        Выбрать
        <Icon name="arrow-right" size={14} />
      </span>
    </>
  );
}

// ─── Состояния после кассы ───────────────────────────────────────────

function Result({ step, onRestart }: { step: PageStep; onRestart: () => void }) {
  if (step === "processing") {
    return (
      <section key="processing" className="ak-card asb-result" data-sheet="22" suppressHydrationWarning style={at(1)} aria-labelledby="asb-res-h" aria-busy="true">
        <span className="asb-mark" aria-hidden>
          <span className="asb-spin" />
        </span>
        <span className="ak-status"><i />Ждём ответ платёжной системы</span>
        <h2 id="asb-res-h" className="asb-res-h">Проверяем оплату</h2>
        <p className="ak-text" role="status">Пожалуйста, подождите. Проверяем статус вашего платежа…</p>
        <span className="asb-dots" aria-hidden><i /><i /><i /></span>
        <p className="ak-fine">
          Если статус долго не меняется, откройте кабинет и нажмите «Проверить подписку» — оплата подхватится.
        </p>
        <div className="ak-actions">
          <Link href="/dashboard" className="a-btn ak-btn-soft">В кабинет</Link>
        </div>
      </section>
    );
  }

  if (step === "success") {
    return (
      <section key="success" className="ak-card ak-dark asb-result" data-sheet="22" suppressHydrationWarning style={at(1)} aria-labelledby="asb-res-h">
        <span className="asb-mark asb-mark-ok" aria-hidden><Icon name="check" size={32} /></span>
        <span className="ak-status"><i />Оплачено</span>
        <h2 id="asb-res-h" className="asb-res-h" role="status">Оплата принята</h2>
        <p className="ak-text">Подписка успешно продлена. Ключ активен и готов к использованию.</p>
        <div className="ak-actions">
          <Link href="/dashboard" className="a-btn a-btn-primary asb-go">
            Перейти в кабинет
            <Icon name="arrow-right" size={16} />
          </Link>
        </div>
      </section>
    );
  }

  const failed = step === "failed";
  return (
    <section key={step} className="ak-card asb-result" data-sheet="22" suppressHydrationWarning style={at(1)} aria-labelledby="asb-res-h">
      <span className="asb-mark asb-mark-bad" data-tone={failed ? "off" : "warn"} aria-hidden>
        <Icon name={failed ? "close" : "clock"} size={30} />
      </span>
      <span className="ak-status" data-tone={failed ? "off" : "warn"}><i />{failed ? "Платёж отклонён" : "Платёж аннулирован"}</span>
      <h2 id="asb-res-h" className="asb-res-h" role="alert">{failed ? "Оплата не прошла" : "Время истекло"}</h2>
      <p className="ak-text">
        {failed
          ? "Платёж отклонён или отменён. Попробуйте ещё раз или используйте другую карту."
          : "Платёж не был оплачен в течение 15 минут и аннулирован. Создайте новый."}
      </p>
      <div className="ak-actions">
        <button type="button" onClick={onRestart} className="a-btn a-btn-primary asb-go">
          {failed ? "Попробовать снова" : "Создать новый платёж"}
          <Icon name="arrow-right" size={16} />
        </button>
        <Link href="/dashboard" className="a-btn ak-btn-soft">Вернуться в кабинет</Link>
      </div>
    </section>
  );
}

function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p className="asb-error" role="alert">
      <Icon name="close" size={16} className="asb-error-ico" />
      <span>{children}</span>
    </p>
  );
}
