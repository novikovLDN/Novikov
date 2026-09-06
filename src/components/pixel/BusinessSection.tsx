import Link from "next/link";
import Icon from "./Icon";
import SectionHeading from "./SectionHeading";
import { DEVICE_LIMIT } from "@/lib/plans";

/**
 * Блок для компаний на главной.
 *
 * Второй адресат сайта появляется здесь впервые в развёрнутом виде:
 * реестр направлений выше только называет его. Блок стоит после
 * доказательств скорости и безопасности — до них разговор про
 * договор и счёт преждевременный, компания сначала проверяет
 * продукт, а потом спрашивает про бумаги.
 *
 * Формулировки сняты с реальных возражений корпоративного
 * покупателя (кто платит, кто отвечает, как отозвать доступ у
 * уволенного), а не с общих слов про «надёжного партнёра».
 *
 * Крупное число блока — срок ответа. Это единственное обещание,
 * которое компания может проверить в первый же день, поэтому оно и
 * вынесено в кадр. Значение совпадает с заявленным сроком ответа
 * продаж на /contact и помечено в COMPLIANCE-CHECK.md как требующее
 * подтверждения эксплуатацией.
 */
const POINTS = [
  {
    title: "Договор и счёт",
    body: "Оплата по безналичному расчёту, закрывающие документы, работа с юридическим лицом — без карт сотрудников и авансовых отчётов.",
  },
  {
    title: "Один счёт за всех",
    body: "Подключения сотрудников живут в общем аккаунте компании: одна оплата на всех вместо десятка личных подписок.",
  },
  {
    title: "Выдать и отозвать",
    body: "Доступ назначает администратор компании. Сотрудник ушёл — доступ снимается в тот же день, вместе с его устройствами.",
  },
  {
    title: "Поддержка вне очереди",
    body: "Отдельный канал связи и приоритет в обработке обращений. Проблема сотрудника не стоит в общей очереди.",
  },
];

export default function BusinessSection() {
  return (
    <section className="px-section" aria-labelledby="business-title">
      <div className="px-shell">
        {/* Действия в шапке секции нет намеренно: призыв «оставить
            заявку» живёт в карточке справа, и два одинаковых
            призыва в одном кадре делят внимание пополам. */}
        <SectionHeading
          eyebrow="Компаниям"
          title={["Подключение для команды —", "по договору и счёту"]}
          titleId="business-title"
          index="08"
        />

        <div className="px-biz">
          <ul className="px-biz-list px-stagger">
            {POINTS.map((p) => (
              <li key={p.title} className="px-biz-item px-reveal">
                <span className="px-biz-mark" aria-hidden>
                  <Icon name="check" size={14} />
                </span>
                <div className="min-w-0">
                  <h3 className="px-biz-title">{p.title}</h3>
                  <p className="px-body mt-2">{p.body}</p>
                </div>
              </li>
            ))}
          </ul>

          <aside className="px-card px-spot px-biz-aside px-reveal">
            <p className="px-eyebrow">Срок ответа</p>
            {/* Число набрано чернилами, а не акцентом: в кадре уже
                есть оранжевая кнопка, и второй яркий акцент отнимает
                у неё внимание — правило системы «один акцент в
                кадре». */}
            <p className="px-figure-xl mt-4">
              4<span className="px-figure-unit">рабочих часа</span>
            </p>
            <p className="px-body mt-6">
              Расскажите про команду и задачу — вернёмся с расчётом и проектом
              договора. Если задача срочная, напишите сразу в продажи.
            </p>

            <dl className="px-biz-facts">
              <div>
                <dt className="px-rail-metric-label">Устройств на сотрудника</dt>
                <dd className="px-num px-biz-fact-value">{DEVICE_LIMIT}</dd>
              </div>
              {/* ТРЕБУЕТ ПОДТВЕРЖДЕНИЯ: нижняя граница договора не
                  закреплена в коде и выбрана по нижней ступени формы
                  заявки («5–20 человек»). См. COMPLIANCE-CHECK.md §5 —
                  до коммерческого решения число показывать нельзя. */}
              <div>
                <dt className="px-rail-metric-label">Минимальный договор</dt>
                <dd className="px-num px-biz-fact-value">5 мест</dd>
              </div>
            </dl>

            <div className="px-biz-actions">
              <Link href="/business" className="px-btn px-btn-md px-btn-primary group">
                Оставить заявку
                <Icon
                  name="arrow-right"
                  size={16}
                  className="transition-transform duration-200 ease-out group-hover:translate-x-1"
                />
              </Link>
              {/* Почтовый адрес продаж совпадает с /contact. При смене
                  адреса менять в обоих местах. */}
              <a href="mailto:sales@atlas.secure" className="px-btn px-btn-md px-btn-secondary">
                sales@atlas.secure
              </a>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
