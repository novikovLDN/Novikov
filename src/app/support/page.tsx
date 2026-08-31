"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/pixel/SiteHeader";
import SiteFooter from "@/components/pixel/SiteFooter";
import Icon from "@/components/pixel/Icon";

/**
 * /support — quick access to support channels (Telegram + VK).
 *
 * Reskinned in the v4 light shell (MTS Wide + off-white bg + white
 * rounded cards). Uses `<Back` to go to whatever the user came from
 * (usually /dashboard).
 */
export default function Support() {
  const router = useRouter();

  return (
    <div className="px-page">
      <div className="px-grid-bg" aria-hidden />
      <SiteHeader />
      <div className="px-header-spacer" aria-hidden />

      <div className="flex-1 px-shell max-w-[600px] pt-8 pb-16 sm:pt-12 sm:pb-24">
        <button type="button" onClick={() => router.back()} className="px-chip mb-10">
          <Icon name="arrow-right" size={14} className="rotate-180" />
          Назад
        </button>
        <div className="text-[13px] tracking-[0.14em] uppercase text-[color:var(--px-text-4)] mb-4">
          Поддержка
        </div>
        <h1 className="text-[36px] sm:text-[48px] lg:text-[56px] leading-[1.02] tracking-tight font-bold mb-4">
          Нужна помощь?
        </h1>
        <p className="text-[15px] sm:text-[16px] leading-[1.5] text-[color:var(--px-text-3)] mb-10 max-w-[40ch]">
          Мы всегда на связи и готовы помочь с любыми вопросами по настройке и работе сервиса.
        </p>

        {/* Telegram */}
        <a
          href="https://t.me/atlas_suppbot"
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-[color:var(--px-surface)] border border-[color:var(--px-line)] rounded-2xl p-5 sm:p-6 mb-3 hover:border-[color:var(--px-line-2)] hover:-translate-y-0.5 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[color:var(--px-accent-dim)] flex items-center justify-center shrink-0">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" className="text-[color:var(--px-accent)]">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[16px] sm:text-[17px] font-bold">Telegram</div>
              <div className="text-[13px] text-[color:var(--px-text-3)] mt-0.5">Быстрый ответ в чате поддержки</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-[color:var(--px-text)]/30 shrink-0">
              <path d="M7 17l10-10M7 7h10v10" />
            </svg>
          </div>
        </a>

        {/* VK */}
        <a
          href="https://vk.com/atlassecure"
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-[color:var(--px-surface)] border border-[color:var(--px-line)] rounded-2xl p-5 sm:p-6 mb-6 hover:border-[color:var(--px-line-2)] hover:-translate-y-0.5 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#0077FF]/12 flex items-center justify-center shrink-0">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="#0077FF">
                <path d="M12.785 16.241s.288-.032.436-.194c.136-.148.132-.427.132-.427s-.02-1.304.587-1.496c.596-.19 1.365 1.26 2.178 1.816.614.422 1.08.33 1.08.33l2.172-.03s1.136-.07.598-.964c-.044-.073-.314-.662-1.618-1.872-1.365-1.268-1.182-1.063.462-3.258.999-1.334 1.398-2.149 1.273-2.497-.12-.332-.858-.245-.858-.245l-2.446.015s-.181-.025-.316.056c-.132.079-.216.262-.216.262s-.39 1.038-.908 1.92c-1.097 1.867-1.536 1.967-1.716 1.85-.418-.273-.313-1.095-.313-1.68 0-1.826.277-2.588-.542-2.786-.272-.066-.472-.109-1.167-.116-.891-.01-1.645.003-2.071.213-.285.139-.504.45-.37.467.165.022.54.101.738.372.256.35.247 1.136.247 1.136s.147 2.149-.343 2.415c-.336.183-.798-.19-1.789-1.894-.507-.873-.89-1.838-.89-1.838s-.074-.18-.205-.278c-.16-.118-.382-.156-.382-.156l-2.323.015s-.349.01-.477.162c-.114.135-.009.414-.009.414s1.838 4.3 3.92 6.467c1.907 1.987 4.075 1.857 4.075 1.857h.983z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[16px] sm:text-[17px] font-bold">ВКонтакте</div>
              <div className="text-[13px] text-[color:var(--px-text-3)] mt-0.5">Сообщество Atlas Secure</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-[color:var(--px-text)]/30 shrink-0">
              <path d="M7 17l10-10M7 7h10v10" />
            </svg>
          </div>
        </a>

        <div className="bg-[color:var(--px-surface-2)] border border-[color:var(--px-line)] rounded-2xl p-4 sm:p-5 text-center">
          <p className="text-[13px] leading-relaxed text-[color:var(--px-text-3)]">
            Самый быстрый способ получить помощь — написать в Telegram. Отвечаем в течение часа даже ночью.
          </p>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
