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

### Design System
- Dark theme (`#0a0a0a` background)
- Tailwind v4 with custom tokens in `globals.css`
- Mobile-first responsive: all screens work from 320px to 1920px+
- Glass header with backdrop-filter blur
- Custom animations: `animate-fade-in-up`, `animate-scale-in`, `animate-shake`, `animate-delay-{1-5}`
- Safe area insets for mobile notches
- `btn-press` class for tactile button feedback
- `gradient-text` for gradient typography

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
- Brand: **Atlas Secure** (not Rocket VPN)
- All UI text: **Russian**
- Mobile-first, app-like feel
- VPN protocol: VLESS with Reality (configurable)
- Trial: **3 days** free
- Referral: **+20 days** per paid referral
- Telegram bonus: **+7 days**
- Never commit `.env` — use `.env.example`
- Inline SVG icons (no external icon library)
- Session via httpOnly cookie (`session` = user ID)
- All pages are `"use client"` components
- Max container width: `max-w-2xl` (42rem)
