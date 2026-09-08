import Link from "next/link";
import SiteHeader from "@/components/pixel/SiteHeader";
import SiteFooter from "@/components/pixel/SiteFooter";
import { PLANS, PLAN_SPEED, PLAN_CONTENT, DEVICE_LIMIT, formatRub, pricePerMonth } from "@/lib/plans";
import { LOCATIONS, COUNTRY_COUNT, CLOSEST } from "@/lib/locations";
import { TRIAL_DAYS } from "@/lib/brand-facts";
import { SERVER_ENTRY_USD, formatUsd } from "@/lib/servers";
import { landPath, project, MAP_W, MAP_H } from "@/lib/world-map";
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

      <main id="main">
        {/* ── Сцена 1: прибор ─────────────────────────────────────── */}
        <section className="gh-hero" aria-labelledby="hero-title">
          <div className="gh-graticule" aria-hidden>
            {PARALLELS.map((p) => (
              <span key={p} className="gh-parallel">{p}</span>
            ))}
          </div>

          <div className="gh-shell gh-hero-body">
            <div>
              <h1 id="hero-title" className="gh-title">Ускоритель интернета</h1>
              <p className="gh-lead">
                Atlas Secure — передовое решение VPS-ускорителя. Шифрует трафик,
                меняет страну и открывает то, что перестало открываться.
              </p>
              <div className="gh-actions">
                <Link href={enter} className="gh-btn gh-btn-primary">
                  {TRIAL_DAYS} дня бесплатно
                </Link>
                <Link href="/vds" className="gh-btn gh-btn-quiet">
                  Выделенные серверы
                </Link>
              </div>
              <p className="gh-fine">
                Без карты. Дальше от {basicMonth} ₽ в месяц.
              </p>
            </div>

            {/* Прибор: две дорожки идут наперегонки сами. Первый экран
                обязан объяснять себя без действий читателя. */}
            <div
              className="g-plane gh-instrument"
              role="img"
              aria-label={`Сравнение: без ускорителя загрузка доходит до 61 процента и останавливается, через Atlas завершается за ${CLOSEST.latencyMs} миллисекунд`}
            >
              <div className="gh-lane">
                <p className="gh-lane-name">без ускорителя</p>
                <span className="gh-lane-track" aria-hidden>
                  <span className="gh-lane-fill gh-lane-slow" />
                </span>
                <p className="gh-lane-value"><b>61%</b><span>не отвечает</span></p>
              </div>
              <div className="gh-lane">
                <p className="gh-lane-name">с Atlas</p>
                <span className="gh-lane-track" aria-hidden>
                  <span className="gh-lane-fill gh-lane-fast" />
                </span>
                <p className="gh-lane-value">
                  <b>готово</b>
                  <span>{CLOSEST.cities[0]} · {CLOSEST.latencyMs} мс</span>
                </p>
              </div>
            </div>
          </div>

          <dl className="gh-shell gh-rail">
            <div><dt>стран</dt><dd>{COUNTRY_COUNT}</dd></div>
            <div><dt>устройств</dt><dd>{DEVICE_LIMIT}</dd></div>
            <div><dt>канал</dt><dd>{PLAN_SPEED.plus} Гбит/с</dd></div>
            <div><dt>логи</dt><dd>нет</dd></div>
          </dl>
        </section>

        {/* ── Сцена 2: манифест ───────────────────────────────────── */}
        <section className="gh-manifest" aria-labelledby="manifest-title">
          <h2 id="manifest-title" className="b-sr">Зачем это нужно</h2>
          <div className="gh-beat gh-beat-1"><p>Сайты и приложения перестали открываться</p></div>
          <div className="gh-beat gh-beat-2"><p>Ваш интернет тут ни при чём</p></div>
          <div className="gh-beat gh-beat-3"><p>Включите Atlas — и они откроются</p></div>
        </section>

        {/* ── Сцена 3: проверяемые числа ──────────────────────────── */}
        <section className="gh-facts" aria-label="Что входит">
          <ul className="gh-shell">
            <li><b>{COUNTRY_COUNT}</b> стран</li>
            <li><b>{DEVICE_LIMIT}</b> устройств на подписке</li>
            <li><b>{PLAN_SPEED.plus}</b> Гбит/с</li>
            <li>логов нет</li>
            <li><b>{TRIAL_DAYS}</b> дня бесплатно</li>
            <li>от <b>{basicMonth}</b> ₽ в месяц</li>
            <li>отмена в один клик</li>
          </ul>
        </section>

        {/* ── Сцена 4: что внутри подписки ────────────────────────── */}
        <section className="gh-scene gh-shell gh-in" aria-labelledby="inside-title">
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
        </section>

        {/* ── Сцена 5: три шага ───────────────────────────────────── */}
        <section className="gh-scene gh-shell gh-in" id="how" aria-labelledby="how-title">
          <h2 id="how-title" className="gh-h2">Три шага, и ни одного лишнего</h2>
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
        <section className="gh-scene gh-shell gh-in" aria-labelledby="atlas-title">
          <h2 id="atlas-title" className="gh-h2">Девятнадцать стран</h2>
          <p className="gh-p">
            Точку выбираете вы. Ближайшая отвечает за {CLOSEST.latencyMs} миллисекунд,
            самая дальняя — за {MAX_MS}.
          </p>

          <div className="gh-atlas-grid">
            {/* Материки набраны точками из текстовой маски 3° × 3°.
                Никаких картографических библиотек и растровых подложек. */}
            <svg
              className="gh-map"
              viewBox={`0 0 ${MAP_W} ${MAP_H}`}
              role="img"
              aria-label={`Карта присутствия: ${COUNTRY_COUNT} стран`}
            >
              <path className="gh-map-land" d={landPath(3)} />
              {LOCATIONS.map((l) => {
                const { x, y } = project(l.lat, l.lon);
                return <circle key={l.code} className="gh-map-node" cx={x} cy={y} r={5} />;
              })}
            </svg>

            <div>
              <ul className="gh-loc">
                {NEAR.map((l) => (
                  <li key={l.code}>
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
        <section className="gh-scene gh-shell gh-in" aria-labelledby="price-title">
          <h2 id="price-title" className="b-sr">Сколько стоит</h2>
          <div className="gh-price">
            <p className="gh-price-figure">
              {basicYear} ₽
              <small>в месяц, Basic при оплате за год</small>
            </p>
            <div className="gh-plans">
              {(["basic", "plus"] as const).map((id) => (
                <article key={id} className="gh-plan">
                  <h3>{PLAN_CONTENT[id].name}</h3>
                  <span className="gh-plan-speed">{PLAN_SPEED[id]} Гбит/с</span>
                  <p>{PLAN_CONTENT[id].tagline}</p>
                </article>
              ))}
            </div>
          </div>
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
            <h2 id="outro-title" className="gh-h2 gh-outro-title">Проверьте сами</h2>
            <p className="gh-p">
              {TRIAL_DAYS} дня без карты. Не подойдёт — просто не продлевайте.
            </p>
            <div className="gh-actions">
              <Link href={enter} className="gh-btn gh-btn-primary">Начать</Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
