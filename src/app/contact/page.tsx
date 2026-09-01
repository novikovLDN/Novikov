"use client";

import Link from "next/link";
import { useState } from "react";
import SiteHeader from "@/components/pixel/SiteHeader";
import SiteFooter from "@/components/pixel/SiteFooter";

/**
 * /contact — support & sales page in the v4 light shell.
 *
 * Top bar → hero → contact channels (Telegram + emails) →
 * response-time card → contact form → orange CTA → общий футер сайта.
 * Preserves the POST /api/contact submit and the Telegram handle
 * @atlas_suppbot exactly.
 */

const INTERESTS: Array<{ value: string; label: string }> = [
  { value: "vpn",        label: "Pro" },
  { value: "vps",        label: "VPS" },
  { value: "vds",        label: "VDS" },
  { value: "enterprise", label: "Enterprise" },
  { value: "security",   label: "Безопасность" },
  { value: "other",      label: "Другое" },
];

const CHANNELS = [
  {
    kind: "telegram",
    label: "Telegram поддержка",
    value: "@atlas_suppbot",
    href:  "https://t.me/atlas_suppbot",
    sla:   "менее 30 минут",
  },
  {
    kind: "email",
    label: "Продажи",
    value: "sales@atlas.secure",
    href:  "mailto:sales@atlas.secure",
    sla:   "менее 4 часов",
  },
  {
    kind: "shield",
    label: "Безопасность и уязвимости",
    value: "security@atlas.secure",
    href:  "mailto:security@atlas.secure",
    sla:   "менее 24 часов",
  },
  {
    kind: "lock",
    label: "Приватность и DPO",
    value: "privacy@atlas.secure",
    href:  "mailto:privacy@atlas.secure",
    sla:   "менее 48 часов",
  },
];

function ChannelIcon({ kind }: { kind: string }) {
  const stroke = "#111";
  if (kind === "telegram") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill={stroke}>
        <path d="M21.5 3.5L2.5 10.5c-.8.3-.8 1.5 0 1.8l4.7 1.8 2 6.3c.3.8 1.2 1 1.8.4l2.7-2.5 4.6 3.3c.8.6 1.9.2 2.1-.8l2.5-14.8c.3-1.1-.8-2-1.9-1.5zM10 15l-1 3-1-4 11-8-9 9z" />
      </svg>
    );
  }
  if (kind === "shield") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z" />
      </svg>
    );
  }
  if (kind === "lock") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 018 0v3" />
      </svg>
    );
  }
  // default: email
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

