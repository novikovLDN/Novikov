import type { Metadata } from "next";
import Link from "next/link";
import AtlasShell from "@/components/atlas/AtlasShell";
import AtlasDefs from "@/components/atlas/AtlasDefs";
import PointerDrift from "@/components/atlas/PointerDrift";
import Chart from "@/components/atlas/Chart";
import { COUNTRY_COUNT, CITY_COUNT, CLOSEST, LOCATIONS } from "@/lib/locations";
import { PLAN_SPEED, PLAN_CONTENT, DEVICE_LIMIT, type PlanId } from "@/lib/plans";
import { SERVERS, SERVER_ENTRY_USD, formatUsd } from "@/lib/servers";
import { plural } from "@/lib/ru-words";
import "./infra-atlas.css";

/**
 * /infrastructure — лист 17 «Инфраструктура», корпус «Атлас-издание».
 *
 * Состав: 01 маршрут трафика · 02 карта присутствия (сцена погружения:
 * карта входит приближенной и отдаляется, города проявляются волной —
 * общий Chart) · 03 три участка пути · 04 что подтверждено, а что нет ·
 * 05 финал.
 *
 * ЧТО СНЯТО С ПРЕЖНЕЙ ВЕРСИИ. «Ключ создаётся на устройстве и не
 * покидает его», разрез стойки («два независимых ввода питания, две
 * границы, фильтр трафика»), «запас считался под вечерний час пик» —
 * ни одно не подтверждено ни кодом, ни COMPLIANCE-CHECK.md. Пункт
 * «история подключений не хранится» убран из колонки «подтверждено
 * кодом»: в COMPLIANCE-CHECK.md §4 он стоит как [ПОДТВЕРДИТЬ].
 * Слово «узел» заменено на «сервер» (поправка владельца 10.09.2026),
 * «магистраль» — на «ширину канала».
 *
 * Весь моушн — infra-atlas.css, раздел «Движение».
 */
const COUNTRY_WORD = plural(COUNTRY_COUNT, ["страна", "страны", "стран"]);
const CITY_WORD = plural(CITY_COUNT, ["город", "города", "городов"]);

export const metadata: Metadata = {
  title: `Серверы в ${COUNTRY_COUNT} ${plural(COUNTRY_COUNT, ["стране", "странах", "странах"])}: где проходит ваш трафик`,
  description:
    `Путь трафика: ваше устройство, сервер Atlas, сайт. ${COUNTRY_COUNT} ${COUNTRY_WORD}, ` +
    `${CITY_COUNT} ${CITY_WORD}, ширина канала до ${PLAN_SPEED.plus} Гбит/с. ` +
    "Страну выбираете сами: чем ближе сервер, тем быстрее открываются сайты.",
  alternates: { canonical: "/infrastructure" },
};

const ROUTE = "M 40 150 C 200 40, 340 210, 520 110 S 820 40, 1000 130";
const STOPS = [
  { x: 40, y: 150, t: "ваше устройство", align: "start" },
  { x: 520, y: 110, t: "сервер Atlas", align: "middle" },
  { x: 1000, y: 130, t: "сайт", align: "end" },
] as const;

const HERO_1 = "где проходит";
const HERO_2 = "ваш трафик";

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

