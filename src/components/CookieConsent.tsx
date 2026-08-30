"use client";

import { useState, useEffect } from "react";
import { CONSENT_KEY, announceConsentSettled } from "@/lib/overlay-queue";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(CONSENT_KEY);
    if (!accepted) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, "1");
    setVisible(false);
    // Низ экрана освободился — промпты установки могут показаться.
    announceConsentSettled();
  };

  if (!visible) return null;

  return (
    <>
      {/* ─── Banner ─── */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 px-4 pb-[max(16px,env(safe-area-inset-bottom))] transition-transform duration-500 ease-out ${
          showDetails ? "translate-y-full" : "translate-y-0"
        }`}
        style={{ animation: "slideUp 0.5s ease-out" }}
      >
        <div className="max-w-2xl mx-auto bg-card border border-border/50 rounded-2xl p-4 sm:p-5 shadow-lg shadow-black/30">
          <p className="text-xs sm:text-sm text-muted-light leading-relaxed mb-3">
            Мы используем минимально необходимые файлы cookie для обеспечения работы сервиса: авторизации и
            безопасности вашей учётной записи. Мы не используем рекламные или аналитические cookie.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleAccept}
              className="flex-1 h-10 sm:h-11 rounded-xl bg-foreground text-background font-medium text-sm hover:bg-foreground/90 transition-all btn-press"
            >
              Принять
            </button>
            <button
              onClick={() => setShowDetails(true)}
              className="h-10 sm:h-11 px-4 sm:px-5 rounded-xl bg-card-hover border border-border text-muted-light font-medium text-sm hover:bg-card-active hover:text-foreground transition-all btn-press"
            >
              Подробнее
            </button>
          </div>
        </div>
      </div>

      {/* ─── Details Overlay ─── */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowDetails(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
          <div
            className="relative bg-card border border-border/50 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto"
            style={{ animation: "slideUp 0.4s ease-out" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-card border-b border-border/30 px-5 py-4 flex items-center justify-between z-10">
              <h2 className="font-bold text-base sm:text-lg">Политика использования cookie</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="w-8 h-8 rounded-full bg-card-hover flex items-center justify-center hover:bg-card-active transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="px-5 py-4 space-y-5 text-sm text-muted-light leading-relaxed">
              <section>
                <h3 className="text-foreground font-semibold mb-2">Какие данные мы обрабатываем</h3>
                <p>
                  Atlas Secure использует исключительно функциональные cookie-файлы, необходимые
                  для корректной работы сервиса. Мы не собираем и не обрабатываем данные в рекламных
                  или маркетинговых целях.
                </p>
              </section>

              <section>
                <h3 className="text-foreground font-semibold mb-2">Типы используемых cookie</h3>
                <div className="space-y-3">
                  <div className="bg-background rounded-xl p-3.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-foreground font-medium text-sm">Сессионный cookie</span>
                      <span className="text-[10px] bg-primary-light text-primary px-2 py-0.5 rounded-full font-medium">Обязательный</span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      Идентифицирует вашу авторизованную сессию. Без него вход в личный кабинет невозможен.
                      Хранится 3 часа и автоматически удаляется. Передаётся только по защищённому HTTPS-соединению.
                    </p>
                  </div>

                  <div className="bg-background rounded-xl p-3.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-foreground font-medium text-sm">Cookie верификации</span>
                      <span className="text-[10px] bg-primary-light text-primary px-2 py-0.5 rounded-full font-medium">Обязательный</span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      Временный cookie для процесса подтверждения email. Хранится 10 минут и удаляется
                      сразу после завершения верификации.
                    </p>
                  </div>

                  <div className="bg-background rounded-xl p-3.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-foreground font-medium text-sm">Согласие на cookie</span>
                      <span className="text-[10px] bg-warning-light text-warning px-2 py-0.5 rounded-full font-medium">Локальное</span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      Сохраняется в localStorage вашего браузера для запоминания вашего выбора.
                      Не передаётся на сервер.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-foreground font-semibold mb-2">Чего мы НЕ делаем</h3>
                <ul className="space-y-1.5 text-xs text-muted">
                  <li className="flex items-start gap-2">
                    <span className="text-danger mt-0.5 shrink-0">&#x2717;</span>
                    Не используем рекламные или аналитические cookie
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-danger mt-0.5 shrink-0">&#x2717;</span>
                    Не отслеживаем поведение пользователей на сайте
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-danger mt-0.5 shrink-0">&#x2717;</span>
                    Не передаём данные третьим лицам и рекламным сетям
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-danger mt-0.5 shrink-0">&#x2717;</span>
                    Не используем пиксели отслеживания и фингерпринтинг
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="text-foreground font-semibold mb-2">Правовое основание</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Обработка данных осуществляется на основании законного интереса оператора в обеспечении
                  функционирования сервиса (статья 6(1)(f) GDPR). Используемые cookie являются строго
                  необходимыми для предоставления запрошенной вами услуги и не требуют отдельного
                  согласия в соответствии с рекомендациями ePrivacy Directive. Ваше согласие запрашивается
                  в информационных целях для обеспечения прозрачности обработки данных.
                </p>
              </section>

              <section>
                <h3 className="text-foreground font-semibold mb-2">Управление cookie</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Вы можете в любой момент удалить cookie через настройки вашего браузера. Обратите
                  внимание, что удаление сессионного cookie приведёт к необходимости повторной
                  авторизации в сервисе.
                </p>
              </section>
            </div>

            <div className="sticky bottom-0 bg-card border-t border-border/30 px-5 py-4">
              <button
                onClick={() => { handleAccept(); setShowDetails(false); }}
                className="w-full h-11 sm:h-12 rounded-xl bg-foreground text-background font-medium text-sm sm:text-base hover:bg-foreground/90 transition-all btn-press"
              >
                Принять и закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
