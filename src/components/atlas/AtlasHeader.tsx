import Link from "next/link";
import BrandMark from "@/components/pixel/BrandMark";
import { PRODUCTS, HEADER_LINKS, SITE_SHEETS, LEGAL_LINKS } from "@/lib/nav";

/**
 * Шапка — верхнее поле листа.
 *
 * Пункты меню стоят на одной волосяной линии во всю ширину, как подписи
 * на рамке карты (A7: Eladio Dieste, Franklin Azzi). Стеклянной панели
 * и размытия нет. Справа — смешанная строка «лист 04 · Девятнадцать
 * стран»: номер широким гротеском, место курсивом антиквы. На главной
 * её обновляет MotionController по листу в кадре.
 *
 * Состав ссылок — из `src/lib/nav.ts`, как у прежней шапки: структура
 * сайта одна, оформление может различаться, пока идёт перевод.
 *
 * Серверный компонент. Указатель листов на телефоне — `<details>`:
 * раскрывается без скрипта, закрывается им же.
 */
export default function AtlasHeader({ sheetNo, sheetTitle }: { sheetNo: string; sheetTitle: string }) {
  return (
    <header className="a-head">
      <div className="a-field a-head-inner">
        <Link href="/" className="a-mark" aria-label="Atlas Secure — на главную">
          <BrandMark size={20} />
          <span>atlas secure</span>
        </Link>

        <nav className="a-nav" aria-label="Основная навигация">
          {PRODUCTS.map((p) => (
            <Link key={p.href} href={p.href}>{p.label}</Link>
          ))}
          {HEADER_LINKS.map((l) => (
            <Link key={l.href} href={l.href}>{l.label}</Link>
          ))}
        </nav>

        <p className="a-head-sheet">
          <span className="a-wide" data-sheet-no>{`лист ${sheetNo}`}</span>{" "}
          <em data-sheet-title>{sheetTitle}</em>
        </p>

        <Link href="/auth" className="a-head-cta">Войти</Link>

        <details className="a-index">
          <summary className="a-wide">указатель</summary>
          <nav className="a-index-panel" aria-label="Указатель листов">
            <ul>
              {SITE_SHEETS.map((s) => (
                <li key={s.href}>
                  <Link href={s.href}>
                    <span className="a-wide">{s.no}</span> <em>{s.title}</em>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="a-index-legal">
              {LEGAL_LINKS.map((l) => (
                <Link key={l.href} href={l.href}>{l.label}</Link>
              ))}
            </p>
          </nav>
        </details>
      </div>
    </header>
  );
}
