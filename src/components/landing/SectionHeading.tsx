import Link from "next/link";
import Icon from "./Icon";

/**
 * Асимметричная шапка секции — принцип 3 (research/concept.md).
 *
 * Заголовок слева, необязательное действие справа по нижней базовой
 * линии. Ровно эта пара повторяется в пяти секциях лендинга, поэтому
 * живёт одним компонентом: любой сдвиг ритма правится в одном месте и
 * не может «разъехаться» между блоками.
 */
interface SectionHeadingProps {
  eyebrow: string;
  /** Массив строк вместо <br> в тексте: перенос — решение вёрстки,
   *  а не часть контента. */
  title: string[];
  action?: { label: string; href: string };
  /** id ставится на сам <h2>, чтобы секция ссылалась на него через
   *  aria-labelledby — без второго, скрытого заголовка. */
  titleId: string;
}

export default function SectionHeading({ eyebrow, title, action, titleId }: SectionHeadingProps) {
  return (
    <header className="ls-head ls-reveal">
      <div>
        <p className="ls-eyebrow">{eyebrow}</p>
        <h2 id={titleId} className="ls-display ls-head-title mt-4">
          {title.map((line, i) => (
            <span key={line} className="block">
              {line}
              {i < title.length - 1 ? " " : ""}
            </span>
          ))}
        </h2>
      </div>

      {action && (
        <div className="ls-head-aside">
          <Link href={action.href} className="as-btn as-btn-compact as-btn-ghost group">
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
