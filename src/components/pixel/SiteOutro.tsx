import Link from "next/link";
import Icon from "./Icon";
import SiteFooter from "./SiteFooter";
import CubeCluster from "./CubeCluster";

/**
 * Финальная зона: призыв и футер.
 *
 * Этим заканчивается каждая публичная страница, поэтому блок общий:
 * иначе у страниц заводятся расходящиеся наборы ссылок на разделы
 * сайта — второй источник правды о структуре.
 *
 * Кластер кубиков здесь другой формы, чем в герое: короткая
 * восходящая ступень. Мотив тот же, но повторять первый экран
 * буквально не нужно — иначе низ страницы читается как её начало.
 */
const OUTRO_SHAPE = [
  "....XX",
  "...XX.",
  "..XX..",
  ".XX...",
  "XX....",
];

const DEFAULT_TITLE = ["Стабильный интернет —", "за минуту"];
const DEFAULT_LEDE =
  "Регистрация занимает 30 секунд и не требует карты. Первые три дня — бесплатно.";

export default function SiteOutro({
  primaryHref = "/auth",
  title = DEFAULT_TITLE,
  lede = DEFAULT_LEDE,
}: {
  primaryHref?: string;
  title?: string[];
  lede?: string;
}) {
  return (
    <>
      <section className="px-section" aria-labelledby="final-title">
        <div className="px-shell">
          <div className="px-outro-card px-reveal">
            <div className="px-outro-copy">
              <h2 id="final-title" className="px-h2">
                {title.map((line, i) => (
                  <span key={line} className="block">
                    {line}
                    {i < title.length - 1 ? " " : ""}
                  </span>
                ))}
              </h2>
              <p className="px-lede mt-5">{lede}</p>

              <div className="px-cta mt-8">
                <Link href={primaryHref} className="px-btn px-btn-xl px-btn-primary px-btn-block group">
                  Создать аккаунт
                  <Icon
                    name="arrow-right"
                    size={18}
                    className="transition-transform duration-200 ease-out group-hover:translate-x-1"
                  />
                </Link>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <Link href="/pricing" className="px-btn px-btn-md px-btn-secondary">Тарифы</Link>
                  <Link href="/support" className="px-btn px-btn-md px-btn-secondary">Поддержка</Link>
                </div>
              </div>
            </div>

            <div className="px-outro-art">
              <CubeCluster shape={OUTRO_SHAPE} />
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
