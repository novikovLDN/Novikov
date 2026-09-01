import SectionHeading from "./SectionHeading";
import { PLAN_SPEED } from "@/lib/plans";

/**
 * Локации.
 *
 * Непрерывный список с волосяными разделителями вместо карточек с
 * мелкой таблицей внутри: двенадцать значений кеглем 10–11px не
 * читались на телефоне и шумели на десктопе.
 *
 * ВНИМАНИЕ: количество серверов и задержки — консервативные оценки на
 * момент написания. Их нужно заменить фактическими значениями, как
 * только эксплуатация подтвердит окончательный список.
 *
 * Скорость канала здесь не своя: она берётся из src/lib/plans.ts.
 * Раньше в этой колонке стояла «магистраль» локации (200/100 Гбит/с) —
 * величина другого порядка и другого смысла, чем скорость, которую
 * получает подключение. Рядом с тарифом это читалось как обещание
 * 200 Гбит/с покупателю.
 *
 * Флагов-эмодзи нет намеренно: они по-разному рисуются в разных ОС.
 * Двухбуквенная монограмма в формах кубика однозначна везде.
 */
interface Location {
  code: string;
  country: string;
  city: string;
  servers: number;
  latency: string;
}

const LOCATIONS: Location[] = [
  { code: "DE", country: "Германия", city: "Frankfurt", servers: 12, latency: "24 мс" },
  { code: "NL", country: "Нидерланды", city: "Amsterdam", servers: 8, latency: "32 мс" },
  { code: "AT", country: "Австрия", city: "Vienna", servers: 6, latency: "38 мс" },
  { code: "US", country: "США", city: "New York", servers: 4, latency: "120 мс" },
];

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

        <p className="px-lede px-reveal -mt-6 mb-12">
          Четыре страны сейчас, остальные — по запросу. Партнёрские дата-центры
          уровня Tier-3 и Tier-4: клиент сам выбирает ближайший маршрут, а нужную
          локацию можно закрепить вручную.
        </p>

        <ul className="px-stagger">
          {LOCATIONS.map((l) => (
            <li key={l.city} className="px-loc px-reveal">
              <span className="px-loc-mono" aria-hidden>{l.code}</span>

              <div className="min-w-0">
                <h3 className="text-[20px] sm:text-[24px] font-bold leading-tight tracking-[-0.025em] truncate">
                  {l.city}
                </h3>
                <p className="px-caption mt-1">{l.country}</p>
              </div>

              <dl className="px-loc-figures">
                <Figure label="Серверов" value={String(l.servers)} />
                <Figure label="Скорость канала" value={CHANNEL} />
                <Figure label="Задержка" value={`${l.latency} из Москвы`} />
              </dl>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="px-figure-label">{label}</dt>
      <dd className="px-figure-value px-num">{value}</dd>
    </div>
  );
}
