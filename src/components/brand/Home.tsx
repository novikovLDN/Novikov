"use client";

import { useEffect } from "react";
import BrandHeader from "./BrandHeader";
import MotionField from "./MotionField";
import PacketRail from "./PacketRail";
import RaceHero from "./RaceHero";
import ManifestoScene from "./ManifestoScene";
import FactsBand from "./FactsBand";
import BentoSection from "./BentoSection";
import HowScene from "./HowScene";
import AtlasScene from "./AtlasScene";
import PriceScene from "./PriceScene";
import OutroScene from "./OutroScene";
import BrandFooter from "./BrandFooter";
import { Cursor, SmoothScroll } from "./motion";

/**
 * Главная страница — направление «ГРАНИЦА» (TRENDS.md §11).
 *
 * Страница собрана сценами, а не блоками: каждая сцена держит кадр,
 * пока читатель проходит её высоту, и передаёт следующей. Порядок
 * такой же, как у разговора: что это → что мешает сейчас → как это
 * снимается → где работает → сколько стоит → начать.
 */
export default function Home({ referralCode }: { referralCode?: string }) {
  // Реферальный код подставляется в ссылку входа, а не только
  // складывается в память устройства: приглашённый мог прийти по
  // ссылке и уйти на вход в том же клике.
  const primaryHref = referralCode ? `/auth?ref=${encodeURIComponent(referralCode)}` : "/auth";

  // Реферальный код запоминается на устройстве и подставляется на
  // входе. Витрина от него не зависит и остаётся статической.
  // Состояния, которые прячут содержимое до срабатывания скрипта,
  // объявлены под .b-js. Без скрипта страница отрисована целиком:
  // прятать разрешено только после того, как механизм показа доказал
  // работоспособность.
  useEffect(() => {
    document.documentElement.classList.add("b-js");
    return () => document.documentElement.classList.remove("b-js");
  }, []);

  useEffect(() => {
    if (!referralCode) return;
    try { localStorage.setItem("atlas-ref", referralCode); } catch { /* приватный режим */ }
  }, [referralCode]);

  return (
    <div className="b-root">
      <a href="#main" className="b-skip">К содержимому</a>
      <SmoothScroll />
      {/* Одно поле движения на страницу: скорость прокрутки пружиной
          и потеря сигнала при простое. Всё остальное подключается к
          нему одной строкой CSS. */}
      <MotionField />
      <PacketRail />
      <Cursor />
      <div className="b-grid-lines" aria-hidden />

      <BrandHeader />

      <main id="main">
        {/* Стена закрывает кадр, курсор её стирает. */}
        {/* Две дорожки идут наперегонки: без ускорителя полоса
            застревает, с Atlas проскакивает. Забег идёт сам —
            первый экран обязан объяснять себя без действий. */}
        <RaceHero primaryHref={primaryHref} />
        {/* Три утверждения и переворот корпуса из чернил в бумагу. */}
        <ManifestoScene />
        {/* Шов между «зачем» и «как»: лента проверяемых чисел,
            которая слышит прокрутку. */}
        <FactsBand />

        {/* Состав подписки модульной сеткой: ячейка даёт зрительную
            точку, разный размер задаёт порядок чтения. */}
        <BentoSection />

        {/* Как получить: три шага, кадр держится на месте. */}
        <HowScene />
        {/* Где работает: лента стран едет вбок. */}
        <AtlasScene />
        {/* Сколько стоит: число вместо таблицы. */}
        <PriceScene />
      </main>

      {/* Возврат в чернила: страница закрывается там же, где началась. */}
      <OutroScene />
      <BrandFooter />
    </div>
  );
}
