# Atlas Secure — VPN Service Website

## Project Overview
Atlas Secure is a VPN selling website built with Next.js. Features: email-based auth with OTP codes, automatic VPN key generation via Xray UUID, 3-day free trial, multi-device support, referral program (+20 days), and Telegram integration (+7 days bonus).

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 with custom design tokens
- **Email**: Nodemailer (SMTP)
- **VPN Backend**: Xray (VLESS/VMess/Trojan) with UUID-based user management

## Project Structure
```
src/
├── app/
│   ├── layout.tsx              # Root layout, metadata, viewport, fonts
│   ├── page.tsx                # Auth page: email input → code verification
│   ├── globals.css             # Design system: tokens, animations, utilities
│   ├── dashboard/page.tsx      # User dashboard: subscription, VPN key, referrals, Telegram
│   ├── devices/page.tsx        # Device selection + per-platform setup instructions
│   └── api/
│       ├── auth/
│       │   ├── send-code/      # POST: generate & send 6-digit OTP code
│       │   └── verify-code/    # POST: verify code, create user + Xray UUID, set session
│       ├── user/
│       │   ├── subscription/   # GET: subscription status, VPN key, referral data
│       │   ├── devices/        # GET: supported device platforms
│       │   └── referral/       # GET: referral statistics
│       └── vpn/
│           └── generate-key/   # POST: regenerate VPN key (new Xray UUID)
├── components/
│   ├── Header.tsx              # Sticky glass header with responsive nav
│   ├── Footer.tsx              # Footer with legal links
│   ├── FeatureCard.tsx         # Feature highlight card with icon
│   ├── LoadingSpinner.tsx      # Animated loading spinner
│   └── PageContainer.tsx       # Responsive page wrapper (max-w-2xl)
├── lib/
│   ├── store.ts                # In-memory data store (dev only — use DB in production)
│   ├── email.ts                # SMTP email service
│   └── xray.ts                 # Xray VPN integration: UUID gen, URI builders, API client stub
└── types/
    └── index.ts                # Shared TypeScript interfaces
```

## Commands
```bash
npm run dev       # Dev server at http://localhost:3000
npm run build     # Production build
npm run start     # Production server
npm run lint      # ESLint
```

## Environment Variables
See `.env.example`. Key groups:
- **SMTP_*** — email delivery (codes logged to console without config)
- **XRAY_*** — Xray server: domain, port, protocol, Reality keys
- **XRAY_PANEL_*** — optional panel API (3x-ui, Marzban)

## Architecture

### Auth Flow
1. `POST /api/auth/send-code` → 6-digit OTP to email (10min TTL, 5 attempts max)
2. `POST /api/auth/verify-code` → verify code → create user with Xray UUID + VLESS key → session cookie
3. Redirect to `/dashboard`

### Xray Integration (`src/lib/xray.ts`)
- **UUID Generation**: Each user gets a unique Xray UUID on registration
- **Connection URIs**: Builds VLESS/VMess/Trojan URIs with Reality/TLS params
- **API Client Stub**: Interface ready for gRPC or panel API implementation
- **Config Builder**: Generate Xray config.json client entries

**TODO for production**: Implement `XrayApiClient` methods to actually add/remove users from the Xray server via gRPC or panel API.

### Data Store
In-memory Maps for development. **Replace with a database for production.**

### Design System — PIXEL

Единственный источник значений — блок `PIXEL` в `src/app/globals.css`.
Направление и обоснование каждого решения: `research/concept.md`.

- Светлый технологичный корпус. Фон `#F6F5F2`, поверхности —
  `--px-surface` `#FFFFFF` (карточки), `--px-surface-2` `#EFEEEA`
  (вторичные, secondary-кнопки). Обоснование пивота с тёмного на
  светлый: `research/07.md` (VK Cloud / Yandex Cloud / Selectel).
- **Тёмных поверхностей в системе нет.** Класс `.px-focal` удалён
  вместе с токенами `--px-focal*`: первый экран, финальный блок и
  полноэкранное меню светлые, как и всё тело сайта. Глубину первого
  экрана держат вертикальный градиент (`#FFFFFF` → `--px-bg`),
  пиксельная сетка тёмной линией малой альфы (`--px-grid-line`,
  два `linear-gradient` на `.px-hero::before` с радиальной маской,
  шаг = `--px-cell`) и медленно дышащее акцентное пятно на `::after`.
  Заводить новую тёмную плиту на публичной странице нельзя: разрыв
  материала между первым экраном и секциями ниже — та самая правка,
  ради которой тёмный герой убрали.
