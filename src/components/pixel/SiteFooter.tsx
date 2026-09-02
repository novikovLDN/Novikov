import Link from "next/link";
import BrandMark from "./BrandMark";

/**
 * Футер сайта.
 *
 * Общий для всех страниц: иначе у каждой заводится собственный набор
 * ссылок на разделы — второй, расходящийся источник правды о структуре.
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
  /* Год основания фиксирован, текущий считается: копирайт не должен
     устаревать первого января. */
  const FOUNDED = 2016;
  const year = new Date().getFullYear();
  const span = year > FOUNDED ? `${FOUNDED}\u2013${year}` : String(FOUNDED);

  return (
    <footer className="px-footer">
      <div className="px-shell">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-10">
          <div className="lg:col-span-4">
            <Link href="/" className="px-brand" aria-label="Atlas Secure — на главную">
              <BrandMark size={20} />
              <span className="px-wordmark">atlas.secure</span>
            </Link>
            <p className="px-body mt-5 max-w-[36ch]">
              Ускоритель интернета. Стабильное соединение и низкий пинг на любом
              устройстве, настройка за минуту.
            </p>
          </div>

          <nav className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10" aria-label="Разделы сайта">
            {COLUMNS.map((c) => (
              <div key={c.title}>
                <h2 className="px-eyebrow">{c.title}</h2>
                <ul className="mt-3">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="px-footer-link">{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="px-footer-bottom">
          <span className="px-num">© {span} Atlas Secure</span>
          <span aria-hidden className="hidden sm:inline">·</span>
          <span>HQ: Hong Kong SAR</span>
          <span className="sm:ml-auto">Работает на любом устройстве</span>
        </div>
      </div>
    </footer>
  );
}
