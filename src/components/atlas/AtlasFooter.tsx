import Link from "next/link";
import { SITE_SHEETS, LEGAL_LINKS, FOUNDED } from "@/lib/nav";
import { COUNTRY_COUNT } from "@/lib/locations";
import { NowStamp } from "./Reading";

/**
 * Выходные данные — колофон издания и указатель листов.
 *
 * Команды здесь нет: имён и портретов в исходных данных нет, а
 * выдумывать их запрещено (ТЗ 15.5). Реальные люди, если владелец их
 * даст, становятся строками «отвечает за…», а не фотографиями.
 *
 * Указатель набран крупнее колофона: навигация главнее реквизитов.
 * Время выпуска идёт — это единственное холостое место футера, и оно
 * меняет текст, а не геометрию.
 */
export default function AtlasFooter() {
  const year = new Date().getFullYear();
  const span = year > FOUNDED ? `${FOUNDED}–${year}` : String(FOUNDED);

  return (
    <footer className="a-foot">
      <div className="a-field">
        <nav className="a-foot-index" aria-label="Указатель листов">
          <p className="a-wide a-foot-label">указатель листов</p>
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
          <p>
            atlas secure, атлас. выпуск: <NowStamp variant="issue" />
          </p>
          <p>© {span} Atlas Secure. Часть группы QoDev, Гонконг (SAR)</p>
          <p>{COUNTRY_COUNT} стран присутствия</p>
          <p className="a-colophon-legal">
            {LEGAL_LINKS.map((l) => (
              <Link key={l.href} href={l.href} prefetch={false}>{l.label.toLowerCase()}</Link>
            ))}
          </p>
        </div>
      </div>
    </footer>
  );
}
