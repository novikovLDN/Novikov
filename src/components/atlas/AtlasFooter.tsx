import Link from "next/link";
import { SITE_SHEETS, LEGAL_LINKS, FOUNDED } from "@/lib/nav";
import { COUNTRY_COUNT } from "@/lib/locations";

/**
 * Футер: разделы сайта и реквизиты.
 *
 * Команды здесь нет: имён и портретов в исходных данных нет, а
 * выдумывать их запрещено (ТЗ 15.5). Разделы набраны крупнее
 * реквизитов — навигация главнее мелкого шрифта.
 */
export default function AtlasFooter() {
  const year = new Date().getFullYear();
  const span = year > FOUNDED ? `${FOUNDED}–${year}` : String(FOUNDED);

  return (
    <footer className="a-foot">
      <div className="a-field">
        <nav className="a-foot-index" aria-label="Разделы сайта">
          <p className="a-wide a-foot-label">разделы</p>
          <ul>
            {SITE_SHEETS.map((s) => (
              <li key={s.href}>
                <Link href={s.href} prefetch={false}>
                  <span className="a-wide">{s.no}</span> <em>{s.title}</em>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="a-colophon a-wide">
          <p>© {span} Atlas Secure. Часть группы QoDev, Гонконг (SAR)</p>
          <p>Серверы в {COUNTRY_COUNT} странах</p>
          <p className="a-colophon-legal">
            {LEGAL_LINKS.map((l) => (
              <Link key={l.href} href={l.href} prefetch={false}>{l.label}</Link>
            ))}
          </p>
        </div>
      </div>
    </footer>
  );
}
