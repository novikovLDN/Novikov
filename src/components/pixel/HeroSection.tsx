"use client";

import Link from "next/link";
import CubeCluster from "./CubeCluster";
import Icon from "./Icon";

/**
 * Первый экран.
 *
 * Композиция по референсу: слева очень крупный заголовок, короткий
 * подзаголовок и блок действий — широкая акцентная панель сверху и две
 * тёмные второстепенные под ней в ряд. Справа — живой кластер кубиков,
 * стоящий в ячейках той же фоновой сетки, что и вся страница.
 *
 * Действия наши, не из референса: «Скачать» здесь неуместно — у сервиса
 * нет загрузки, вход происходит по почте.
 *
 * Язык публичный: ускорение и стабильность. Слово «VPN» и названия
 * туннельных протоколов на публичных страницах не употребляются —
 * точная терминология живёт в личном кабинете.
 *
 * Зелёная точка статуса — единственное санкционированное применение
 * зелёного вне кабинета: это индикатор состояния системы, а не декор.
 */
interface HeroSectionProps {
  primaryHref: string;
}

export default function HeroSection({ primaryHref }: HeroSectionProps) {
  return (
    <section className="px-hero" aria-labelledby="hero-title">
      <div className="px-shell grid lg:grid-cols-12 gap-14 lg:gap-10 items-center w-full">
        <div className="lg:col-span-7">
          <p className="px-status px-reveal">
            <span className="px-status-dot" aria-hidden />
            <span className="px-eyebrow">Все серверы работают</span>
          </p>

          <h1 id="hero-title" className="px-h1 px-reveal mt-6">
            Интернет
            <br />
            без просадок
          </h1>

          <p className="px-lede px-reveal mt-6">
            Игры, созвоны и стриминг без фризов — сразу на всех устройствах.
            Подключение занимает полминуты.
          </p>

          <div className="px-cta px-reveal mt-9">
            <Link href={primaryHref} className="px-btn px-btn-xl px-btn-primary px-btn-block group">
              Создать аккаунт
              <Icon
                name="arrow-right"
                size={18}
                className="transition-transform duration-200 ease-out group-hover:translate-x-1"
              />
            </Link>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <Link href="/pricing" className="px-btn px-btn-md px-btn-secondary">
                Тарифы
              </Link>
              <Link href="/auth" className="px-btn px-btn-md px-btn-secondary">
                Войти
              </Link>
            </div>
          </div>

          <ul className="px-friction px-reveal mt-6">
            {["3 дня бесплатно", "Без карты", "Отмена в один клик"].map((t) => (
              <li key={t}>
                <Icon name="check" size={13} className="px-accent" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-5 flex justify-center lg:justify-end px-reveal">
          <CubeCluster />
        </div>
      </div>
    </section>
  );
}
