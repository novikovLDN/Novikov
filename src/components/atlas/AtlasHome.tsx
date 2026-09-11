import Link from "next/link";
import AtlasShell from "./AtlasShell";
import AtlasDefs from "./AtlasDefs";
import IsoFragment from "./IsoFragment";
import HeroField from "./HeroField";
import HeroReel from "./HeroReel";
import GlobeGL from "./GlobeGL";
import MissionGL from "./MissionGL";
import PointerDrift from "./PointerDrift";
import LaptopScrub from "./LaptopScrub";
import type { ReactNode } from "react";
import "@/app/home-v5.css";
import {
  PLANS, PLAN_SPEED, PLAN_CONTENT, DEVICE_LIMIT, formatRub, pricePerMonth, type PlanId,
} from "@/lib/plans";
import { LOCATIONS, COUNTRY_COUNT } from "@/lib/locations";
import { TRIAL_DAYS } from "@/lib/brand-facts";
import { SERVER_ENTRY_USD, formatUsd } from "@/lib/servers";
import { plural } from "@/lib/ru-words";
import { FOUNDED } from "@/lib/nav";

/**
 * Главная — «Атлас-издание», редакция 5 (разбор владельца 11.09.2026).
 *
 *   01 буквы поднимаются, объёмные формы из Blender за текстом, нырок
 *   02 закреплённая сцена: слова проявляются, по дорожкам бегут данные —
 *      без Atlas ползут и застревают, с Atlas текут ровно
 *   03 «зум с остановкой»: глобус реального времени за текстом
 *   04 тарифы карточками, ширина канала — шкала
 *   05 линия по прокрутке идёт от кружка к кружку и расплывается
 *   06 ноутбук открывается по прокрутке (кадры Blender, LaptopScrub)
 *   07 миссия и компания, живой объект реального времени
 *   08 кольцо из бесплатных дней заполняется по прокрутке
 *
 * Тексты — польза и короткое объяснение, числа из src/lib.
 *
 * Моушн: atlas.css, раздел 6 (блоки 01–03), home-v5.css (04–08 и поток
 * в 02). Только transform, opacity и шкалы браузера; холостой слой на
 * паузе вне кадра; без скрипта и при reduced-motion — конечный кадр.
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

/** 02 — данные бегут по дорожке: без Atlas ползут и застревают, с Atlas текут ровно. */
function Flow({ n }: { n: number }) {
  return (
    <span className="h5-flow" aria-hidden>
      {Array.from({ length: n }, (_, k) => (
        <i key={k} className="a-idle" style={{ ["--k" as string]: k }} />
      ))}
    </span>
  );
}

/** 05 — три шага. */
const STEPS: { t: string; d: ReactNode }[] = [
  { t: "Войдите по почте", d: "Нужны только адрес и код из письма. Без пароля и без карты." },
  { t: "Поставьте приложение", d: "Ключ и QR-код уже ждут в личном кабинете — отсканируйте код в приложении." },
  {
    t: "Включите",
    d: (
      <>
        Одно касание — дальше всё работает само. <span className="a-on a-idle">включено</span>
      </>
    ),
  },
];

