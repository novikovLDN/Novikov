"use client";

import Link from "next/link";

/**
 * Landing footer — dark rounded card at the bottom, same aesthetic
 * as the other dark sections. Three link columns + brand row +
 * copyright / legal.
 */
export default function LandingFooter() {
  return (
    <footer className="bg-black text-white px-5 sm:px-8 pt-16 sm:pt-20 pb-10 mx-2 sm:mx-3 mt-2 sm:mt-3 mb-2 sm:mb-3 rounded-[28px] sm:rounded-[36px]">
      <div className="max-w-[1200px] mx-auto">
        {/* Brand + tagline */}
        <div className="mb-14 sm:mb-16 max-w-[520px]">
          <div className="flex items-center gap-2 mb-5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M5 5 L1 1 M5 5 L5 1 M5 5 L1 5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M19 5 L23 1 M19 5 L19 1 M19 5 L23 5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 19 L1 23 M5 19 L5 23 M5 19 L1 19" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M19 19 L23 23 M19 19 L19 23 M19 19 L23 19" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-mts-wide text-[13px] tracking-[0.16em] uppercase text-white/85">
              atlas.secure
            </span>
          </div>
          <p className="font-mts-wide text-[15px] sm:text-[16px] leading-[1.5] text-white/55">
            Ускоритель интернета. Стабильное соединение и низкий пинг на любом устройстве. Настройка за минуту.
          </p>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 mb-16">
          <Column
            title="Продукт"
            links={[
              { label: "Тарифы",       href: "/pricing" },
              { label: "Устройства",   href: "/devices" },
              { label: "Безопасность", href: "/security" },
              { label: "Инфраструктура", href: "/infrastructure" },
            ]}
          />
          <Column
            title="Компания"
            links={[
              { label: "О нас",       href: "/about" },
              { label: "Контакты",    href: "/contact" },
              { label: "Поддержка",   href: "/support" },
            ]}
          />
          <Column
            title="Юридическое"
            links={[
              { label: "Условия",       href: "/terms" },
              { label: "Приватность",   href: "/privacy" },
            ]}
          />
          <Column
            title="Аккаунт"
            links={[
              { label: "Войти",           href: "/auth" },
              { label: "Личный кабинет",  href: "/dashboard" },
            ]}
          />
        </div>

        {/* Bottom row */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 font-mts-wide text-[12px] text-white/40">
          <span>&copy; {new Date().getFullYear()} Atlas Secure</span>
          <span className="hidden sm:inline">·</span>
          <span>HQ: Hong Kong SAR</span>
          <span className="sm:ml-auto">Работает на любом устройстве</span>
        </div>
      </div>
    </footer>
  );
}

function Column({ title, links }: { title: string; links: Array<{ label: string; href: string }> }) {
  return (
    <div>
      <div className="font-mts-wide text-[12px] tracking-[0.10em] uppercase text-white/40 mb-4">
        {title}
      </div>
      <ul className="space-y-3">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="font-mts-wide text-[14px] text-white/75 hover:text-white transition-colors">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
