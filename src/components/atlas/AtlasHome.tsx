import Link from "next/link";
import AtlasShell from "./AtlasShell";
import AtlasDefs from "./AtlasDefs";
import IsoFragment from "./IsoFragment";
import HeroField from "./HeroField";
import PointerDrift from "./PointerDrift";
import Chart from "./Chart";
import {
  PLANS, PLAN_SPEED, PLAN_CONTENT, DEVICE_LIMIT, formatRub, pricePerMonth, type PlanId,
} from "@/lib/plans";
import { LOCATIONS, COUNTRY_COUNT } from "@/lib/locations";
import { TRIAL_DAYS } from "@/lib/brand-facts";
import { SERVER_ENTRY_USD, formatUsd } from "@/lib/servers";
import { plural } from "@/lib/ru-words";

/**
 * Главная — «Атлас-издание», редакция 4: погружение.
 *
 * Владелец 11.09.2026: «стиль отличный, блоки переделывай и доделывай
 * каждый детально, больше анимированного погружения». Состав шести
 * блоков прежний (редакция 3), каждый получил свою сцену:
 *
 *   01 буквы поднимаются, поле изохрон за рукой, нырок на уходе
 *   02 закреплённая сцена: слова проявляются, дорожки идут по прокрутке
 *   03 карта входит приближенной и отдаляется, города волной, пакет
 *   04 строки тарифов въезжают с разных сторон
 *   05 цифры шагов с разной глубиной, диагональ прочерчивается
 *   06 слова финала проявляются, кольцо у кнопки
 *
 * Весь моушн — atlas.css, раздел 6. Только transform, opacity и шкалы
 * браузера; холостой слой на паузе вне кадра; без скрипта и при
 * reduced-motion страница отрисована в конечном виде.
 */

const TRIAL = `${TRIAL_DAYS} ${plural(TRIAL_DAYS, ["день", "дня", "дней"])}`;
const COUNTRY_WORD = plural(COUNTRY_COUNT, ["страна", "страны", "стран"]);
const DEVICE_WORD = plural(DEVICE_LIMIT, ["устройство", "устройства", "устройств"]);

const HERO_1 = "всё открывается";
const HERO_2 = "и не тормозит";

/** Плитки распада медленной дорожки: сдвиг растёт к краю, как смаз кадра. */
const MOSH = Array.from({ length: 14 }, (_, i) => {
  const col = i % 7;
  const row = Math.floor(i / 7);
  return Math.round(col * col * 0.55 + (row ? col * 1.5 : 0));
});

/** Изобаты под плитой: линии глубины, светлее плиты. */
const ISOBATHS = Array.from({ length: 7 }, (_, k) => {
  const y0 = 30 + k * 55;
  let d = "";
  for (let x = 0; x <= 1200; x += 40) {
    const y = y0 + 16 * Math.sin(x / 170 + k * 0.9) + 6 * Math.sin(x / 61 + k);
    d += `${x ? "L" : "M"}${x} ${y.toFixed(1)}`;
  }
  return d;
});

