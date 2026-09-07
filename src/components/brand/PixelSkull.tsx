/**
 * Знак бренда — череп, собранный из ячеек.
 *
 * Та же ячейка, из которой сложена стена первого экрана и маркеры
 * списков: у знака и у фона один строительный элемент, поэтому марка
 * не выглядит вставленной из другого проекта.
 *
 * Форма задаётся строковой картой, а не путём в SVG: карту видно в
 * коде глазами, и её можно править, не открывая редактор.
 *
 * Череп — знак сети DedSec из референса. Здесь он не копируется, а
 * пересобирается в пиксельной сетке системы: восемь колонок на семь
 * рядов, глазницы и зубы — пропуски, а не отдельные фигуры.
 */
const SKULL = [
  "..XXXX..",
  ".XXXXXX.",
  "XX.XX.XX",
  "XXXXXXXX",
  ".XXXXXX.",
  "..X.X.X.",
  "..XXXX..",
];

export default function PixelSkull({ size = 22 }: { size?: number }) {
  const cols = SKULL[0].length;
  const rows = SKULL.length;
  const cell = size / cols;

  return (
    <span
      className="b-skull"
      style={{
        ["--skull-cols" as string]: cols,
        ["--skull-rows" as string]: rows,
        ["--skull-cell" as string]: `${cell}px`,
      }}
      aria-hidden
    >
      {SKULL.flatMap((row, y) =>
        [...row].map((ch, x) =>
          ch === "X" ? <i key={`${x}-${y}`} style={{ gridArea: `${y + 1} / ${x + 1}` }} /> : null,
        ),
      )}
    </span>
  );
}
