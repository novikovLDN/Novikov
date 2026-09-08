import Link from "next/link";
import SiteHeader from "@/components/graticule/SiteHeader";
import SiteFooter from "@/components/graticule/SiteFooter";
import { PLANS, PLAN_SPEED, PLAN_CONTENT, DEVICE_LIMIT, formatRub, pricePerMonth } from "@/lib/plans";
import { LOCATIONS, COUNTRY_COUNT, CLOSEST } from "@/lib/locations";
import { TRIAL_DAYS } from "@/lib/brand-facts";
import { SERVER_ENTRY_USD, formatUsd } from "@/lib/servers";
import { landPath, project, MAP_W, MAP_H } from "@/lib/world-map";
import LivePing from "./LivePing";
import SignalTrace from "./SignalTrace";
import SignalField from "./SignalField";
import InvertLens from "./InvertLens";
import "@/app/graticule-home.css";

/**
 * Главная — сцены системы «Гратикул».
 *
 * Разметка написана заново. Прежняя главная была чернильной сборкой на
 * `.b-*`, и перекрасить её токенами значило бы получить старую
 * композицию в новых цветах — а перерисовать нужно было именно
 * композицию.
 *
 * СЕРВЕРНЫЙ КОМПОНЕНТ. Клиентского кода на странице нет вовсе: гонка
 * дорожек идёт CSS-анимацией, появление секций — нативным
 * `animation-timeline: view()`. Прежняя главная тянула gsap с тремя
 * плагинами, Lenis и девять собственных циклов rAF; страница не
 * отдавала стабильный кадр никогда (docs/00_AUDIT.md §5).
 *
 * ЧТО СОХРАНЕНО ИЗ ПРЕЖНЕГО (docs/ANIMATION_INVENTORY.md, «сохранить»):
 *   · первый экран объясняет себя без действий — прибор, а не обещание;
 *   · манифест светлеет от такта к такту;
 *   · задержка нарисована полосой рядом с числом;
 *   · цена — объект, а не таблица;
 *   · все числа приходят из кода.
 *
 * ЧЕГО ЗДЕСЬ НЕТ НАМЕРЕННО: капслок-надзаголовков, строк через
 * средние точки, «→» в кнопках, моноширинных меток, «fade-up» у
 * каждой секции — всё это типовые признаки, а не решения.
 */

/** Ближайшие узлы для списка задержек: пять первых по времени ответа. */
const NEAR = [...LOCATIONS].sort((a, b) => a.latencyMs - b.latencyMs).slice(0, 5);
const MAX_MS = Math.max(...LOCATIONS.map((l) => l.latencyMs));

const PARALLELS = ["60°", "50°", "40°", "30°", "20°", "10°"];

