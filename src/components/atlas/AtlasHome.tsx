import Link from "next/link";
import AtlasShell from "./AtlasShell";
import AtlasDefs from "./AtlasDefs";
import IsoFragment from "./IsoFragment";
import Chart, { READER_DEFAULT } from "./Chart";
import Reading, { NowStamp } from "./Reading";
import {
  PLANS, PLAN_SPEED, PLAN_CONTENT, DEVICE_LIMIT, formatRub, pricePerMonth, type PlanId,
} from "@/lib/plans";
import { LOCATIONS, COUNTRY_COUNT, CLOSEST } from "@/lib/locations";
import { TRIAL_DAYS } from "@/lib/brand-facts";
import { SERVERS, SERVER_ENTRY_USD, formatUsd } from "@/lib/servers";
import { capitalize, plural, wordsFeminine } from "@/lib/ru-words";

/**
 * Главная — «Атлас-издание» (docs/rebrand-2027/SCREEN_SCORE.md).
 *
 * Сайт свёрстан как атлас: пронумерованные листы, легенда, указатель,
 * выходные данные. Палитра «Лоция» — белая бумага, кобальт, серый
 * рельеф (CONCEPTS.md, «Поправки владельца»). Все числа — из кода:
 * `plans.ts`, `locations.ts`, `servers.ts`, `brand-facts.ts`; прописью
 * тоже (`ru-words.ts`).
 *
 * Серверный компонент. Клиентского кода — показание, время, свет на
 * карте, развёртка и один наблюдатель на документ.
 */

const NEAR = [...LOCATIONS].sort((a, b) => a.latencyMs - b.latencyMs).slice(0, 4);

