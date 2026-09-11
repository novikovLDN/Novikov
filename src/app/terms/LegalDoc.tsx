import AtlasShell from "@/components/atlas/AtlasShell";
import "./legal-atlas.css";

/**
 * Правовая страница на корпусе «Атлас-издание» — общий каркас /terms и
 * /privacy. Текст разделов приходит со страницы и здесь не меняется.
 *
 * Серверный компонент, скрипта своего нет:
 *   · разделы ложатся при входе общим `a-settle` (MotionController ставит
 *     `data-seen` на каждый `a-sheet`);
 *   · текущий раздел в оглавлении подсвечивается шкалами прокрутки,
 *     запасной путь — `:target` (legal-atlas.css, раздел 4.1).
 *
 * У разделов нет `data-title`: шапка всё время показывает «§ Условия» /
 * «§ Приватность», а место в тексте показывает оглавление.
 */
export type LegalSection = { n: string; t: string; body: React.ReactNode };

const v = (o: Record<string, string | number>) => o as React.CSSProperties;

export default function LegalDoc({
  sheetTitle,
  title,
  k,
  meta,
  tocLabel,
  sections,
}: {
  sheetTitle: string;
  title: string;
  /** Ширина самого длинного слова заголовка в кеглях (legal-atlas.css, .al-h1). */
  k: number;
  meta: React.ReactNode[];
  tocLabel: string;
  sections: LegalSection[];
}) {
  return (
    <AtlasShell sheetNo="§" sheetTitle={sheetTitle}>
      <main id="main" className="a-main al">
        <section className="a-sheet al-hero" data-sheet="§" data-title={sheetTitle} aria-labelledby="al-title">
          <div className="a-field al-hero-field">
            <p className="a-wide al-kicker a-settle" style={v({ "--i": 0 })}>
              Правовая информация
            </p>
            <h1 id="al-title" className="al-h1" style={v({ "--k": k })}>
              {title}
            </h1>
            <ul className="al-meta a-settle" style={v({ "--i": 2 })}>
              {meta.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        </section>

        <div className="a-field al-body">
          <nav className="al-toc" aria-label={tocLabel}>
            <p className="a-wide al-toc-head">Содержание</p>
            <ol>
              {sections.map((s) => (
                <li key={s.n}>
                  <a href={`#s-${s.n}`}>
                    <span className="a-wide">{s.n}</span>
                    <span className="al-toc-t">{s.t}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="al-text">
            {sections.map((s) => (
              <section
                key={s.n}
                id={`s-${s.n}`}
                className="a-sheet al-sec"
                data-sheet="§"
                aria-labelledby={`s-${s.n}-t`}
              >
                <span className="al-no" aria-hidden>
                  {s.n}
                </span>
                <h2 id={`s-${s.n}-t`} className="al-h2 a-settle" style={v({ "--i": 0 })}>
                  {s.t}
                </h2>
                <div className="a-settle" style={v({ "--i": 2 })}>
                  {s.body}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
    </AtlasShell>
  );
}
