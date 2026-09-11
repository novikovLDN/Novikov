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
 * `.a-js`. Класс ставит строка ниже во время разбора HTML — до первой
 * отрисовки, поэтому уже видимое не мигает «видно → спрятано → видно».
 * Без скрипта класса нет, и страница отрисована в конечном виде.
 *
 * `?static=1` вместо класса ставит `data-static`: всё холостое и все
 * переходы выключены, кадр стабилен для скриншотов и design-critic
 * (узкое место фазы A, docs/rebrand-2027/00_PHASE_A_REPORT.md, п. 12).
 */
const BOOT =
  "(function(){var d=document.documentElement;" +
  "if(/[?&]static\\b/.test(location.search)){d.setAttribute('data-static','')}" +
  "else{d.classList.add('a-js')}})();";

export default function AtlasShell({
  sheetNo,
  sheetTitle,
  unfold = false,
  children,
}: {
  sheetNo: string;
  sheetTitle: string;
  unfold?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`a ${atlasWide.variable}`}>
      <script dangerouslySetInnerHTML={{ __html: BOOT }} />
      <a href="#main" className="b-skip">К содержимому</a>
      <AtlasHeader sheetNo={sheetNo} sheetTitle={sheetTitle} />
      {unfold ? <Unfold /> : null}
      {children}
      <AtlasFooter />
      <MotionController />
    </div>
  );
}
