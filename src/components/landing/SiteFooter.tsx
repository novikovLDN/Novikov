import Link from "next/link";
import { BrandMark } from "./SiteHeader";

/**
 * Блок 8 — футер.
 *
 * Композиция сохранена (бренд + четыре колонки ссылок + нижняя
 * строка), но ритм и типографика приведены к шкале концепции:
 * общий контейнер .ls-shell, надзаголовки колонок — .ls-eyebrow,
 * отступы кратны 8. Раньше блок жил на собственных значениях и не
 * попадал в левый край остальных секций.
 *
 * Год берётся на сервере при рендере. Значение одинаково на сервере и
 * клиенте в пределах одного запроса, так что рассинхронизации гидрации
 * не возникает.
 */
const COLUMNS: Array<{ title: string; links: Array<{ label: string; href: string }> }> = [
  {
    title: "Продукт",
    links: [
      { label: "Тарифы", href: "/pricing" },
      { label: "Устройства", href: "/devices" },
      { label: "Безопасность", href: "/security" },
      { label: "Инфраструктура", href: "/infrastructure" },
    ],
  },
  {
    title: "Компания",
    links: [
      { label: "О нас", href: "/about" },
      { label: "Контакты", href: "/contact" },
      { label: "Поддержка", href: "/support" },
    ],
  },
  {
    title: "Юридическое",
    links: [
      { label: "Условия", href: "/terms" },
      { label: "Приватность", href: "/privacy" },
    ],
  },
  {
    title: "Аккаунт",
    links: [
      { label: "Войти", href: "/auth" },
      { label: "Личный кабинет", href: "/dashboard" },
    ],
  },
];

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="ls-shell pb-10 pt-4 sm:pt-8">
      <div className="border-t border-white/10 pt-14 sm:pt-16">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-10">
          <div className="lg:col-span-4">
            <Link
              href="/"
              className="ls-tap ls-tap-brand gap-2 text-white rounded-lg"
              aria-label="Atlas Secure — на главную"
            >
              <BrandMark />
              <span className="text-[13px] tracking-[0.16em] uppercase font-medium">
                atlas.secure
              </span>
            </Link>
            <p className="ls-body mt-5 max-w-[36ch]">
              Ускоритель интернета. Стабильное соединение и низкий пинг
              на любом устройстве, настройка за минуту.
            </p>
          </div>

          <nav className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10" aria-label="Разделы сайта">
            {COLUMNS.map((c) => (
              <div key={c.title}>
                <h2 className="ls-eyebrow">{c.title}</h2>
                <ul className="mt-3">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="ls-tap text-[14px] text-white/70 hover:text-white transition-colors duration-200 ease-out"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-[12px] text-white/40">
          <span className="ls-num">© {year} Atlas Secure</span>
          <span aria-hidden className="hidden sm:inline">·</span>
          <span>HQ: Hong Kong SAR</span>
          <span className="sm:ml-auto">Работает на любом устройстве</span>
        </div>
      </div>
    </footer>
  );
}
