"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "./Icon";
import StickyScene, { type SceneStep } from "./StickyScene";
import ParticleHeading from "./ParticleHeading";
import SectionHeading from "./SectionHeading";
import { useReducedMotion } from "./motion";

/**
 * Безопасность и собственный отдел ИБ.
 *
 * Раньше приватность на главной была одной строкой в списке
 * преимуществ — то есть равной по весу «настройке за минуту».
 * Защита данных — отдельный аргумент покупки, и у него отдельный
 * блок.
 *
 * ТРЕБУЕТ ПОДТВЕРЖДЕНИЯ ЭКСПЛУАТАЦИЕЙ (правило CLAUDE.md о числах и
 * заявлениях): состав дежурной смены и режим её работы описаны со
 * слов владельца сервиса. Сертификаций мы не заявляем — их здесь
 * намеренно нет. Отсутствие журналов подтверждено страницами
 * /privacy и /security.
 *
 * Четыре гарантии показаны залипающей сценой — той же, что у шагов
 * подключения: читатель проходит их по одной, а не пробегает
 * глазами сетку из четырёх карточек. Ссылки на подробные страницы
 * стоят под сценой, чтобы не спорить с ней за внимание.
 *
 * Крупное слово набрано точками (ParticleHeading): курсор стирает
 * буквы и они собираются обратно. Мотив тот же, что у кубиков, —
 * пиксель как единица, из которой собран продукт.
 *
 * На узком экране слово короче. Двенадцать букв на 320px ужимаются
 * до кегля, при котором точки складываются не в буквы, а в шум:
 * длина строки здесь — вопрос читаемости, а не вкуса.
 */
const BAND_WIDE = { text: "БЕЗОПАСНОСТЬ", height: 116 };
const BAND_MID = { text: "БЕЗОПАСНОСТЬ", height: 92 };
const BAND_NARROW = { text: "ЗАЩИТА", height: 88 };
const GUARDS: SceneStep[] = [
  {
    n: "01",
    title: "Дежурная смена, а не подрядчик",
    body:
      "Инфраструктуру ведёт собственный отдел информационной безопасности. Сеть и серверы под наблюдением круглосуточно: подозрительную активность гасят на месте, обновления ставят до того, как о них напишут в новостях.",
    hint: "смена 24/7 → инцидент → реакция на месте",
    icon: "shield",
  },
  {
    n: "02",
    title: "Шифрование на всём пути",
    body:
      "Трафик закрыт от устройства до выходного сервера. Провайдер и владелец сети видят только то, что вы подключены.",
    hint: "устройство → шифр → выходной сервер",
    icon: "bolt",
  },
  {
    n: "03",
    title: "Выдать нечего",
    body:
      "Ни истории сайтов, ни DNS-запросов, ни журнала подключений. Данных, которые можно было бы запросить, просто не существует.",
    hint: "нет журналов → нечего запрашивать",
    icon: "globe",
  },
  {
    n: "04",
    title: "Доступ по ключам",
    body:
      "К серверам нельзя подключиться паролем: только ключ и второй фактор, каждый вход остаётся в журнале доступа.",
    hint: "ключ + второй фактор → запись в журнале",
    icon: "clock",
  },
];

const LINKS = [
  { href: "/privacy", label: "Политика конфиденциальности" },
  { href: "/security", label: "Как мы защищаем данные" },
];

export default function SecuritySection() {
  const reduced = useReducedMotion();
  const [band, setBand] = useState(BAND_WIDE);

  useEffect(() => {
    const pick = () => {
      const w = window.innerWidth;
      setBand(w < 640 ? BAND_NARROW : w < 1024 ? BAND_MID : BAND_WIDE);
    };
    pick();
    window.addEventListener("resize", pick, { passive: true });
    return () => window.removeEventListener("resize", pick);
  }, []);

  return (
    <section className="px-section px-guard-section" aria-labelledby="security-title">
      <div className="px-shell">
        <SectionHeading
          eyebrow="Безопасность"
          title={["Ваши данные ведёт", "отдельная команда"]}
          titleId="security-title"
          index="04"
          action={{ label: "О защите данных", href: "/security" }}
        />

        <p className="px-lede px-reveal -mt-6 mb-12">
          Безопасность у нас — не пункт в списке возможностей, а люди с
          дежурством и зоной ответственности. Ниже — что именно они держат.
        </p>

        <div className="px-particle-band px-reveal" data-cursor-hover>
          <ParticleHeading
            key={band.text}
            text={band.text}
            height={band.height}
            className="px-particle-head"
          />
          {!reduced && (
            <p className="px-caption px-particle-hint">
              Проведите курсором по надписи
            </p>
          )}
        </div>

      </div>

      <StickyScene caption="Безопасность" steps={GUARDS} />

      <div className="px-shell">
        <div className="px-guard-links px-reveal">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="px-link group">
              {l.label}
              <Icon
                name="arrow-right"
                size={13}
                className="transition-transform duration-200 ease-out group-hover:translate-x-0.5"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
