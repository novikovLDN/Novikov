import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/graticule/SiteHeader";
import SiteFooter from "@/components/graticule/SiteFooter";
import { DEVICE_LIMIT } from "@/lib/plans";
import { COUNTRY_COUNT } from "@/lib/locations";
import { TRIAL_DAYS } from "@/lib/brand-facts";
import "./sec.css";

/**
 * /security — что мы знаем о вас.
 *
 * ГЛАВНЫЙ ОБЪЕКТ СЦЕНЫ — ПУСТОЙ СПИСОК. Перечень того, чего мы не
 * храним, длиннее перечня того, что храним, и это видно с первого
 * взгляда. Единственный экран сайта, где содержанием является
 * пустота.
 *
 * ЧТО СНЯТО С ПРЕЖНЕЙ ВЕРСИИ. Она называла ISO, SOC, аудиты и
 * сертификации, которых у нас нет на руках (COMPLIANCE-CHECK.md).
 * Названия стандартов без самого сертификата — то же самое, что
 * чужие товарные знаки без права упоминания.
 *
 * ЧТО ОСТАЛОСЬ И ПОЧЕМУ. Алгоритмы шифрования названы, но помечены
 * как требующие подтверждения конфигурацией: они с высокой
 * вероятностью верны, но «с высокой вероятностью» — не то основание,
 * на котором пишут на витрине. Всё остальное — проверяемое: список
 * того, что хранится в базе, и список того, чего в ней нет.
 *
 * ТЕХНОЛОГИЧНОСТЬ 2027 (исследование): открытый каркас, видимые
 * границы в один пиксель, плотность данных вместо воздуха. У нас это
 * не заимствование тренда: «названная граница» была позицией бренда
 * раньше, чем стала модой.
 */
export const metadata: Metadata = {
  title: "Безопасность",
  description:
    "Что мы знаем о вас: адрес почты. Не храним ни посещённых сайтов, " +
    "ни DNS-запросов, ни истории подключений.",
};

/** Что действительно лежит в базе. Список короткий — в этом суть. */
const STORED = [
  "Адрес электронной почты",
  "Дата окончания подписки",
  "Идентификатор в панели выдачи ключей",
  "Реферальный код, если вы им пользуетесь",
];

/** Чего в базе нет. Список длиннее — и это главный аргумент страницы. */
const NOT_STORED = [
  "Посещённые сайты",
  "DNS-запросы",
  "История подключений: когда, откуда, как долго",
  "IP-адреса сеансов",
  "Имя, фамилия, отчество",
  "Номер телефона",
  "Почтовый адрес",
  "Данные банковской карты — они остаются у платёжного провайдера",
  "Содержимое трафика — оно закрыто ключом, которого у нас нет",
];

