import Link from "next/link";
import BrandMark from "@/components/pixel/BrandMark";
import { PRODUCTS, HEADER_LINKS, SITE_SHEETS, LEGAL_LINKS } from "@/lib/nav";
import { TRIAL_DAYS } from "@/lib/brand-facts";
import { plural } from "@/lib/ru-words";
import IndexCloser from "./IndexCloser";

const TRIAL = `${TRIAL_DAYS} ${plural(TRIAL_DAYS, ["день", "дня", "дней"])}`;

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
type Cta = { href: string; label: string };

/* `cta` — действие справа. По умолчанию «Войти»; в кабинете `null`:
   человек уже внутри, свои действия у кабинета в панели под шапкой. */
export default function AtlasHeader({
  sheetNo,
  sheetTitle,
  cta = { href: "/auth", label: "Войти" },
}: {
  sheetNo: string;
  sheetTitle: string;
  cta?: Cta | null;
}) {
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
          <span className="a-wide" data-sheet-no>{sheetNo}</span>{" "}
          <em data-sheet-title>{sheetTitle}</em>
        </p>

        {/* Витрина (в шапке «Войти»): главное действие всегда под рукой —
            пробный период кобальтовой пилюлей (разбор продажника
            12.09.2026). На телефоне оно в меню, в шапке нет места. */}
        {cta?.href === "/auth" ? (
          <Link href="/auth" className="a-head-try">{TRIAL} бесплатно</Link>
        ) : null}
        {cta ? <Link href={cta.href} className="a-head-cta">{cta.label}</Link> : null}

        <details className="a-index">
          <summary className="a-wide">
            <span className="a-index-ico" aria-hidden />
            <span className="a-index-open">меню</span>
            <span className="a-index-shut">закрыть</span>
          </summary>
          <nav className="a-index-panel" aria-label="Разделы сайта">
            <ul>
              {SITE_SHEETS.map((s, i) => (
                <li key={s.href} style={{ ["--i" as string]: i }}>
                  <Link href={s.href}>
                    <span className="a-wide">{s.no}</span> <em>{s.title}</em>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="a-index-foot" style={{ ["--i" as string]: SITE_SHEETS.length }}>
              {/* Главное действие — только на витрине, где в шапке «Войти». */}
              {cta?.href === "/auth" ? (
                <Link href="/auth" className="a-btn a-btn-primary">Попробовать {TRIAL} бесплатно</Link>
              ) : null}
              <p className="a-index-legal">
                {LEGAL_LINKS.map((l) => (
                  <Link key={l.href} href={l.href}>{l.label}</Link>
                ))}
              </p>
            </div>
          </nav>
        </details>
        <IndexCloser />
      </div>
    </header>
  );
}
