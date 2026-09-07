"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import BorderWall from "./BorderWall";
import AsciiWall from "./AsciiWall";
import TrustStrip from "./TrustStrip";
import { RollingNumber } from "./KineticHeadline";
import { usePrefersReducedMotion } from "./motion";
import { DEVICE_LIMIT, PLANS, PLAN_SPEED } from "@/lib/plans";
import { COUNTRY_COUNT } from "@/lib/locations";
import { TRIAL_DAYS } from "@/lib/brand-facts";
import { typo } from "@/lib/typo";

/**
 * ПЕРВЫЙ ЭКРАН — граница, которую двигают рукой.
 *
 * Третья конструкция, и первые две отвергнуты по делу:
 *   1) заголовок-плакат и семь слоёв вокруг — красиво и мертво,
 *      продукт описан словами;
 *   2) заголовок плюс терминал сбоку — взаимодействие появилось, но
 *      кадр распался на две несвязанные половины.
 *
 * Здесь кадр один, и он же и есть продукт. Экран разрезан вертикально:
 * слева — интернет без нас (мёртвая сетка, коды ошибок, шум), справа —
 * он же через Atlas (живая стена, кислота, открыто). Границу можно
 * тащить мышью, пальцем и стрелками с клавиатуры.
 *
 * Заголовок разрезан той же границей: слева он серый и сбитый, справа
 * целый и белый. Двигая ручку, человек буквально чинит фразу — это и
 * есть демонстрация, для которой не нужно ни одного слова объяснения.
 *
 * ДОСТУПНОСТЬ. Содержание лежит НАД разрезом и видно всегда, при любом
 * положении границы: разрез трогает только среду. Ручка — настоящий
 * слайдер с ролью, значением и управлением стрелками. Мёртвая
 * половина скрыта от диктора: это декорация, а не сообщение.
 */
const DEAD_LINES = [
  "ERR_CONNECTION_RESET",
  "ERR_TIMED_OUT",
  "доступ ограничен",
  "ERR_CONNECTION_CLOSED",
  "сеть недоступна",
];

const MIN = 12;
const MAX = 88;

export default function SplitHero({ primaryHref }: { primaryHref: string }) {
  const [split, setSplit] = useState(44);
  const rootRef = useRef<HTMLElement>(null);
  const dragging = useRef(false);
  const reduced = usePrefersReducedMotion();

  const setFromX = useCallback((clientX: number) => {
    const node = rootRef.current;
    if (!node) return;
    const r = node.getBoundingClientRect();
    const pct = ((clientX - r.left) / r.width) * 100;
    setSplit(Math.max(MIN, Math.min(MAX, pct)));
  }, []);

  useEffect(() => {
    const move = (e: PointerEvent) => { if (dragging.current) setFromX(e.clientX); };
    const up = () => { dragging.current = false; document.body.classList.remove("b-dragging"); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [setFromX]);

  /* Подсказка движением: граница один раз мягко качается, чтобы стало
     видно, что её можно двигать. Ни таймеров-повторов, ни стрелок —
     если приём не считывается с первого раза, второй не поможет. */
  useEffect(() => {
    if (reduced) return;
    const t = setTimeout(() => {
      const node = rootRef.current;
      if (!node || dragging.current) return;
      node.classList.add("b-split-hint");
      const off = () => node.classList.remove("b-split-hint");
      node.addEventListener("animationend", off, { once: true });
    }, 1400);
    return () => clearTimeout(t);
  }, [reduced]);

  const onKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 3;
    if (e.key === "ArrowLeft") { e.preventDefault(); setSplit((v) => Math.max(MIN, v - step)); }
    if (e.key === "ArrowRight") { e.preventDefault(); setSplit((v) => Math.min(MAX, v + step)); }
    if (e.key === "Home") { e.preventDefault(); setSplit(MIN); }
    if (e.key === "End") { e.preventDefault(); setSplit(MAX); }
  };

  return (
    <section
      ref={rootRef}
      className="b-hero b-split"
      style={{ ["--split" as string]: `${split}%` }}
      aria-labelledby="hero-title"
    >
      {/* ─── Мёртвая половина: интернет без нас ─────────────────── */}
      <div className="b-split-dead" aria-hidden>
        <AsciiWall rows={18} cols={70} />
        <ul className="b-dead-log">
          {DEAD_LINES.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </div>

      {/* ─── Живая половина: он же через Atlas ──────────────────── */}
      <div className="b-split-live" aria-hidden>
        <BorderWall />
      </div>

      {/* ─── Метки сторон ───────────────────────────────────────── */}
      <span className="b-split-tag b-split-tag-dead" aria-hidden>без Atlas</span>
      <span className="b-split-tag b-split-tag-live" aria-hidden>с Atlas</span>

      {/* ─── Граница ────────────────────────────────────────────── */}
      <div
        className="b-split-handle"
        role="slider"
        tabIndex={0}
        aria-label="Граница между интернетом без Atlas и через Atlas. Двигайте, чтобы сравнить"
        aria-valuemin={MIN}
        aria-valuemax={MAX}
        aria-valuenow={Math.round(split)}
        aria-valuetext={`открыто на ${Math.round(split)} процентов`}
        onPointerDown={(e) => {
          dragging.current = true;
          document.body.classList.add("b-dragging");
          setFromX(e.clientX);
        }}
        onKeyDown={onKey}
      >
        <span className="b-split-grip" aria-hidden />
      </div>

      {/* ─── Содержание: всегда над разрезом ────────────────────── */}
      <div className="b-hero-body b-shell">
        {/* Надзаголовка нет: метки сторон «без Atlas» и «с Atlas» уже
            называют продукт, а вместе они налезали друг на друга. */}
        <h1 id="hero-title" className="b-mega b-hero-title b-split-title">
          {/* Слева фраза сбита, справа цела: двигая границу, человек
              чинит заголовок руками. Копия для мёртвой стороны скрыта
              от диктора — он читает один текст. */}
          <span className="b-split-title-dead" aria-hidden>Здесь стен нет</span>
          <span className="b-split-title-live">Здесь стен нет</span>
        </h1>

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
              {PLANS.basic[1]} ₽ в месяц
            </Link>
          </div>

          <p className="b-hero-fine">{typo(`${TRIAL_DAYS} дня бесплатно, без карты.`)}</p>
          <TrustStrip />
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
