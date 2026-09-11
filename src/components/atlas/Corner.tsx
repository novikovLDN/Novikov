import Link from "next/link";
import Icon from "@/components/pixel/Icon";

/**
 * Круглая кнопка в вырезе угла панели (референс владельца 11.09.2026:
 * кружок со стрелкой, врезанный в угол карточки). Вырез рисует кольцо
 * цвета доски вокруг кнопки — src/app/work-atlas.css, «.ak-corner». Общая для рабочих экранов (кабинет, вход).
 * Стрелка смотрит ↗, на наведение выпрямляется в →.
 */
export default function Corner({ href, label, external = false }: { href: string; label: string; external?: boolean }) {
  const arrow = <Icon name="arrow-right" size={16} />;
  return external ? (
    <a className="ak-corner" href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
      {arrow}
    </a>
  ) : (
    <Link className="ak-corner" href={href} aria-label={label}>
      {arrow}
    </Link>
  );
}