export default function SecurityPage() {
  return (
    <div className="g gs">
      <SiteHeader />

      <main>
        <section className="gs-shell gs-hero" aria-labelledby="sec-title">
          <h1 id="sec-title">Что мы знаем о вас</h1>
          <p className="gs-answer">Адрес почты. И всё.</p>
          <p className="gs-answer-note">
            Ниже — оба списка целиком: что лежит в базе и чего в ней нет.
            Второй длиннее, и это не приём вёрстки.
          </p>
        </section>

        {/* Приборная панель: плотность данных вместо воздуха — тренд
            2027 и наш случай одновременно. Каждое число проверяемое. */}
        <section className="gs-shell" aria-label="Показатели приватности">
          <dl className="g-panel">
            <div className="g-readout" data-kind="measured">
              <dt>полей о вас в базе</dt>
              <dd>{STORED.length}</dd>
            </div>
            <div className="g-readout" data-kind="measured">
              <dt>того, чего мы не храним</dt>
              <dd>{NOT_STORED.length}</dd>
            </div>
            <div className="g-readout" data-kind="measured">
              <dt>нужно для входа</dt>
              <dd>1<small>поле</small></dd>
            </div>
            <div className="g-readout" data-kind="measured">
              <dt>дней без карты</dt>
              <dd>{TRIAL_DAYS}</dd>
            </div>
          </dl>
        </section>

        <section className="gs-shell gs-know" aria-labelledby="know">
          <h2 id="know" className="b-sr">Что храним и чего не храним</h2>
          <div className="gs-know-grid">
            <div className="gs-col">
              <h2>Храним</h2>
              <ul>
                {STORED.map((t, i) => (
                  <li key={t}><b>{String(i + 1).padStart(2, "0")}</b>{t}</li>
                ))}
              </ul>
              <p className="gs-count">{STORED.length} поля. Всё, что нужно, чтобы подписка работала.</p>
            </div>
            <div className="gs-col">
              <h2>Не храним</h2>
              <ul className="gs-col-none">
                {NOT_STORED.map((t, i) => (
                  <li key={t}><b>{String(i + 1).padStart(2, "0")}</b>{t}</li>
                ))}
              </ul>
              <p className="gs-count">
                {NOT_STORED.length} пунктов. Этих записей нет, поэтому их нельзя
                ни запросить у нас, ни украсть у нас.
              </p>
            </div>
          </div>
        </section>

        {/* Схема «до и после» на одном месте: тот же путь, только
            закрытый. Приём №28 каталога. */}
        <section className="gs-shell gs-path" aria-labelledby="path">
          <h2 id="path">Что видит тот, кто смотрит на канал</h2>
          <svg className="gs-diagram" viewBox="0 0 1000 190" role="img"
               aria-label="Без ускорителя провайдер видит адрес сайта и содержимое запроса. С Atlas виден только факт соединения с узлом.">
            <rect className="gs-box" x="20" y="70" width="120" height="50" rx="2" />
            <text className="gs-cap" x="80" y="100" textAnchor="middle">устройство</text>

            <path className="gs-wire-open" d="M 145 95 H 480" />
            <circle className="gs-eye" cx="310" cy="95" r="7" />
            <text className="gs-cap" x="310" y="78" textAnchor="middle">видно: адрес и запрос</text>

            <path className="gs-wire-closed" d="M 145 95 H 480" pathLength={1} />
            <text className="gs-cap" x="310" y="126" textAnchor="middle">видно: соединение с узлом</text>

            <rect className="gs-box" x="485" y="70" width="120" height="50" rx="2" />
            <text className="gs-cap" x="545" y="100" textAnchor="middle">узел Atlas</text>

            <path className="gs-wire" d="M 610 95 H 860" />
            <rect className="gs-box" x="865" y="70" width="115" height="50" rx="2" />
            <text className="gs-cap" x="922" y="100" textAnchor="middle">сайт</text>
          </svg>
        </section>

        <section className="gs-shell gs-spec" aria-labelledby="spec">
          <h2 id="spec">Технические параметры</h2>
          <dl className="g-panel">
            <div className="g-readout">
              <dt>устройств на подписке</dt>
              <dd>{DEVICE_LIMIT}</dd>
            </div>
            <div className="g-readout">
              <dt>стран на выбор</dt>
              <dd>{COUNTRY_COUNT}</dd>
            </div>
            <div className="g-readout" data-kind="estimate">
              <dt>шифрование канала</dt>
              <dd style={{ fontSize: "1.05rem" }}>AES-256 / ChaCha20</dd>
            </div>
            <div className="g-readout" data-kind="estimate">
              <dt>ключ хранится</dt>
              <dd style={{ fontSize: "1.05rem" }}>на устройстве</dd>
            </div>
          </dl>
          <p className="g-tolerance" style={{ marginTop: "1rem", maxWidth: "62ch" }}>
            Два показателя помечены как требующие подтверждения: алгоритмы и
            место хранения ключа мы обязаны подтвердить конфигурацией, а не
            памятью. Названий стандартов, аудитов и сертификаций на этой
            странице нет — они появятся вместе с самими документами.
          </p>
          <div className="gh-actions" style={{ marginTop: "1.75rem" }}>
            <Link href="/privacy" className="gh-btn gh-btn-quiet">Политика приватности</Link>
            <Link href="/infrastructure" className="gh-btn gh-btn-quiet">Как устроена сеть</Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
