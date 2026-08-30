/**
 * Логотип Atlas Secure.
 *
 * Формы взяты один в один из канонического источника —
 * src/app/icon.tsx, где логотип задан для иконок приложения. Он не
 * перерисован и не упрощён: единственное отличие — заливка
 * currentColor вместо жёсткого белого, чтобы знак корректно работал
 * и на тёмной шапке, и на светлой поверхности.
 */
export default function BrandMark({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M20 15 L60 15 L60 30 L42 30 L75 63 L63 75 L30 42 L30 60 L15 60 L15 20 Z" />
      <path d="M180 15 L140 15 L140 30 L158 30 L125 63 L137 75 L170 42 L170 60 L185 60 L185 20 Z" />
      <path d="M20 185 L60 185 L60 170 L42 170 L75 137 L63 125 L30 158 L30 140 L15 140 L15 180 Z" />
      <path d="M180 185 L140 185 L140 170 L158 170 L125 137 L137 125 L170 158 L170 140 L185 140 L185 180 Z" />
    </svg>
  );
}
