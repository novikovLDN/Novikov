"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import Icon from "@/components/pixel/Icon";

/**
 * Форма корпоративной заявки.
 *
 * Проверка на клиенте — до отправки и по каждому полю отдельно:
 * общая строка «заполните все поля» заставляет человека искать, какое
 * именно поле не устроило форму. Ошибка живёт рядом со своим полем,
 * связана с ним через aria-describedby, поле помечается aria-invalid,
 * и фокус переводится на первое неверное — иначе на телефоне ошибка
 * оказывается за пределами экрана.
 *
 * Браузерная проверка отключена (noValidate) намеренно: нативные
 * подсказки не переводятся, не стилизуются и исчезают по таймеру.
 * Атрибуты type/inputMode при этом оставлены — они поднимают нужную
 * клавиатуру на телефоне.
 *
 * КУДА ПОДКЛЮЧИТЬ БЭКЕНД И CRM
 * ────────────────────────────
 * Сейчас заявка уходит в POST /api/contact (src/app/api/contact/route.ts):
 * запись в таблицу contact_requests и уведомление администратору.
 * Контракт запроса — { name, email, interest, message } — не менялся,
 * поэтому корпоративные поля (компания, размер команды, что нужно)
 * складываются в message структурированными строками: см. buildMessage
 * ниже.
 *
 * Когда появится CRM (amoCRM, Битрикс24, HubSpot), правильное место
 * для интеграции — обработчик /api/contact, а не этот компонент:
 * ключ интеграции не должен попасть в браузер. Порядок работ:
 *   1. Добавить в contact_requests колонки company, team_size, needs
 *      (миграция), чтобы не разбирать message строками.
 *   2. Расширить контракт API этими полями и передавать их здесь
 *      вместо склейки в message.
 *   3. В обработчике после INSERT отправить лид в CRM — из ключа в
 *      переменной окружения, с ретраем: отказ CRM не должен ронять
 *      ответ посетителю, заявка уже сохранена в базе.
 */
const NEEDS: Array<{ value: string; label: string }> = [
  { value: "access", label: "Подключения для сотрудников" },
  { value: "servers", label: "Виртуальные или выделенные машины" },
  { value: "both", label: "И то, и другое" },
];

const SIZES: Array<{ value: string; label: string }> = [
  { value: "5-20", label: "5–20 человек" },
  { value: "21-100", label: "21–100" },
  { value: "101-500", label: "101–500" },
  { value: "500+", label: "Больше 500" },
];

/** Почта проверяется тем же выражением, что и на сервере
 *  (src/app/api/contact/route.ts): расхождение между проверками даёт
 *  адрес, который форма принимает, а API отклоняет. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldName = "name" | "email" | "company" | "size" | "need";
type Errors = Partial<Record<FieldName, string>>;

interface FormState {
  name: string;
  email: string;
  company: string;
  size: string;
  need: string;
  message: string;
}

const EMPTY: FormState = { name: "", email: "", company: "", size: "", need: "", message: "" };

function validate(v: FormState): Errors {
  const e: Errors = {};
  if (!v.name.trim()) e.name = "Укажите, как к вам обращаться";
  if (!v.email.trim()) e.email = "Укажите рабочую почту";
  else if (!EMAIL_RE.test(v.email.trim())) e.email = "Проверьте адрес: похоже, в нём опечатка";
  if (!v.company.trim()) e.company = "Укажите название компании";
  if (!v.size) e.size = "Выберите размер команды";
  if (!v.need) e.need = "Выберите, что нужно";
  return e;
}

/** Корпоративные поля складываются в message: контракт /api/contact
 *  их пока не знает. Формат — строки «ключ: значение», чтобы письмо
 *  читалось человеком и разбиралось скриптом. */
