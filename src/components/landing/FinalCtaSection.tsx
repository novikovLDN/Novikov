import Link from "next/link";
import Icon from "./Icon";

/**
 * Блок 7 — финальный призыв.
 *
 * Было: секция, залитая оранжевым во всю площадь. Кнопка внутри неё
 * переставала выделяться — акцент был везде, а значит нигде.
 *
 * Стало: тёмная фокальная поверхность (общая с футером), на которой
 * оранжевой остаётся ровно одна кнопка. Повторена и строка снятия
 * возражений из героя: это последняя точка решения на странице, и
 * возражение «а вдруг спишут деньги» здесь такое же живое, как вверху.
 */
interface FinalCtaSectionProps {
  primaryHref: string;
}

export default function FinalCtaSection({ primaryHref }: FinalCtaSectionProps) {
  return (
    <section className="ls-section ls-section-flush-bottom" aria-labelledby="final-title">
      <div className="ls-shell max-w-[760px] text-center">
        <h2 id="final-title" className="ls-display ls-reveal">
          Стабильный интернет —
          <br />
          за минуту
        </h2>

        <p className="ls-lede ls-reveal mx-auto mt-6">
          Регистрация занимает 30 секунд, первые три дня бесплатно.
          Дальше соединение поднимается само на каждом устройстве.
        </p>

        <div className="ls-reveal mt-10 flex flex-col sm:flex-row sm:justify-center gap-3">
          <Link href={primaryHref} className="as-btn as-btn-xl as-btn-accent as-btn-block sm:w-auto group">
            Начать бесплатно
            <Icon
              name="arrow-right"
              size={18}
              className="transition-transform duration-200 ease-out group-hover:translate-x-0.5"
            />
          </Link>
          <Link href="/pricing" className="as-btn as-btn-xl as-btn-dark as-btn-block sm:w-auto">
            Все тарифы
          </Link>
        </div>

        <ul className="ls-friction ls-reveal mt-6 justify-center">
          <li>
            <Icon name="check" size={13} style={{ color: "var(--as-good)" }} />
            3 дня бесплатно
          </li>
          <li>
            <Icon name="check" size={13} style={{ color: "var(--as-good)" }} />
            Без привязки карты
          </li>
          <li>
            <Icon name="check" size={13} style={{ color: "var(--as-good)" }} />
            Отмена в один клик
          </li>
        </ul>
      </div>
    </section>
  );
}
