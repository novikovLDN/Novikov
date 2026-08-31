"use client";

import Icon from "./Icon";
import SectionHeading from "./SectionHeading";
import { AnimatedNumber } from "./motion";

/**
 * Что видит пользователь после регистрации.
 *
 * Рынок ушёл от иллюстраций к реальному интерфейсу над сгибом: покупатель
 * решает быстрее, когда видит сам продукт, а не рассказ о нём. Раньше
 * превью было втиснуто в угол первого экрана и работало как декорация;
 * здесь оно занимает половину секции и читается как настоящий экран.
 *
 * Это живой DOM, а не скриншот: он резкий на любом DPI, тянется по
 * ширине, весит ноль байт и не устаревает при следующей правке кабинета.
 *
 * Язык публичный: маршрут и приоритет вместо протоколов и туннелей.
 * Для скринридера карточка декоративна — роль несёт подпись и текст
 * рядом, дублировать те же цифры в озвучке незачем.
 */
const STEPS = [
  {
    icon: "clock" as const,
    title: "Сразу после оплаты",
    body: "Подписка активируется автоматически. Ключ и QR-код уже ждут в кабинете.",
  },
  {
    icon: "globe" as const,
    title: "Маршрут выбирается сам",
    body: "Клиент берёт ближайший узел. Нужную страну можно закрепить вручную.",
  },
  {
    icon: "shield" as const,
    title: "Дальше не требует внимания",
    body: "Соединение поднимается само на каждом устройстве и держится в фоне.",
  },
];

export default function ProductSection() {
  return (
    <section className="px-section" aria-labelledby="product-title">
      <div className="px-shell">
        <SectionHeading
          eyebrow="Личный кабинет"
          title={["Всё управление —", "на одном экране"]}
          titleId="product-title"
          index="01"
        />

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          <div className="lg:col-span-7 px-reveal">
            <AccountPreview />
          </div>

          <ul className="lg:col-span-5 px-stagger flex flex-col gap-4">
            {STEPS.map((s) => (
              <li key={s.title} className="px-reveal flex items-start gap-4">
                <span className="px-benefit-icon shrink-0" aria-hidden>
                  <Icon name={s.icon} size={20} />
                </span>
                <div>
                  <h3 className="text-[16px] font-bold tracking-[-0.02em]">{s.title}</h3>
                  <p className="px-body mt-1.5">{s.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function AccountPreview() {
  return (
    <figure className="m-0">
      <div className="px-card px-preview p-6 sm:p-8" aria-hidden="true">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2.5">
            <span className="px-status-dot" />
            <span className="text-[13px] font-medium">Соединение активно</span>
          </span>
          <span className="px-tag">Plus</span>
        </div>

        <div className="mt-8 flex flex-wrap items-end gap-x-10 gap-y-6">
          <div>
            <p className="px-rail-metric-label">Задержка</p>
            <p className="mt-2 flex items-baseline gap-2">
              <span className="px-num font-bold text-[clamp(40px,7vw,60px)] leading-none tracking-[-0.04em]">
                <AnimatedNumber value={24} from={68} />
              </span>
              <span className="px-text-3 text-[15px] font-medium">мс</span>
            </p>
          </div>
          <div>
            <p className="px-rail-metric-label">Маршрут</p>
            <p className="mt-2 flex items-center gap-2 text-[15px] font-medium">
              <Icon name="globe" size={15} className="px-accent" />
              Frankfurt
            </p>
          </div>
          <div>
            <p className="px-rail-metric-label">Устройства</p>
            <p className="mt-2 text-[15px] font-medium">Безлимит</p>
          </div>
        </div>

        {/* Полоса нагрузки канала — та же графика кубиков в роли шкалы. */}
        <div className="px-preview-row mt-8 pt-7">
          <p className="px-rail-metric-label">Загрузка канала за сутки</p>
          <div className="px-bars mt-4" aria-hidden>
            {[
              32, 41, 36, 48, 44, 39, 52, 46, 58, 51, 44, 62,
              55, 49, 68, 60, 53, 74, 66, 58, 81, 70, 61, 54,
            ].map((h, i) => (
              <span key={i} style={{ ["--h" as string]: `${h}%` }} />
            ))}
          </div>
        </div>

        <div className="px-preview-row mt-7 pt-7">
          <span className="px-preview-cta">
            Подключить устройство
            <Icon name="arrow-right" size={15} />
          </span>
        </div>
      </div>

      <figcaption className="px-caption mt-4">
        Так выглядит кабинет после регистрации — без настройки и конфигов.
      </figcaption>
    </figure>
  );
}
