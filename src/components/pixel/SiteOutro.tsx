import Link from "next/link";
import Icon from "./Icon";
import BrandMark from "./BrandMark";
import CubeCluster from "./CubeCluster";

/**
 * Финальная зона: призыв и футер.
 *
 * Этим заканчивается каждая публичная страница, поэтому блок общий:
 * иначе у страниц заводятся расходящиеся наборы ссылок на разделы
 * сайта — второй источник правды о структуре.
 *
 * Кластер кубиков здесь другой формы, чем в герое: короткая
 * восходящая ступень. Мотив тот же, но повторять первый экран
 * буквально не нужно — иначе низ страницы читается как её начало.
 */
const OUTRO_SHAPE = [
  "....XX",
  "...XX.",
  "..XX..",
  ".XX...",
  "XX....",
];

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

const DEFAULT_TITLE = ["Стабильный интернет —", "за минуту"];
const DEFAULT_LEDE =
  "Регистрация занимает 30 секунд и не требует карты. Первые три дня — бесплатно.";

export default function SiteOutro({
  primaryHref = "/auth",
  title = DEFAULT_TITLE,
  lede = DEFAULT_LEDE,
}: {
  primaryHref?: string;
  title?: string[];
  lede?: string;
}) {
  const year = new Date().getFullYear();

  return (
    <>
      <section className="px-section" aria-labelledby="final-title">
        <div className="px-shell">
          <div className="px-outro-card px-reveal">
            <div className="px-outro-copy">
              <h2 id="final-title" className="px-h2">
                {title.map((line, i) => (
                  <span key={line} className="block">
                    {line}
                    {i < title.length - 1 ? " " : ""}
                  </span>
                ))}
              </h2>
              <p className="px-lede mt-5">{lede}</p>

              <div className="px-cta mt-8">
                <Link href={primaryHref} className="px-btn px-btn-xl px-btn-primary px-btn-block group">
                  Создать аккаунт
                  <Icon
                    name="arrow-right"
                    size={18}
                    className="transition-transform duration-200 ease-out group-hover:translate-x-1"
                  />
                </Link>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <Link href="/pricing" className="px-btn px-btn-md px-btn-secondary">Тарифы</Link>
                  <Link href="/support" className="px-btn px-btn-md px-btn-secondary">Поддержка</Link>
                </div>
              </div>
            </div>

            <div className="px-outro-art">
              <CubeCluster shape={OUTRO_SHAPE} />
            </div>
          </div>
        </div>
      </section>

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
            <span className="px-num">© {year} Atlas Secure</span>
            <span aria-hidden className="hidden sm:inline">·</span>
            <span>HQ: Hong Kong SAR</span>
            <span className="sm:ml-auto">Работает на любом устройстве</span>
          </div>
        </div>
      </footer>
    </>
  );
}
