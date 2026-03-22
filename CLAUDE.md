# Atlas Secure — VPN Service Website

## Project Overview
Atlas Secure is a VPN service selling website built with Next.js. It provides user registration via email verification, automatic VPN key generation with a 3-day trial period, device management, referral system, and Telegram integration.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Runtime**: Node.js
- **Email**: Nodemailer (SMTP)

## Project Structure
```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── layout.tsx          # Root layout (metadata, global styles)
│   ├── page.tsx            # Login/registration page (email → code → auth)
│   ├── globals.css         # Global styles, Tailwind config, animations
│   ├── dashboard/
│   │   └── page.tsx        # User dashboard (subscription, referrals, VPN key)
│   ├── devices/
│   │   └── page.tsx        # Device selection & key sharing
│   └── api/
│       ├── auth/
│       │   ├── send-code/route.ts    # POST: send verification code to email
│       │   └── verify-code/route.ts  # POST: verify code, create user, set session
│       ├── user/
│       │   ├── subscription/route.ts # GET: subscription status
│       │   ├── devices/route.ts      # GET: supported devices list
│       │   └── referral/route.ts     # GET: referral info
│       └── vpn/
│           └── generate-key/route.ts # POST: reset/regenerate VPN key
├── components/
│   ├── Header.tsx          # App header with logo and navigation
│   ├── Footer.tsx          # Footer with legal links
│   └── FeatureCard.tsx     # Reusable feature highlight card
├── lib/
│   ├── store.ts            # In-memory data store (replace with DB in production)
│   └── email.ts            # Email sending utility
└── types/
    └── index.ts            # TypeScript type definitions
```

## Development Commands
```bash
npm run dev       # Start development server (http://localhost:3000)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

## Environment Variables
Copy `.env.example` to `.env` and configure:
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` — email delivery
- `SMTP_FROM` — sender address
- `VPN_API_URL`, `VPN_API_KEY` — VPN server integration
- `SESSION_SECRET` — session cookie signing

In dev mode without SMTP config, verification codes are logged to console.

## Architecture & Conventions

### Authentication Flow
1. User enters email → `POST /api/auth/send-code` → 6-digit code sent via email
2. User enters code → `POST /api/auth/verify-code` → account auto-created with 3-day trial
3. Session cookie set → redirect to `/dashboard`

### Data Store
Currently uses in-memory Maps (`src/lib/store.ts`). **Must be replaced with a real database for production** (PostgreSQL, MongoDB, etc.).

### Styling
- Dark theme by default (background: `#0a0a0a`)
- Tailwind CSS v4 with custom theme tokens in `globals.css`
- Mobile-first responsive design, max-width `lg` (32rem) container
- Custom animations: `animate-fade-in`, `animate-fade-in-delay-{1-4}`

### Key Design Patterns
- All pages are client components (`"use client"`) for interactivity
- API routes use Next.js Route Handlers (`route.ts`)
- Session management via httpOnly cookies
- SVG icons inline (no icon library dependency)
- Russian language UI throughout

### API Response Format
All API endpoints return:
```json
{ "success": true, "data": { ... } }
{ "success": false, "error": "Error message" }
```

## Important Notes for AI Assistants
- Brand name is **Atlas Secure** (not Rocket VPN)
- All UI text is in **Russian**
- The site is mobile-first, designed to look like a mobile app
- VPN keys use `vless://` protocol format
- Trial period is **3 days** for new users
- Referral bonus is **+20 days** per paying referral
- Telegram linking bonus is **+7 days**
- Never commit `.env` files — use `.env.example` as reference
