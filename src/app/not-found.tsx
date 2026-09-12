import Link from "next/link";
import type { Metadata } from "next";
import AtlasShell from "@/components/atlas/AtlasShell";
import { TRIAL_DAYS } from "@/lib/brand-facts";
import { plural } from "@/lib/ru-words";

const TRIAL = `${TRIAL_DAYS} ${plural(TRIAL_DAYS, ["день", "дня", "дней"])}`;

export const metadata: Metadata = {
  title: "Страница не найдена",
  robots: { index: false },
};

/**
 * Лист ∅ — «белое пятно» (SCREEN_SCORE.md §2).
 *
 * Ошибка становится позицией бренда: карта честно показывает, где она
 * не снята. Ступени подходят к пятну и обрываются на его кромке.
 */
const RINGS = [5, 4, 3, 2, 1];

export default function NotFound() {
  return (
    <AtlasShell sheetNo="∅" sheetTitle="Страница не найдена">
      <main id="main" className="a-main">
        <section className="a-sheet a-void" data-sheet="∅" aria-labelledby="a-void-title">
          <div className="a-field a-void-in">
            <svg className="a-void-map" viewBox="0 0 600 360" aria-hidden focusable="false">
              {RINGS.map((l) => (
                <ellipse
                  key={l}
                  className="a-void-ring a-idle"
                  data-level={l}
                  style={{ ["--l" as string]: l }}
                  cx="300"
                  cy="180"
                  rx={50 + l * 48}
                  ry={30 + l * 28}
                />
              ))}
              <path
                className="a-void-spot"
                d="M226 152C244 96 352 88 376 138S398 236 318 248 206 214 226 152Z"
              />
            </svg>
            <div>
              <h1 id="a-void-title" className="a-h2">
                <span className="a-no">404</span>такой страницы нет
                <span className="b-sr"> — ошибка 404</span>
              </h1>
              <p className="a-p">
                Возможно, в адресе опечатка или страница переехала. Начните с главной или
                посмотрите тарифы — первые {TRIAL} бесплатно, без карты.
              </p>
              <div className="a-actions">
                <Link href="/" className="a-btn a-btn-primary">На главную</Link>
                <Link href="/pricing" className="a-btn a-btn-quiet">Тарифы</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </AtlasShell>
  );
}