- Цвет текста у компонента объявляется явно, а не наследуется от
  предка: на смене корпуса это уже давало невидимый текст (белые
  ссылки меню, белый заголовок героя, весь блок реферальной
  программы в кабинете).
- **Тем в проекте нет — корпус один.** Переключатель темы,
  `ThemeProvider`, модал выбора темы и класс `dark`/`light` на `<html>`
  удалены: тёмных значений в системе не осталось, и переключатель
  ничего не менял. Служебная палитра старого слоя (`@theme` в начале
  `globals.css`: `bg-card`, `text-muted`, `border-border`,
  `bg-primary`…) тоже светлая и совпадает с токенами PIXEL — это она
  красит уведомления, баннер установки, предложение passkey и
  админку. Заводить второй набор значений «для тёмной темы» нельзя:
  ровно это и приводило к невидимому тексту.
- **Ровно один яркий акцент** `--px-accent` `#FF6B45` (коралловый
  оранжевый) в кадре. `--px-good` `#0EA394` — только состояние системы
  (подключено, активно, успех), не декор. Других акцентных цветов нет.
- **Акцент замкнут в токены** `--px-accent*`. Писать цвет акцента
  хексом в компоненте запрещено: смена бренд-цвета должна оставаться
  правкой одного блока.
- Плоские заливки запрещены: каждая поверхность получает
  альфа-градиент и подъём. Элевация на светлом корпусе — обычный
  `box-shadow` (`--px-edge` / `--px-edge-strong`); приём «подъём
  светом» из research/04.md относился к тёмному фону и вместе с ним
  выведен из системы. Один и тот же токен-слот не переиспользуется
  между двумя смыслами без ревизии всех потребителей.
- Текст: `--px-text` `#14140F`, `--px-text-2` `#4B4A44`,
  `--px-text-3/4` — подписи и мета. Инверсий больше нет: одна шкала
  чернил на весь сайт.
- Радиусы: кнопки `--px-r-btn` 10px, карточки `--px-r-card` 14px,
  навигационные чипы — пилюля, кубики — 22% стороны.
- Шрифт проекта не меняется: MTS Wide (Medium 500 / Bold 700).
  Третьего веса в лицензии нет.
- Логотип не меняется: формы в `src/components/pixel/BrandMark.tsx`
  взяты один в один из `src/app/icon.tsx`.

**Фирменный мотив — кубики.** `src/components/pixel/CubeCluster.tsx`:
фигура задаётся строковой картой, кубики перескакивают по ячейкам
сетки. Компонент пишет только CSS-переменные, всё рисование — в CSS.
Мини-версия `MiniCubes` используется как буллет надзаголовков.

**Motion.** Всё в `src/components/pixel/motion.tsx`, ноль
JS-библиотек анимации: `useReveal` (появление секций, играет один
раз), `useInView` (факт попадания в кадр — для шкал и холстов),
`useParallax` (медленный ход элемента относительно страницы),
`ScrollProgress` (полоса прочтения под шапкой). Правило слоя: пишутся
только `transform` и `opacity`, слушатели пассивные, значение считает
rAF, а не рендер React. Ноль layout shift.
`prefers-reduced-motion` упрощает слой, а не ломает его.

Состояния, которые прячут контент до срабатывания скрипта
(`.px-reveal`, `.px-gauge-fill`), объявляются под `.px-js` — классом,
который ставит сам `useReveal`. Без скрипта страница отрисована
целиком: прятать разрешено только после того, как механизм показа
доказал работоспособность.

**Надпись из точек** — `ParticleHeading`: строка сэмплируется в
offscreen-canvas, каждая закрашенная ячейка становится точкой,
курсор работает ластиком (точки разлетаются и гаснут, потом
пружинят обратно). Семейство шрифта в `ctx.font` подставляется
вычисленным значением: `var(--font-*)` парсер шрифта не понимает и
молча откатывается на 10px sans-serif.

