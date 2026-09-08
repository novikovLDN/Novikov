import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/graticule/SiteHeader";
import SiteFooter from "@/components/graticule/SiteFooter";
import { COUNTRY_COUNT, CITY_COUNT, CLOSEST, LOCATIONS, plural } from "@/lib/locations";
import { PLAN_SPEED, DEVICE_LIMIT } from "@/lib/plans";
import "./infra.css";

/**
 * /infrastructure — путешествие по сети.
 *
 * ЧТО БЫЛО. Страница перечисляла Equinix FR5, M9, NEXTDC S2, DE-CIX,
 * MSK-IX, PUE 1.3, ISO 27001, 152-ФЗ и ФСТЭК — ни одно из этих
 * утверждений не подтверждено договором или сертификатом
 * (COMPLIANCE-CHECK.md). Чужие товарные знаки требуют права
 * упоминания, а сертификации — самого сертификата. Всё это снято.
 *
 * ЧТО ВМЕСТО. Четыре главы пути, который проходит трафик: устройство
 * → узел → канал → железо. В каждой — только то, что можно
 * проверить: числа из lib и то, что видно в самом продукте. Плюс
 * отдельная глава о том, чего мы ещё НЕ подтвердили: «названная
 * граница» — позиция бренда, и на этой странице она нужнее всего.
 *
 * ПОЧЕМУ ЗДЕСЬ ПОГРУЖЕНИЕ УМЕСТНО, А НА ДРУГИХ ЭКРАНАХ НЕТ. Читатель
 * приходит сюда с вопросом «как это устроено». На такой вопрос
 * показывают, а не перечисляют. Одиннадцать приёмов каталога, все
 * нативные: ни библиотеки, ни строки клиентского кода.
 */
export const metadata: Metadata = {
  title: "Инфраструктура",
  description:
    `Путь трафика: устройство, узел, канал, железо. ${COUNTRY_COUNT} стран, ` +
    `${CITY_COUNT} городов, канал до ${PLAN_SPEED.plus} Гбит/с.`,
};

/** Разрез стойки знаками: фотографий залов у нас нет, а сток запрещён. */
const RACK = `  ┌─────────────────────────────────────────┐
  │  U42   коммутатор доступа               │
  │  U41   коммутатор доступа   ·  резерв   │
  ├─────────────────────────────────────────┤
  │  U40   маршрутизатор границы            │
  │  U39   маршрутизатор границы ·  резерв  │
  ├─────────────────────────────────────────┤
  │  U38   фильтр трафика                   │
  ├─────────────────────────────────────────┤
  │  U24   узел                             │
  │  U23   узел                             │
  │  U22   узел                             │
  │  U21   узел                             │
  ├─────────────────────────────────────────┤
  │  U08   питание  A                       │
  │  U07   питание  B   ·  независимый ввод │
  └─────────────────────────────────────────┘`;

const ROUTE = "M 40 150 C 200 40, 340 210, 520 110 S 820 40, 1000 130";

