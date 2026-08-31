"use client";

import Icon from "./Icon";
import { AnimatedNumber } from "./motion";

/**
 * Превью личного кабинета — настоящие сущности продукта, а не
 * абстрактная иллюстрация.
 *
 * Разбор VK Cloud / Yandex Cloud / Selectel (research/07.md) сходится
 * в одном: все три показывают реальный интерфейс — панель, дашборд,
 * биллинг — вместо декоративной графики. Это визуальный DOM, а не
 * скриншот: резкий на любом DPI, весит ноль байт, не устаревает при
 * следующей правке кабинета.
 *
 * Используется и в героях (главная), и в секции продукта — одна и та
 * же карточка, чтобы витрина не расходилась сама с собой.
 */
export default function AccountPreview() {
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
