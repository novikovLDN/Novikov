/**
 * Единый набор иконок лендинга — принцип 7 (research/concept.md).
 *
 * Один источник правды вместо SVG, разбросанных по восьми секциям.
 * Все глифы нарисованы под одну сетку 24×24, одну толщину штриха и
 * скруглённые концы — поэтому набор читается как один шрифт, а не как
 * коллекция иконок из разных библиотек.
 *
 * Никаких внешних icon-library: каждый глиф — часть дизайн-системы.
 */

export type IconName =
  | "arrow-right"
  | "check"
  | "iphone"
  | "android"
  | "macos"
  | "windows"
  | "tv"
  | "shield"
  | "bolt"
  | "globe"
  | "clock"
  | "menu"
  | "close";

interface IconProps {
  name: IconName;
  /** Сторона квадрата в px. Штрих компенсируется, чтобы вес глифа
   *  visually совпадал на 14px и на 40px. */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/** Тоньше на крупных размерах — оптическая компенсация веса штриха. */
function strokeFor(size: number): number {
  if (size <= 16) return 1.9;
  if (size <= 24) return 1.6;
  if (size <= 32) return 1.45;
  return 1.3;
}

export default function Icon({ name, size = 20, className, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeFor(size)}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}

const PATHS: Record<IconName, React.ReactNode> = {
  "arrow-right": <path d="M4 12h15M13 6l6 6-6 6" />,
  check: <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />,
  iphone: (
    <>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.6" />
      <path d="M10.5 5.6h3" />
    </>
  ),
  android: (
    <>
      <path d="M4 15.5V11a8 8 0 0 1 16 0v4.5" />
      <path d="M4 15.5h16v2.2a2.3 2.3 0 0 1-2.3 2.3H6.3A2.3 2.3 0 0 1 4 17.7z" />
      <path d="M7.6 5.2 6.2 3M16.4 5.2 17.8 3" />
      <path d="M9.6 9.4h.01M14.4 9.4h.01" />
    </>
  ),
  macos: (
    <>
      <rect x="2.5" y="4" width="19" height="12.5" rx="1.8" />
      <path d="M1.5 20h21M9.8 20l.5-3.5M14.2 20l-.5-3.5" />
    </>
  ),
  windows: (
    <>
      <path d="M3.5 6.2 10.4 5v6.3H3.5z" />
      <path d="M12.2 4.7 20.5 3.4v7.9h-8.3z" />
      <path d="M3.5 12.7h6.9V19L3.5 17.8z" />
      <path d="M12.2 12.7h8.3v7.9l-8.3-1.3z" />
    </>
  ),
  tv: (
    <>
      <rect x="2.5" y="4.2" width="19" height="13" rx="2.2" />
      <path d="M8.4 20.8h7.2" />
      <path d="M12 17.2v3.6" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2.9 4.6 6v6.1c0 4.3 3 8.1 7.4 9.3 4.4-1.2 7.4-5 7.4-9.3V6z" />
      <path d="M9.2 12.1 11.3 14.2 15 10.5" />
    </>
  ),
  bolt: <path d="M13.4 2.8 5.2 13.4h5.5l-.9 7.8 8.2-10.6h-5.5z" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9.2" />
      <path d="M2.9 12h18.2" />
      <path d="M12 2.8a13.5 13.5 0 0 1 0 18.4 13.5 13.5 0 0 1 0-18.4z" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9.2" />
      <path d="M12 6.8V12l3.4 2" />
    </>
  ),
  menu: <path d="M3.5 7h17M3.5 12h17M3.5 17h17" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
};
