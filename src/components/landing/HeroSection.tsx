"use client";

import Link from "next/link";
import Icon from "./Icon";
import { AnimatedNumber, Spotlight, useParallax } from "./motion";

/**
 * Блок 1 — первый экран.
 *
 * Что изменено против прошлой версии и почему (research/03.md):
 *
 *   1. Заголовок был брендовой рамкой («Ускоритель интернета»). Стал
 *      исходом пользователя: он покупает не ускоритель, а отсутствие
 *      просадок. Перевод заголовка с бренд-рамки на исход — приём с
 *      наибольшим измеренным влиянием на конверсию из всего разбора.
 *   2. Добавлен сигнал времени — его используют Vercel и Ramp, и у нас
 *      он подтверждён продуктом.
 *   3. Под парой CTA появилась строка снятия возражений: раньше между
 *      кнопкой и регистрацией не стояло ни одного ответа на «а вдруг
 *      спишут деньги».
 *   4. Появилось превью личного кабинета. Рынок ушёл от иллюстраций к
 *      реальному интерфейсу над сгибом; раньше первый экран состоял
 *      только из текста о продукте.
 *
 * Движение (принцип 5) — четыре слоя, каждый со своей задачей:
 *   - строки заголовка выезжают из-под обреза — задаёт тон всей странице;
 *   - фон дышит двумя дрейфующими пятнами — экран живой, а не картинка;
 *   - превью идёт с параллаксом — глубина без 3D и без веса;
 *   - метрики отсчитываются — числа и есть аргумент продукта.
 *
 * Язык — публичный (принцип 7): ускорение и стабильность. Названий
 * туннельных протоколов здесь нет: для посетителя это шум из чужой
 * предметной области. Точная терминология живёт в личном кабинете.
 *
 * Числа: тариф — src/app/api/payments/create/route.ts (PLANS.basic[1]),
 * длительность триала — src/lib/remnawave.ts (TRIAL_DURATION_DAYS),
 * задержка и локация — LocationsSection.
 */
interface HeroSectionProps {
  primaryHref: string;
}

/** `from` задаёт стартовую точку отсчёта — см. AnimatedNumber. */
const METRICS = [
  { value: 4, decimals: 0, suffix: "", label: "страны", from: 0 },
  { value: 99.98, decimals: 2, suffix: " %", label: "аптайм", from: 99 },
  { value: 5, decimals: 0, prefix: "< ", suffix: " мс", label: "в регионе", from: 28 },
  { value: 5, decimals: 0, suffix: "", label: "платформ", from: 0 },
];

const HEADLINE = ["Интернет", "без просадок"];

