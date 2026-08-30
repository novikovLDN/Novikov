import type { ReactNode } from "react";

/**
 * Первый экран внутренней страницы.
 *
 * Тёмная фокальная поверхность со скруглённым низом — та же, что
 * открывает главную. Один компонент на все страницы раздела: до этого
 * каждая страница строила свой заголовочный блок с собственными
 * отступами и кеглем, и левый край текста не совпадал между ними.
 *
 * Высота не фиксирована: внутренние страницы не должны занимать
 * первым экраном целый вьюпорт — посетитель уже знает, зачем пришёл,
 * и ему нужен контент, а не ещё один плакат.
 */
export default function PageHero({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string;
  /** Строки заголовка: перенос — решение вёрстки, а не часть текста. */
  title: string[];
  lede?: string;
  children?: ReactNode;
}) {
  return (
    <section className="ls-focal ls-page-hero" aria-labelledby="page-title">
      <div className="ls-aurora" aria-hidden>
        <span />
        <span />
      </div>

      <div className="ls-shell">
        <p className="ls-eyebrow ls-enter" style={{ ["--ls-i" as string]: 0 }}>
          {eyebrow}
        </p>

        <h1 id="page-title" className="ls-page-hero-title mt-5">
          {title.map((line, i) => (
            <span key={line} className="ls-line">
              <span className="ls-line-in" style={{ ["--ls-i" as string]: i + 1 }}>
                {line}
              </span>
            </span>
          ))}
        </h1>

        {lede && (
          <p
            className="ls-lede ls-enter mt-6"
            style={{ ["--ls-i" as string]: title.length + 1 }}
          >
            {lede}
          </p>
        )}

        {children && (
          <div className="ls-enter mt-9" style={{ ["--ls-i" as string]: title.length + 2 }}>
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
