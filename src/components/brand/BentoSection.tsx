import Link from "next/link";
import ScrambleLabel from "./ScrambleLabel";
import { RollingNumber } from "./KineticHeadline";
import { typo } from "@/lib/typo";
import { DEVICE_LIMIT, PLAN_SPEED } from "@/lib/plans";
import { CITY_COUNT, COUNTRY_COUNT, LOCATIONS, plural } from "@/lib/locations";
import { TRIAL_DAYS } from "@/lib/brand-facts";

/**
 * БЕНТО — состав продукта модульной сеткой.
 *
 * Почему сетка, а не список: ячейка даёт зрительную точку — читатель
 * успевает переварить одно утверждение прежде, чем перейти к
 * следующему. Разный размер ячеек задаёт порядок чтения без единого
 * дополнительного элемента оформления.
 *
 * Внутреннее устройство ячейки перестраивается по ЕЁ ширине, а не по
 * ширине экрана (container queries): широкая ячейка кладёт число и
 * подпись в строку, узкая — столбиком. На телефоне это разные
 * ситуации при одной и той же ширине окна.
 *
 * Все числа — из кода: тарифы, локации, срок пробного доступа.
 */
const FASTEST = [...LOCATIONS].sort((a, b) => a.latencyMs - b.latencyMs)[0];

export default function BentoSection() {
  return (
    <section className="b-section b-paper b-live b-bento-sec" aria-labelledby="bento-title">
      <div className="b-shell">
        <ScrambleLabel text="Состав" />
        <h2 id="bento-title" className="b-lg b-bento-title">
          {typo("Что внутри подписки")}
        </h2>

        <div className="b-bento b-vel">
          {/* Ведущая ячейка: главный аргумент и его число. */}
          <article className="b-cell b-cell-lead">
            <p className="b-label">Ширина канала</p>
            <p className="b-cell-figure b-num">
              <RollingNumber value={PLAN_SPEED.plus} suffix=" Гбит/с" />
            </p>
            <p className="b-body">
              {typo("Запас считался под вечерний час пик. Созвон не рассыпается, фильм не встаёт на паузу.")}
            </p>
          </article>

          <article className="b-cell">
            <p className="b-label">Устройств</p>
            <p className="b-cell-figure b-num">
              <RollingNumber value={DEVICE_LIMIT} />
            </p>
            <p className="b-body">На одной подписке, менять можно в любой момент.</p>
          </article>

          <article className="b-cell b-cell-wide">
            <p className="b-label">Точки выхода</p>
            <p className="b-cell-figure b-num">
              {COUNTRY_COUNT} / {CITY_COUNT}
            </p>
            <p className="b-body">
              {typo(`${COUNTRY_COUNT} ${plural(COUNTRY_COUNT, ["страна", "страны", "стран"])} и ${CITY_COUNT} ${plural(CITY_COUNT, ["город", "города", "городов"])}. Ближайшая — ${FASTEST.cities[0]}, ${FASTEST.latencyMs} мс.`)}
            </p>
          </article>

          {/* Состояние системы — тихая ячейка, но с живым признаком. */}
          <article className="b-cell b-cell-status">
            <p className="b-label">Журналы</p>
            <p className="b-cell-figure b-cell-figure-word">нет</p>
            <p className="b-body">
              {typo("Ни посещённых сайтов, ни DNS-запросов, ни истории подключений.")}
            </p>
          </article>

          <article className="b-cell b-cell-cta">
            <p className="b-label">Начало</p>
            <p className="b-cell-figure b-num">
              <RollingNumber value={TRIAL_DAYS} suffix=" дня" />
            </p>
            <p className="b-body">Бесплатно и без карты. Дальше — как удобно.</p>
            <Link href="/auth" className="b-btn b-btn-acid b-cell-btn">
              Начать
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}