function Isobaths() {
  return (
    <svg className="a-isobaths a-idle" viewBox="0 0 1200 400" preserveAspectRatio="none" aria-hidden focusable="false">
      <g className="a-iso-g">
        {ISOBATHS.map((d, i) => (
          <path key={i} d={d} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
    </svg>
  );
}

/**
 * Разбивка по буквам делается сервером: разметка приезжает разобранной,
 * до скрипта ничего не мигает. Чтец экрана получает строку целиком из
 * aria-label заголовка; буквы от него спрятаны.
 */
function Chars({ text, start = 0 }: { text: string; start?: number }) {
  return (
    <>
      {[...text].map((ch, i) =>
        ch === " " ? (
          " "
        ) : (
          <span key={i} className="a-char" style={{ ["--i" as string]: start + i }}>
            {ch}
          </span>
        ),
      )}
    </>
  );
}

/** Разбивка по словам для сцен, где слова проявляются по прокрутке. */
function Words({ text, start = 0 }: { text: string; start?: number }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((w, i) => (
        <span key={i}>
          <span className="a-word" style={{ ["--i" as string]: start + i }}>{w}</span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </>
  );
}

export default function AtlasHome({ referralCode }: { referralCode?: string }) {
  const enter = referralCode ? `/auth?ref=${encodeURIComponent(referralCode)}` : "/auth";

  return (
    <AtlasShell sheetNo="01" sheetTitle="Главная" unfold>
      <AtlasDefs />
      <PointerDrift target=".a-cover" />
      <main id="main" className="a-main">
        {/* ── 01 · Обещание ─────────────────────────────────────── */}
        <section className="a-sheet a-cover" data-sheet="01" data-title="Главная" aria-labelledby="a-cover-title">
          <HeroField />
          <div className="a-field">
            <h1 id="a-cover-title" className="a-display" aria-label={`${HERO_1} ${HERO_2}`}>
              <span className="a-fit a-fit-1" aria-hidden><Chars text={HERO_1} /></span>
              <span className="a-fit a-fit-2" aria-hidden><Chars text={HERO_2} start={HERO_1.length} /></span>
            </h1>

            <div className="a-cover-grid">
              <p className="a-lead">
                VPS-ускоритель для телефона и компьютера. Включаете Atlas <IsoFragment /> — и сайты
                с приложениями снова работают на полной скорости.
              </p>
              <div>
                <div className="a-actions">
                  <Link href={enter} className="a-btn a-btn-primary">Попробовать {TRIAL} бесплатно</Link>
                  <Link href="#tariffs" className="a-btn a-btn-quiet">Тарифы</Link>
                </div>
                <p className="a-fine">Без карты. Потом — от {formatRub(PLANS.basic[1])} ₽ в месяц.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 02 · Проблема и разница — закреплённая сцена ──────── */}
        <section className="a-sheet a-plate a-why" data-sheet="02" data-title="Зачем" aria-labelledby="a-why-title">
          <div className="a-why-stick">
            <Isobaths />
            <div className="a-field">
              <h2 id="a-why-title" className="a-beat"><Words text="Сайты перестали открываться?" /></h2>
              <p className="a-beat a-beat-neg"><Words text="Дело не в вашем интернете." start={3} /></p>

              <div
                className="a-lanes"
                role="img"
                aria-label="Без Atlas страница застревает и не отвечает. С Atlas открывается полностью."
              >
                <div className="a-lane" data-lane="slow">
                  <span className="a-lane-name a-wide">без Atlas</span>
                  <span className="a-lane-track" aria-hidden>
                    <span className="a-lane-fill" />
                    <span className="a-mosh">
                      {MOSH.map((s, i) => (
                        <i key={i} className="a-idle" style={{ ["--s" as string]: `${s}px` }} />
                      ))}
                    </span>
                  </span>
                  <span className="a-lane-out">не отвечает</span>
                </div>
                <div className="a-lane" data-lane="fast">
                  <span className="a-lane-name a-wide">с Atlas</span>
                  <span className="a-lane-track" aria-hidden>
                    <span className="a-lane-fill" />
                    <span className="a-lane-glint a-idle" />
                  </span>
                  <span className="a-lane-out">открыто</span>
                </div>
              </div>

              <p className="a-p a-why-end">
                Atlas шифрует трафик и меняет страну — и открывает то, что перестало открываться.
              </p>
            </div>
          </div>
        </section>

        {/* ── 03 · Страны ───────────────────────────────────────── */}
        <section className="a-sheet a-map" data-sheet="03" data-title="Страны" aria-labelledby="a-map-title">
          <div className="a-field">
            <h2 id="a-map-title" className="a-h2 a-settle">
              <span className="a-no">03</span>{COUNTRY_COUNT} {COUNTRY_WORD}. выбирайте ближайшую
            </h2>
            <p className="a-p a-settle" style={{ ["--i" as string]: 2 }}>
              Чем ближе сервер, тем быстрее. Нажмите на город — покажем отклик.
            </p>

            <Chart />

            {/* Всё, что есть на карте, — словами, для чтеца экрана. */}
            <table className="b-sr">
              <caption>Серверы Atlas Secure и примерный отклик из Москвы</caption>
              <thead>
                <tr><th scope="col">страна</th><th scope="col">город</th><th scope="col">отклик, мс</th></tr>
              </thead>
              <tbody>
                {[...LOCATIONS].sort((a, b) => a.latencyMs - b.latencyMs).map((l) => (
                  <tr key={l.code}>
                    <td>{l.country}</td>
                    <td>{l.cities.join(", ")}</td>
                    <td>примерно {l.latencyMs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── 04 · Тарифы ───────────────────────────────────────── */}
        <section className="a-sheet a-legend" data-sheet="04" data-title="Тарифы" id="tariffs" aria-labelledby="a-legend-title">
          <div className="a-field">
            <h2 id="a-legend-title" className="a-h2 a-settle">
              <span className="a-no">04</span>два тарифа
            </h2>

            <div className="a-legend-group">
              {(["basic", "plus"] as PlanId[]).map((id, i) => (
                <div key={id} className="a-slide" style={{ ["--i" as string]: i, ["--dir" as string]: i ? 1 : -1 }}>
                  <Link
                    href="/pricing"
                    className="a-legend-row"
                    style={{
                      ["--w" as string]: `${Math.max(2, Math.round((PLAN_SPEED[id] / PLAN_SPEED.plus) * 6))}px`,
                      ["--flow" as string]: `${((2.4 * PLAN_SPEED.plus) / PLAN_SPEED[id]).toFixed(2)}s`,
                    }}
                  >
                    <span className="a-legend-name">{PLAN_CONTENT[id].name}</span>
                    <span className="a-sym a-print" aria-hidden>
                      <span className="a-sym-flow a-idle" />
                    </span>
                    <span className="a-legend-val"><b className="a-num">{PLAN_SPEED[id]}</b> Гбит/с</span>
                    <span className="a-legend-price">
                      <b className="a-num">{formatRub(PLANS[id][1])} ₽</b> в месяц
                      <small>за год — {formatRub(pricePerMonth(id, 12))} ₽ в месяц</small>
                    </span>
                    <span className="a-legend-tag">{PLAN_CONTENT[id].tagline}</span>
                  </Link>
                </div>
              ))}
              <p className="a-legend-note a-settle" style={{ ["--i" as string]: 4 }}>
                В каждом — до {DEVICE_LIMIT} {DEVICE_WORD} и все {COUNTRY_COUNT} {COUNTRY_WORD}. Отмена в один клик.
              </p>
            </div>

            <p className="a-servers-line a-settle" style={{ ["--i" as string]: 5 }}>
              Нужен сервер целиком? <Link href="/vds">Выделенные серверы</Link> — от {formatUsd(SERVER_ENTRY_USD)} в месяц.
            </p>
          </div>
        </section>

        {/* ── 05 · Подключение ──────────────────────────────────── */}
        <section className="a-sheet a-steps-sheet" data-sheet="05" data-title="Подключение" id="how" aria-labelledby="a-steps-title">
          <div className="a-field">
            <h2 id="a-steps-title" className="a-h2 a-settle">
              <span className="a-no">05</span>три шага
            </h2>
            <div className="a-steps-wrap">
            {/* Диагональ через три цифры: прочерчивается по прокрутке. */}
            <svg className="a-steps-line" viewBox="0 0 1376 320" preserveAspectRatio="none" aria-hidden focusable="false">
              <path d="M40 55 L509 127 L978 199" pathLength="1" />
            </svg>
            <ol className="a-steps">
              <li className="a-step a-settle">
                <span className="a-step-n" aria-hidden style={{ ["--d" as string]: 0 }}>1</span>
                <h3>Войдите по почте</h3>
                <p>Только адрес и код из письма.</p>
              </li>
              <li className="a-step a-settle" style={{ ["--i" as string]: 3 }}>
                <span className="a-step-n" aria-hidden style={{ ["--d" as string]: 1 }}>2</span>
                <h3>Поставьте приложение</h3>
                <p>Ключ и QR-код ждут в кабинете.</p>
              </li>
              <li className="a-step a-settle" style={{ ["--i" as string]: 6 }}>
                <span className="a-step-n" aria-hidden style={{ ["--d" as string]: 2 }}>3</span>
                <h3>Включите</h3>
                <p>
                  Дальше всё работает само. <span className="a-on a-idle">включено</span>
                </p>
              </li>
            </ol>
            </div>
          </div>
        </section>

        {/* ── 06 · Попробовать ──────────────────────────────────── */}
        <section className="a-sheet a-plate a-final" data-sheet="06" data-title="Попробовать" aria-labelledby="a-final-title">
          <Isobaths />
          <div className="a-field">
            <h2 id="a-final-title" className="a-h2">
              <span className="a-no">06</span>
              <Words text={`попробуйте ${TRIAL} бесплатно`} />
            </h2>
            <p className="a-p a-settle" style={{ ["--i" as string]: 6 }}>Без карты. Не понравится — просто не продлевайте.</p>
            <div className="a-actions a-settle" style={{ ["--i" as string]: 8 }}>
              <Link href={enter} className="a-btn a-btn-invert a-idle">Начать бесплатно</Link>
              <Link href="/contact" className="a-btn a-btn-line">Написать нам</Link>
            </div>
          </div>
        </section>
      </main>
    </AtlasShell>
  );
}
