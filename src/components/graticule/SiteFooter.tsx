import Link from "next/link";
import { FOOTER_COLUMNS, FOUNDED } from "@/lib/nav";
import { COUNTRY_COUNT } from "@/lib/locations";

/**
 * Футер системы «Гратикул».
 *
 * Один на все страницы, состав — из `src/lib/nav.ts`. Собственный
 * набор ссылок на странице заводить нельзя: это второй источник
 * правды о структуре сайта.
 *
 * Серверный компонент: год считается на сборке, состояния нет.
 *
 * prefetch={false} на ссылках колонок. next/link предзагружает каждый
 * маршрут, попавший в кадр, а футер стоит на каждой странице и ведёт
 * в одиннадцать разделов, до которых читатель почти не доходит: на
 * коротких страницах это была половина всех запросов. Шапка и призывы
 * к действию предзагрузку сохраняют — туда как раз идут.
 */
export default function SiteFooter() {
  const year = new Date().getFullYear();
  const span = year > FOUNDED ? `${FOUNDED}–${year}` : String(FOUNDED);

  return (
    <footer className="gx-footer">
      <div className="g-field">
        <div className="gx-footer-top">
          <Link href="/" className="gx-mark" aria-label="Atlas Secure — на главную">
            <span className="gx-mark-cell" aria-hidden />
            Atlas
          </Link>

          <nav className="gx-footer-nav" aria-label="Разделы сайта">
            {FOOTER_COLUMNS.map((c) => (
              <div key={c.title}>
                <h2>{c.title}</h2>
                <ul>
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} prefetch={false} className="gx-footer-link">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="gx-footer-bottom">
          <span>© {span} Atlas Secure</span>
          <span>Часть группы QoDev</span>
          <span>Гонконг (SAR)</span>
          <span>{COUNTRY_COUNT} стран присутствия</span>
        </div>
      </div>
    </footer>
  );
}
