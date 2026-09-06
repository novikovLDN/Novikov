import SectionHeading from "./SectionHeading";
import PresenceMap from "./PresenceMap";
import { PLAN_SPEED } from "@/lib/plans";
import { CITY_COUNT, COUNTRY_COUNT, plural } from "@/lib/locations";

/**
 * Локации.
 *
 * Состав сети живёт в src/lib/locations.ts — там же, откуда его берут
 * бегущая строка под первым экраном, карточка статуса в кабинете и
 * метрика «стран присутствия» в герое. Здесь он только показывается.
 *
 * Показывается картой, а не списком: список отвечал на вопрос
 * «сколько», а человек, выбирающий страну выхода, задаёт вопрос
 * «где». Девятнадцать строк к тому же занимали два экрана прокрутки.
 * Легенда под картой сохраняет перечень целиком — для тех, кому
 * карта недоступна, и для мелких экранов.
 */
const CHANNEL = `до ${PLAN_SPEED.plus} Гбит/с`;

export default function LocationsSection() {
  return (
    <section className="px-section" aria-labelledby="locations-title">
      <div className="px-shell">
        <SectionHeading
          eyebrow="Инфраструктура"
          title={["Серверы там,", "где вам нужно"]}
          titleId="locations-title"
          index="09"
          action={{ label: "Об инфраструктуре", href: "/infrastructure" }}
        />

        <p className="px-lede px-reveal -mt-6 mb-10">
          {COUNTRY_COUNT} {plural(COUNTRY_COUNT, ["страна", "страны", "стран"])} и{" "}
          {CITY_COUNT} {plural(CITY_COUNT, ["город", "города", "городов"])} — от Минска
          и Варшавы до Токио и Лос-Анджелеса. Клиент сам выбирает ближайший маршрут,
          а нужную страну можно закрепить вручную. Скорость канала одинаковая
          везде: {CHANNEL}.
        </p>

        <div className="px-reveal">
          <PresenceMap />
        </div>

        <p className="px-caption px-reveal mt-6">
          Задержка указана ориентировочно — типовой отклик из Москвы до
          ближайшей точки страны.
        </p>
      </div>
    </section>
  );
}
