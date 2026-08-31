"use client";

import Icon, { type IconName } from "./Icon";
import { Spotlight } from "./motion";
import SectionHeading from "./SectionHeading";

/**
 * Блок 2 — платформы.
 *
 * Было: шесть одинаковых квадратов в ровной сетке. Ровный ритм без
 * иерархии — ни одна платформа не выделена, хотя телефоны дают
 * подавляющую долю подключений.
 *
 * Стало: bento-сетка (принцип 3). iPhone и Android занимают по четыре
 * ячейки и получают имя приложения, остальные — по одной. Сетка
 * заполняется без «дырок» на каждом брейкпоинте: 2 колонки → 3 → 6.
 *
 * Список платформ синхронизирован с src/app/devices/page.tsx — это
 * единственный источник правды о том, что мы реально поддерживаем.
 * Прошлая версия рекламировала Linux и роутеры, которых в инструкциях
 * по настройке нет (принцип 7).
 */
interface Platform {
  name: string;
  detail: string;
  icon: IconName;
  /** Приложение показывается только у крупных ячеек — мелким не хватает воздуха. */
  app?: string;
  span: string;
}

const PLATFORMS: Platform[] = [
  {
    name: "iPhone / iPad",
    detail: "iOS 16+",
    icon: "iphone",
    app: "Happ",
    span: "col-span-2 md:col-span-2 lg:col-span-2 lg:row-span-2",
  },
  {
    name: "Android",
    detail: "10 и новее",
    icon: "android",
    app: "Happ",
    span: "col-span-1 md:col-span-1 lg:col-span-2 lg:row-span-2",
  },
  {
    name: "macOS",
    detail: "M1 / Intel",
    icon: "macos",
    span: "col-span-1 md:col-span-1 lg:col-span-2",
  },
  {
    name: "Windows",
    detail: "10 / 11",
    icon: "windows",
    span: "col-span-1 md:col-span-1 lg:col-span-1",
  },
  {
    name: "Android TV",
    detail: "все модели",
    icon: "tv",
    span: "col-span-1 md:col-span-1 lg:col-span-1",
  },
];

export default function DevicesSection() {
  return (
    <section className="ls-section" aria-labelledby="devices-title">
      <div className="ls-shell">
        <SectionHeading
          eyebrow="Устройства"
          title={["Работает везде,", "где вы работаете"]}
          action={{ label: "Инструкции по настройке", href: "/devices" }}
          titleId="devices-title"
        />

        <ul className="ls-stagger grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 lg:grid-rows-[repeat(2,minmax(168px,auto))] gap-3 sm:gap-4">
          {PLATFORMS.map((p) => (
            <li key={p.name} className={`ls-reveal ${p.span}`}>
              <Spotlight
                as="article"
                className="ls-card group h-full min-h-[150px] p-5 sm:p-6 flex flex-col justify-between"
              >
                <Icon
                  name={p.icon}
                  size={30}
                  className="ls-ink-4 ls-icon-lift group-hover:!text-[color:var(--as-ink)]"
                />
                <div className="mt-6">
                  {p.app && (
                    <p className="ls-eyebrow mb-2">через {p.app}</p>
                  )}
                  <h3 className="text-[16px] sm:text-[18px] font-bold tracking-[-0.02em] leading-tight">
                    {p.name}
                  </h3>
                  <p className="ls-ink-4 mt-1 text-[12.5px]">{p.detail}</p>
                </div>
              </Spotlight>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
