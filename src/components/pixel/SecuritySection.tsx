"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon, { type IconName } from "./Icon";
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
interface Guard {
  title: string;
  body: string;
  icon: IconName;
  href?: string;
  linkLabel?: string;
}

const GUARDS: Guard[] = [
  {
    title: "Дежурная смена, а не подрядчик",
    body:
      "Инфраструктуру ведёт собственный отдел информационной безопасности. Сеть и серверы под наблюдением круглосуточно: подозрительную активность гасят на месте, обновления безопасности ставят до того, как о них напишут в новостях.",
    icon: "shield",
  },
  {
    title: "Шифрование на всём пути",
    body: "Трафик закрыт от устройства до выходного сервера. Провайдер и владелец сети видят только то, что вы подключены.",
    icon: "bolt",
  },
  {
    title: "Выдать нечего",
    body: "Ни истории сайтов, ни DNS-запросов, ни журнала подключений. Данных, которые можно было бы запросить, просто не существует.",
    icon: "globe",
    href: "/privacy",
    linkLabel: "Политика конфиденциальности",
  },
  {
    title: "Доступ по ключам",
    body: "К серверам нельзя подключиться паролем: только ключ и второй фактор, каждый вход остаётся в журнале доступа.",
    icon: "clock",
    href: "/security",
    linkLabel: "Как мы защищаем данные",
  },
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
          index="03"
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

        <div className="px-guards px-stagger">
          {GUARDS.map((g) => (
            <article key={g.title} className="px-card px-guard px-reveal p-6 sm:p-8">
              <span className="px-benefit-icon" aria-hidden>
                <Icon name={g.icon} size={20} />
              </span>
              <h3 className="px-h3 mt-6">{g.title}</h3>
              <p className="px-body mt-3">{g.body}</p>
              {g.href && (
                <Link href={g.href} className="px-link group mt-4">
                  {g.linkLabel}
                  <Icon
                    name="arrow-right"
                    size={13}
                    className="transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                  />
                </Link>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
