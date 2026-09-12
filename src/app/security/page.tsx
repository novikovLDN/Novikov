import type { Metadata } from "next";
import Link from "next/link";
import AtlasShell from "@/components/atlas/AtlasShell";
import PointerDrift from "@/components/atlas/PointerDrift";
import { DEVICE_LIMIT } from "@/lib/plans";
import { COUNTRY_COUNT } from "@/lib/locations";
import { TRIAL_DAYS } from "@/lib/brand-facts";
import { plural } from "@/lib/ru-words";
import "./security-atlas.css";

/**
 * /security — лист 16 «Безопасность», корпус «Атлас-издание».
 *
 * Главный объект — два списка: что лежит в базе и чего в ней нет.
 * Второй длиннее, и это видно с первого экрана (полоса ячеек).
 *
 * Состав: 01 ответ · 02 храним и не храним · 03 что видит провайдер
 * (закреплённая сцена: те же пункты закрываются по прокрутке) ·
 * 04 в цифрах · 05 финал.
 *
 * ЧТО СНЯТО С ПРЕЖНЕЙ ВЕРСИИ. «Шифрование канала: AES-256 / ChaCha20»
 * и «ключ хранится на устройстве» — сама страница помечала их как
 * требующие подтверждения конфигурацией, в COMPLIANCE-CHECK.md их нет,
 * а названия алгоритмов — инженерный термин на витрине. Приписка
 * «закрыто ключом, которого у нас нет» у пункта «содержимое трафика»
 * снята по той же причине. Вернуть — вместе с подтверждением.
 *
 * ТРЕБУЕТ ПОДТВЕРЖДЕНИЯ: «не храним посещённые сайты, DNS-запросы,
 * историю подключений» — COMPLIANCE-CHECK.md §4. Строка оставлена:
 * это смысл страницы, и файл советует её подтвердить, а не снимать.
 *
 * Весь моушн — security-atlas.css, раздел «Движение».
 */
export const metadata: Metadata = {
  title: "Безопасность: что мы храним о вас",
  description:
    "Для входа нужна только почта. Не храним ни посещённых сайтов, ни DNS-запросов, " +
    "ни истории подключений, ни IP-адреса. Оба списка — что храним и что нет — целиком на странице.",
  alternates: { canonical: "/security" },
};

/** Что действительно лежит в базе. Список короткий — в этом суть. */
const STORED = [
  "Адрес электронной почты",
  "Дата окончания подписки",
  "Служебный номер, по которому выдаётся ключ",
  "Реферальный код, если вы им пользуетесь",
];

/** Чего в базе нет. Список длиннее — и это главный аргумент страницы. */
const NOT_STORED = [
  "Посещённые сайты",
  "Запросы адресов сайтов (DNS-запросы)",
  "История подключений: когда, откуда, как долго",
  "IP-адрес, с которого вы подключаетесь",
  "Имя, фамилия, отчество",
  "Номер телефона",
  "Почтовый адрес",
  "Данные банковской карты — они остаются у платёжного сервиса",
  "Содержимое трафика",
];

/** Что видно провайдеру без Atlas — из прежней схемы «до и после». */
const SEEN = ["какой сайт вы открыли", "что вы на нём запросили"];

const TRIAL = `${TRIAL_DAYS} ${plural(TRIAL_DAYS, ["день", "дня", "дней"])}`;
const HERO_1 = "что мы знаем о вас";
const HERO_2 = "почту. и всё.";

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

const pad = (n: number) => String(n).padStart(2, "0");