export default function ContactPage() {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [interest, setInterest] = useState("");
  const [message, setMessage]   = useState("");
  const [sending, setSending]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name || !email || !interest) {
      setError("Заполните все обязательные поля");
      return;
    }
    setSending(true);
    try {
      const res  = await fetch("/api/contact", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name, email, interest, message }),
      });
      const data = await res.json();
      if (data.success) setSent(true);
      else setError(data.error || "Ошибка отправки");
    } catch {
      setError("Ошибка сети");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="px-page">
      <div className="px-grid-bg" aria-hidden />
      <SiteHeader />
      <div className="px-header-spacer" aria-hidden />

      {/* Hero */}
      <section className="px-5 sm:px-8 pt-16 pb-16 sm:pt-24 sm:pb-20 max-w-[1200px] mx-auto w-full">
        <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-[color:var(--px-text-4)] mb-5">
          Контакты
        </div>
        <h1 className="font-mts-wide text-[40px] sm:text-[56px] lg:text-[80px] leading-[1.02] tracking-tight font-bold max-w-[14ch]">
          Свяжитесь<br />с нами
        </h1>
        <p className="font-mts-wide text-[16px] sm:text-[18px] leading-[1.5] text-[color:var(--px-text-3)] mt-8 max-w-[58ch]">
          Продажи, техподдержка, юридические вопросы, безопасность — выберите подходящий канал. На большинство запросов отвечаем в течение 4 рабочих часов.
        </p>
      </section>

      {/* Contact channels */}
      <section className="px-5 sm:px-8 pb-16 sm:pb-24 max-w-[1200px] mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CHANNELS.map((c) => (
            <a
              key={c.value}
              href={c.href}
              target={c.kind === "telegram" ? "_blank" : undefined}
              rel={c.kind === "telegram" ? "noopener noreferrer" : undefined}
              className="group bg-[color:var(--px-surface)] border border-[color:var(--px-line)] rounded-3xl p-6 sm:p-8 hover:border-[color:var(--px-line-2)] transition-colors flex items-start gap-5"
            >
              <div className="shrink-0 w-11 h-11 rounded-full bg-[color:var(--px-surface-2)] flex items-center justify-center">
                <ChannelIcon kind={c.kind} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-mts-wide text-[11px] tracking-[0.14em] uppercase text-[color:var(--px-text-4)] mb-2">
                  {c.label}
                </div>
                <div className="font-mts-wide text-[18px] sm:text-[20px] font-bold leading-tight tracking-tight break-all">
                  {c.value}
                </div>
                <div className="font-mts-wide text-[13px] text-[color:var(--px-text-3)] mt-3">
                  Ответ {c.sla}
                </div>
              </div>
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                className="mt-1 text-[color:var(--px-text-4)] group-hover:text-[color:var(--px-text)] transition-colors"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          ))}
        </div>
      </section>

      {/* Response-time SLA card */}
      <section className="px-5 sm:px-8 pb-16 sm:pb-24 max-w-[900px] mx-auto w-full">
        <div className="mb-8 sm:mb-10">
          <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-[color:var(--px-text-4)] mb-4">Время ответа</div>
          <h2 className="font-mts-wide text-[28px] sm:text-[36px] leading-[1.05] tracking-tight font-bold">
            Гарантированный SLA
          </h2>
        </div>
        <div className="bg-[color:var(--px-surface)] border border-[color:var(--px-line)] rounded-3xl overflow-hidden">
          {[
            ["Telegram",           "менее 30 минут"],
            ["Email продажи",      "менее 4 часов"],
            ["Безопасность",       "менее 24 часов"],
            ["DPO и приватность",  "менее 48 часов"],
          ].map(([k, v], i) => (
            <div
              key={k}
              className={`flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6 px-5 sm:px-8 py-4 sm:py-5 ${i > 0 ? "border-t border-[color:var(--px-line)]" : ""}`}
            >
              <div className="font-mts-wide text-[13px] text-[color:var(--px-text-4)] sm:w-[220px] shrink-0">{k}</div>
              <div className="font-mts-wide text-[14px] sm:text-[15px] text-[color:var(--px-text)] font-medium tabular-nums">{v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact form */}
      <section className="px-5 sm:px-8 pb-20 sm:pb-28 max-w-[900px] mx-auto w-full">
        <div className="mb-8 sm:mb-10">
          <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-[color:var(--px-text-4)] mb-4">Форма запроса</div>
          <h2 className="font-mts-wide text-[28px] sm:text-[36px] leading-[1.05] tracking-tight font-bold">
            Запросить доступ
          </h2>
          <p className="font-mts-wide text-[15px] sm:text-[16px] text-[color:var(--px-text-3)] mt-4 max-w-[52ch]">
            Заполните форму — подберём оптимальное решение под задачу.
          </p>
        </div>

        <div className="bg-[color:var(--px-surface)] border border-[color:var(--px-line)] rounded-3xl p-6 sm:p-10">
          {sent ? (
            <div className="text-center py-10 sm:py-14">
              <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-black flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h3 className="font-mts-wide text-[22px] sm:text-[26px] font-bold tracking-tight mb-3">
                Запрос отправлен
              </h3>
              <p className="font-mts-wide text-[15px] text-[color:var(--px-text-3)] mb-8 max-w-[46ch] mx-auto">
                Ответим в течение 4 рабочих часов. Проверьте, пожалуйста, входящие и папку «Спам».
              </p>
              <Link href="/" className="px-btn px-btn-md px-btn-primary">
                На главную
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="font-mts-wide block text-[12px] tracking-[0.10em] uppercase text-[color:var(--px-text-4)] mb-2">
                  Как к вам обращаться? *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Имя, например Александр"
                  className="font-mts-wide w-full bg-[color:var(--px-bg)] border border-[color:var(--px-line)] rounded-2xl px-5 py-4 text-[15px] text-[color:var(--px-text)] placeholder:text-[color:var(--px-text)]/35 focus:outline-none focus:border-black/50 transition-colors"
                />
              </div>

              {/* Email */}
              <div>
                <label className="font-mts-wide block text-[12px] tracking-[0.10em] uppercase text-[color:var(--px-text-4)] mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@company.com"
                  className="font-mts-wide w-full bg-[color:var(--px-bg)] border border-[color:var(--px-line)] rounded-2xl px-5 py-4 text-[15px] text-[color:var(--px-text)] placeholder:text-[color:var(--px-text)]/35 focus:outline-none focus:border-black/50 transition-colors"
                />
              </div>

              {/* Interest */}
              <div>
                <label className="font-mts-wide block text-[12px] tracking-[0.10em] uppercase text-[color:var(--px-text-4)] mb-3">
                  Что интересует? *
                </label>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((opt) => {
                    const active = interest === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setInterest(opt.value)}
                        className={`px-chip${active ? " px-chip-active" : ""}`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="font-mts-wide block text-[12px] tracking-[0.10em] uppercase text-[color:var(--px-text-4)] mb-2">
                  Сообщение <span className="text-[color:var(--px-text)]/35">(опционально)</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Расскажите о задачах..."
                  rows={4}
                  className="font-mts-wide w-full bg-[color:var(--px-bg)] border border-[color:var(--px-line)] rounded-2xl px-5 py-4 text-[15px] text-[color:var(--px-text)] placeholder:text-[color:var(--px-text)]/35 focus:outline-none focus:border-black/50 transition-colors resize-none"
                />
              </div>

              {error && (
                <p className="font-mts-wide text-[13px] text-[#DC2626]">{error}</p>
              )}

              <button
                type="submit"
                disabled={sending}
                className="px-btn px-btn-md px-btn-primary px-btn-block sm:!w-auto"
              >
                {sending ? "Отправка..." : "Отправить запрос"}
                {!sending && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                )}
              </button>

              <p className="font-mts-wide text-[12px] text-[color:var(--px-text-4)] leading-[1.55]">
                Отправляя запрос, вы соглашаетесь с{" "}
                <Link href="/privacy" className="text-[color:var(--px-text-2)] underline underline-offset-2 hover:text-[color:var(--px-text)]">
                  Политикой конфиденциальности
                </Link>
                .
              </p>
            </form>
          )}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[color:var(--px-accent)] text-[color:var(--px-text)] px-5 sm:px-8 py-20 sm:py-28 mx-2 sm:mx-3 mt-8 rounded-[28px] sm:rounded-[36px]">
        <div className="max-w-[900px] mx-auto text-center">
          <h2 className="font-mts-wide text-[36px] sm:text-[52px] lg:text-[64px] leading-[1.02] tracking-tight font-bold">
            Готовы начать?
          </h2>
          <p className="font-mts-wide text-[16px] sm:text-[18px] leading-[1.45] text-[color:var(--px-text-2)] mt-6 max-w-[46ch] mx-auto">
            Три дня бесплатно. Без карты, без ограничений скорости.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3 sm:gap-4">
            <Link href="/pricing" className="px-btn px-btn-md px-btn-primary">
              Тарифы
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
            <Link href="/auth" className="px-btn px-btn-md px-btn-secondary" style={{ background: "rgba(0,0,0,0.08)", color: "#000" }}>
              Войти
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
