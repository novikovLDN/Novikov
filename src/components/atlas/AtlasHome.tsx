import Link from "next/link";
import AtlasShell from "./AtlasShell";
import AtlasDefs from "./AtlasDefs";
import IsoFragment from "./IsoFragment";
import Chart from "./Chart";
import {
  PLANS, PLAN_SPEED, PLAN_CONTENT, DEVICE_LIMIT, formatRub, pricePerMonth, type PlanId,
} from "@/lib/plans";
import { LOCATIONS, COUNTRY_COUNT } from "@/lib/locations";
import { TRIAL_DAYS } from "@/lib/brand-facts";
import { SERVER_ENTRY_USD, formatUsd } from "@/lib/servers";
import { plural } from "@/lib/ru-words";

/**
 * Главная — «Атлас-издание», редакция 3.
 *
 * Замечание владельца 10.09.2026: «полностью блоки переделывай, много
 * того, что не нужно и тупо звучит». Главная сокращена с восьми
 * блоков до шести, у каждого одна мысль и один объект:
 *
 *   01 обещание · 02 проблема и разница · 03 страны · 04 тарифы ·
 *   05 подключение · 06 попробовать
 *
 * Ушли: таблица «цифры, которые можно проверить», список ближайших
 * серверов, подписи-наблюдения, «без мелкого шрифта», видимая таблица
 * стран (осталась для чтеца экрана) и язык атласа в заголовках.
 * Правило «числа из кода» не тронуто: `plans.ts`, `locations.ts`,
 * `servers.ts`, `brand-facts.ts`.
 */

const TRIAL = `${TRIAL_DAYS} ${plural(TRIAL_DAYS, ["день", "дня", "дней"])}`;
const COUNTRY_WORD = plural(COUNTRY_COUNT, ["страна", "страны", "стран"]);
const DEVICE_WORD = plural(DEVICE_LIMIT, ["устройство", "устройства", "устройств"]);

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

  return (
    <AtlasShell sheetNo="01" sheetTitle="Главная" unfold>
      <AtlasDefs />
      <main id="main" className="a-main">
        {/* ── 01 · Обещание ─────────────────────────────────────── */}
        <section className="a-sheet a-cover" data-sheet="01" data-title="Главная" aria-labelledby="a-cover-title">
          <div className="a-field">
            <h1 id="a-cover-title" className="a-display">
              <span className="a-fit a-fit-1">всё открывается</span>
              <span className="a-fit a-fit-2">и не тормозит</span>
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

        {/* ── 02 · Проблема и разница ───────────────────────────── */}
        <section className="a-sheet a-plate a-why" data-sheet="02" data-title="Зачем" aria-labelledby="a-why-title">
          <Isobaths />
          <div className="a-field">
            <h2 id="a-why-title" className="a-beat a-settle">Сайты перестали открываться?</h2>
            <p className="a-beat a-beat-neg a-settle" style={{ ["--i" as string]: 1 }}>Дело не в вашем интернете.</p>

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

            <p className="a-p a-settle" style={{ ["--i" as string]: 2 }}>
              Atlas шифрует трафик и меняет страну — и открывает то, что перестало открываться.
            </p>
          </div>
        </section>

        {/* ── 03 · Страны ───────────────────────────────────────── */}
        <section className="a-sheet a-map" data-sheet="03" data-title="Страны" aria-labelledby="a-map-title">
          <div className="a-field">
            <h2 id="a-map-title" className="a-h2">
              <span className="a-no">03</span>{COUNTRY_COUNT} {COUNTRY_WORD}. выбирайте ближайшую
            </h2>
            <p className="a-p">Чем ближе сервер, тем быстрее. Нажмите на город — покажем отклик.</p>

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
            <h2 id="a-legend-title" className="a-h2">
              <span className="a-no">04</span>два тарифа
            </h2>

            <div className="a-legend-group">
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
              ))}
              <p className="a-legend-note">
                В каждом — до {DEVICE_LIMIT} {DEVICE_WORD} и все {COUNTRY_COUNT} {COUNTRY_WORD}. Отмена в один клик.
              </p>
            </div>

            <p className="a-servers-line">
              Нужен сервер целиком? <Link href="/vds">Выделенные серверы</Link> — от {formatUsd(SERVER_ENTRY_USD)} в месяц.
            </p>
          </div>
        </section>

        {/* ── 05 · Подключение ──────────────────────────────────── */}
        <section className="a-sheet a-steps-sheet" data-sheet="05" data-title="Подключение" id="how" aria-labelledby="a-steps-title">
          <div className="a-field">
            <h2 id="a-steps-title" className="a-h2">
              <span className="a-no">05</span>три шага
            </h2>
            <ol className="a-steps">
              <li className="a-step a-settle">
                <span className="a-step-n" aria-hidden>1</span>
                <h3>Войдите по почте</h3>
                <p>Только адрес и код из письма.</p>
              </li>
              <li className="a-step a-settle" style={{ ["--i" as string]: 3 }}>
                <span className="a-step-n" aria-hidden>2</span>
                <h3>Поставьте приложение</h3>
                <p>Ключ и QR-код ждут в кабинете.</p>
              </li>
              <li className="a-step a-settle" style={{ ["--i" as string]: 6 }}>
                <span className="a-step-n" aria-hidden>3</span>
                <h3>Включите</h3>
                <p>
                  Дальше всё работает само. <span className="a-on a-idle">включено</span>
                </p>
              </li>
            </ol>
          </div>
        </section>

        {/* ── 06 · Попробовать ──────────────────────────────────── */}
        <section className="a-sheet a-plate a-final" data-sheet="06" data-title="Попробовать" aria-labelledby="a-final-title">
          <Isobaths />
          <div className="a-field">
            <h2 id="a-final-title" className="a-h2">
              <span className="a-no">06</span>попробуйте {TRIAL} бесплатно
            </h2>
            <p className="a-p">Без карты. Не понравится — просто не продлевайте.</p>
            <div className="a-actions">
              <Link href={enter} className="a-btn a-btn-invert">Начать бесплатно</Link>
              <Link href="/contact" className="a-btn a-btn-line">Написать нам</Link>
            </div>
          </div>
        </section>
      </main>
    </AtlasShell>
  );
}
