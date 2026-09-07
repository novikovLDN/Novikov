"use client";

import { useEffect } from "react";
import BrandHeader from "./BrandHeader";
import HeroScene from "./HeroScene";
import ManifestoScene from "./ManifestoScene";
import FactsBand from "./FactsBand";
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
      <Cursor />
      <div className="b-grid-lines" aria-hidden />

      <BrandHeader />

      <main id="main">
        {/* Стена закрывает кадр, курсор её стирает. */}
        <HeroScene />
        {/* Три утверждения и переворот корпуса из чернил в бумагу. */}
        <ManifestoScene />
        {/* Шов между «зачем» и «как»: лента проверяемых чисел,
            которая слышит прокрутку. */}
        <FactsBand />

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