export default function GraticuleHome({ referralCode }: { referralCode?: string }) {
  const enter = referralCode ? `/auth?ref=${encodeURIComponent(referralCode)}` : "/auth";
  const basicMonth = formatRub(PLANS.basic[1]);
  const basicYear = formatRub(pricePerMonth("basic", 12));

  return (
    <div className="g gh">
      <a href="#main" className="b-skip">К содержимому</a>
      <SiteHeader />

      {/* Полоса прочтения: сколько документа пройдено. Считает браузер
          по шкале прокрутки, скрипта нет. */}
      <div className="gh-read" aria-hidden />

      <main id="main">
        {/* ── Сцена 1: прибор ─────────────────────────────────────── */}
        <section className="gh-hero" aria-labelledby="hero-title">
          {/* Гратикул во весь кадр: сетка предъявлена, как на карте.
              Наложение multiply — сетка проходит СКВОЗЬ буквы, а не
              лежит под ними: приём снят с tonik.com и obys.agency
              (research/03_AGENCY_TEARDOWN.md, вывод 3). */}
          <div className="gh-graticule" aria-hidden />

          {/* Лента прибора: единственный холст на сайте. Рисует не
              абстрактную рябь, а длительность кадров браузера на
              устройстве читателя. */}
          <div className="gh-trace-band"><SignalTrace /></div>

          {/* Поле сигнала — материал кадра. Штрихи разворачиваются
              вслед за рукой, как стружка над магнитом. */}
          <div className="gh-field-band"><SignalField /></div>

          {/* Объект первого экрана — сама типографика. Три строки во
              всю ширину, вторая сдвинута, третья выходит за правый
              край. Механика снята с живых референсов: у Exo Ape
              заголовок занимает 83% ширины окна при интерлиньяже 0,9
              и выходит за край кадра (research/refs/exoape--hero.jpg). */}
          <h1 id="hero-title" className="gh-type">
            <span className="gh-line gh-line-1">Ускоритель</span>
            <span className="gh-line gh-line-2">интернета</span>
            {/* Третья строка — не третья ступень заголовка, а выносок:
                четверть кегля, разрядка вместо сжатия, прижат к
                правому краю. Две выключенные строки держат блок, а
                выносок его намеренно рвёт — иначе получается ровный
                прямоугольник без единого события. */}
            <span className="gh-line gh-kicker">без оговорок</span>
          </h1>

          {/* Под заголовком — две колонки, а не одна строка в пустом
              поле. Замер плотности (research/05_MOTION.md) показал 38–63
              узла в кадре против медианы 135 у двадцати референсов и
              заполнение 0,23: правило «первый экран держит четыре вещи»
              экономило внимание за счёт того, что кадр оставался пустым
              на три четверти. Правая колонка — не украшение: это состав
              подписки, за которым читатель иначе уходит вниз. */}
          <div className="gh-say">
            <p className="gh-lead">Atlas&nbsp;Secure — передовое решение VPS-ускорителя.</p>
            <div className="gh-actions">
              <Link href={enter} className="gh-btn gh-btn-primary">
                {TRIAL_DAYS} дня бесплатно
              </Link>
              <Link href="/vds" className="gh-btn gh-btn-quiet">
                Выделенные серверы
              </Link>
            </div>
            <p className="gh-fine">Без карты. Дальше от {basicMonth} ₽ в месяц.</p>
          </div>

          {/* Правая колонка несёт ДРУГОЕ содержание, а не те же числа
              крупнее: приборная полоса внизу уже говорит «19 стран,
              14 устройств, 75 Гбит/с». Здесь — конкретика за словом
              «19»: ближайшие узлы и время ответа каждого, с полосой
              вместо второго числа. Значения из src/lib/locations.ts. */}
          <ul className="gh-brief" aria-label="Ближайшие узлы и время ответа">
            {NEAR.slice(0, 4).map((l) => (
              <li key={l.code}>
                <span className="gh-brief-city">{l.cities[0]}</span>
                <span
                  className="gh-brief-bar"
                  aria-hidden
                  /* Нормируем по самому дальнему из ПОКАЗАННЫХ узлов, а
                     не по самому дальнему из всех девятнадцати: иначе
                     все четыре полосы упираются в левый край и разницу
                     между 12 и 24 миллисекундами не видно. */
                  style={{ ["--w" as string]: `${Math.round((l.latencyMs / NEAR[3].latencyMs) * 100)}%` }}
                >
                  <i />
                </span>
                <b>{l.latencyMs}<i>мс</i></b>
              </li>
            ))}
          </ul>

          {/* Живое измерение стоит не карточкой сбоку, а пятым
              показанием приборной полосы: это такое же число, как
              остальные, только считанное сейчас и здесь. */}
          <dl className="gh-shell gh-rail">
            <div><dt>стран</dt><dd>{COUNTRY_COUNT}</dd></div>
            <div><dt>устройств</dt><dd>{DEVICE_LIMIT}</dd></div>
            <div><dt>канал</dt><dd>{PLAN_SPEED.plus} Гбит/с</dd></div>
            <div><dt>логи</dt><dd>нет</dd></div>
            <div className="gh-rail-live"><LivePing fallbackMs={CLOSEST.latencyMs} /></div>
            <div className="gh-rail-live">
              <dt>кадров/с, ваш экран</dt>
              <dd id="gh-fps">60</dd>
            </div>
          </dl>
        </section>

        {/* ── Сцена 1а: забег ─────────────────────────────────────── */}
        {/* Сравнение вынесено из первого экрана в собственную сцену и
            отдано прокрутке. Полоса, которая заполняется сама за 2,6 с,
            заканчивается раньше, чем читатель успел понять, что
            сравнивают; полоса, которую он тянет сам, читается. Заливку
            считает браузер по `animation-timeline: view()` — ни строки
            JS. */}
        <section className="gh-lap" aria-labelledby="lap-title">
          <div className="gh-lap-stick">
            <h2 id="lap-title" className="gh-lap-title">Одна и&nbsp;та&nbsp;же страница</h2>
            <div className="gh-lap-grid"
                 role="img"
                 aria-label="Без ускорителя страница доходит до 61 процента и останавливается. Через Atlas загрузка завершается.">
              <div className="gh-lap-row" data-lane="slow">
                <span className="gh-lap-name">без ускорителя</span>
                <span className="gh-lap-track" aria-hidden>
                  <span className="gh-lap-fill gh-lane-slow" />
                  <span className="gh-lap-head" />
                </span>
                {/* Разряды считает браузер: зарегистрированное свойство
                    --lap-n анимируется по той же шкале прокрутки, а
                    счётчик печатает его в ::after. Без JS. */}
                <span className="gh-lap-pct" aria-hidden />
                <span className="gh-lap-out">соединение сброшено</span>
              </div>
              <div className="gh-lap-row" data-lane="fast">
                <span className="gh-lap-name">через Atlas</span>
                <span className="gh-lap-track" aria-hidden>
                  <span className="gh-lap-fill gh-lane-fast" />
                  <span className="gh-lap-head" />
                </span>
                <span className="gh-lap-pct" aria-hidden />
                <span className="gh-lap-out">готово · {CLOSEST.cities[0]}</span>
              </div>
            </div>
            <p className="gh-lap-fine">
              Atlas шифрует трафик и меняет страну выхода — и страница
              открывается оттуда, откуда открывается. Полосы идут ровно
              настолько, насколько вы пролистали.
            </p>
          </div>
        </section>

        {/* ── Сцена 2: манифест ───────────────────────────────────── */}
        <section className="gh-manifest" aria-labelledby="manifest-title">
          <h2 id="manifest-title" className="b-sr">Зачем это нужно</h2>
          <div className="gh-beat gh-beat-1"><p>Сайты и приложения перестали открываться</p></div>
          <div className="gh-beat gh-beat-2"><p>Ваш интернет тут ни при чём</p></div>
          <div className="gh-beat gh-beat-3">
            {/* Приём №55: граница материала проходит сквозь
                строку, а не между блоками. */}
            <p data-line="Включите Atlas — и они откроются">Включите Atlas — и они откроются</p>
          </div>
        </section>

        {/* ── Сцена 3: проверяемые числа ──────────────────────────── */}
        {/* Приём №48: дорожка продублирована, поэтому конца ленты не
            видно. Второй экземпляр скрыт от диктора — иначе он
            прочитает список дважды. */}
        <section className="gh-facts" aria-label="Что входит">
          <div className="gh-facts-track">
          <ul className="gh-shell">
            <li><b>{COUNTRY_COUNT}</b> стран</li>
            <li><b>{DEVICE_LIMIT}</b> устройств на подписке</li>
            <li><b>{PLAN_SPEED.plus}</b> Гбит/с</li>
            <li>логов нет</li>
            <li><b>{TRIAL_DAYS}</b> дня бесплатно</li>
            <li>от <b>{basicMonth}</b> ₽ в месяц</li>
            <li>отмена в один клик</li>
          </ul>
          <ul className="gh-shell" aria-hidden>
            <li><b>{COUNTRY_COUNT}</b> стран</li>
            <li><b>{DEVICE_LIMIT}</b> устройств на подписке</li>
            <li><b>{PLAN_SPEED.plus}</b> Гбит/с</li>
            <li>логов нет</li>
            <li><b>{TRIAL_DAYS}</b> дня бесплатно</li>
            <li>от <b>{basicMonth}</b> ₽ в месяц</li>
            <li>отмена в один клик</li>
          </ul>
          </div>
        </section>

        {/* ── Сцена 4: что внутри подписки ──────────────────────────
            Сцена закреплена: пока читатель проходит её высоту, кадр
            стоит, а состав едет вбок. Прокрутку никто не перехватывает
            — кадр держит `position: sticky`, а сдвиг дорожки считает
            браузер по шкале прокрутки секции. Колесо, жест и клавиши
            работают как обычно, и полоса прочтения идёт ровно. */}
        <section className="gh-scene gh-in gh-hscene" data-col="a" aria-labelledby="inside-title">
          <div className="gh-hstick gh-shell">
          <h2 id="inside-title" className="gh-h2">Что внутри подписки</h2>
          <div className="gh-cells">
            <article className="gh-cell gh-cell-loud">
              <span className="gh-cell-figure">{PLAN_SPEED.plus} Гбит/с</span>
              <h3>Ширина канала</h3>
              <p>
                Запас считался под вечерний час пик. Созвон не рассыпается,
                фильм не встаёт на паузу.
              </p>
            </article>
            <article className="gh-cell">
              <span className="gh-cell-figure">{DEVICE_LIMIT}</span>
              <h3>Устройств</h3>
              <p>Телефон, ноутбук, планшет, телевизор — на одной подписке.</p>
            </article>
            <article className="gh-cell">
              <span className="gh-cell-figure">0</span>
              <h3>Записей о вас</h3>
              <p>Ни посещённых сайтов, ни DNS-запросов, ни истории подключений.</p>
            </article>
            <article className="gh-cell">
              <span className="gh-cell-figure">{COUNTRY_COUNT}</span>
              <h3>Стран на выбор</h3>
              <p>Точку выбираете вы, а не мы за вас.</p>
            </article>
            <article className="gh-cell">
              <span className="gh-cell-figure">1</span>
              <h3>Клик до отмены</h3>
              <p>Без писем в поддержку и разговоров с удерживающим менеджером.</p>
            </article>
          </div>
          </div>
        </section>

        {/* ── Сцена 5: три шага ───────────────────────────────────── */}
        <section className="gh-scene gh-shell gh-in gh-steps-scene" data-col="b" id="how" aria-labelledby="how-title">
          <h2 id="how-title" className="gh-h2">Три шага, и ни одного лишнего</h2>
          {/* Приём №2 каталога: `timeline-scope` отдаёт один
              источник прогресса двум ветвям DOM — этой полосе и
              содержимому списка. Раньше для этого требовался
              наблюдатель и общее состояние в React. */}
          <div className="gh-steps-rail" aria-hidden><span /></div>
          <ol className="gh-steps">
            <li className="gh-step">
              <span className="gh-step-n">01</span>
              <div>
                <h3>Почта и код</h3>
                <p>
                  Ни имени, ни телефона, ни карты. Вводите адрес, получаете
                  шестизначный код, входите.
                </p>
              </div>
              <span className="gh-step-m"><b>30 сек</b><span>на регистрацию</span></span>
            </li>
            <li className="gh-step">
              <span className="gh-step-n">02</span>
              <div>
                <h3>Ключ и приложение</h3>
                <p>
                  Кабинет выдаёт ключ и QR-код. Приложение бесплатное и есть на
                  всех платформах.
                </p>
              </div>
              <span className="gh-step-m"><b>{DEVICE_LIMIT}</b><span>устройств</span></span>
            </li>
            <li className="gh-step">
              <span className="gh-step-n">03</span>
              <div>
                <h3>Включили — работает</h3>
                <p>
                  Дальше соединение поднимается само при запуске. Потом обычная
                  подписка, отмена в один клик.
                </p>
              </div>
              <span className="gh-step-m"><b>{TRIAL_DAYS} дня</b><span>бесплатно</span></span>
            </li>
          </ol>
        </section>

        {/* ── Сцена 6: атлас ──────────────────────────────────────── */}
        <section className="gh-scene gh-shell gh-in" data-col="c" aria-labelledby="atlas-title">
          <h2 id="atlas-title" className="gh-h2 gh-masked">Девятнадцать стран</h2>
          <p className="gh-p">
            Точку выбираете вы. Ближайшая отвечает за {CLOSEST.latencyMs} миллисекунд,
            самая дальняя — за {MAX_MS}.
          </p>

          <div className="gh-atlas-grid">
            {/* Материки набраны точками из текстовой маски 3° × 3°.
                Никаких картографических библиотек и растровых подложек. */}
            <svg
              className="gh-map"
              viewBox={`0 0 ${MAP_W} ${MAP_H * 1.1}`}
              role="img"
              aria-label={`Карта присутствия: ${COUNTRY_COUNT} стран`}
            >
              <path className="gh-map-land" d={landPath(3)} />
              {/* Приём №26: контур вычерчивается по мере чтения.
                  Приём №27: пакет ведёт offset-path — браузер сам
                  двигает точку по кривой, и путь виден в разметке. */}
              <path
                className="gh-map-outline"
                d={landPath(3)}
                fill="none"
                stroke="var(--g-chart)"
                strokeWidth="0.6"
                opacity="0.5"
              />
              {/* Приём №64: цвет узла — его время ответа. Ближние
                  горячие, дальние остывают к чернилам. Легенда —
                  список справа, где то же число написано словами. */}
              {LOCATIONS.map((l) => {
                const { x, y } = project(l.lat, l.lon);
                const k = (l.latencyMs - CLOSEST.latencyMs) / (MAX_MS - CLOSEST.latencyMs || 1);
                return (
                  <circle
                    key={l.code}
                    className="gh-map-node"
                    cx={x}
                    cy={y}
                    r={5}
                    fill={`color-mix(in oklab, var(--g-chart) ${Math.round((1 - k) * 100)}%, var(--g-ink-3))`}
                  />
                );
              })}
              {/* Приём №53: подпись идёт вдоль меридиана. */}
              <path id="gh-meridian" d={`M ${MAP_W * 0.04} ${MAP_H * 1.03} Q ${MAP_W * 0.5} ${MAP_H * 1.11} ${MAP_W * 0.96} ${MAP_H * 1.0}`} fill="none" />
              <text className="gh-meridian-text" fontSize="11" fill="var(--g-ink-3)">
                <textPath className="gh-meridian-label" href="#gh-meridian" startOffset="4%">
                  присутствие Atlas Secure · {COUNTRY_COUNT} стран
                </textPath>
              </text>
            </svg>

            <div>
              <ul className="gh-loc">
                {NEAR.map((l) => (
                  <li key={l.code} style={{ ["--g-heat" as string]: `color-mix(in oklab, var(--g-chart) ${Math.round((1 - (l.latencyMs - CLOSEST.latencyMs) / (MAX_MS - CLOSEST.latencyMs || 1)) * 100)}%, var(--g-ink-3))` }}>
                    <span className="gh-loc-name">{l.cities[0]}</span>
                    <span className="gh-loc-ms">{l.latencyMs} мс</span>
                    <span className="gh-loc-bar" aria-hidden>
                      <span style={{ width: `${(l.latencyMs / MAX_MS) * 100}%` }} />
                    </span>
                  </li>
                ))}
              </ul>
              <p className="gh-note">
                Задержки — оценки, пока их не подтвердит эксплуатация.
              </p>
            </div>
          </div>
        </section>

        {/* ── Сцена 7: цена ───────────────────────────────────────── */}
        {/* Composition: строка во всю ширину, под ней реестр тарифов
            строками. Прежняя версия ставила цифру слева, а карточки
            тарифов справа — ровно та компоновка «текст слева, объект
            справа», от которой отказались на первом экране; на
            странице она держалась ещё в двух местах.

            Ширина канала показана полосой, а не только числом: 25 и 75
            Гбит/с сравнивать на слух трудно, а по длине — мгновенно.
            Длину полосы считает шкала прокрутки. */}
        <section className="gh-scene gh-shell gh-in gh-price-scene" data-col="d" aria-labelledby="price-title">
          <h2 id="price-title" className="gh-h2 gh-price-figure">
            {basicYear}<span className="gh-rub">₽</span> в&nbsp;месяц
          </h2>
          <p className="gh-price-sub">
            Basic при оплате за год. Помесячно — {basicMonth} ₽, отмена в один клик.
          </p>

          <dl className="gh-tiers">
            {(["basic", "plus"] as const).map((id) => (
              <div
                key={id}
                className="gh-tier"
                style={{ ["--w" as string]: `${Math.round((PLAN_SPEED[id] / PLAN_SPEED.plus) * 100)}%` }}
              >
                <dt className="gh-tier-name">{PLAN_CONTENT[id].name}</dt>
                <dd className="gh-tier-speed">{PLAN_SPEED[id]} Гбит/с</dd>
                <dd className="gh-tier-bar" aria-hidden><span /></dd>
                <dd className="gh-tier-price">{formatRub(PLANS[id][1])} ₽<span> в месяц</span></dd>
                <dd className="gh-tier-note">{PLAN_CONTENT[id].tagline}</dd>
              </div>
            ))}
          </dl>

          <p className="gh-note">
            Выделенные серверы — отдельное направление, от {formatUsd(SERVER_ENTRY_USD)} в месяц.
          </p>
          <div className="gh-actions">
            <Link href="/pricing" className="gh-btn gh-btn-quiet">Сравнить тарифы</Link>
          </div>
        </section>

        {/* ── Сцена 8: финал ──────────────────────────────────────── */}
        <section className="gh-outro" aria-labelledby="outro-title">
          <div className="gh-shell">
            <h2 id="outro-title" className="gh-h2 gh-outro-title">
              <Letters text="Проверьте сами" />
            </h2>
            <p className="gh-p">
              {TRIAL_DAYS} дня без карты. Не подойдёт — просто не продлевайте.
            </p>
            <div className="gh-actions">
              <Link href={enter} className="gh-btn gh-btn-primary">Начать</Link>
            </div>
            {/* Приглашение проверить — и рядом то, что читатель уже
                проверил, не нажав ничего. */}
            <p className="gh-outro-live">
              <LivePing fallbackMs={CLOSEST.latencyMs} />
            </p>
          </div>
        </section>
      </main>

      <InvertLens />
      <SiteFooter />
    </div>
  );
}

/**
 * Разбивка строки на буквы для набора «по знакам».
 *
 * Делает это сервер, а не скрипт в браузере: разметка приезжает уже
 * разобранной, и до появления JS ничего не мигает. Диктор читает
 * исходную строку из `aria-label`, а сами буквы от него спрятаны —
 * иначе он произносит их по одной.
 *
 * Разбивка двухуровневая: сначала слова, потом буквы. Без слоя слов
 * браузер переносит строку посреди слова, потому что каждая буква для
 * него — отдельный inline-блок. Номер знака уезжает в --i: по нему
 * CSS сдвигает диапазон прокрутки каждой буквы.
 */
function Letters({ text }: { text: string }) {
  let n = 0;
  return (
    <span className="gh-letters" aria-label={text}>
      {text.split(" ").map((word, w) => (
        <span className="gh-word" key={w} aria-hidden>
          {[...word].map((ch, i) => (
            <span className="gh-letter" key={i} style={{ ["--i" as string]: n++ }}>
              {ch}
            </span>
          ))}
          {w < text.split(" ").length - 1 ? " " : null}
        </span>
      ))}
    </span>
  );
}
