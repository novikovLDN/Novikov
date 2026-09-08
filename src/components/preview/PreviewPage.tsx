"use client";

import Link from "next/link";
import "./preview.css";
import { DEVICE_LIMIT, PLANS, PLAN_SPEED, formatRub, pricePerMonth } from "@/lib/plans";
import { COUNTRY_COUNT } from "@/lib/locations";
import { TRIAL_DAYS } from "@/lib/brand-facts";
import { typo } from "@/lib/typo";
import AsciiWall from "./AsciiWall";
import { VARIANTS, type Variant } from "./variants";

/**
 * Один макет — три системы.
 *
 * Содержание, числа и порядок блоков одинаковы во всех вариантах:
 * различаются только материал, гарнитуры, цвет и плотность. Иначе
 * сравнение превращается в выбор между разными текстами, а не между
 * направлениями.
 *
 * Строение взято из практики конверсионных лендингов 2026 (TRENDS-2.md
 * §1): главное — в первом экране, один призыв, доверие раньше эффекта.
 */


const META: Record<Variant, { name: string; idea: string }> = {
  a: { name: "Тихий", idea: "Премиальный минимализм: антиква, воздух, почти нет движения" },
  b: { name: "Стекло", idea: "Глубина и материал: матовые панели, мягкий свет, пространство" },
  c: { name: "Журнал", idea: "Редакционная подача: колонки, линейки, буквица" },
  d: { name: "Дерзкий", idea: "Цифропанк: трафарет, глитч, ASCII, наклейки, неон на бетоне" },
};

const FACTS: Array<[string, string]> = [
  [String(COUNTRY_COUNT), "стран на выбор"],
  [String(DEVICE_LIMIT), "устройств на подписке"],
  [`${PLAN_SPEED.plus} Гбит/с`, "ширина канала"],
  ["нет", "журналов подключений"],
];

const PROOF = [
  {
    t: "Открывает то, что закрыто",
    d: "Сайты и приложения, которые перестали открываться, работают снова. На телефоне, ноутбуке и телевизоре одинаково.",
  },
  {
    t: "Не проседает вечером",
    d: "Широкий канал рассчитан на час пик. Созвон не рассыпается, фильм не встаёт на паузу, игра не превращается в слайд-шоу.",
  },
  {
    t: "Нечего отдать",
    d: "Не храним ни посещённые сайты, ни DNS-запросы, ни историю подключений. Хранить нечего — значит нечего и передать.",
  },
];

export default function PreviewPage({ variant }: { variant: Variant }) {
  const year = pricePerMonth("basic", 12);
  const month = PLANS.basic[1];

  return (
    <div className={`pv pv-${variant}`}>
      {/* Панель сравнения — только для выбора направления, в продукт
          она не идёт. */}
      <nav className="pv-switch" aria-label="Направления">
        {VARIANTS.map((v) => (
          <Link key={v} href={`/preview/${v}`} className={`pv-switch-btn${v === variant ? " pv-switch-on" : ""}`}>
            {META[v].name}
          </Link>
        ))}
        <span className="pv-switch-idea">{META[variant].idea}</span>
      </nav>

      <header className="pv-head">
        <span className="pv-mark">Atlas</span>
        <span className="pv-head-nav">
          <Link href="/pricing">Тарифы</Link>
          <Link href="/support">Поддержка</Link>
          <Link href="/auth" className="pv-head-cta">Войти</Link>
        </span>
      </header>

      <main>
        {/* ─── Первый экран ─────────────────────────────────────── */}
        <section className="pv-hero">
          {variant === "d" && (
            <>
              {/* Стена из знаков за содержанием — язык DedSec собран из
                  дизеринга, ASCII и глитча, а не из иллюстраций. */}
              <AsciiWall />
              <span className="pv-tape pv-tape-1" aria-hidden>//ATLAS_NODE_19</span>
              <span className="pv-tape pv-tape-2" aria-hidden>СТЕНА_НЕ_ТВОЯ</span>
            </>
          )}
          <div className="pv-wrap">
            <p className="pv-kicker">Atlas — VPS для телефона и компьютера</p>
            <h1 className="pv-h1" data-text="Интернет без стен">
              Интернет <em>без стен</em>
            </h1>
            <p className="pv-lede">
              {typo("Шифруем трафик, меняем страну и открываем то, что перестало открываться. Настройка занимает минуту.")}
            </p>

            <div className="pv-cta">
              <span className="pv-hud">
                <Link href="/auth" className="pv-btn" data-glitch="Взломать стену">
                  {variant === "d" ? "Взломать стену" : `Попробовать ${TRIAL_DAYS} дня бесплатно`}
                </Link>
              </span>
              <span className="pv-cta-note">
                {typo(`Без карты. Дальше ${formatRub(year)} ₽ в месяц при оплате за год.`)}
              </span>
            </div>

            <dl className="pv-facts">
              {FACTS.map(([v, l]) => (
                <div key={l}>
                  <dt>{v}</dt>
                  <dd>{l}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ─── Доказательство ───────────────────────────────────── */}
        <section className="pv-proof">
          <div className="pv-wrap">
            <p className="pv-label">Что это даёт</p>
            <div className="pv-proof-grid">
              {PROOF.map((p, i) => (
                <article key={p.t} className="pv-card">
                  <span className="pv-card-n">{String(i + 1).padStart(2, "0")}</span>
                  <h2 className="pv-h3">{typo(p.t)}</h2>
                  <p className="pv-body">{typo(p.d)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Цена ─────────────────────────────────────────────── */}
        <section className="pv-price">
          <div className="pv-wrap pv-price-inner">
            <div>
              <p className="pv-label">Цена</p>
              <p className="pv-price-value">
                {formatRub(year)} <span>₽ в месяц</span>
              </p>
              <p className="pv-body">
                {typo(`Тариф Basic при оплате за год. Помесячно — ${formatRub(month)} ₽. Отмена в один клик, деньги за неиспользованное возвращаются.`)}
              </p>
            </div>
            <Link href="/auth" className="pv-btn pv-btn-quiet">
              Начать
            </Link>
          </div>
        </section>
      </main>

      <footer className="pv-foot">
        <div className="pv-wrap">
          <span>© 2026 Atlas Secure</span>
          <span>Часть группы QoDev</span>
        </div>
      </footer>
    </div>
  );
}
