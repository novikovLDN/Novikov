import LocationMarquee from "./LocationMarquee";

/**
 * Полоса доверия сразу под героем.
 *
 * Раньше бегущая строка локаций стояла в середине страницы, внутри
 * секции локаций. Сигналы доверия работают сильнее, когда идут рано —
 * пока решение ещё не принято (research/03.md §4). Перенесена под
 * первый экран как самостоятельный узкий элемент: не секция с
 * заголовком, а тонкая лента, которая продолжает ритм героя.
 */
const LOCATIONS = [
  { code: "DE", city: "Frankfurt", latency: "24 мс" },
  { code: "NL", city: "Amsterdam", latency: "32 мс" },
  { code: "AT", city: "Vienna", latency: "38 мс" },
  { code: "US", city: "New York", latency: "120 мс" },
];

export default function TrustBand() {
  return <LocationMarquee locations={LOCATIONS} />;
}
