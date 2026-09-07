"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import BorderWall from "./BorderWall";
import TrustStrip from "./TrustStrip";
import { RollingNumber } from "./KineticHeadline";
import { usePrefersReducedMotion } from "./motion";
import { DEVICE_LIMIT, PLANS, PLAN_SPEED } from "@/lib/plans";
import { COUNTRY_COUNT, LOCATIONS } from "@/lib/locations";
import { TRIAL_DAYS } from "@/lib/brand-facts";
import { typo } from "@/lib/typo";

/**
 * ПЕРВЫЙ ЭКРАН — гонка двух полос.
 *
 * Третья пересборка, и каждая прошлая отвергнута по делу:
 *   1) заголовок-плакат с семью слоями — красиво и мёртво;
 *   2) заголовок плюс терминал сбоку — кадр развалился надвое;
 *   3) разрез с ручкой — приём требовал действия, чтобы что-то
 *      показать, а первый экран обязан объяснять себя сам.
 *
 * Здесь ничего трогать не нужно. Две дорожки идут наперегонки: без
 * ускорителя полоса ползёт и застревает, с Atlas проскакивает и
 * упирается в готово. Это буквальное изображение слова «ускоритель»,
 * и оно читается за секунду без единой строки объяснения.
 *
 * Гонка идёт сама и повторяется: сайт должен жить, а не ждать
 * действия. При prefers-reduced-motion показывается результат забега
 * без самого забега — смысл сохраняется целиком.
 *
 * Все числа из кода: задержка ближайшего узла — src/lib/locations.ts,
 * скорость канала и цена — src/lib/plans.ts.
 */
const NEAREST = [...LOCATIONS].sort((a, b) => a.latencyMs - b.latencyMs)[0];

/** Профиль медленной дорожки: рывок, долгий застой, ещё рывок. Так
 *  ведёт себя соединение, которое «вроде грузится». */
function slowAt(t: number) {
  if (t < 0.18) return t * 2.1;
  if (t < 0.55) return 0.378 + (t - 0.18) * 0.12;
  if (t < 0.72) return 0.422 + (t - 0.55) * 0.9;
  return Math.min(0.72, 0.575 + (t - 0.72) * 0.35);
}

export default function RaceHero({ primaryHref }: { primaryHref: string }) {
  const [slow, setSlow] = useState(0);
  const [fast, setFast] = useState(0);
  const reduced = usePrefersReducedMotion();
  const raf = useRef(0);

  useEffect(() => {
    if (reduced) {
      setSlow(0.62);
      setFast(1);
      return;
    }
    let start = performance.now();
    const RUN = 5200;
    const HOLD = 2600;

    const frame = (now: number) => {
      raf.current = requestAnimationFrame(frame);
      const elapsed = now - start;
      if (elapsed > RUN + HOLD) { start = now; return; }
      const t = Math.min(1, elapsed / RUN);
      setSlow(slowAt(t));
      // Быстрая дорожка финиширует к четверти забега и ждёт.
      setFast(Math.min(1, t / 0.26));
    };
    raf.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf.current);
  }, [reduced]);

  const pct = (v: number) => Math.round(v * 100);

  return (
    <section className="b-hero b-race" aria-labelledby="hero-title">
      <BorderWall />

      <div className="b-hero-body b-shell">
        <h1 id="hero-title" className="b-mega b-hero-title b-glitch" data-text="УСКОРИТЕЛЬ ИНТЕРНЕТА">
          Ускоритель интернета
        </h1>

        <div className="b-race-grid">
          {/* ─── Гонка ──────────────────────────────────────────── */}
          <div className="b-lanes" role="img"
               aria-label={`Наглядное сравнение: без ускорителя загрузка доходит до ${pct(slow)} процентов и стоит, через Atlas завершается за ${NEAREST.latencyMs} миллисекунд`}>
            <div className="b-lane">
              <p className="b-label b-lane-name">без ускорителя</p>
              <div className="b-lane-track">
                <span className="b-lane-fill b-lane-slow" style={{ width: `${pct(slow)}%` }} />
              </div>
              <p className="b-lane-value b-num">
                {pct(slow)}% <span className="b-lane-note">не отвечает</span>
              </p>
            </div>

            <div className="b-lane b-lane-hot">
              <p className="b-label b-lane-name">с Atlas</p>
              <div className="b-lane-track">
                <span className="b-lane-fill b-lane-fast" style={{ width: `${pct(fast)}%` }} />
              </div>
              <p className="b-lane-value b-num">
                {fast >= 1 ? "готово" : `${pct(fast)}%`}{" "}
                <span className="b-lane-note">
                  {NEAREST.cities[0]} · {NEAREST.latencyMs} мс
                </span>
              </p>
            </div>
          </div>

          {/* ─── Смысл и действие ───────────────────────────────── */}
          <div className="b-hero-say">
            <p className="b-lede">
              {typo("Atlas — это VPN и виртуальные серверы. Шифрует трафик, меняет страну и открывает то, что перестало открываться.")}
            </p>

            <div className="b-hero-actions">
              <span className="b-hud">
                <Link href={primaryHref} className="b-btn b-btn-acid b-btn-hot">
                  {TRIAL_DAYS} дня бесплатно
                </Link>
              </span>
              <Link href="/vps" className="b-btn b-btn-ghost">
                Серверы VPS
              </Link>
            </div>

            <p className="b-hero-fine">
              {typo(`Без карты. Дальше от ${PLANS.basic[1]} ₽ в месяц.`)}
            </p>
            <TrustStrip />
          </div>
        </div>
      </div>

      <dl className="b-hero-rail b-shell">
        <div className="b-hero-metric">
          <dt className="b-label">стран</dt>
          <dd className="b-num"><RollingNumber value={COUNTRY_COUNT} /></dd>
        </div>
        <div className="b-hero-metric">
          <dt className="b-label">устройств</dt>
          <dd className="b-num"><RollingNumber value={DEVICE_LIMIT} /></dd>
        </div>
        <div className="b-hero-metric">
          <dt className="b-label">канал</dt>
          <dd className="b-num"><RollingNumber value={PLAN_SPEED.plus} suffix=" Гбит/с" /></dd>
        </div>
        <div className="b-hero-metric">
          <dt className="b-label">логи</dt>
          <dd className="b-num">нет</dd>
        </div>
      </dl>
    </section>
  );
}
