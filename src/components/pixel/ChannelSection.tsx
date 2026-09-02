"use client";

import Link from "next/link";
import Icon from "./Icon";
import SectionHeading from "./SectionHeading";
import { AnimatedNumber, useInView } from "./motion";
import { PLAN_CONTENT, PLAN_SPEED, type PlanId } from "@/lib/plans";

/**
 * Скорость канала.
 *
 * Заменяет слово «магистраль», которое стояло и в герое, и в
 * преимуществах. Термин из инженерного словаря: покупатель не обязан
 * знать, что магистральный канал — это не его личная скорость. Здесь
 * то же самое сказано его словами — «ширина трубы между вами и
 * сервером» — и подкреплено масштабом, который можно проверить
 * бытовым опытом (фильм в 4K).
 *
 * Числа берутся из src/lib/plans.ts (PLAN_SPEED) — того же файла, из
 * которого их берёт касса и состав тарифа. Дублировать их здесь
 * нельзя: витрина и тариф обязаны говорить одно и то же.
 *
 * Шкалы растут при появлении в кадре. Анимируется только transform
 * (scaleX), поэтому рост полосы не вызывает пересчёт раскладки. Без
 * JS полосы отрисованы сразу заполненными — см. `.px-gauge-fill`.
 *
 * Число вынесено вперёд и набрано в размер иллюстрации: на витрине,
 * где вся суть в одной цифре, она должна читаться раньше текста.
 * Подпись тарифа и пояснение выстроены вокруг неё, а не над ней.
 */
const ORDER: PlanId[] = ["basic", "plus"];

const NOTE: Record<PlanId, string> = {
  basic: "Повседневный интернет: 4K, соцсети, работа, музыка.",
  plus: "Приоритет в очереди: игры, стримы и созвоны идут первыми.",
};

/** Максимум шкалы — самый широкий канал в линейке. */
const SCALE = Math.max(...ORDER.map((id) => PLAN_SPEED[id]));

export default function ChannelSection() {
  const [ref, inView] = useInView<HTMLUListElement>(0.25);

  return (
    <section className="px-section" aria-labelledby="channel-title">
      <div className="px-shell">
        <SectionHeading
          eyebrow="Скорость"
          title={["Ширина канала —", "простыми словами"]}
          titleId="channel-title"
          index="02"
          action={{ label: "Все тарифы", href: "/pricing" }}
        />

        <p className="px-lede px-reveal -mt-6 mb-12">
          Канал — это ширина трубы между вами и нашим сервером. Чем она шире,
          тем больше людей одновременно смотрят, качают и играют, не мешая
          друг другу. Ниже — не рекламное «до», а та ширина, которая стоит
          за подключением на каждом тарифе.
        </p>

        <ul ref={ref} className={`px-gauges${inView ? " px-gauge-live" : ""}`}>
          {ORDER.map((id, i) => (
            <li key={id} className="px-gauge px-spot px-reveal" style={{ ["--px-delay" as string]: `${i * 120}ms` }}>
              <div className="px-gauge-head">
                <span className="px-tag">{PLAN_CONTENT[id].name}</span>
                <span className="px-gauge-order">{`0${i + 1}`}</span>
              </div>

              <p className={`px-figure-xl mt-4${id === "plus" ? " px-figure-xl-accent" : ""}`}>
                <AnimatedNumber value={PLAN_SPEED[id]} />
                <span className="px-figure-unit">Гбит/с</span>
              </p>

              <div className="px-gauge-track" aria-hidden>
                <span
                  className={`px-gauge-fill${id === "plus" ? " px-gauge-fill-hi" : ""}`}
                  style={{ ["--p" as string]: PLAN_SPEED[id] / SCALE, ["--px-delay" as string]: `${i * 160}ms` }}
                />
              </div>

              <p className="px-body px-gauge-note">{NOTE[id]}</p>
            </li>
          ))}
        </ul>

        <div className="px-scale px-reveal">
          <p className="px-scale-lede">
            Чтобы почувствовать масштаб: фильму в 4K хватает
            <span className="px-scale-mark"> 25 Мбит/с</span> — это одна
            тысячная канала на тарифе Basic.
          </p>
          <div className="px-scale-strip" aria-hidden>
            {Array.from({ length: 40 }, (_, i) => (
              <span key={i} style={{ ["--i" as string]: i }} />
            ))}
          </div>
          <Link href="/infrastructure" className="px-link group">
            Как устроена сеть
            <Icon
              name="arrow-right"
              size={13}
              className="transition-transform duration-200 ease-out group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