**Общие компоненты** живут в `src/components/pixel/`: `SiteHeader`,
`SiteFooter`, `SiteOutro`, `PageHero`, `SectionHeading`, `PlanCard`,
`PeriodSelector`, `Faq`, `Icon`, `motion`. Собственную шапку или
футер на странице заводить нельзя — это второй источник правды о
структуре сайта. Флоу оплаты и добавления устройства держат свою
верхнюю панель (в ней шаги и «назад»), но футер у всех страниц один —
`SiteFooter`.

**Личный кабинет** живёт на тех же токенах: `.dashboard-v2`,
`.dv2-card` и соседи в `globals.css`. Карточки кабинета светлые;
`bg-white/[0.xx]`, `text-white/xx` и прочие альфа-белые утилиты в нём
запрещены — они остались от тёмной версии и на светлой карточке дают
невидимый текст.

**Тарифы** — единственный источник `src/lib/plans.ts`; его же
использует обработчик оплаты. Дублировать цены запрещено. Там же
`PLAN_SPEED` — скорость канала (Basic 25 Гбит/с, Plus 75 Гбит/с):
её показывают первый экран, секция «ширина канала», состав тарифа и
список локаций, и все четыре обязаны брать число оттуда.

**Локации** — единственный источник `src/lib/locations.ts`: 19 стран,
их города, координаты и ориентировочные задержки. На главной они
показаны картой присутствия (`PresenceMap`), а не списком: материки
набраны точками из `src/lib/world-map.ts` — текстовой маски 3° × 3°,
которая продолжает пиксельный мотив системы. Никаких картографических
библиотек и растровых подложек. Европейские маркеры стоят вплотную,
поэтому зона нажатия сведена к видимому размеру точки, а полный
доступ ко всем странам даёт легенда под картой — она же список для
тех, кому карта недоступна. Оттуда же берутся производные
`COUNTRY_COUNT` и `CITY_COUNT` — число стран нигде не пишется руками,
иначе первый экран, атлас, бегущая строка, карточка статуса в
кабинете и страницы /about и /infrastructure немедленно расходятся
(так уже было: «четыре страны» на витрине против «трёх юрисдикций» в
инфраструктуре). Города и задержки помечены в файле как оценки,
требующие подтверждения эксплуатацией.

### UI Screens
1. **Auth** (`/`): Email input → OTP code entry with auto-submit, countdown timer, resend
2. **Dashboard** (`/dashboard`): Subscription days counter, VPN key copy, referral sharing, Telegram bonus
3. **Devices** (`/devices`): Platform selection grid, per-platform setup instructions (V2rayNG, Streisand, Hiddify), key copy, key reset

### API Response Format
```json
{ "success": true, "data": { ... } }
{ "success": false, "error": "Описание ошибки" }
```

## Conventions for AI Assistants

- Brand: **Atlas Secure**
- All UI text: **Russian**
- **Два языка продукта.** Публичные страницы — это «ускоритель
  интернета»: скорость, стабильность, отсутствие просадок. Слово
  «VPN» и названия туннельных протоколов там не употребляются.
  В личном кабинете (после входа) — говорим прямо: это VPN, и
  VPN-терминология уместна.
- **Инженерных терминов на витрине нет.** «Магистраль» заменена на
  «ширину канала» с бытовым объяснением, «аптайм» — на «время без
  сбоев». Термин, который приходится объяснять покупателю, на
  публичной странице не работает.
- Trial: **3 дня** (`TRIAL_DURATION_DAYS` в `src/lib/remnawave.ts`)
- Referral: **+20 дней** за оплаченного приглашённого
- Telegram bonus: **+7 дней**
- Никогда не коммитить `.env` — только `.env.example`
- Иконки — только собственный набор `src/components/pixel/Icon.tsx`.
  Никаких сторонних библиотек, эмодзи и стоковых иллюстраций.
- Сессия — httpOnly cookie (`session` = user id)
- **Числа на страницах должны быть подтверждены кодом.** Список
  поддерживаемых платформ — `src/app/devices/page.tsx`, цены —
  `src/lib/plans.ts`, длительность триала — `src/lib/remnawave.ts`.
  Заявления, которые нельзя проверить (сертификации, число
  пользователей), помечаются в файле как требующие подтверждения.
- Перед сдачей страницы: сборка, `tsc`, проверка на 320/375/414/768/
  1024/1280/1440/1920 — без бокового скролла, без тап-зон меньше
  44px, без непоявившегося контента и ошибок консоли.
