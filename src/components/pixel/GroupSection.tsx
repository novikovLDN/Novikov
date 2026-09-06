import Link from "next/link";
import Icon from "./Icon";
import SectionHeading from "./SectionHeading";
import { COUNTRY_COUNT } from "@/lib/locations";
import { DEVICE_LIMIT } from "@/lib/plans";

/**
 * Реестр направлений — блок, который отвечает на вопрос «кто вы такие».
 *
 * До этого главная говорила от лица одного продукта и одному
 * человеку: «тебе будет быстрее». Продуктов при этом четыре
 * (ускорение, VPS, VDS, корпоративные подключения), и три из них
 * адресованы не частному лицу. Посетитель-компания не находил на
 * витрине ни одного признака, что здесь есть что-то для него.
 *
 * Форма — реестр, а не три равные карточки в ряд. Ведущая колонка —
 * КОМУ, а не название: именно адресат здесь несёт смысл, а названия
 * направлений («виртуальные серверы») без него не различаются между
 * собой. Строки не нумеруются: это каталог, а не последовательность
 * шагов, и порядковый номер сообщал бы неправду о содержании.
 *
 * Раскрытие параметров — на CSS (grid-template-rows: 0fr → 1fr) по
 * наведению и по фокусу с клавиатуры; ноль JS. На узком экране
 * параметры видны всегда: наведения там нет, и прятать содержимое за
 * недоступным жестом нельзя.
 *
 * Цен здесь нет намеренно. Цена ускорения живёт в src/lib/plans.ts,
 * цены машин — на своих страницах; продублировать их здесь значит
 * завести пятое место, где сумма может разойтись с кассой.
 */
interface Direction {
  /** Адресат — ведущая колонка строки. */
  who: string;
  name: string;
  body: string;
  /** Три проверяемых параметра, раскрываются при наведении и фокусе. */
  specs: string[];
  href: string;
  cta: string;
}

const DIRECTIONS: Direction[] = [
  {
    who: "Частным лицам",
    name: "Быстрый интернет",
    body:
      "Соединение, которое не проседает вечером и открывает то, что перестало открываться. Настройка занимает минуту, дальше работает само.",
    specs: [
      `${COUNTRY_COUNT} стран на выбор`,
      `${DEVICE_LIMIT} устройств на одной подписке`,
      "Три дня бесплатно, без карты",
    ],
    href: "/pricing",
    cta: "Тарифы",
  },
  {
    who: "Разработчикам",
    name: "Виртуальные серверы",
    body:
      "Машина под проект, готовая примерно через минуту после заказа. Гарантированные ядра и собственный диск — соседи по железу не забирают производительность.",
    specs: ["KVM с выделенными vCPU", "Enterprise NVMe", "Сеть 10 Гбит/с в базе"],
    href: "/vps",
    cta: "О виртуальных серверах",
  },
  {
    who: "Командам",
    name: "Выделенные машины",
    body:
      "Физический сервер целиком: процессор, память и диски не делятся ни с кем. Для баз данных, аналитики и всего, что упирается в железо.",
    specs: ["AMD EPYC и Intel Xeon", "NVMe в RAID 10", "Сеть до 200 Гбит/с"],
    href: "/vds",
    cta: "О выделенных машинах",
  },
  {
    who: "Компаниям",
    name: "Корпоративные подключения",
    body:
      "Доступ для сотрудников по договору и одному счёту. Подключения выдаёт и отзывает администратор компании, а не каждый работник сам.",
    specs: ["Договор и закрывающие документы", "Единый счёт за всех", "Приоритетная поддержка"],
    href: "/business",
    cta: "Для бизнеса",
  },
];

export default function GroupSection() {
  return (
    <section className="px-section" aria-labelledby="group-title">
      <div className="px-shell">
        <SectionHeading
          eyebrow="Направления"
          title={["Одна сеть —", "четыре способа ей пользоваться"]}
          titleId="group-title"
          index="01"
        />

        <ul className="px-registry px-stagger">
          {DIRECTIONS.map((d) => (
            <li key={d.href} className="px-registry-row px-reveal">
              <Link href={d.href} className="px-registry-link">
                <span className="px-registry-who px-eyebrow">{d.who}</span>

                <span className="px-registry-main">
                  <span className="px-registry-name">{d.name}</span>
                  <span className="px-body px-registry-body">{d.body}</span>

                  {/* Оболочка нужна раскрытию: анимируется она, а
                      список внутри остаётся в нормальном потоке. */}
                  <span className="px-registry-specs">
                    <span className="px-registry-specs-inner">
                      {d.specs.map((s) => (
                        <span key={s} className="px-registry-spec px-num">
                          <Icon name="check" size={13} />
                          {s}
                        </span>
                      ))}
                    </span>
                  </span>
                </span>

                <span className="px-registry-cta">
                  <span className="px-registry-cta-label">{d.cta}</span>
                  <Icon name="arrow-right" size={16} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