function buildMessage(v: FormState): string {
  const need = NEEDS.find((n) => n.value === v.need)?.label ?? v.need;
  const size = SIZES.find((s) => s.value === v.size)?.label ?? v.size;
  return [
    `Компания: ${v.company.trim()}`,
    `Размер команды: ${size}`,
    `Что нужно: ${need}`,
    v.message.trim() ? `Задача: ${v.message.trim()}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export default function BusinessRequestForm() {
  const [v, setV] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [failure, setFailure] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const set = (field: keyof FormState) => (value: string) => {
    setV((prev) => ({ ...prev, [field]: value }));
    // Ошибка снимается по мере исправления, а не по повторной
    // отправке: иначе поле остаётся красным, пока человек не нажмёт
    // кнопку ещё раз.
    setErrors((prev) => (prev[field as FieldName] ? { ...prev, [field]: undefined } : prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFailure("");

    const found = validate(v);
    setErrors(found);
    const first = (Object.keys(found) as FieldName[])[0];
    if (first) {
      const node = formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`);
      node?.focus();
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: v.name,
          email: v.email,
          interest: "enterprise",
          message: buildMessage(v),
        }),
      });
      const data = await res.json();
      // Текст ошибки от API наружу не показываем: там служебные
      // английские строки («Server error», «Invalid email format»),
      // написанные для журнала, а не для человека на сайте.
      if (data.success) setSent(true);
      else
        setFailure(
          "Заявка не ушла — сбой на нашей стороне. Попробуйте ещё раз или напишите на sales@atlas.secure",
        );
    } catch {
      setFailure("Нет связи с сервером. Проверьте соединение или напишите на sales@atlas.secure");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="px-card px-form-card px-reveal" role="status">
        <span className="px-form-done-mark" aria-hidden>
          <Icon name="check" size={22} />
        </span>
        <h3 className="px-h3 mt-6">Заявка принята</h3>
        <p className="px-body mt-3">
          Вернёмся в течение четырёх рабочих часов на указанную почту — с расчётом и
          проектом договора. Если задача срочная, напишите на{" "}
          <a href="mailto:sales@atlas.secure" className="px-link-inline">sales@atlas.secure</a>.
        </p>
      </div>
    );
  }

  return (
    <div className="px-form-grid">
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        noValidate
        className="px-card px-form-card px-reveal"
        aria-labelledby="request-title"
      >
        <div className="px-field">
          <label className="px-label" htmlFor="rq-name">
            Как к вам обращаться <span className="px-req" aria-hidden>*</span>
          </label>
          <input
            id="rq-name"
            data-field="name"
            className="px-input"
            type="text"
            autoComplete="name"
            value={v.name}
            onChange={(e) => set("name")(e.target.value)}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "rq-name-err" : undefined}
            aria-required="true"
          />
          {errors.name && (
            <p className="px-field-error" id="rq-name-err">{errors.name}</p>
          )}
        </div>

        <div className="px-field">
          <label className="px-label" htmlFor="rq-email">
            Рабочая почта <span className="px-req" aria-hidden>*</span>
          </label>
          <input
            id="rq-email"
            data-field="email"
            className="px-input"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={v.email}
            onChange={(e) => set("email")(e.target.value)}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "rq-email-err" : undefined}
            aria-required="true"
          />
          {errors.email && (
            <p className="px-field-error" id="rq-email-err">{errors.email}</p>
          )}
        </div>

        <div className="px-field">
          <label className="px-label" htmlFor="rq-company">
            Компания <span className="px-req" aria-hidden>*</span>
          </label>
          <input
            id="rq-company"
            data-field="company"
            className="px-input"
            type="text"
            autoComplete="organization"
            value={v.company}
            onChange={(e) => set("company")(e.target.value)}
            aria-invalid={errors.company ? true : undefined}
            aria-describedby={errors.company ? "rq-company-err" : undefined}
            aria-required="true"
          />
          {errors.company && (
            <p className="px-field-error" id="rq-company-err">{errors.company}</p>
          )}
        </div>

        {/* Размер команды и состав — группы переключателей, а не
            выпадающие списки: вариантов мало, и на телефоне список
            открывает системное колесо ради четырёх строк. */}
        <fieldset className="px-field" aria-describedby={errors.size ? "rq-size-err" : undefined}>
          <legend className="px-label">
            Размер команды <span className="px-req" aria-hidden>*</span>
          </legend>
          <div className="px-choice-row">
            {SIZES.map((s, i) => (
              <button
                key={s.value}
                type="button"
                data-field={i === 0 ? "size" : undefined}
                className={`px-choice${v.size === s.value ? " px-choice-on" : ""}`}
                aria-pressed={v.size === s.value}
                onClick={() => set("size")(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
          {errors.size && <p className="px-field-error" id="rq-size-err">{errors.size}</p>}
        </fieldset>

        <fieldset className="px-field" aria-describedby={errors.need ? "rq-need-err" : undefined}>
          <legend className="px-label">
            Что нужно <span className="px-req" aria-hidden>*</span>
          </legend>
          <div className="px-choice-row">
            {NEEDS.map((n, i) => (
              <button
                key={n.value}
                type="button"
                data-field={i === 0 ? "need" : undefined}
                className={`px-choice${v.need === n.value ? " px-choice-on" : ""}`}
                aria-pressed={v.need === n.value}
                onClick={() => set("need")(n.value)}
              >
                {n.label}
              </button>
            ))}
          </div>
          {errors.need && <p className="px-field-error" id="rq-need-err">{errors.need}</p>}
        </fieldset>

        <div className="px-field">
          <label className="px-label" htmlFor="rq-message">
            Задача <span className="px-text-4">(необязательно)</span>
          </label>
          <textarea
            id="rq-message"
            className="px-input px-textarea"
            rows={4}
            value={v.message}
            onChange={(e) => set("message")(e.target.value)}
            placeholder="Сколько сотрудников и где работают, какие сервисы должны открываться, есть ли сроки"
          />
        </div>

        {/* Сообщение об отказе объявлено живой областью: без неё
            экранный диктор не узнает, что после нажатия что-то
            изменилось. */}
        <p className="px-form-status" role="alert" aria-live="assertive">
          {failure}
        </p>

        <div className="px-form-foot">
          <button type="submit" className="px-btn px-btn-md px-btn-primary" disabled={sending}>
            {sending ? "Отправляем…" : "Отправить заявку"}
            {!sending && <Icon name="arrow-right" size={16} />}
          </button>
          <p className="px-caption">
            Отправляя заявку, вы соглашаетесь с{" "}
            <Link href="/privacy" className="px-link-inline">политикой конфиденциальности</Link>.
          </p>
        </div>
      </form>

      <aside className="px-form-aside px-reveal">
        <p className="px-eyebrow">Что дальше</p>
        <ol className="px-form-steps">
          <li>
            <span className="px-num px-form-step-n">1</span>
            Читаем заявку и уточняем недостающее письмом — обычно это один вопрос.
          </li>
          <li>
            <span className="px-num px-form-step-n">2</span>
            Присылаем расчёт по числу мест и состав подключения.
          </li>
          <li>
            <span className="px-num px-form-step-n">3</span>
            Проект договора и счёт. Тестовый доступ на время согласования — по запросу.
          </li>
        </ol>
        <p className="px-caption mt-8">
          Заявка попадает менеджеру продаж. Срок ответа — четыре рабочих часа, тот же,
          что указан на странице{" "}
          <Link href="/contact" className="px-link-inline">контактов</Link>.
        </p>
      </aside>
    </div>
  );
}