const TRIAL = `${TRIAL_DAYS} ${plural(TRIAL_DAYS, ["день", "дня", "дней"])}`;
const COUNTRIES = `${COUNTRY_COUNT} ${plural(COUNTRY_COUNT, ["страна", "страны", "стран"])}`;
const COUNTRIES_WORDS = `${wordsFeminine(COUNTRY_COUNT)} ${plural(COUNTRY_COUNT, ["страна", "страны", "стран"])}`;
const DEVICES = `${DEVICE_LIMIT} ${plural(DEVICE_LIMIT, ["устройство", "устройства", "устройств"])}`;

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
      {ISOBATHS.map((d, i) => (
        <path key={i} d={d} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

export default function AtlasHome({ referralCode }: { referralCode?: string }) {
  const enter = referralCode ? `/auth?ref=${encodeURIComponent(referralCode)}` : "/auth";
  const basicMonth = formatRub(PLANS.basic[1]);

  const index: Array<{ n: React.ReactNode; what: string; sheet: string; from: string; kind: string; src: string }> = [
    { n: COUNTRY_COUNT, what: "стран с серверами", sheet: "04", from: "карта серверов", kind: "из списка", src: "locations.ts" },
    { n: DEVICE_LIMIT, what: "устройств на одной подписке", sheet: "05", from: "условия подписки", kind: "из условий", src: "plans.ts" },
    { n: `${PLAN_SPEED.plus} Гбит/с`, what: "ширина канала Plus", sheet: "05", from: "прайс", kind: "из прайса", src: "plans.ts" },
    { n: `${PLAN_SPEED.basic} Гбит/с`, what: "ширина канала Basic", sheet: "05", from: "прайс", kind: "из прайса", src: "plans.ts" },
    { n: `${basicMonth} ₽`, what: "Basic помесячно", sheet: "05", from: "прайс", kind: "из прайса", src: "plans.ts" },
    { n: TRIAL, what: "бесплатного доступа, без карты", sheet: "01", from: "условия подписки", kind: "из условий", src: "brand-facts.ts" },
    { n: formatUsd(SERVER_ENTRY_USD), what: "выделенный сервер в месяц, от", sheet: "11", from: "прайс серверов", kind: "из прайса", src: "servers.ts" },
    { n: `${CLOSEST.latencyMs} мс`, what: `${CLOSEST.cities[0]}, время ответа от Москвы`, sheet: "04", from: "карта серверов", kind: "ориентировочно", src: "locations.ts" },
    { n: <Reading live />, what: "отклик этого сайта у вас", sheet: "01", from: "ваш браузер", kind: "замер", src: "браузер" },
  ];

  return (
    <AtlasShell sheetNo="01" sheetTitle="Обложка" unfold>
      <AtlasDefs />
      <main id="main" className="a-main">
        {/* Маршрут читателя — линия на поле листа через всю главную.
            Кобальт прочерчивается по прокрутке документа; без
            поддержки шкалы прокрутки линия прочерчена целиком. */}
        <div className="a-route" aria-hidden>
          <span className="a-route-fill" />
        </div>

        {/* ── Лист 01 · Обложка ─────────────────────────────────── */}
        <section className="a-sheet a-cover" data-sheet="01" data-title="Обложка" aria-labelledby="a-cover-title">
          <div className="a-field">
            <h1 id="a-cover-title" className="a-display">
              <span className="a-fit a-fit-1">одинаково</span>
              <span className="a-fit a-fit-2">отовсюду</span>
            </h1>

            <div className="a-cover-grid">
              <div>
                <p className="a-lead">
                  От <em>вашего города</em> <IsoFragment /> до ближайшего сервера. VPS-ускоритель
                  Atlas&nbsp;Secure: {COUNTRIES}, без просадок.
                </p>
                <div className="a-actions">
                  <Link href={enter} className="a-btn a-btn-primary">{TRIAL} бесплатно</Link>
                  <Link href="/vds" className="a-btn a-btn-quiet">Выделенные серверы</Link>
                </div>
                <p className="a-fine">Без карты. Дальше от {basicMonth} ₽ в месяц.</p>
              </div>

              <aside className="a-cover-side" aria-label="Ближайшие серверы">
                <p className="a-caption">
                  <NowStamp />. {READER_DEFAULT.city}, по умолчанию. Ближайший сервер — {CLOSEST.cities[0]},{" "}
                  {CLOSEST.latencyMs}&nbsp;мс, ориентировочно. Отклик этого сайта у вас — <Reading />.
                </p>
                <ul className="a-near">
                  {NEAR.map((l, i) => (
                    <li key={l.code} className="a-settle" style={{ ["--i" as string]: i }}>
                      <em>{l.cities[0]}</em>
                      <span
                        className="a-near-bar"
                        aria-hidden
                        style={{ ["--w" as string]: `${Math.round((l.latencyMs / NEAR[NEAR.length - 1].latencyMs) * 100)}%` }}
                      >
                        <i />
                      </span>
                      <span><b className="a-num">{l.latencyMs}</b>&nbsp;мс</span>
                    </li>
                  ))}
                </ul>
              </aside>
            </div>
          </div>
        </section>

        {/* ── Лист 02 · Одна и та же страница ───────────────────── */}
        <section className="a-sheet a-lap" data-sheet="02" data-title="Одна и та же страница" aria-labelledby="a-lap-title">
          <div className="a-field">
            <h2 id="a-lap-title" className="a-h2">
              <span className="a-no">лист 02</span>одна и та же страница
            </h2>

            <div
              className="a-lanes"
              role="img"
              aria-label="Без ускорителя страница доходит до 61 процента и не отвечает. Через Atlas загрузка завершается."
            >
              <div className="a-lane" data-lane="slow">
                <span className="a-lane-name a-wide">без ускорителя</span>
                <span className="a-lane-track" aria-hidden>
                  <span className="a-lane-fill" />
                  <span className="a-mosh">
                    {MOSH.map((s, i) => (
                      <i key={i} className="a-idle" style={{ ["--s" as string]: `${s}px` }} />
                    ))}
                  </span>
                </span>
                <span className="a-lane-pct" aria-hidden />
                <em className="a-lane-out">не отвечает</em>
              </div>
              <div className="a-lane" data-lane="fast">
                <span className="a-lane-name a-wide">через Atlas</span>
                <span className="a-lane-track" aria-hidden>
                  <span className="a-lane-fill" />
                  <span className="a-lane-glint a-idle" />
                </span>
                <span className="a-lane-pct" aria-hidden />
                <em className="a-lane-out">готово, {CLOSEST.cities[0]}</em>
              </div>
            </div>

            <p className="a-p a-settle">
              Atlas шифрует соединение и меняет страну выхода — и страница открывается оттуда,
              откуда открывается. Полосы идут ровно настолько, насколько вы пролистали.
            </p>
          </div>
        </section>

        {/* ── Лист 03 · Граница (кто мы) ────────────────────────── */}
        <section className="a-sheet a-plate a-border" data-sheet="03" data-title="Граница" aria-labelledby="a-border-title">
          <Isobaths />
          <div className="a-field">
            <h2 id="a-border-title" className="b-sr">Кто мы</h2>
            <p className="a-beat a-settle">Сайты и приложения перестали открываться.</p>
            <p className="a-beat a-beat-neg a-settle" style={{ ["--i" as string]: 1 }}>Ваш интернет тут ни при чём.</p>
            <p className="a-beat a-settle" style={{ ["--i" as string]: 2 }}>Включите Atlas — и они откроются.</p>

            <div className="a-bounds">
              <p className="a-wide a-bounds-head">мы называем границу</p>
              <ul>
                <li className="a-settle" style={{ ["--i" as string]: 3 }}>
                  <b className="a-num">{DEVICE_LIMIT}</b> {plural(DEVICE_LIMIT, ["устройство", "устройства", "устройств"])} — а не «безлимит».
                </li>
                <li className="a-settle" style={{ ["--i" as string]: 4 }}>
                  <b className="a-num">{COUNTRY_COUNT}</b> {plural(COUNTRY_COUNT, ["страна", "страны", "стран"])} — а не «весь мир».
                </li>
                <li className="a-settle" style={{ ["--i" as string]: 5 }}>
                  Где не знаем точно, пишем <em>ориентировочно</em>.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ── Лист 04 · Карта присутствия ───────────────────────── */}
        <section className="a-sheet a-map" data-sheet="04" data-title={capitalize(COUNTRIES_WORDS)} aria-labelledby="a-map-title">
          <div className="a-field">
            <h2 id="a-map-title" className="a-h2">
              <span className="a-no">лист 04</span>{COUNTRIES_WORDS}
            </h2>
            <p className="a-p">
              Сервер выбираете вы. Нажмите на город — на карте его время ответа от Москвы.
              Всё то же самое — в таблице ниже.
            </p>

            <Chart />

            <div className="a-table-wrap">
              <table className="a-table">
                <caption className="b-sr">Серверы Atlas Secure по времени ответа</caption>
                <thead>
                  <tr>
                    <th scope="col">страна</th>
                    <th scope="col">город</th>
                    <th scope="col" className="a-td-num">от Москвы, мс</th>
                    <th scope="col">материал</th>
                  </tr>
                </thead>
                <tbody>
                  {[...LOCATIONS].sort((a, b) => a.latencyMs - b.latencyMs).map((l) => (
                    <tr key={l.code}>
                      <td>{l.country}</td>
                      <td><em>{l.cities.join(", ")}</em></td>
                      <td className="a-td-num"><span className="a-num">{l.latencyMs}</span></td>
                      <td>ориентировочно</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Лист 05 · Легенда (услуги) ────────────────────────── */}
        <section className="a-sheet a-legend" data-sheet="05" data-title="Легенда" aria-labelledby="a-legend-title">
          <div className="a-field">
            <h2 id="a-legend-title" className="a-h2">
              <span className="a-no">лист 05</span>легенда
            </h2>

            <div className="a-legend-group">
              <p className="a-wide a-legend-head">ускоритель — толщина знака пропорциональна ширине канала</p>
              {(["basic", "plus"] as PlanId[]).map((id, i) => (
                <Link
                  key={id}
                  href="/pricing"
                  className="a-legend-row a-settle"
                  style={{
                    ["--i" as string]: i,
                    ["--w" as string]: `${Math.max(2, Math.round((PLAN_SPEED[id] / PLAN_SPEED.plus) * 6))}px`,
                    ["--flow" as string]: `${((2.4 * PLAN_SPEED.plus) / PLAN_SPEED[id]).toFixed(2)}s`,
                  }}
                >
                  <span className="a-sym a-print" aria-hidden>
                    <span className="a-sym-flow a-idle" />
                  </span>
                  <span className="a-legend-name"><em>{PLAN_CONTENT[id].name}</em></span>
                  <span className="a-legend-val"><b className="a-num">{PLAN_SPEED[id]}</b> Гбит/с</span>
                  <span className="a-legend-price">
                    от <b className="a-num">{formatRub(pricePerMonth(id, 12))}</b> ₽ в месяц при оплате за год,{" "}
                    <b className="a-num">{formatRub(PLANS[id][1])}</b> ₽ помесячно
                  </span>
                </Link>
              ))}
              <p className="a-legend-note">На каждой подписке — до {DEVICES}, все {COUNTRIES}.</p>
            </div>

            <div className="a-legend-group">
              <p className="a-wide a-legend-head">выделенные серверы — от {formatUsd(SERVER_ENTRY_USD)} в месяц</p>
              <Link href="/vds" className="a-servers a-settle" aria-label={`Выделенные серверы: ${SERVERS.map((s) => s.name).join(", ")}`}>
                {SERVERS.map((s) => (
                  <em key={s.id}>{s.name}</em>
                ))}
              </Link>
            </div>

            <div className="a-actions">
              <Link href="/pricing" className="a-btn a-btn-quiet">Все тарифы</Link>
              <Link href="/vds" className="a-btn a-btn-quiet">Выделенные серверы</Link>
            </div>
          </div>
        </section>

        {/* ── Лист 06 · Три шага ────────────────────────────────── */}
        <section className="a-sheet a-steps-sheet" data-sheet="06" data-title="Три шага" id="how" aria-labelledby="a-steps-title">
          <div className="a-field">
            <h2 id="a-steps-title" className="a-h2">
              <span className="a-no">лист 06</span>три шага, и ни одного лишнего
            </h2>
            <ol className="a-steps">
              <li className="a-step a-settle">
                <span className="a-step-n" aria-hidden>1</span>
                <span className="a-step-link" aria-hidden><i className="a-idle" /></span>
                <h3>Почта и код</h3>
                <p>Ни имени, ни телефона, ни карты. Адрес, шестизначный код — и вы внутри.</p>
              </li>
              <li className="a-step a-settle" style={{ ["--i" as string]: 3 }}>
                <span className="a-step-n" aria-hidden>2</span>
                <span className="a-step-link" aria-hidden><i className="a-idle" /></span>
                <h3>Ключ и приложение</h3>
                <p>Кабинет выдаёт ключ и QR-код. Приложение бесплатное и есть на всех платформах.</p>
              </li>
              <li className="a-step a-settle" style={{ ["--i" as string]: 6 }}>
                <span className="a-step-n" aria-hidden>3</span>
                <h3>Включили — работает</h3>
                <p>
                  Дальше соединение поднимается само. <span className="a-on a-idle">включено</span>
                </p>
              </li>
            </ol>
          </div>
        </section>

        {/* ── Лист 07 · Указатель ───────────────────────────────── */}
        <section className="a-sheet a-index-sheet" data-sheet="07" data-title="Указатель" aria-labelledby="a-index-title">
          <div className="a-field">
            <h2 id="a-index-title" className="a-h2">
              <span className="a-no">лист 07</span>указатель
            </h2>
            <p className="a-p">
              Каждое число этого сайта — откуда оно и чем является. Замер снят с вашего устройства,
              остальное — из условий и прайса, оценки названы оценками.
            </p>
            <div className="a-table-wrap">
              <table className="a-table a-index-table">
                <caption className="b-sr">Указатель чисел сайта</caption>
                <thead>
                  <tr>
                    <th scope="col" className="a-td-num">число</th>
                    <th scope="col">что это</th>
                    <th scope="col">лист</th>
                    <th scope="col">откуда</th>
                    <th scope="col">материал</th>
                  </tr>
                </thead>
                <tbody>
                  {index.map((r, i) => (
                    <tr key={i} data-source={r.src} data-kind={r.kind === "замер" ? "measured" : undefined}>
                      <td className="a-td-num"><span className="a-num">{r.n}</span></td>
                      <td>{r.what}</td>
                      <td><span className="a-wide">{r.sheet}</span></td>
                      <td>{r.from}</td>
                      <td>{r.kind}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Лист 08 · Финал ───────────────────────────────────── */}
        <section className="a-sheet a-plate a-final" data-sheet="08" data-title="Проверьте сами" aria-labelledby="a-final-title">
          <Isobaths />
          <div className="a-field">
            <h2 id="a-final-title" className="a-h2">
              <span className="a-no">лист 08</span>проверьте сами
            </h2>
            <p className="a-p">{TRIAL} без карты. Не подойдёт — просто не продлевайте.</p>
            <div className="a-actions">
              <Link href={enter} className="a-btn a-btn-invert">Начать</Link>
              <Link href="/contact" className="a-btn a-btn-line">Написать нам</Link>
            </div>
            <p className="a-here">
              <i className="a-here-dot a-idle" aria-hidden />
              <span className="a-wide">вы здесь</span> — отклик этого сайта у вас <Reading />
            </p>
          </div>
        </section>
      </main>
    </AtlasShell>
  );
}
