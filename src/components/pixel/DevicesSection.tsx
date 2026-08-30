import Icon, { type IconName } from "./Icon";
import SectionHeading from "./SectionHeading";

/**
 * Платформы.
 *
 * Bento-сетка: два главных устройства занимают по четыре ячейки и
 * получают имя приложения, остальные — по одной. Сетка заполняется без
 * «дырок» на каждом брейкпоинте: 2 колонки → 3 → 6.
 *
 * Список синхронизирован с src/app/devices/page.tsx — единственным
 * источником правды о поддержке. Прошлые версии лендинга рекламировали
 * Linux и роутеры, которых в инструкциях по настройке нет.
 */
interface Platform {
  name: string;
  detail: string;
  icon: IconName;
  app?: string;
  span: string;
  featured?: boolean;
}

const PLATFORMS: Platform[] = [
  { name: "iPhone / iPad", detail: "iOS 16+", icon: "iphone", app: "Happ", span: "col-span-2 md:col-span-2 lg:col-span-2 lg:row-span-2", featured: true },
  { name: "Android", detail: "10 и новее", icon: "android", app: "Happ", span: "col-span-1 md:col-span-1 lg:col-span-2 lg:row-span-2", featured: true },
  { name: "macOS", detail: "M1 / Intel", icon: "macos", span: "col-span-1 md:col-span-1 lg:col-span-2" },
  { name: "Windows", detail: "10 / 11", icon: "windows", span: "col-span-1 md:col-span-1 lg:col-span-1" },
  { name: "Android TV", detail: "все модели", icon: "tv", span: "col-span-1 md:col-span-1 lg:col-span-1" },
];

export default function DevicesSection() {
  return (
    <section className="px-section" aria-labelledby="devices-title">
      <div className="px-shell">
        <SectionHeading
          eyebrow="Устройства"
          title={["Работает везде,", "где вы работаете"]}
          titleId="devices-title"
          action={{ label: "Инструкции по настройке", href: "/devices" }}
        />

        <ul className="px-stagger grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 lg:grid-rows-[repeat(2,minmax(172px,auto))] gap-3 sm:gap-4">
          {PLATFORMS.map((p) => (
            <li key={p.name} className={`px-reveal ${p.span}`}>
              <article className="px-card px-device group relative overflow-hidden h-full min-h-[152px] p-5 sm:p-6 flex flex-col justify-between">
                {p.featured && (
                  <span className="px-device-art" aria-hidden>
                    <Icon name={p.icon} size={136} />
                  </span>
                )}
                <Icon
                  name={p.icon}
                  size={26}
                  className={`px-device-mark${p.featured ? " px-device-mini" : ""}`}
                />

                <div className="relative mt-6">
                  {p.app && <p className="px-eyebrow mb-2">через {p.app}</p>}
                  <h3 className="text-[16px] sm:text-[18px] font-bold tracking-[-0.02em] leading-tight">
                    {p.name}
                  </h3>
                  <p className="px-caption mt-1">{p.detail}</p>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
