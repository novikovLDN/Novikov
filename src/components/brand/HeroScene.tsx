"use client";

import Link from "next/link";
import BorderWall from "./BorderWall";
import KineticHeadline, { RollingNumber } from "./KineticHeadline";
import { DEVICE_LIMIT, PLANS, PLAN_SPEED } from "@/lib/plans";
import { COUNTRY_COUNT } from "@/lib/locations";
import { TRIAL_DAYS } from "@/lib/brand-facts";

/**
 * Первый экран.
 *
 * Стена из пикселей закрывает кадр, курсор её стирает, прокрутка
 * растворяет целиком. Над стеной — четыре вещи и ни одной лишней:
 * что это, заголовок, одна честная строка и одно действие. Полоса
 * показаний внизу.
 *
 * ЗАГОЛОВОК. Три варианта, выбран первый:
 *   1. «ЗДЕСЬ СТЕН НЕТ» — утверждение, работает со сценой напрямую:
 *      читатель стирает стену рукой и читает, что её нет.
 *   2. «СТЕНА СТИРАЕТСЯ» — описывает процесс, но звучит как подпись
 *      к анимации, а не как позиция бренда.
 *   3. «ИНТЕРНЕТ БЕЗ СТЕН» — понятнее всего и скучнее всего: ровно та
 *      формулировка, которую напишет любой конкурент.
 *
 * ПОДЗАГОЛОВОК. Три варианта, выбран первый:
 *   1. «Atlas — это VPN. Шифрует трафик, меняет страну, открывает то,
 *      что перестало открываться.» — называет продукт и механику.
 *   2. «VPN, который не притворяется чем-то другим.» — тон есть,
 *      пользы нет.
 *   3. «Быстрый VPN для телефона и компьютера.» — честно и никак.
 *
 * Все числа берутся из кода: скорость и цена — src/lib/plans.ts,
 * страны — src/lib/locations.ts, срок пробного доступа —
 * src/lib/brand-facts.ts.
 */
export default function HeroScene() {
  const monthly = PLANS.basic[1];

  return (
    <section className="b-hero" aria-labelledby="hero-title">
      <BorderWall />

      <div className="b-hero-body b-shell">
        <p className="b-label b-hero-kicker">
          Atlas <span aria-hidden>—</span> VPN
          <span className="b-hero-hint" aria-hidden>
            проведите курсором
          </span>
        </p>

        <KineticHeadline
          text="Здесь стен нет"
          id="hero-title"
          className="b-mega b-hero-title"
          reveal="css"
        />

        <div className="b-hero-say">
          <p className="b-lede">
            Atlas — это VPN. Шифрует трафик, меняет страну, открывает то, что
            перестало открываться.
          </p>
          <div className="b-hero-actions">
            <Link href="/auth" className="b-btn b-btn-acid">
              {TRIAL_DAYS} дня бесплатно
            </Link>
            <Link href="/pricing" className="b-btn b-btn-ghost">
              {monthly} ₽ в месяц
            </Link>
          </div>
          <p className="b-hero-fine">
            Без карты. Отмена в один клик. Мы не храним историю подключений.
          </p>
        </div>
      </div>

      <dl className="b-hero-rail b-shell">
        <div>
          <dt className="b-label">Стран</dt>
          <dd className="b-num"><RollingNumber value={COUNTRY_COUNT} /></dd>
        </div>
        <div>
          <dt className="b-label">Устройств</dt>
          <dd className="b-num"><RollingNumber value={DEVICE_LIMIT} /></dd>
        </div>
        <div>
          <dt className="b-label">Канал</dt>
          <dd className="b-num"><RollingNumber value={PLAN_SPEED.plus} suffix=" Гбит/с" /></dd>
        </div>
        <div>
          <dt className="b-label">Логи</dt>
          <dd className="b-num">нет</dd>
        </div>
      </dl>
    </section>
  );
}
