import type { Metadata } from "next";
import Link from "next/link";
import AtlasShell from "@/components/atlas/AtlasShell";
import PointerDrift from "@/components/atlas/PointerDrift";
import { CITY_COUNT, COUNTRY_COUNT } from "@/lib/locations";
import { DEVICE_LIMIT, PLANS, PLAN_CONTENT, PLAN_SPEED, formatRub } from "@/lib/plans";
import { SERVER_ENTRY_USD, formatUsd } from "@/lib/servers";
import { TRIAL_DAYS } from "@/lib/brand-facts";
import { plural } from "@/lib/ru-words";
import "./about-atlas.css";

/**
 * /about — лист 18 «О нас», корпус «Атлас-издание».
 *
 * Состав: 01 обещание · 02 в цифрах · 03 три правила (закреплённая
 * сцена: слова проявляются по прокрутке) · 04 что мы делаем · 05 финал.
 *
 * ЧТО СНЯТО С ПРЕЖНЕЙ ВЕРСИИ И ПОЧЕМУ. Штаб-квартира и год основания,
 * вехи (миллион пользователей, дата-центры, ISO 27001), реестр
 * («Military-Grade · NSA Suite B · FIPS 140-3», «ISO/IEC 27001 · SOC 2
 * Type II», «Аптайм SLA 99,98% гарантированно», «NOC 24/7/365»),
 * «партнёрская инфраструктура на трёх континентах», «публикуем
 * результаты внешних аудитов». Всё это в COMPLIANCE-CHECK.md стоит с
 * пометкой [ПОДТВЕРДИТЬ]: до документа строку показывать нельзя.
 * Вернуть — вместе с документом, а не осторожной формулировкой.
 *
 * Все числа — из src/lib: страны и города (`locations.ts`), устройства
 * и ширина канала (`plans.ts`), пробный период (`brand-facts.ts`),
 * цена входа в серверы (`servers.ts`).
 *
 * Весь моушн — about-atlas.css, раздел «Движение».
 */
export const metadata: Metadata = {
  title: "О нас",
  description:
    `Atlas Secure — VPS-ускоритель для телефона и компьютера и выделенные серверы. ` +
    `${COUNTRY_COUNT} ${plural(COUNTRY_COUNT, ["страна", "страны", "стран"])}, ` +
    `до ${DEVICE_LIMIT} устройств на подписке. Во что мы верим и что можем подтвердить.`,
  alternates: { canonical: "/about" },
};

const TRIAL = `${TRIAL_DAYS} ${plural(TRIAL_DAYS, ["день", "дня", "дней"])}`;

const HERO_1 = "интернет, который";
const HERO_2 = "просто работает";

/** Три правила. Тексты — из прежней страницы (принципы и манифест),
 *  без названий стандартов, которые не подтверждены. */
const RULES: Array<{ say: string; note: string }> = [
  {
    say: "Чего мы не собираем, того не украдут.",
    note: "Храним почту и срок подписки. Посещённые сайты и история подключений не записываются.",
  },
  {
    say: "Шифрование — не роскошь, а база.",
    note: "Такая же обычная вещь, как электричество или вода.",
  },
  {
    say: "Пишем только то, что можем показать.",
    note: "Страны, скорость и число устройств на этом сайте берутся из того же кода, по которому работает сервис.",
  },
];

/** Сквозная нумерация слов: каждое следующее слово проявляется позже. */
const RULE_STARTS = RULES.reduce<number[]>((acc, r, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + RULES[i - 1].say.split(" ").length);
  return acc;
}, []);
const RULE_WORDS = RULE_STARTS[RULES.length - 1] + RULES[RULES.length - 1].say.split(" ").length;

/** Меридианы шара на первом экране: полуоси эллипсов. */
const MERIDIANS = [1, 0.82, 0.6, 0.34, 0.1];

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

