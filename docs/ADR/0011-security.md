# ADR-0011. Заголовки безопасности и CSP

**Статус:** принято, 8 сентября 2026.

## Контекст
`next.config.ts` содержит `reactStrictMode`, `output: standalone` и
один rewrite. Заголовков безопасности нет: ни CSP, ни HSTS, ни
`X-Frame-Options`, ни `Referrer-Policy`. Для бренда, который продаёт
приватность, это расхождение слова и дела.

## Решение
- **CSP** с nonce для скриптов. Отдельного внимания требуют inline
  `<style>` от Next и `data:`-шрифты.
- **HSTS** с `includeSubDomains` и `preload` — после проверки, что
  все поддомены на HTTPS.
- `X-Content-Type-Options: nosniff`, `Referrer-Policy:
  strict-origin-when-cross-origin`, `X-Frame-Options: DENY`,
  `Permissions-Policy` без geolocation, camera, microphone.
- **Rate-limit** на формы и `/api/auth/*` — `src/lib/rate-limit.ts`
  уже есть, распространяется на новые маршруты заказа.
- Секреты только в переменных окружения; `.env` не коммитится.
- Раздел OWASP Top 10 проходится на фазе 7 и записывается в отчёт.

## Последствия
- CSP вводится сначала в режиме `report-only` на превью, потом
  включается. Иначе она гарантированно что-то сломает молча.
- Cloudflare часть заголовков может добавлять сам — проверить, чтобы
  не появилось двух разных значений.
