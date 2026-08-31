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

- Тёмный технологичный минимализм. Фон `#0E100D` с едва заметной
  пиксельной сеткой (два `linear-gradient`, шаг = `--px-cell`).
- Поверхности: `--px-surface` `#24261F` (карточки), `--px-surface-2`
  `#191B16` (вторичные, secondary-кнопки).
- **Ровно один яркий акцент** `--px-accent` `#C6F24E` (кислотный лайм)
  в кадре. `--px-good` `#2DD4BF` — только состояние системы
  (подключено, активно, успех), не декор. Бирюзовый, а не зелёный:
  рядом с лаймовым акцентом обычный зелёный перестаёт читаться как
  отдельный смысл. Других акцентных цветов нет.
- **Акцент замкнут в токены** `--px-accent*`. Писать цвет акцента
  хексом в компоненте запрещено: смена бренд-цвета должна оставаться
  правкой одного блока.
- Плоские заливки запрещены: каждая поверхность получает
  альфа-градиент и кромку света `--px-edge` (см. research/04.md).
- Текст: `--px-text` `#FFFFFF`, `--px-text-2` `#B9B9BD`,
  `--px-text-3/4` — подписи и мета.
- Радиусы: кнопки `--px-r-btn` 14px, карточки `--px-r-card` 18px,
  навигационные чипы — пилюля, кубики — 22% стороны.
- Шрифт проекта не меняется: MTS Wide (Medium 500 / Bold 700).
  Третьего веса в лицензии нет.
- Логотип не меняется: формы в `src/components/pixel/BrandMark.tsx`
  взяты один в один из `src/app/icon.tsx`.

**Фирменный мотив — кубики.** `src/components/pixel/CubeCluster.tsx`:
фигура задаётся строковой картой, кубики перескакивают по ячейкам
сетки. Компонент пишет только CSS-переменные, всё рисование — в CSS.
Мини-версия `MiniCubes` используется как буллет надзаголовков.

**Motion.** Появление секций — `useReveal` (IntersectionObserver,
играет один раз). Только `transform` и `opacity`, ноль layout shift,
ноль JS-библиотек анимации. `prefers-reduced-motion` упрощает слой.

**Общие компоненты** живут в `src/components/pixel/`: `SiteHeader`,
`SiteFooter`, `SiteOutro`, `PageHero`, `SectionHeading`, `PlanCard`,
`PeriodSelector`, `Faq`, `Icon`, `motion`. Собственную шапку или
футер на странице заводить нельзя — это второй источник правды о
структуре сайта.

**Тарифы** — единственный источник `src/lib/plans.ts`; его же
использует обработчик оплаты. Дублировать цены запрещено.

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