export default function SecurityPage() {
  const nums: Array<[string, string]> = [
    [String(STORED.length), `${plural(STORED.length, ["поле", "поля", "полей"])} о вас в базе`],
    [String(NOT_STORED.length), `${plural(NOT_STORED.length, ["пункт", "пункта", "пунктов"])}, которых мы не храним`],
    ["1", "поле нужно для входа — почта"],
    [String(TRIAL_DAYS), `${plural(TRIAL_DAYS, ["день", "дня", "дней"])} бесплатно, без карты`],
    [String(DEVICE_LIMIT), `${plural(DEVICE_LIMIT, ["устройство", "устройства", "устройств"])} на одной подписке`],
    [String(COUNTRY_COUNT), `${plural(COUNTRY_COUNT, ["страна", "страны", "стран"])} на выбор`],
  ];

  return (
    <AtlasShell sheetNo="16" sheetTitle="Безопасность">
      <PointerDrift target=".asec-cover" />
      <main id="main" className="a-main">
        {/* ── 01 · Ответ ────────────────────────────────────────── */}
        <section className="a-sheet asec-cover" data-sheet="16" data-title="Безопасность" aria-labelledby="asec-title">
          <div className="a-field">
            <h1 id="asec-title" className="asec-display" aria-label="Что мы знаем о вас? Почту. И всё.">
              <span className="asec-line" aria-hidden><Chars text={HERO_1} /></span>
              <span className="asec-line asec-line-2" aria-hidden><Chars text={HERO_2} start={HERO_1.length} /></span>
            </h1>

            {/* Полоса ячеек: закрашено то, что храним, пусто — то, чего нет. */}
            <div className="asec-strip">
              <div className="asec-cells" aria-hidden>
                <div className="asec-cells-move">
                  {Array.from({ length: STORED.length + NOT_STORED.length }, (_, i) => (
                    <i
                      key={i}
                      className={i < STORED.length ? "asec-cell asec-cell-on" : "asec-cell"}
                      style={{ ["--i" as string]: i }}
                    />
                  ))}
                  <span className="asec-scan a-idle" />
                </div>
              </div>
              <p className="asec-cells-cap a-wide">
                {STORED.length} {plural(STORED.length, ["поле", "поля", "полей"])} храним ·{" "}
                {NOT_STORED.length} {plural(NOT_STORED.length, ["пункт", "пункта", "пунктов"])} не храним
              </p>
            </div>

            <div className="asec-cover-grid">
              <p className="a-lead">
                Ниже — оба списка целиком: что лежит в базе и чего в ней нет. Чего у нас нет, того
                нельзя ни украсть, ни передать.
              </p>
              <div>
                <div className="a-actions">
                  <Link href="/auth" className="a-btn a-btn-primary">Попробовать {TRIAL} бесплатно</Link>
                  <Link href="#lists" className="a-btn a-btn-quiet">Смотреть списки</Link>
                </div>
                <p className="a-fine">Для входа нужна только почта.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 02 · Храним и не храним ───────────────────────────── */}
        <section className="a-sheet asec-lists" id="lists" data-sheet="16" data-title="Что храним" aria-labelledby="asec-lists-title">
          <div className="a-field">
            <h2 id="asec-lists-title" className="a-h2 a-settle">
              <span className="a-no">02</span>храним и не храним
            </h2>
            <div className="asec-cols">
              <div className="asec-col">
                <h3 className="asec-col-h a-settle">
                  храним <b className="a-num">{STORED.length}</b>
                </h3>
                <ol className="asec-list">
                  {STORED.map((t, i) => (
                    <li key={t} className="asec-item a-slide" style={{ ["--i" as string]: i, ["--dir" as string]: -1 }}>
                      <span className="asec-n a-wide">{pad(i + 1)}</span>
                      <span className="asec-t">{t}</span>
                    </li>
                  ))}
                </ol>
                <p className="asec-count a-settle" style={{ ["--i" as string]: 5 }}>
                  {STORED.length} {plural(STORED.length, ["поле", "поля", "полей"])}. Всё, что нужно, чтобы
                  подписка работала.
                </p>
              </div>
              <div className="asec-col asec-col-none">
                <h3 className="asec-col-h a-settle" style={{ ["--i" as string]: 1 }}>
                  не храним <b className="a-num">{NOT_STORED.length}</b>
                </h3>
                <ul className="asec-list">
                  {NOT_STORED.map((t, i) => (
                    <li key={t} className="asec-item a-slide" style={{ ["--i" as string]: i, ["--dir" as string]: 1 }}>
                      <span className="asec-n a-wide">
                        {pad(i + 1)}
                        <span className="asec-strike" aria-hidden style={{ ["--i" as string]: i }} />
                      </span>
                      <span className="asec-t">{t}</span>
                    </li>
                  ))}
                </ul>
                <p className="asec-count a-settle" style={{ ["--i" as string]: 10 }}>
                  {NOT_STORED.length} {plural(NOT_STORED.length, ["пункт", "пункта", "пунктов"])}. Этих
                  записей нет, поэтому их нельзя ни запросить у нас, ни украсть у нас.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 03 · Что видит провайдер — закреплённая сцена ─────── */}
        <section className="a-sheet asec-see" data-sheet="16" data-title="Что видит провайдер" aria-labelledby="asec-see-title">
          <div className="asec-stick">
            <div className="a-field">
              <h2 id="asec-see-title" className="a-h2">
                <span className="a-no">03</span>
                <Words text="что видит ваш провайдер" />
              </h2>
              <p className="asec-watch a-wide">
                <span className="asec-eye a-idle" aria-hidden />
                так ваш трафик выглядит со стороны
              </p>

              <div className="asec-rows">
                <div className="asec-row" data-row="open">
                  <p className="asec-row-name a-wide">без Atlas</p>
                  <ul className="asec-chips">
                    {SEEN.map((t) => (
                      <li key={t} className="asec-chip">{t}</li>
                    ))}
                  </ul>
                </div>
                <div className="asec-row" data-row="shut">
                  <p className="asec-row-name a-wide">с Atlas</p>
                  <ul className="asec-chips">
                    {SEEN.map((t, i) => (
                      <li key={t} className="asec-chip asec-chip-shut" style={{ ["--i" as string]: i }}>
                        <span aria-hidden>{t}</span>
                        <span className="b-sr">{t} — не видно</span>
                        <span className="asec-veil" aria-hidden>
                          <span className="a-wide">скрыто</span>
                          <i className="asec-glint a-idle" />
                        </span>
                      </li>
                    ))}
                    <li className="asec-chip asec-chip-on">подключение к серверу Atlas</li>
                  </ul>
                </div>
              </div>

              <p className="a-p asec-see-end">
                Провайдер видит только, что вы подключены к серверу Atlas. Что внутри — нет.
              </p>
            </div>
          </div>
        </section>

        {/* ── 04 · В цифрах ─────────────────────────────────────── */}
        <section className="a-sheet asec-nums-sheet" data-sheet="16" data-title="В цифрах" aria-labelledby="asec-nums-title">
          <div className="a-field">
            <h2 id="asec-nums-title" className="a-h2 a-settle">
              <span className="a-no">04</span>в цифрах
            </h2>
            <dl className="asec-nums">
              {nums.map(([v, label], i) => (
                <div key={label} className="asec-num a-settle" style={{ ["--i" as string]: i + 1 }}>
                  <dt>{label}</dt>
                  <dd className="a-num a-print">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="a-p asec-nums-note a-settle" style={{ ["--i" as string]: 8 }}>
              Названий стандартов, аудитов и сертификатов на этой странице нет — они появятся вместе
              с самими документами.
            </p>
            <div className="a-actions a-settle" style={{ ["--i" as string]: 9 }}>
              <Link href="/privacy" className="a-btn a-btn-quiet">Политика приватности</Link>
              <Link href="/infrastructure" className="a-btn a-btn-quiet">Как устроена сеть</Link>
            </div>
          </div>
        </section>

        {/* ── 05 · Финал ────────────────────────────────────────── */}
        <section className="a-sheet a-plate a-final" data-sheet="16" data-title="Попробовать" aria-labelledby="asec-final-title">
          <div className="a-field">
            <h2 id="asec-final-title" className="a-h2">
              <span className="a-no">05</span>
              <Words text="для входа нужна только почта" />
            </h2>
            <p className="a-p a-settle" style={{ ["--i" as string]: 6 }}>
              {TRIAL} бесплатно, без карты. Не понравится — просто не продлевайте.
            </p>
            <div className="a-actions a-settle" style={{ ["--i" as string]: 8 }}>
              <Link href="/auth" className="a-btn a-btn-invert a-idle">Попробовать бесплатно</Link>
            </div>
          </div>
        </section>
      </main>
    </AtlasShell>
  );
}
