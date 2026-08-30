"use client";

import { useState, useEffect } from "react";
import { CONSENT_KEY, announceConsentSettled } from "@/lib/overlay-queue";

/**
 * Согласие на cookie.
 *
 * Приведено к дизайн-системе: поверхности --px-surface/--px-surface-2,
 * мягкий радиус, кнопки .px-btn. Раньше блок жил на прежней палитре и
 * читался как деталь другого сайта поверх новой страницы.
 *
 * Правовой текст сохранён дословно — он согласован и не является
 * предметом редизайна.
 *
 * Крестики в списке «чего мы не делаем» заменены собственным глифом:
 * типографский знак ✗ рисуется по-разному в разных ОС и выпадает из
 * единого набора иконок.
 */
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
      <div
        className={`px-consent${showDetails ? " px-consent-hidden" : ""}`}
        role="region"
        aria-label="Использование cookie"
      >
        <div className="px-consent-card">
          <p className="px-body">
            Мы используем минимально необходимые файлы cookie для обеспечения работы сервиса:
            авторизации и безопасности вашей учётной записи. Мы не используем рекламные или
            аналитические cookie.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <button type="button" onClick={handleAccept} className="px-btn px-btn-sm px-btn-primary flex-1">
              Принять
            </button>
            <button
              type="button"
              onClick={() => setShowDetails(true)}
              className="px-btn px-btn-sm px-btn-secondary"
            >
              Подробнее
            </button>
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="px-sheet" onClick={() => setShowDetails(false)}>
          <div className="px-sheet-scrim" aria-hidden />
          <div
            className="px-sheet-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-policy-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-sheet-head">
              <h2 id="cookie-policy-title" className="px-h3">Политика использования cookie</h2>
              <button
                type="button"
                onClick={() => setShowDetails(false)}
                className="px-icon-btn"
                aria-label="Закрыть"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-sheet-body">
              <section>
                <h3 className="px-sheet-h">Какие данные мы обрабатываем</h3>
                <p className="px-body">
                  Atlas Secure использует исключительно функциональные cookie-файлы, необходимые
                  для корректной работы сервиса. Мы не собираем и не обрабатываем данные в рекламных
                  или маркетинговых целях.
                </p>
              </section>

              <section>
                <h3 className="px-sheet-h">Типы используемых cookie</h3>
                <div className="flex flex-col gap-3">
                  {COOKIE_TYPES.map((c) => (
                    <div key={c.name} className="px-card-2 p-4">
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <span className="text-[14px] font-medium text-[color:var(--px-text)]">{c.name}</span>
                        <span className="px-tag">{c.tag}</span>
                      </div>
                      <p className="px-caption">{c.text}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="px-sheet-h">Чего мы не делаем</h3>
                <ul className="flex flex-col gap-2">
                  {NEVER.map((t) => (
                    <li key={t} className="flex items-start gap-2.5 px-caption">
                      <NoMark />
                      {t}
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="px-sheet-h">Правовое основание</h3>
                <p className="px-caption">
                  Обработка данных осуществляется на основании законного интереса оператора в обеспечении
                  функционирования сервиса (статья 6(1)(f) GDPR). Используемые cookie являются строго
                  необходимыми для предоставления запрошенной вами услуги и не требуют отдельного
                  согласия в соответствии с рекомендациями ePrivacy Directive. Ваше согласие запрашивается
                  в информационных целях для обеспечения прозрачности обработки данных.
                </p>
              </section>

              <section>
                <h3 className="px-sheet-h">Управление cookie</h3>
                <p className="px-caption">
                  Вы можете в любой момент удалить cookie через настройки вашего браузера. Обратите
                  внимание, что удаление сессионного cookie приведёт к необходимости повторной
                  авторизации в сервисе.
                </p>
              </section>
            </div>

            <div className="px-sheet-foot">
              <button
                type="button"
                onClick={() => { handleAccept(); setShowDetails(false); }}
                className="px-btn px-btn-md px-btn-primary px-btn-block"
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

const COOKIE_TYPES = [
  {
    name: "Сессионный cookie",
    tag: "Обязательный",
    text: "Идентифицирует вашу авторизованную сессию. Без него вход в личный кабинет невозможен. Хранится 3 часа и автоматически удаляется. Передаётся только по защищённому HTTPS-соединению.",
  },
  {
    name: "Cookie верификации",
    tag: "Обязательный",
    text: "Временный cookie для процесса подтверждения email. Хранится 10 минут и удаляется сразу после завершения верификации.",
  },
  {
    name: "Согласие на cookie",
    tag: "Локальное",
    text: "Сохраняется в localStorage вашего браузера для запоминания вашего выбора. Не передаётся на сервер.",
  },
];

const NEVER = [
  "Не используем рекламные или аналитические cookie",
  "Не отслеживаем поведение пользователей на сайте",
  "Не передаём данные третьим лицам и рекламным сетям",
  "Не используем пиксели отслеживания и фингерпринтинг",
];

/** Собственный глиф отрицания — вместо типографского знака ✗. */
function NoMark() {
  return (
    <svg
      width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
      className="mt-[3px] shrink-0 opacity-45"
      aria-hidden
    >
      <path d="M6 6 18 18M18 6 6 18" />
    </svg>
  );
}
