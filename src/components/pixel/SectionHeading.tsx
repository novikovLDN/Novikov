import Link from "next/link";
import Icon from "./Icon";
import { MiniCubes } from "./CubeCluster";

/**
 * Шапка секции: надзаголовок с мини-кластером кубиков, крупный
 * заголовок и необязательное действие справа по нижней базовой линии.
 *
 * Мини-кубики — тот же фирменный мотив в малой дозе: он связывает
 * секции между собой и с героем, не повторяя крупную фигуру.
 */
export default function SectionHeading({
  eyebrow,
  title,
  titleId,
  action,
  index,
}: {
  eyebrow: string;
  /** Строки заголовка: перенос — решение вёрстки, а не часть текста. */
  title: string[];
  titleId: string;
  action?: { label: string; href: string };
  /** Порядковый номер секции. Полоса с номером задаёт странице
   *  «приборный» счёт разделов — приём инженерной точности из
   *  research/04.md §6. */
  index?: string;
}) {
  return (
    <header className="px-head px-reveal">
      <div className="min-w-0">
        {index && (
          <div className="px-rail">
            <span className="px-rail-index px-num">{index}</span>
            <span className="px-rail-line" aria-hidden />
          </div>
        )}
        <p className="px-eyebrow flex items-center gap-3">
          <MiniCubes />
          {eyebrow}
        </p>
        <h2 id={titleId} className="px-h2 px-head-title mt-5">
          {title.map((line, i) => (
            <span key={line} className="block">
              {line}
              {i < title.length - 1 ? " " : ""}
            </span>
          ))}
        </h2>
      </div>

      {action && (
        <div className="px-head-aside">
          <Link href={action.href} className="px-btn px-btn-sm px-btn-secondary group">
            {action.label}
            <Icon
              name="arrow-right"
              size={14}
              className="transition-transform duration-200 ease-out group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      )}
    </header>
  );
}