/** 08 — дуги кольца: по одной на каждый бесплатный день, с зазорами. */
function arc(r: number, a0: number, a1: number) {
  const pt = (a: number) => {
    const t = ((a - 90) * Math.PI) / 180;
    return `${(100 + r * Math.cos(t)).toFixed(2)} ${(100 + r * Math.sin(t)).toFixed(2)}`;
  };
  return `M${pt(a0)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${pt(a1)}`;
}
const DAY_ARCS = Array.from({ length: TRIAL_DAYS }, (_, k) => {
  const s = 360 / TRIAL_DAYS;
  return arc(86, k * s + 6, (k + 1) * s - 6);
});

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
    <AtlasShell sheetNo="01" sheetTitle="Главная">
      <AtlasDefs />
      <PointerDrift target=".a-cover" />
      <main id="main" className="a-main">
        {/* ── 01 · Обещание ─────────────────────────────────────── */}
        <section className="a-sheet a-cover" data-sheet="01" data-title="Главная" aria-labelledby="a-cover-title">
          <HeroField />
          <HeroReel />
          <div className="a-field">
            <h1 id="a-cover-title" className="a-display" aria-label={`${HERO_1} ${HERO_2}`}>
              <span className="a-fit a-fit-1" aria-hidden><Chars text={HERO_1} /></span>
              <span className="a-fit a-fit-2" aria-hidden><Chars text={HERO_2} start={HERO_1.length} /></span>
            </h1>

            <div className="a-cover-grid">
              <p className="a-lead">
                VPS-ускоритель для телефона и компьютера. Включаете Atlas <IsoFragment /> — и сайты,
                видео и приложения открываются сразу и на полной скорости.
              </p>
              <div>
                <div className="a-actions">
                  <Link href={enter} className="a-btn a-btn-primary">Попробовать {TRIAL} бесплатно</Link>
                  <Link href="#tariffs" className="a-btn a-btn-quiet">Смотреть тарифы</Link>
                </div>
                <p className="a-fine">
                  Без карты. До {DEVICE_LIMIT} {DEVICE_WORD} в одной подписке. Потом — от {formatRub(PLANS.basic[1])} ₽ в месяц.
                </p>
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
                    <Flow n={5} />
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
                    <Flow n={7} />
                    <span className="a-lane-glint a-idle" />
                  </span>
                  <span className="a-lane-out">открыто</span>
                </div>
              </div>

              <p className="a-p a-why-end">
                Часть сайтов тормозит ещё по дороге к вам. Atlas шифрует трафик и ведёт его в обход,
                через наш сервер в другой стране, — поэтому страница открывается сразу и целиком.
              </p>
            </div>
          </div>
        </section>

        {/* ── 03 · Страны ───────────────────────────────────────── */}
        {/* Зум с остановкой (владелец, 11.09.2026): раздел высотой в
            несколько экранов, сцена в нём закреплена. Пока читатель
            листает, глобус за текстом подъезжает, держится и уходит
            вперёд — atlas.css, 6.8. Без поддержки шкал прокрутки и при
            reduced-motion — обычный раздел с глобусом за текстом. */}
        <section className="a-sheet a-map a-pin" data-sheet="03" data-title="Страны" aria-labelledby="a-map-title">
          <div className="a-pin-stage">
            {/* Глобус из Blender за текстом. Плоская карта с главной
                убрана (владелец, 11.09.2026), осталась на /infrastructure.
                Смысл глобуса — таблицей ниже, для чтеца экрана. */}
            {/* Глобус реального времени (владелец, 11.09.2026: видео 30 fps
                «очень резкое», нужна максимальная плавность). Рисуется на
                частоте экрана — 60/120/240 Гц, движение по реальному
                времени. Без WebGL/WebGPU, при reduced-motion и экономии
                трафика — постер того же глобуса из Blender. */}
            <GlobeGL className="a-globe a-pin-art" poster="/media/globe2.jpg" />
            <div className="a-field a-pin-copy">
              <h2 id="a-map-title" className="a-h2 a-settle">
                <span className="a-no">03</span>{COUNTRY_COUNT} {COUNTRY_WORD}. выбирайте ближайшую
              </h2>
              <p className="a-p a-settle" style={{ ["--i" as string]: 2 }}>
                Чем ближе сервер, тем меньше задержка и тем быстрее открываются сайты и видео. Все{" "}
                {COUNTRY_COUNT} {COUNTRY_WORD} входят в каждый тариф — доплачивать за страну не нужно.
              </p>
            </div>
          </div>
          <div className="a-field">
            {/* Всё, что есть на глобусе, — словами, для чтеца экрана. */}
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
              <span className="a-no">04</span>два тарифа. всё уже включено
            </h2>
            <p className="a-p a-settle" style={{ ["--i" as string]: 1 }}>
              Тарифы отличаются только шириной канала — тем, сколько данных проходит одновременно.
              {" "}{PLAN_CONTENT.basic.name} хватает для сайтов, видео и работы. {PLAN_CONTENT.plus.name}{" "}— для
              игр, стримов и созвонов, где важен каждый кадр.
            </p>

            {/* Тарифы карточками (владелец, 11.09.2026: «полоса непонятная —
                полностью перерисовать»). Ширина канала — шкала, где полная
                длина — самый быстрый тариф; числа — из src/lib/plans.ts. */}
            <div className="h5-plans">
              {(["basic", "plus"] as PlanId[]).map((id, i) => (
                <article
                  key={id}
                  className="h5-plan a-slide"
                  data-plan={id}
                  style={{
                    ["--i" as string]: i,
                    ["--dir" as string]: i ? 1 : -1,
                    ["--sp" as string]: PLAN_SPEED[id] / PLAN_SPEED.plus,
                  }}
                >
                  <h3 className="h5-plan-name">{PLAN_CONTENT[id].name}</h3>
                  <p className="h5-plan-tagline">{PLAN_CONTENT[id].tagline}</p>
                  <div className="h5-speed">
                    <p className="h5-speed-label">Ширина канала</p>
                    <div className="h5-speed-bar" aria-hidden>
                      <i><b className="a-idle" /></i>
                    </div>
                    <p className="h5-speed-val"><b className="a-num">{PLAN_SPEED[id]}</b> Гбит/с</p>
                  </div>
                  <p className="h5-price"><b className="a-num">{formatRub(PLANS[id][1])} ₽</b> в месяц</p>
                  <p className="h5-price-year">за год — {formatRub(pricePerMonth(id, 12))} ₽ в месяц</p>
                  <ul className="h5-feats">
                    {PLAN_CONTENT[id].features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <Link href="/pricing" className={`a-btn ${id === "plus" ? "a-btn-invert" : "a-btn-primary"}`}>
                    Выбрать {PLAN_CONTENT[id].name}
                  </Link>
                </article>
              ))}
            </div>
            <p className="a-legend-note a-settle" style={{ ["--i" as string]: 4 }}>
              В каждом тарифе — до {DEVICE_LIMIT} {DEVICE_WORD}, все {COUNTRY_COUNT} {COUNTRY_WORD} и отмена
              в один клик. За год выходит дешевле, чем помесячно.
            </p>

            <p className="a-servers-line a-settle" style={{ ["--i" as string]: 5 }}>
              Нужен целый сервер для проекта или компании? <Link href="/vds">Выделенные серверы</Link> — от{" "}
              {formatUsd(SERVER_ENTRY_USD)} в месяц.
            </p>
          </div>
        </section>

        {/* ── 05 · Подключение ──────────────────────────────────── */}
        {/* Линия по прокрутке идёт от кружка к кружку и расплывается на
            третьем (владелец, 11.09.2026). На широком экране раздел
            закреплён; шкала — его прокрутка (home-v5.css). */}
        <section className="a-sheet h5-steps" data-sheet="05" data-title="Подключение" id="how" aria-labelledby="a-steps-title">
          <div className="h5-stage">
            <div className="a-field">
              <h2 id="a-steps-title" className="a-h2 a-settle">
                <span className="a-no">05</span>три шага — и всё работает
              </h2>
              <p className="a-p a-settle" style={{ ["--i" as string]: 1 }}>
                Настраивать вручную ничего не нужно. Регистрация, ключ и инструкция — в одном месте.
              </p>
              <div className="h5-track">
                {/* Кружки — в центрах трёх равных колонок (1/6, 1/2, 5/6 ширины).
                    Координаты 1200×72: без non-scaling-stroke, иначе Chrome
                    считает штрих в экранных единицах и линия рвётся на куски. */}
                <svg className="h5-path" viewBox="0 0 1200 72" preserveAspectRatio="none" aria-hidden focusable="false">
                  <path className="h5-path-glow" d="M200 36 C 330 -4, 470 -4, 600 36 S 870 76, 1000 36" pathLength="1" />
                  <path className="h5-path-line" d="M200 36 C 330 -4, 470 -4, 600 36 S 870 76, 1000 36" pathLength="1" />
                </svg>
                <ol className="h5-list">
                  {STEPS.map((s, k) => (
                    <li key={s.t} className="h5-step">
                      <span className="h5-dot" aria-hidden>{k + 1}</span>
                      <h3>{s.t}</h3>
                      <p>{s.d}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* ── 06 · Устройства ───────────────────────────────────── */}
        {/* Список платформ повторяет PLATFORMS в src/app/devices/DevicesView.tsx. */}
        {/* Ноутбук открывается по прокрутке (владелец, 11.09.2026): на
            широком экране раздел закреплён, кадры листает LaptopScrub. */}
        <section className="a-sheet h5-dev" data-sheet="06" data-title="Устройства" data-scrub aria-labelledby="a-devices-title">
          <div className="h5-stage">
            <div className="a-field h5-dev-grid">
              <div>
                <h2 id="a-devices-title" className="a-h2 a-settle">
                  <span className="a-no">06</span>одна подписка на {DEVICE_LIMIT} {DEVICE_WORD}
                </h2>
                <p className="a-lead a-settle" style={{ ["--i" as string]: 1 }}>
                  Телефон, ноутбук, планшет и телевизор — подключайте всё, что есть дома, без доплаты
                  за каждое устройство.
                </p>
                <p className="a-p a-settle" style={{ ["--i" as string]: 2 }}>
                  Atlas работает на iPhone и iPad, Android, Windows, macOS и Android TV. Для каждого
                  устройства есть пошаговая инструкция.
                </p>
                <div className="a-actions a-settle" style={{ ["--i" as string]: 3 }}>
                  <Link href="/devices" className="a-btn a-btn-quiet">Инструкции для устройств</Link>
                </div>
              </div>
              <LaptopScrub className="h5-laptop" />
            </div>
          </div>
        </section>

        {/* ── 07 · Миссия и компания ────────────────────────────── */}
        <section className="a-sheet h5-mission" data-sheet="07" data-title="Компания" aria-labelledby="a-company-title">
          <div className="a-field">
            <h2 id="a-company-title" className="a-h2 a-settle">
              <span className="a-no">07</span>свободный и быстрый интернет для каждого
            </h2>
            <p className="a-lead a-settle" style={{ ["--i" as string]: 1 }}>
              Наша миссия — чтобы интернет у каждого работал свободно и быстро: без тормозов и
              сложных настроек.
            </p>
            <p className="a-p a-settle" style={{ ["--i" as string]: 2 }}>
              Atlas Secure — технологическая компания в составе группы QoDev. Работаем с {FOUNDED} года,
              держим серверы в {COUNTRY_COUNT} {plural(COUNTRY_COUNT, ["стране", "странах", "странах"])},
              в команде больше 100 человек.
            </p>
            <ul>
              <li className="a-p a-settle" style={{ ["--i" as string]: 3 }}>
                <b>Скорость по умолчанию.</b> Сайты, видео и игры должны открываться сразу, где бы вы ни были.
              </li>
              <li className="a-p a-settle" style={{ ["--i" as string]: 4 }}>
                <b>Простота.</b> Вход по почте, ключ в кабинете, включение одним касанием.
              </li>
              <li className="a-p a-settle" style={{ ["--i" as string]: 5 }}>
                <b>Честные условия.</b> {TRIAL} бесплатно без карты, понятные цены и отмена в один клик.
              </li>
              <li className="a-p a-settle" style={{ ["--i" as string]: 6 }}>
                <b>Приватность.</b> Трафик шифруется на пути от вашего устройства до нашего сервера.
              </li>
            </ul>
            <div className="a-actions a-settle" style={{ ["--i" as string]: 7 }}>
              <Link href="/about" className="a-btn a-btn-quiet">Подробнее о компании</Link>
            </div>
          </div>
          {/* Живой объект миссии реального времени: сфера-сеть из узлов
              вокруг стеклянного кобальтового ядра, по сети идёт волна. */}
          <MissionGL className="h5-mission-art" />
        </section>

        {/* ── 08 · Попробовать ──────────────────────────────────── */}
        <section className="a-sheet a-plate a-final" data-sheet="08" data-title="Попробовать" aria-labelledby="a-final-title">
          <Isobaths />
          <div className="a-field">
            <h2 id="a-final-title" className="a-h2">
              <span className="a-no">08</span>
              <Words text={`попробуйте ${TRIAL} бесплатно`} />
            </h2>
            <p className="a-p a-settle" style={{ ["--i" as string]: 6 }}>
              Без карты и без обязательств. Понравится — выберите тариф, нет — просто не продлевайте.
            </p>
            <div className="a-actions a-settle" style={{ ["--i" as string]: 8 }}>
              <Link href={enter} className="a-btn a-btn-invert a-idle">Начать бесплатно</Link>
              <Link href="/contact" className="a-btn a-btn-line">Написать нам</Link>
            </div>
          </div>
          {/* Кольцо из бесплатных дней: заполняется по прокрутке по одному
              дню, по кольцу идёт светлая точка (владелец, 11.09.2026). После
              текста — на телефоне стоит под ним, на широком экране справа. */}
          <div className="h5-days" aria-hidden>
            <svg viewBox="0 0 200 200" focusable="false">
              <circle className="h5-days-track" cx="100" cy="100" r="86" />
              {DAY_ARCS.map((d, k) => (
                <path key={k} className="h5-day" d={d} pathLength="1" style={{ ["--k" as string]: k }} />
              ))}
            </svg>
            <span className="h5-days-orbit a-idle"><i /></span>
            <p className="h5-days-num">
              <b className="a-num">{TRIAL_DAYS}</b>
              {plural(TRIAL_DAYS, ["день", "дня", "дней"])} бесплатно
            </p>
          </div>
        </section>
      </main>
    </AtlasShell>
  );
}
