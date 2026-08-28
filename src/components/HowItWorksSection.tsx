"use client";

/**
 * "Как это работает" — light section with white step cards.
 * Only Hero, FinalCta and Footer stay accent-coloured.
 */
export default function HowItWorksSection() {
  const steps = [
    {
      n: "01",
      t: "Регистрация",
      d: "Введите email — придёт код на вход. 30 секунд, без пароля.",
    },
    {
      n: "02",
      t: "Выбор тарифа",
      d: "Basic для повседневки или Plus для игр и стримов. Оплата картой РФ / зарубежной или СБП.",
    },
    {
      n: "03",
      t: "Подключение",
      d: "В личном кабинете — QR-код и одна кнопка «Открыть в Happ». Дальше работает автоматически на всех устройствах.",
    },
  ];

  return (
    <section className="bg-[#f5f5f0] text-[#111] px-5 sm:px-8 py-20 sm:py-28 lg:py-32">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-14 sm:mb-20 max-w-[720px]">
          <div className="font-mts-wide text-[13px] tracking-[0.14em] uppercase text-black/45 mb-4">
            Как это работает
          </div>
          <h2 className="font-mts-wide text-[36px] sm:text-[48px] lg:text-[64px] leading-[1.02] tracking-tight font-bold">
            От регистрации<br />до подключения — минута
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {steps.map((s, i) => (
            <div
              key={s.n}
              className="relative rounded-2xl border border-black/[0.06] bg-white hover:border-black/[0.15] hover:-translate-y-0.5 transition-all p-6 sm:p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="font-mts-wide text-[12px] tracking-[0.12em] font-medium text-black/45">
                  ШАГ {s.n}
                </div>
                {i < steps.length - 1 && (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    className="text-black/25 md:hidden"
                  >
                    <path d="M12 5v14M5 12l7 7 7-7" />
                  </svg>
                )}
              </div>
              <h3 className="font-mts-wide text-[24px] sm:text-[28px] leading-[1.15] font-bold tracking-tight mb-3">
                {s.t}
              </h3>
              <p className="font-mts-wide text-[14px] sm:text-[15px] leading-[1.55] text-black/60">
                {s.d}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