export default function InfrastructurePage() {
  const far = [...LOCATIONS].sort((a, b) => b.latencyMs - a.latencyMs)[0];

  return (
    <div className="g gi">
      <SiteHeader />

      <main>
        {/* ── Первый экран: маршрут ───────────────────────────────── */}
        <section className="gi-shell gi-hero" aria-labelledby="infra-title">
          <h1 id="infra-title">Где проходит ваш трафик</h1>
          <p className="gi-lead">
            Четыре участка пути. На каждом написано, что мы делаем и что можем
            подтвердить.
          </p>

          <svg className="gi-route" viewBox="0 0 1040 220" role="img"
               aria-label="Маршрут трафика: устройство, узел Atlas, магистраль, сайт назначения">
            <defs>
              {/* Гуи-фильтр: формы сливаются каплями при сближении.
                  feGaussianBlur размывает, feColorMatrix возвращает
                  резкую границу — классический приём, здесь он
                  изображает слияние потоков в узле. */}
              <filter id="gi-gooey">
                <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="b" />
                <feColorMatrix in="b" mode="matrix"
                  values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" result="g" />
                <feComposite in="SourceGraphic" in2="g" operator="atop" />
              </filter>
            </defs>

            <path className="gi-route-line" d={ROUTE} />
            <path className="gi-route-live" d={ROUTE} pathLength={1} />

            {[
              { x: 40, y: 150, t: "ваше устройство" },
              { x: 520, y: 110, t: "узел Atlas" },
              { x: 1000, y: 130, t: "сайт назначения" },
            ].map((s) => (
              <g key={s.t}>
                <circle className="gi-route-stop" cx={s.x} cy={s.y} r={7} />
                <text className="gi-route-label" x={s.x} y={s.y + 26}
                      textAnchor={s.x > 900 ? "end" : s.x < 100 ? "start" : "middle"}>
                  {s.t}
                </text>
              </g>
            ))}

            {/* Пакет идёт по тому же пути: offset-path берёт кривую
                прямо из разметки, а не повторяет её числами. */}
            <circle className="gi-packet" r={5} style={{ ["--gi-path" as string]: `path("${ROUTE}")` }} />
          </svg>
        </section>

        {/* ── Глава 1: устройство ─────────────────────────────────── */}
        <section className="gi-chapter" aria-labelledby="ch1">
          <div className="gi-shell gi-frame">
            <div>
              <p className="gi-n">01 — устройство</p>
              <h2 id="ch1">Шифрование начинается у вас</h2>
              <p>
                Ключ создаётся на устройстве и не покидает его. Дальше по сети
                идёт уже закрытый трафик: провайдер видит, что соединение есть,
                и не видит, что внутри.
              </p>
              <div className="gi-figures">
                <span className="gi-fig"><b>{DEVICE_LIMIT}</b><span>устройств на подписке</span></span>
                <span className="gi-fig"><b>0</b><span>записей о том, что вы открывали</span></span>
              </div>
            </div>
            <div>
              {/* Полутон: плотность точек показывает, сколько данных
                  остаётся открытым. Слева всё видно, справа — ничего. */}
              <div className="gi-halftone" aria-hidden>
                {Array.from({ length: 96 }, (_, i) => (
                  <i key={i} style={{ opacity: Math.max(0.06, 1 - (i % 24) / 23) }} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Глава 2: узел ───────────────────────────────────────── */}
        <section className="gi-chapter" aria-labelledby="ch2">
          <div className="gi-shell gi-frame">
            <div>
              <p className="gi-n">02 — узел</p>
              <h2 id="ch2">Точку выбираете вы</h2>
              <p>
                {COUNTRY_COUNT} {plural(COUNTRY_COUNT, ["страна", "страны", "стран"])},{" "}
                {CITY_COUNT} {plural(CITY_COUNT, ["город", "города", "городов"])}. Ближайший
                узел отвечает за {CLOSEST.latencyMs} мс, самый дальний — за {far.latencyMs}.
                Задержки — оценки, пока их не подтвердит эксплуатация.
              </p>
              <div className="gi-figures">
                <span className="gi-fig"><b>{COUNTRY_COUNT}</b><span>стран</span></span>
                <span className="gi-fig"><b>{CITY_COUNT}</b><span>городов</span></span>
                <span className="gi-fig"><b>{CLOSEST.latencyMs} мс</b><span>ближайший узел</span></span>
              </div>
            </div>
            <div>
              <svg className="gi-nodes" viewBox="0 0 400 200" role="img"
                   aria-label="Потоки сливаются в узле и расходятся дальше">
                <g className="gi-nodes-gooey">
                  {[38, 74, 110, 146].map((y, i) => (
                    <circle key={y} className="gi-node-quiet" cx={60 + i * 6} cy={y} r={9} />
                  ))}
                  <circle className="gi-node" cx={210} cy={100} r={13} />
                  <circle className="gi-node" cx={244} cy={100} r={10} />
                  {[70, 100, 130].map((y) => (
                    <circle key={y} className="gi-node-quiet" cx={340} cy={y} r={8} />
                  ))}
                </g>
              </svg>
            </div>
          </div>
        </section>

        {/* ── Глава 3: канал ──────────────────────────────────────── */}
        <section className="gi-chapter" aria-labelledby="ch3">
          <div className="gi-shell gi-frame">
            <div>
              <p className="gi-n">03 — канал</p>
              <h2 id="ch3">Ширина трубы, а не обещание</h2>
              <p>
                Канал — это то, сколько данных проходит одновременно. Запас
                считался под вечерний час пик: когда все дома и все смотрят,
                скорость не должна падать.
              </p>
              <div className="gi-figures">
                <span className="gi-fig"><b>{PLAN_SPEED.basic}</b><span>Гбит/с на Basic</span></span>
                <span className="gi-fig"><b>{PLAN_SPEED.plus}</b><span>Гбит/с на Plus</span></span>
              </div>
            </div>
            <div>
              {/* Изолинии: ширина канала показана расходящимися
                  линиями, а не столбиком. Basic тише, Plus громче. */}
              <div className="gi-iso gi-iso-quiet" aria-hidden>
                {Array.from({ length: 6 }, (_, i) => (
                  <span key={i} style={{ width: `${28 + i * 6}%` }} />
                ))}
              </div>
              <div className="gi-iso" style={{ marginTop: "1.25rem" }} aria-hidden>
                {Array.from({ length: 10 }, (_, i) => (
                  <span key={i} style={{ width: `${40 + i * 6}%` }} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Глава 4: железо ─────────────────────────────────────── */}
        <section className="gi-chapter" aria-labelledby="ch4">
          <div className="gi-shell gi-frame">
            <div>
              <p className="gi-n">04 — железо</p>
              <h2 id="ch4">Что стоит в стойке</h2>
              <p>
                Два независимых ввода питания, две границы, фильтр трафика перед
                узлами. Разрез набран знаками, а не снят на камеру: фотографий
                чужих залов у нас нет, а стоковые мы не ставим.
              </p>
            </div>
            <div>
              <pre className="gi-rack" aria-label="Схема стойки: коммутаторы доступа, маршрутизаторы границы, фильтр трафика, узлы, два ввода питания">
                {RACK}
              </pre>
            </div>
          </div>
        </section>

        {/* ── Честный блок ────────────────────────────────────────── */}
        <section className="gi-shell gi-honest" aria-labelledby="honest">
          <h2 id="honest" className="gi-chapter-h2" style={{ margin: 0, fontSize: "var(--g-t-block)", letterSpacing: "-0.02em" }}>
            Что подтверждено, а что ещё нет
          </h2>
          <div className="gi-honest-cols">
            <div>
              <h3>Подтверждено кодом продукта</h3>
              <ul className="gi-col-yes">
                <li>{COUNTRY_COUNT} стран и {CITY_COUNT} городов — список в коде, из него же строится карта</li>
                <li>Канал {PLAN_SPEED.basic} и {PLAN_SPEED.plus} Гбит/с — из состава тарифов</li>
                <li>{DEVICE_LIMIT} устройств на подписке</li>
                <li>История подключений, посещённых сайтов и DNS-запросов не хранится</li>
              </ul>
            </div>
            <div>
              <h3>Ещё не подтверждено, и мы этого не пишем</h3>
              <ul className="gi-col-ask">
                <li>Названия площадок и точек обмена трафиком — нужно право упоминания</li>
                <li>Сертификации и аудиты — нужен сам сертификат</li>
                <li>Показатели времени без сбоев — нужен мониторинг с историей</li>
                <li>Задержки по городам — сейчас это оценки, а не замеры</li>
              </ul>
            </div>
          </div>
          <p style={{ marginTop: "1.5rem", fontSize: "var(--g-t-small)", color: "var(--g-ink-3)", maxWidth: "62ch" }}>
            Раньше на этой странице стояли названия чужих дата-центров, точек
            обмена и сертификатов. Мы их сняли: писать то, что нельзя показать
            по требованию, — ровно то, чего мы не делаем.
          </p>
          <div className="gh-actions">
            <Link href="/vds" className="gh-btn gh-btn-primary">Выделенные серверы</Link>
            <Link href="/security" className="gh-btn gh-btn-quiet">Что мы знаем о вас</Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