export default function HeroSection({ primaryHref }: HeroSectionProps) {
  const previewRef = useParallax<HTMLDivElement>(0.07);

  return (
    <section className="ls-focal ls-hero" aria-labelledby="hero-title">
      {/* Живой фон. Декоративен целиком — вне потока чтения. */}
      <div className="ls-aurora" aria-hidden>
        <span />
        <span />
      </div>

      <div className="ls-shell w-full">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Текстовая колонка — 7 из 12, намеренно не по центру (принцип 3) */}
          <div className="lg:col-span-7">
            <p className="ls-enter flex items-center gap-2.5" style={{ ["--ls-i" as string]: 0 }}>
              <span className="ls-dot" aria-hidden />
              <span className="ls-eyebrow">Все серверы работают</span>
            </p>

            <h1 id="hero-title" className="ls-hero-title mt-6">
              {HEADLINE.map((line, i) => (
                <span key={line} className="ls-line">
                  <span className="ls-line-in" style={{ ["--ls-i" as string]: i + 1 }}>
                    {line}
                  </span>
                </span>
              ))}
            </h1>

            <p className="ls-lede ls-enter mt-6 sm:mt-7" style={{ ["--ls-i" as string]: 4 }}>
              Игры, созвоны и стриминг без фризов — сразу на всех устройствах.
              Подключение занимает полминуты, дальше соединение держится само.
            </p>

            <div
              className="ls-enter mt-8 sm:mt-9 flex flex-col sm:flex-row gap-3"
              style={{ ["--ls-i" as string]: 5 }}
            >
              <Link href={primaryHref} className="as-btn as-btn-xl as-btn-accent as-btn-block sm:w-auto group">
                Начать бесплатно
                <Icon
                  name="arrow-right"
                  size={18}
                  className="transition-transform duration-200 ease-out group-hover:translate-x-1"
                />
              </Link>
              <Link href="/pricing" className="as-btn as-btn-xl as-btn-dark as-btn-block sm:w-auto">
                Тарифы от 199 ₽
              </Link>
            </div>

            <ul className="ls-friction ls-enter mt-6" style={{ ["--ls-i" as string]: 6 }}>
              {["3 дня бесплатно", "Без привязки карты", "Отмена в один клик"].map((t) => (
                <li key={t}>
                  <Icon name="check" size={13} style={{ color: "var(--as-good)" }} />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Превью продукта — 5 из 12 */}
          <div
            ref={previewRef}
            className="lg:col-span-5 ls-parallax ls-enter"
            style={{ ["--ls-i" as string]: 7 }}
          >
            <AccountPreview />
          </div>
        </div>

        <div className="ls-metrics ls-enter mt-14 sm:mt-16" style={{ ["--ls-i" as string]: 8 }}>
          {METRICS.map((m) => (
            <div key={m.label} className="ls-metric">
              <div className="ls-metric-value">
                <AnimatedNumber
                  value={m.value}
                  decimals={m.decimals}
                  prefix={m.prefix}
                  suffix={m.suffix}
                  from={m.from}
                />
              </div>
              <div className="ls-metric-label">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Превью личного кабинета: настоящие сущности продукта — статус
 * подписки, тариф, ближайший маршрут, задержка. Для скринридера
 * декоративно (роль несёт подпись под ним): дублировать те же цифры
 * в озвучке смысла нет, а разметка карточки только мешала бы.
 */
function AccountPreview() {
  return (
    <figure className="m-0">
      <Spotlight className="ls-preview p-5 sm:p-6">
        <div aria-hidden="true">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2.5">
              <span className="ls-dot" />
              <span className="text-[13px] font-medium text-white/85">Соединение активно</span>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-medium tracking-[0.1em] uppercase text-white/70">
              Plus
            </span>
          </div>

          <div className="mt-7">
            <div className="flex items-baseline gap-2">
              <span className="ls-num text-white font-bold text-[clamp(38px,9vw,52px)] leading-none tracking-[-0.03em]">
                <AnimatedNumber value={24} from={68} />
              </span>
              <span className="text-white/45 text-[15px] font-medium">мс</span>
            </div>
            <div className="mt-2.5 flex items-center gap-2 text-white/50 text-[13px]">
              <Icon name="globe" size={14} />
              Frankfurt · ближайший маршрут
            </div>
          </div>

          <dl className="ls-preview-row mt-6 pt-5 grid grid-cols-2 gap-4">
            <div>
              <dt className="ls-metric-label !mt-0">Устройства</dt>
              <dd className="mt-1.5 text-[14px] font-medium text-white/85">Безлимит</dd>
            </div>
            <div>
              <dt className="ls-metric-label !mt-0">Приоритет</dt>
              <dd className="mt-1.5 text-[14px] font-medium text-white/85">Максимальный</dd>
            </div>
          </dl>

          <div className="ls-preview-row mt-5 pt-5">
            <span className="ls-preview-cta">
              Подключить устройство
              <Icon name="arrow-right" size={15} />
            </span>
          </div>
        </div>
      </Spotlight>

      <figcaption className="mt-4 text-[12.5px] text-white/40 text-center lg:text-left">
        Так выглядит личный кабинет после регистрации
      </figcaption>
    </figure>
  );
}
