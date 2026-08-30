import type { ReactNode } from "react";
import { MiniCubes } from "./CubeCluster";

/**
 * Первый экран внутренней страницы.
 *
 * Один компонент на весь раздел: до этого каждая страница строила свой
 * заголовочный блок со своими отступами и кеглем, и левый край текста
 * не совпадал между ними.
 *
 * Высота не фиксирована. Внутренняя страница не должна занимать первым
 * экраном целый вьюпорт: посетитель уже знает, зачем пришёл, и ему
 * нужен контент, а не ещё один плакат.
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
    <section className="px-page-hero" aria-labelledby="page-title">
      <div className="px-shell">
        <p className="px-eyebrow px-reveal flex items-center gap-3">
          <MiniCubes />
          {eyebrow}
        </p>

        <h1 id="page-title" className="px-page-hero-title px-reveal mt-5">
          {title.map((line, i) => (
            <span key={line} className="block">
              {line}
              {i < title.length - 1 ? " " : ""}
            </span>
          ))}
        </h1>

        {lede && <p className="px-lede px-reveal mt-6">{lede}</p>}
        {children && <div className="px-reveal mt-9">{children}</div>}
      </div>
    </section>
  );
}
