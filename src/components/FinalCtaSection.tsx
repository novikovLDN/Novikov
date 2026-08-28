"use client";

import Link from "next/link";

/**
 * Final CTA — orange full-bleed section, same visual language as
 * the /pricing final CTA. Sits above the footer.
 */
export default function FinalCtaSection() {
  return (
    <section className="bg-[#F97316] text-black px-5 sm:px-8 py-20 sm:py-28 lg:py-32 mx-2 sm:mx-3 mt-2 sm:mt-3 rounded-[28px] sm:rounded-[36px]">
      <div className="max-w-[900px] mx-auto text-center">
        <h2 className="font-mts-wide text-[36px] sm:text-[52px] lg:text-[72px] leading-[1.02] tracking-tight font-bold">
          Стабильный интернет —<br />за минуту
        </h2>
        <p className="font-mts-wide text-[16px] sm:text-[18px] leading-[1.45] text-black/70 mt-6 max-w-[46ch] mx-auto">
          Регистрация — 30 секунд. Оплата картой или СБП. Дальше работает автоматически на всех устройствах.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3 sm:gap-4">
          <Link
            href="/auth"
            className="font-mts-wide inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-black text-white font-semibold text-[15px] hover:bg-neutral-800 transition-colors active:scale-[0.98]"
          >
            Создать аккаунт
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            href="/pricing"
            className="font-mts-wide inline-flex items-center gap-2 px-6 py-4 rounded-2xl border border-black/30 text-black font-semibold text-[15px] hover:bg-black/5 transition-colors"
          >
            Все тарифы
          </Link>
        </div>
      </div>
    </section>
  );
}
