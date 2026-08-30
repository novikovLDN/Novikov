import FinalCtaSection from "./FinalCtaSection";
import SiteFooter from "./SiteFooter";

/**
 * Финальная зона страницы: призыв и футер на одной тёмной поверхности.
 *
 * Вынесено отдельным компонентом, потому что этим заканчивается каждая
 * публичная страница. Раньше у /pricing были собственные оранжевая
 * CTA-секция и собственный футер со своим набором ссылок — то есть
 * второй, расходящийся источник правды о структуре сайта.
 *
 * Светлое тело страницы закрывается тем же материалом, которым
 * открывается: тёмные скобки вокруг светлого содержания.
 */
export default function SiteOutro({
  primaryHref = "/auth",
  title,
  lede,
}: {
  primaryHref?: string;
  title?: string[];
  lede?: string;
}) {
  return (
    <div className="ls-focal ls-outro">
      <div className="ls-aurora" aria-hidden>
        <span />
        <span />
      </div>
      <FinalCtaSection primaryHref={primaryHref} title={title} lede={lede} />
      <SiteFooter />
    </div>
  );
}
