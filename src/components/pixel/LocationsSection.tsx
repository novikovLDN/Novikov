import SectionHeading from "./SectionHeading";
import { PLAN_SPEED } from "@/lib/plans";
import {
  CITY_COUNT,
  COUNTRY_COUNT,
  LOCATIONS,
  citiesLabel,
  citiesShort,
  latencyLabel,
  plural,
} from "@/lib/locations";

/**
 * Локации.
 *
 * Состав сети живёт в src/lib/locations.ts — там же, откуда его берут
 * бегущая строка под первым экраном, карточка статуса в кабинете и
 * метрика «стран присутствия» в герое. Здесь список только рисуется.
 *
 * Раньше стран было четыре и каждая занимала строку во всю ширину.
 * На девятнадцати такой список превращается в простыню на два экрана,
 * поэтому строка сжата до ячейки атласа: монограмма, страна, города,
 * задержка. Порядок — по возрастанию задержки, то есть ближайшее
 * сверху; это и есть полезный для читателя порядок.
 *
 * Флагов-эмодзи нет намеренно: они по-разному рисуются в разных ОС.
 * Двухбуквенная монограмма в форме кубика однозначна везде.
 */
const CHANNEL = `до ${PLAN_SPEED.plus} Гбит/с`;

export default function LocationsSection() {
  return (
    <section className="px-section" aria-labelledby="locations-title">
      <div className="px-shell">
        <SectionHeading
          eyebrow="Инфраструктура"
          title={["Серверы там,", "где вам нужно"]}
          titleId="locations-title"
          index="07"
          action={{ label: "Об инфраструктуре", href: "/infrastructure" }}
        />

        <p className="px-lede px-reveal -mt-6 mb-10">
          {COUNTRY_COUNT} {plural(COUNTRY_COUNT, ["страна", "страны", "стран"])} и{" "}
          {CITY_COUNT} {plural(CITY_COUNT, ["город", "города", "городов"])} — от Минска
          и Варшавы до Токио и Лос-Анджелеса. Клиент сам выбирает ближайший маршрут, а нужную
          страну можно закрепить вручную. Скорость канала одинаковая везде:{" "}
          {CHANNEL}.
        </p>

        <ul className="px-atlas px-reveal">
          {LOCATIONS.map((l) => (
            <li key={l.code} className="px-atlas-item">
              <span className="px-atlas-code" aria-hidden>{l.code}</span>

              <span className="px-atlas-body">
                <span className="px-atlas-country">{l.country}</span>
                <span className="px-atlas-cities" title={citiesLabel(l)}>
                  {citiesShort(l)}
                </span>
              </span>

              <span className="px-atlas-latency px-num">{latencyLabel(l)}</span>
            </li>
          ))}
        </ul>

        <p className="px-caption px-reveal mt-6">
          Задержка указана ориентировочно — типовой отклик из Москвы до
          ближайшей точки страны.
        </p>
      </div>
    </section>
  );
}
