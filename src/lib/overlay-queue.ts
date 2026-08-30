/**
 * Очередь нижних оверлеев.
 *
 * На странице три независимых баннера, прибитых к низу экрана:
 * согласие на cookie, промпт установки PWA (Chrome) и подсказка
 * «на экран Домой» (iOS). Каждый показывал себя по собственному
 * таймеру, поэтому на главной они наезжали друг на друга — куки-карточка
 * и карточка установки рисовались в одной точке, одна поверх другой.
 *
 * Правило приоритета простое и не требует общего состояния:
 * согласие на cookie обязательно и идёт первым, промпты установки —
 * только после того, как посетитель его закрыл.
 */

export const CONSENT_KEY = "cookie_consent";
export const CONSENT_EVENT = "atlas:cookie-consent";

/** Согласие уже дано (в этой или прошлой сессии). */
export function hasCookieConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) !== null;
  } catch {
    // Приватный режим без доступа к хранилищу: считаем согласие данным,
    // иначе промпты установки не покажутся никогда.
    return true;
  }
}

/**
 * Вызвать `run`, когда согласие получено: сразу, если оно уже есть,
 * иначе — по событию. Возвращает функцию отписки.
 */
export function whenConsentSettled(run: () => void): () => void {
  if (hasCookieConsent()) {
    run();
    return () => {};
  }
  const handler = () => run();
  window.addEventListener(CONSENT_EVENT, handler, { once: true });
  return () => window.removeEventListener(CONSENT_EVENT, handler);
}

/** Сообщить остальным баннерам, что низ экрана освободился. */
export function announceConsentSettled(): void {
  window.dispatchEvent(new Event(CONSENT_EVENT));
}