export default function AboutPage() {
  const facts: Array<{ v: string; label: string; flow?: boolean }> = [
    { v: String(COUNTRY_COUNT), label: `${plural(COUNTRY_COUNT, ["страна", "страны", "стран"])} на выбор` },
    { v: String(CITY_COUNT), label: `${plural(CITY_COUNT, ["город", "города", "городов"])} с серверами` },
    { v: String(DEVICE_LIMIT), label: `${plural(DEVICE_LIMIT, ["устройство", "устройства", "устройств"])} на одной подписке` },
    { v: String(PLAN_SPEED.plus), label: `Гбит/с — ширина канала на тарифе ${PLAN_CONTENT.plus.name}`, flow: true },
    { v: String(TRIAL_DAYS), label: `${plural(TRIAL_DAYS, ["день", "дня", "дней"])} бесплатно, без карты` },
  ];

  return (
    <AtlasShell sheetNo="18" sheetTitle="О нас">
      <PointerDrift target=".aa-cover" />
      <main id="main" className="a-main">
        {/* ── 01 · Обещание ─────────────────────────────────────── */}
        <section className="a-sheet aa-cover" data-sheet="18" data-title="О нас" aria-labelledby="aa-title">
          <div className="aa-globe" aria-hidden>
            <div className="aa-globe-move">
              <svg className="aa-globe-svg" viewBox="-110 -110 220 220" focusable="false">
                <circle r="100" className="aa-globe-rim" />
                {[-60, -30, 0, 30, 60].map((lat) => (
                  <ellipse
                    key={lat}
                    className="aa-parallel"
                    cy={Math.round(-Math.sin((lat * Math.PI) / 180) * 100)}
                    rx={Math.round(Math.cos((lat * Math.PI) / 180) * 100)}
                    ry={Math.round(Math.cos((lat * Math.PI) / 180) * 16)}
                  />
                ))}
                {MERIDIANS.map((k, i) => (
                  <ellipse
                    key={k}
                    className={`aa-meridian a-idle${i === 0 ? " aa-meridian-lead" : ""}`}
                    rx={Math.round(k * 100)}
                    ry="100"
                    style={{ ["--i" as string]: i }}
                  />
                ))}
              </svg>
            </div>
          </div>

          <div className="a-field">
            <h1 id="aa-title" className="aa-display" aria-label={`${HERO_1} ${HERO_2}`}>
              <span className="aa-line" aria-hidden><Chars text={HERO_1} /></span>
              <span className="aa-line aa-line-2" aria-hidden><Chars text={HERO_2} start={HERO_1.length} /></span>
            </h1>

            <div className="aa-cover-grid">
              <p className="a-lead">
                Atlas Secure — VPS-ускоритель для телефона и компьютера и выделенные серверы.
                Здесь — во что мы верим и что можем подтвердить.
              </p>
              <div>
                <div className="a-actions">
                  <Link href="/auth" className="a-btn a-btn-primary">Попробовать {TRIAL} бесплатно</Link>
                  <Link href="/infrastructure" className="a-btn a-btn-quiet">Как устроена сеть</Link>
                </div>
                <p className="a-fine">Без карты. Нужна только почта.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 02 · В цифрах ─────────────────────────────────────── */}
        <section className="a-sheet aa-facts-sheet" data-sheet="18" data-title="В цифрах" aria-labelledby="aa-facts-title">
          <div className="a-field">
            <h2 id="aa-facts-title" className="a-h2 a-settle">
              <span className="a-no">02</span>atlas в цифрах
            </h2>
            <dl className="aa-facts">
              {facts.map((f, i) => (
                <div key={f.label} className="aa-fact a-settle" style={{ ["--i" as string]: i + 1 }}>
                  {/* Линейка и знак канала — внутри dt: в <div> списка
                      определений допустимы только dt и dd. */}
                  <dt className="aa-fact-label">
                    <span className="aa-rule" aria-hidden style={{ ["--i" as string]: i }} />
                    {f.label}
                    {f.flow ? (
                      <span className="aa-flow" aria-hidden>
                        <span className="aa-flow-run a-idle" />
                      </span>
                    ) : null}
                  </dt>
                  <dd className="aa-fact-v a-num a-print">{f.v}</dd>
                </div>
              ))}
            </dl>
            <p className="a-fine a-settle" style={{ ["--i" as string]: 7 }}>
              Эти числа не пишутся руками: сайт берёт их из того же кода, что и сервис.
            </p>
          </div>
        </section>

        {/* ── 03 · Три правила — закреплённая сцена ─────────────── */}
        <section className="a-sheet aa-why" data-sheet="18" data-title="Три правила" aria-labelledby="aa-why-title">
          <div className="aa-why-stick">
            <svg className="aa-lines a-idle" viewBox="0 0 1200 400" preserveAspectRatio="none" aria-hidden focusable="false">
              {[60, 150, 240, 330].map((y, k) => (
                <path
                  key={y}
                  d={`M0 ${y} C 300 ${y - 26 + k * 6}, 600 ${y + 30}, 900 ${y - 10} S 1150 ${y + 14}, 1200 ${y}`}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>
            <div className="a-field">
              <h2 id="aa-why-title" className="a-h2">
                <span className="a-no">03</span>три правила
              </h2>
              <ol className="aa-rules">
                {RULES.map((r, i) => (
                  <li key={r.say} className="aa-rulerow">
                    <span className="aa-rule-n a-wide" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                    <p className="aa-say"><Words text={r.say} start={RULE_STARTS[i]} /></p>
                    <p
                      className="aa-note"
                      style={{ ["--at" as string]: `${Math.round(((RULE_STARTS[i] + r.say.split(" ").length) / RULE_WORDS) * 72)}%` }}
                    >
                      {r.note}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ── 04 · Что мы делаем ────────────────────────────────── */}
        <section className="a-sheet aa-make" data-sheet="18" data-title="Что мы делаем" aria-labelledby="aa-make-title">
          <div className="a-field">
            <h2 id="aa-make-title" className="a-h2 a-settle">
              <span className="a-no">04</span>что мы делаем
            </h2>
            <div className="aa-make-list">
              <div className="a-slide" style={{ ["--i" as string]: 0, ["--dir" as string]: -1 }}>
                <Link href="/pricing" className="aa-make-row">
                  <span className="aa-make-name">VPS-ускоритель</span>
                  <span className="aa-make-what">
                    Для телефона и компьютера: сайты и приложения снова открываются на полной скорости.
                  </span>
                  <span className="aa-make-price">
                    от <b className="a-num">{formatRub(PLANS.basic[1])} ₽</b> в месяц
                  </span>
                  <span className="aa-make-sym a-print" aria-hidden>
                    <span className="aa-make-flow a-idle" />
                  </span>
                </Link>
              </div>
              <div className="a-slide" style={{ ["--i" as string]: 1, ["--dir" as string]: 1 }}>
                <Link href="/vds" className="aa-make-row">
                  <span className="aa-make-name">Выделенные серверы</span>
                  <span className="aa-make-what">
                    Сервер целиком: железо ни с кем не делится, ширину канала выбираете сами.
                  </span>
                  <span className="aa-make-price">
                    от <b className="a-num">{formatUsd(SERVER_ENTRY_USD)}</b> в месяц
                  </span>
                  <span className="aa-make-sym aa-make-sym-wide a-print" aria-hidden>
                    <span className="aa-make-flow a-idle" />
                  </span>
                </Link>
              </div>
            </div>
            <p className="aa-more a-settle" style={{ ["--i" as string]: 4 }}>
              Для команды — <Link href="/business">подключения по договору</Link>. Как мы обращаемся с
              данными — <Link href="/security">безопасность</Link>.
            </p>
          </div>
        </section>

        {/* ── 05 · Финал ────────────────────────────────────────── */}
        <section className="a-sheet a-plate a-final" data-sheet="18" data-title="Тарифы" aria-labelledby="aa-final-title">
          <div className="a-field">
            <h2 id="aa-final-title" className="a-h2">
              <span className="a-no">05</span>
              <Words text="выберите свой тариф" />
            </h2>
            <p className="a-p a-settle" style={{ ["--i" as string]: 6 }}>
              Два тарифа, до {DEVICE_LIMIT} {plural(DEVICE_LIMIT, ["устройства", "устройств", "устройств"])} и
              все {COUNTRY_COUNT} {plural(COUNTRY_COUNT, ["страна", "страны", "стран"])} в каждом.
            </p>
            <div className="a-actions a-settle" style={{ ["--i" as string]: 8 }}>
              <Link href="/pricing" className="a-btn a-btn-invert a-idle">Посмотреть тарифы</Link>
            </div>
          </div>
        </section>
      </main>
    </AtlasShell>
  );
}
