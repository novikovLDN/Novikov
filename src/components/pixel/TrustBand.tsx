import LocationMarquee from "./LocationMarquee";
import { LOCATIONS, latencyLabel } from "@/lib/locations";

/**
 * Полоса доверия сразу под героем.
 *
 * Сигналы доверия работают сильнее, когда идут рано — пока решение
 * ещё не принято (research/03.md §4). Это не секция с заголовком, а
 * тонкая лента, которая продолжает ритм первого экрана.
 *
 * Состав берётся из общего источника (src/lib/locations.ts): лента и
 * список ниже обязаны показывать одну и ту же сеть.
 */
export default function TrustBand() {
  const locations = LOCATIONS.map((l) => ({
    code: l.code,
    city: l.cities[0],
    latency: latencyLabel(l),
  }));

  return <LocationMarquee locations={locations} />;
}