export default function InfrastructurePage() {
  const byLatency = [...LOCATIONS].sort((a, b) => a.latencyMs - b.latencyMs);
  const far = byLatency[byLatency.length - 1];

  return (
    <AtlasShell sheetNo="17" sheetTitle="Инфраструктура">
      <AtlasDefs />
      <PointerDrift target=".ai-cover" />
      <main id="main" className="a-main">
        {/* ── 01 · Маршрут ──────────────────────────────────────── */}
        <section className="a-sheet ai-cover" data-sheet="17" data-title="Инфраструктура" aria-labelledby="ai-title">
          <div className="a-field">
            <h1 id="ai-title" className="ai-display" aria-label={`${HERO_1} ${HERO_2}`}>
              <span className="ai-line" aria-hidden><Chars text={HERO_1} /></span>
              <span className="ai-line ai-line-2" aria-hidden><Chars text={HERO_2} start={HERO_1.length} /></span>
            </h1>

            <div className="ai-route" role="img" aria-label="Путь трафика: ваше устройство, сервер Atlas, сайт">
              <div className="ai-route-move">
                <svg className="ai-route-svg" viewBox="0 0 1040 220" preserveAspectRatio="none" aria-hidden focusable="false">
                  <path className="ai-route-line" d={ROUTE} vectorEffect="non-scaling-stroke" />
                  <path className="ai-route-live" d={ROUTE} pathLength={1} vectorEffect="non-scaling-stroke" />
                  {/* Пакет бежит по маршруту. SMIL — без скрипта; при
                      reduced-motion и ?static=1 его останавливает
                      MotionController (pauseAnimations). */}
                  <circle className="ai-packet" r="6">
                    <animateMotion dur="3.2s" repeatCount="indefinite" path={ROUTE} />
                  </circle>
                </svg>
                {STOPS.map((s, i) => (
                  <span
                    key={s.t}
                    className="ai-stop"
                    data-align={s.align}
                    style={{ left: `${((s.x / 1040) * 100).toFixed(2)}%`, top: `${((s.y / 220) * 100).toFixed(2)}%`, ["--i" as string]: i }}
                  >
                    <i className="a-idle" />
                    <span className="a-wide">{s.t}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="ai-cover-grid">
              <p className="a-lead">
                Три участка пути: ваше устройство, сервер Atlas и сайт. На каждом — только то, что мы
                можем подтвердить.
              </p>
              <div className="a-actions">
                <Link href="#map" className="a-btn a-btn-quiet">Смотреть карту серверов</Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── 02 · Карта — сцена погружения ─────────────────────── */}
        <section className="a-sheet a-map ai-map" id="map" data-sheet="17" data-title="Страны" aria-labelledby="ai-map-title">
          <div className="a-field">
            <h2 id="ai-map-title" className="a-h2 a-settle">
              <span className="a-no">02</span>
              {COUNTRY_COUNT} {COUNTRY_WORD}, {CITY_COUNT} {CITY_WORD}
            </h2>
            <p className="a-p a-settle" style={{ ["--i" as string]: 2 }}>
              Страну выбираете вы, и чем ближе сервер, тем быстрее открываются сайты. Ближайший — {CLOSEST.cities[0]}, примерно {CLOSEST.latencyMs} мс
              из Москвы; самый дальний — {far.cities[0]}, около {far.latencyMs} мс. Это оценки по
              расстоянию, а не замеры.
            </p>

            <Chart />

            <ul className="ai-places" aria-label="Страны и примерный отклик из Москвы">
              {byLatency.map((l, i) => (
                <li key={l.code} className="ai-place a-settle" style={{ ["--i" as string]: Math.min(i, 12) }}>
                  <span className="ai-place-name">{l.country}</span>
                  <span className="ai-place-city">{l.cities.join(", ")}</span>
                  <span className="ai-place-ms a-num">≈{l.latencyMs} мс</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── 03 · Три участка пути ─────────────────────────────── */}
        <section className="a-sheet ai-path" data-sheet="17" data-title="Путь трафика" aria-labelledby="ai-path-title">
          <div className="a-field">
            <h2 id="ai-path-title" className="a-h2 a-settle">
              <span className="a-no">03</span>три участка пути
            </h2>
            <ol className="ai-stages">
              <li className="ai-stage a-slide" style={{ ["--i" as string]: 0, ["--dir" as string]: -1 }}>
                <span className="ai-stage-n" aria-hidden style={{ ["--d" as string]: 0 }}>1</span>
                <div className="ai-stage-body">
                  <p className="ai-stage-where a-wide">на устройстве</p>
                  <h3>Шифрование начинается у вас</h3>
                  <p>
                    Приложение шифрует трафик прямо на телефоне или компьютере. Провайдер видит, что
                    соединение есть, и не видит, что внутри.
                  </p>
                </div>
                <div className="ai-stage-fig">
                  <b className="a-num">{DEVICE_LIMIT}</b>
                  <span>{plural(DEVICE_LIMIT, ["устройство", "устройства", "устройств"])} на одной подписке</span>
                  <span className="a-on a-idle">шифруется</span>
                </div>
              </li>
              <li className="ai-stage a-slide" style={{ ["--i" as string]: 1, ["--dir" as string]: 1 }}>
                <span className="ai-stage-n" aria-hidden style={{ ["--d" as string]: 1 }}>2</span>
                <div className="ai-stage-body">
                  <p className="ai-stage-where a-wide">на сервере</p>
                  <h3>Страну выбираете вы</h3>
                  <p>
                    Сервер в выбранной стране передаёт запрос дальше. Что вы открывали, у нас не
                    записывается.
                  </p>
                </div>
                <div className="ai-stage-fig">
                  <b className="a-num">0</b>
                  <span>записей о том, что вы открывали</span>
                </div>
              </li>
              <li className="ai-stage a-slide" style={{ ["--i" as string]: 2, ["--dir" as string]: -1 }}>
                <span className="ai-stage-n" aria-hidden style={{ ["--d" as string]: 2 }}>3</span>
                <div className="ai-stage-body">
                  <p className="ai-stage-where a-wide">в канале</p>
                  <h3>Ширина канала, а не обещание</h3>
                  <p>
                    Ширина канала — сколько данных проходит одновременно. Чем она шире, тем реже
                    просадки вечером, когда дома все смотрят видео.
                  </p>
                </div>
                <div className="ai-stage-fig ai-bars">
                  {(["basic", "plus"] as PlanId[]).map((id) => (
                    <div
                      key={id}
                      className="ai-bar"
                      style={{
                        ["--w" as string]: `${Math.max(2, Math.round((PLAN_SPEED[id] / PLAN_SPEED.plus) * 8))}px`,
                        ["--flow" as string]: `${((2.4 * PLAN_SPEED.plus) / PLAN_SPEED[id]).toFixed(2)}s`,
                      }}
                    >
                      <span className="ai-bar-name">{PLAN_CONTENT[id].name}</span>
                      <span className="ai-bar-val"><b className="a-num">{PLAN_SPEED[id]}</b> Гбит/с</span>
                      <span className="ai-bar-sym a-print" aria-hidden>
                        <span className="ai-bar-flow a-idle" />
                      </span>
                    </div>
                  ))}
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* ── 04 · Что подтверждено ─────────────────────────────── */}
        <section className="a-sheet ai-honest" data-sheet="17" data-title="Что подтверждено" aria-labelledby="ai-honest-title">
          <div className="a-field">
            <h2 id="ai-honest-title" className="a-h2 a-settle">
              <span className="a-no">04</span>что подтверждено, а что ещё нет
            </h2>
            <div className="ai-honest-cols">
              <div>
                <h3 className="ai-honest-h a-settle" style={{ ["--i" as string]: 1 }}>подтверждено кодом</h3>
                <ul className="ai-honest-list" data-kind="yes">
                  <li className="a-settle" style={{ ["--i" as string]: 2 }}>
                    {COUNTRY_COUNT} {COUNTRY_WORD} и {CITY_COUNT} {CITY_WORD} — список в коде, из него же строится карта
                  </li>
                  <li className="a-settle" style={{ ["--i" as string]: 3 }}>
                    Ширина канала {PLAN_SPEED.basic} и {PLAN_SPEED.plus} Гбит/с — из состава тарифов
                  </li>
                  <li className="a-settle" style={{ ["--i" as string]: 4 }}>
                    {DEVICE_LIMIT} {plural(DEVICE_LIMIT, ["устройство", "устройства", "устройств"])} на подписке
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="ai-honest-h a-settle" style={{ ["--i" as string]: 2 }}>
                  ещё не подтверждено — и мы этого не пишем
                </h3>
                <ul className="ai-honest-list" data-kind="ask">
                  <li className="a-settle" style={{ ["--i" as string]: 3 }}>Названия площадок и точек обмена трафиком — нужно право упоминания</li>
                  <li className="a-settle" style={{ ["--i" as string]: 4 }}>Сертификаты и аудиты — нужен сам документ</li>
                  <li className="a-settle" style={{ ["--i" as string]: 5 }}>Время без сбоев — нужен мониторинг с историей</li>
                  <li className="a-settle" style={{ ["--i" as string]: 6 }}>Отклик по городам — сейчас это оценки, а не замеры</li>
                </ul>
              </div>
            </div>
            <div className="a-actions a-settle" style={{ ["--i" as string]: 8 }}>
              <Link href="/security" className="a-btn a-btn-quiet">Что мы знаем о вас</Link>
            </div>
          </div>
        </section>

        {/* ── 05 · Финал ────────────────────────────────────────── */}
        <section className="a-sheet a-plate a-final" data-sheet="17" data-title="Выделенные серверы" aria-labelledby="ai-final-title">
          <div className="a-field">
            <h2 id="ai-final-title" className="a-h2">
              <span className="a-no">05</span>
              <Words text="нужен сервер целиком?" />
            </h2>
            <p className="a-p a-settle" style={{ ["--i" as string]: 6 }}>
              Выделенные серверы — от {formatUsd(SERVER_ENTRY_USD)} в месяц, {SERVERS.length}{" "}
              {plural(SERVERS.length, ["ступень", "ступени", "ступеней"])} по ширине канала.
            </p>
            <div className="a-actions a-settle" style={{ ["--i" as string]: 8 }}>
              <Link href="/vds" className="a-btn a-btn-invert a-idle">Выделенные серверы</Link>
            </div>
          </div>
        </section>
      </main>
    </AtlasShell>
  );
}
