"use client";

import { useRouter } from "next/navigation";

export default function Support() {
  const router = useRouter();

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="max-w-lg mx-auto flex items-center h-14 sm:h-16 px-4 sm:px-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-card-hover transition-all btn-press -ml-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h2 className="font-semibold text-sm sm:text-base ml-2">Поддержка</h2>
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-6 pb-8 max-w-lg mx-auto w-full">
        {/* Hero */}
        <div className="text-center mt-8 sm:mt-12 mb-8 sm:mb-10">
          <div className="w-18 h-18 sm:w-20 sm:h-20 mx-auto mb-5 rounded-2xl bg-primary/10 flex items-center justify-center animate-scale-in">
            <svg className="w-9 h-9 sm:w-10 sm:h-10" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-3 animate-fade-in-up">Нужна помощь?</h1>
          <p className="text-muted text-sm sm:text-base leading-relaxed max-w-xs mx-auto animate-fade-in-up animate-delay-1">
            Мы всегда на связи и готовы помочь с любыми вопросами по настройке и работе сервиса
          </p>
        </div>

        {/* Telegram Support */}
        <a
          href="https://t.me/atlas_suppbot"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-card border border-border/50 rounded-2xl p-5 sm:p-6 flex items-center gap-4 transition-all hover:border-telegram/40 hover:bg-card-hover active:scale-[0.98] btn-press mb-3 animate-fade-in-up animate-delay-1"
        >
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl bg-telegram/15 flex items-center justify-center shrink-0">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="#2AABEE">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm sm:text-base">Telegram</p>
            <p className="text-muted text-xs sm:text-sm mt-0.5">Быстрый ответ в чате поддержки</p>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted shrink-0">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>

        {/* VK Support */}
        <a
          href="https://vk.com/atlassecure"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-card border border-border/50 rounded-2xl p-5 sm:p-6 flex items-center gap-4 transition-all hover:border-[#0077FF]/40 hover:bg-card-hover active:scale-[0.98] btn-press mb-6 animate-fade-in-up animate-delay-2"
        >
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl bg-[#0077FF]/15 flex items-center justify-center shrink-0">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="#0077FF">
              <path d="M12.785 16.241s.288-.032.436-.194c.136-.148.132-.427.132-.427s-.02-1.304.587-1.496c.596-.19 1.365 1.26 2.178 1.816.614.422 1.08.33 1.08.33l2.172-.03s1.136-.07.598-.964c-.044-.073-.314-.662-1.618-1.872-1.365-1.268-1.182-1.063.462-3.258.999-1.334 1.398-2.149 1.273-2.497-.12-.332-.858-.245-.858-.245l-2.446.015s-.181-.025-.316.056c-.132.079-.216.262-.216.262s-.39 1.038-.908 1.92c-1.097 1.867-1.536 1.967-1.716 1.85-.418-.273-.313-1.095-.313-1.68 0-1.826.277-2.588-.542-2.786-.272-.066-.472-.109-1.167-.116-.891-.01-1.645.003-2.071.213-.285.139-.504.45-.37.467.165.022.54.101.738.372.256.35.247 1.136.247 1.136s.147 2.149-.343 2.415c-.336.183-.798-.19-1.789-1.894-.507-.873-.89-1.838-.89-1.838s-.074-.18-.205-.278c-.16-.118-.382-.156-.382-.156l-2.323.015s-.349.01-.477.162c-.114.135-.009.414-.009.414s1.838 4.3 3.92 6.467c1.907 1.987 4.075 1.857 4.075 1.857h.983z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm sm:text-base">ВКонтакте</p>
            <p className="text-muted text-xs sm:text-sm mt-0.5">Сообщество Atlas Secure</p>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted shrink-0">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>

        {/* Info text */}
        <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-5 animate-fade-in-up animate-delay-3">
          <p className="text-xs sm:text-sm text-muted leading-relaxed text-center">
            Самый быстрый способ получить помощь — написать нам в Telegram. Если у вас нет возможности использовать Telegram, напишите нам ВКонтакте — мы обязательно ответим.
          </p>
        </div>
      </div>
    </div>
  );
}
