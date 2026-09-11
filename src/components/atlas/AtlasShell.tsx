import { atlasWide } from "@/app/atlas-fonts";
import AtlasHeader from "./AtlasHeader";
import AtlasFooter from "./AtlasFooter";
import MotionController from "./MotionController";
import Unfold from "./Unfold";
import "@/app/atlas.css";

/**
 * Оболочка листа атласа: корпус, поле, шапка на рамке, выходные данные.
 *
 * Состояния, которые прячут содержимое до входа в кадр, объявлены под
 * `.a-js`. Класс ставит строка ATLAS_BOOT в корневом layout во время
 * разбора HTML — до первой отрисовки, поэтому уже видимое не мигает
 * «видно → спрятано → видно». Без скрипта класса нет, и страница
 * отрисована в конечном виде. `?static=1` вместо класса ставит
 * `data-static` (кадр для скриншотов и design-critic).
 *
 * Скрипт живёт в layout, а не здесь (11.09.2026): оболочка
 * перерисовывается при переходе между страницами на клиенте, и React 19
 * на каждом переходе ругался «Encountered a script tag». Layout
 * рендерится на сервере один раз и при переходах не перерисовывается.
 */

export default function AtlasShell({
  sheetNo,
  sheetTitle,
  unfold = false,
  headCta,
  footer = "full",
  children,
}: {
  sheetNo: string;
  sheetTitle: string;
  unfold?: boolean;
  /** Действие справа в шапке; `null` — без него (кабинет). */
  headCta?: { href: string; label: string } | null;
  /** Подвал: полный (витрина) или одна строка реквизитов (рабочие экраны). */
  footer?: "full" | "compact";
  children: React.ReactNode;
}) {
  return (
    <div className={`a ${atlasWide.variable}`}>
      <a href="#main" className="b-skip">К содержимому</a>
      <AtlasHeader sheetNo={sheetNo} sheetTitle={sheetTitle} cta={headCta} />
      {unfold ? <Unfold /> : null}
      {children}
      <AtlasFooter variant={footer} />
      <MotionController />
    </div>
  );
}
