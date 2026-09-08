"use client";

import { useEffect, useState } from "react";

/**
 * Приём №62 каталога — живое измерение вместо заявленного.
 *
 * ПОЧЕМУ ЭТО ГЛАВНЫЙ ПРИЁМ САЙТА, А НЕ УКРАШЕНИЕ. Позиция бренда —
 * «измерено, а не заявлено» (docs/02_BRAND.md). Все конкуренты пишут
 * задержку числом из своей таблицы. Здесь число берётся с устройства
 * читателя прямо сейчас, и это единственное измерение на витрине,
 * которое он может проверить сам.
 *
 * ЧЕСТНОСТЬ ФОРМУЛИРОВКИ. Мы меряем НЕ задержку до VPN-узла: из
 * браузера это невозможно. Мы меряем время ответа нашего сайта с
 * устройства читателя — и подписываем ровно так. Приписать этому
 * числу смысл «пинг до Хельсинки» было бы ровно тем враньём, против
 * которого построен весь бренд.
 *
 * КАК СЧИТАЕТСЯ. Три запроса к собственному origin, берётся медиана —
 * одиночный замер ловит случайный всплеск. Запрос идёт за статикой,
 * которая уже в кэше браузера, с `cache: "no-store"`, чтобы измерялась
 * сеть, а не диск.
 *
 * СТОИМОСТЬ. Три HEAD-запроса по несколько байт, один раз за
 * посещение, после отрисовки. Компонент клиентский, но крошечный:
 * это единственная строка клиентского кода на главной.
 */
export default function LivePing({ fallbackMs }: { fallbackMs: number }) {
  const [ms, setMs] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const measure = async () => {
      const samples: number[] = [];
      for (let i = 0; i < 3; i++) {
        const t0 = performance.now();
        try {
          await fetch(`/icon?ping=${i}-${Date.now()}`, { method: "HEAD", cache: "no-store" });
        } catch {
          return; // сеть отказала — остаёмся на оценке из таблицы
        }
        samples.push(performance.now() - t0);
      }
      if (cancelled || samples.length < 3) return;
      samples.sort((a, b) => a - b);
      setMs(Math.round(samples[1]));
    };

    // После отрисовки: измерение не должно соревноваться с ней за канал.
    const id = window.setTimeout(measure, 1200);
    return () => { cancelled = true; window.clearTimeout(id); };
  }, []);

  return (
    <span className="gh-ping" data-live={ms !== null ? "true" : "false"}>
      <b className="gh-ping-value">{ms ?? fallbackMs}</b>
      <span className="gh-ping-unit">мс</span>
      <span className="gh-ping-note">
        {ms !== null ? "отклик сайта с вашего устройства" : "оценка до ближайшего узла"}
      </span>
    </span>
  );
}
