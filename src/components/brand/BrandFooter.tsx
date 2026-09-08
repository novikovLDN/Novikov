import Link from "next/link";
import PixelSkull from "./PixelSkull";
import { FOOTER_COLUMNS, FOUNDED as NAV_FOUNDED } from "@/lib/nav";

/**
 * Футер.
 *
 * Один на все страницы: собственный набор ссылок на каждой странице —
 * это второй, расходящийся источник правды о структуре сайта.
 *
 * Принадлежность группе объявлена и здесь, и машиночитаемо в
 * schema.org (SiteJsonLd). Официальное наименование группы и реквизиты
 * требуют подтверждения — см. COMPLIANCE-CHECK.md.
 *
 * prefetch={false} на ссылках колонок. next/link по умолчанию
 * предзагружает каждый маршрут, попавший в кадр, а футер есть на
 * каждой странице и ведёт в восемь разделов — то есть открытие
 * любого экрана тянуло восемь RSC-запросов и чужие чанки маршрутов,
 * до которых читатель почти никогда не доходит. На /support это
 * давало 101 КБ и семь лишних чанков поверх 167 КБ самой страницы.
 * Ссылки в шапке и призывы к действию предзагрузку сохраняют: туда
 * как раз идут.
 */
/* Состав — из src/lib/nav.ts. Оформление у прежнего и нового футера
   разное, пока идёт перерисовка; структура одна. */
const COLUMNS = FOOTER_COLUMNS;

export default function BrandFooter() {
  const FOUNDED = NAV_FOUNDED;
  const year = new Date().getFullYear();
  const span = year > FOUNDED ? `${FOUNDED}–${year}` : String(FOUNDED);

  return (
    <footer className="b-footer">
      <div className="b-shell">
        <div className="b-footer-top">
          <Link href="/" className="b-mark b-footer-mark" aria-label="Atlas — на главную">
            <PixelSkull />
            Atlas
          </Link>

          <nav className="b-footer-nav" aria-label="Разделы сайта">
            {COLUMNS.map((c) => (
              <div key={c.title}>
                <h2 className="b-label">{c.title}</h2>
                <ul>
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} prefetch={false} className="b-footer-link">{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="b-footer-bottom">
          <span className="b-num">© {span} Atlas Secure</span>
          <span>Часть группы QoDev</span>
          <span>Гонконг (SAR)</span>
        </div>
      </div>
    </footer>
  );
}
