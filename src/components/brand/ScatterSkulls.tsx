import PixelSkull from "./PixelSkull";

/**
 * Черепа россыпью — метки, оставленные на странице.
 *
 * Раскладка выглядит случайной, но считается детерминированно от
 * номера секции: Math.random() при отрисовке дал бы на сервере одну
 * раскладку, а в браузере другую, и React ругался бы на расхождение
 * при гидратации. Здесь генератор с зерном — разметка совпадает.
 *
 * Метки не перехватывают указатель и скрыты от диктора: это граффити
 * на стене, а не элемент интерфейса. Держатся в стороне от центра
 * кадра — по краям и в пустотах, чтобы не лезть в текст.
 */
function seeded(seed: number) {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export default function ScatterSkulls({
  seed = 1,
  count = 5,
}: {
  seed?: number;
  count?: number;
}) {
  const rnd = seeded(seed);
  const marks = Array.from({ length: count }, (_, i) => {
    const r1 = rnd();
    const r2 = rnd();
    const r3 = rnd();
    const r4 = rnd();
    // Полосы по краям: 6–22% слева или 78–94% — центр кадра отдан
    // тексту.
    const left = r1 < 0.5 ? 4 + r2 * 16 : 76 + r2 * 18;
    return {
      key: i,
      left,
      top: 8 + r3 * 82,
      size: 12 + Math.round(r4 * 16),
      rotate: -22 + Math.round(r1 * 44),
      tone: r3 < 0.18 ? "neon" : r3 > 0.88 ? "cyan" : "acid",
      delay: Math.round(r2 * 9000),
    };
  });

  return (
    <div className="b-marks" aria-hidden>
      {marks.map((m) => (
        <span
          key={m.key}
          className={`b-mark-spot b-mark-${m.tone}`}
          style={{
            left: `${m.left}%`,
            top: `${m.top}%`,
            transform: `rotate(${m.rotate}deg)`,
            ["--spot-delay" as string]: `${m.delay}ms`,
          }}
        >
          <PixelSkull size={m.size} />
        </span>
      ))}
    </div>
  );
}
