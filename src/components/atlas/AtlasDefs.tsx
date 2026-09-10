import { bandPath, landHatch, BAND_COUNT } from "@/lib/isochrones";
import { NOON } from "@/lib/sun";

/**
 * Общие фигуры листа: суша и ступени времени ответа.
 *
 * Объявлены один раз и подключаются через `<use>` там, где нужны:
 * фрагмент карты в строке первого экрана и лист карты берут одну и ту
 * же геометрию. Иначе одинаковые пути приехали бы в HTML дважды.
 *
 * Считается на сервере; в клиентский код не попадает. Контейнер не
 * `display: none` — иначе ссылки на фигуры в некоторых движках не
 * рисуются; он сжат до нуля.
 */
export default function AtlasDefs() {
  const [a, b, c] = landHatch(NOON);
  const levels = Array.from({ length: BAND_COUNT }, (_, i) => i + 1);
  return (
    <svg className="a-defs" width="0" height="0" aria-hidden focusable="false">
      <defs>
        <path id="a-land-all" d={a + b + c} vectorEffect="non-scaling-stroke" />
        {levels.map((l) => (
          <path key={l} id={`a-band-${l}`} d={bandPath(l)} />
        ))}
      </defs>
    </svg>
  );
}
