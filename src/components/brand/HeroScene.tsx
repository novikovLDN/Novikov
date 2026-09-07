"use client";

import Link from "next/link";
import BorderWall from "./BorderWall";
import TrustStrip from "./TrustStrip";
import AccessProbe from "./AccessProbe";
import ScatterSkulls from "./ScatterSkulls";
import KineticHeadline, { RollingNumber } from "./KineticHeadline";
import { DEVICE_LIMIT, PLANS, PLAN_SPEED } from "@/lib/plans";
import { COUNTRY_COUNT } from "@/lib/locations";
import { TRIAL_DAYS } from "@/lib/brand-facts";
import { typo } from "@/lib/typo";

/**
 * Первый экран.
 *
 * ПЕРЕСОБРАН. Было: заголовок-плакат и вокруг него семь слоёв —
 * стена, зерно, развёртка, прокат, метки, скотч и подсказка про
 * курсор. Взаимодействия при этом не было ни одного: продукт
 * описывался словами, а показывался — двумя секциями ниже.
 *
 * Стало: первый экран сам и есть демонстрация. Практика 2026
 * (TRENDS-2.md §6): герой уходит от картинки к взаимодействию, и
 * мгновенный отклик на действие человек читает как признак
 * компетентности. Вводишь адрес — видишь ответ до и после, не
 * прокручивая ничего.
 *
 * Слоёв стало меньше, а не больше: убраны прокат развёртки и
 * подсказка про курсор — стена осталась фоном, но перестала быть
 * тем, ради чего сюда пришли. Правило дозировки прежнее: один
 * громкий элемент в кадре, остальное тихо.
 *
 * Все числа из кода: скорость и цена — src/lib/plans.ts, страны —
 * src/lib/locations.ts, срок пробного доступа — brand-facts.ts.
 */
const METRICS = [
  { value: COUNTRY_COUNT, label: "стран", suffix: "" },
  { value: DEVICE_LIMIT, label: "устройств", suffix: "" },
  { value: PLAN_SPEED.plus, label: "канал", suffix: " Гбит/с" },
];

interface HeroSceneProps {
  primaryHref: string;
}

export default function HeroScene({ primaryHref }: HeroSceneProps) {
  const monthly = PLANS.basic[1];

  return (
    <section className="b-hero" aria-labelledby="hero-title">
      <BorderWall />
      <ScatterSkulls seed={3} count={3} />

      <span className="b-tape b-tape-acid b-hero-tape-1" aria-hidden>
        //ATLAS_NODE_{COUNTRY_COUNT}
      </span>

      <div className="b-hero-body b-shell">
        <p className="b-label b-label-sys b-hero-kicker">Atlas — VPN</p>

        <KineticHeadline
          text="Здесь стен нет"
          id="hero-title"
          className="b-mega b-hero-title"
          reveal="css"
          glitch
        />

        <div className="b-hero-grid">
          <div className="b-hero-say">
            <p className="b-lede">
              {typo("Шифрует трафик, меняет страну и открывает то, что перестало открываться.")}
            </p>

            <div className="b-hero-actions">
              <span className="b-hud">
                <Link href={primaryHref} className="b-btn b-btn-acid b-btn-hot">
                  Взломать стену
                </Link>
              </span>
              <Link href="/pricing" className="b-btn b-btn-ghost">
                {monthly} ₽ в месяц
              </Link>
            </div>

            <p className="b-hero-fine">
              {typo(`${TRIAL_DAYS} дня бесплатно, без карты.`)}
            </p>
            <TrustStrip />
          </div>

          {/* Демонстрация прямо в кадре: продукт показан, а не описан. */}
          <div className="b-hero-probe">
            <AccessProbe compact />
          </div>
        </div>
      </div>

      <dl className="b-hero-rail b-shell">
        {METRICS.map((m) => (
          <div key={m.label} className="b-hero-metric">
            <dt className="b-label">{m.label}</dt>
            <dd className="b-num">
              <RollingNumber value={m.value} suffix={m.suffix} />
            </dd>
          </div>
        ))}
        <div className="b-hero-metric">
          <dt className="b-label">логи</dt>
          <dd className="b-num">нет</dd>
        </div>
      </dl>
    </section>
  );
}
