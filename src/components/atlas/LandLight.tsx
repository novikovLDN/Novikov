"use client";

import { useEffect, useState } from "react";
import { landHatch } from "@/lib/isochrones";
import { MAP_W, MAP_H } from "@/lib/world-map";
import { NOON, DEFAULT_LAT, lonFromTimezone, sunPosition } from "@/lib/sun";

/**
 * Суша листа карты, освещённая солнцем читателя.
 *
 * Без скрипта и до монтирования — полдень (свет с юга), тот же, что на
 * сервере, поэтому гидратация не расходится. После монтирования штрихи
 * раскладываются по трём тонам для текущего положения солнца и
 * пересчитываются раз в минуту — не на кадр. Холста и цикла rAF нет.
 */
export default function LandLight() {
  const [tones, setTones] = useState(() => landHatch(NOON));

  useEffect(() => {
    if (document.documentElement.hasAttribute("data-static")) return;
    const tick = () => {
      const now = new Date();
      setTones(landHatch(sunPosition(now, DEFAULT_LAT, lonFromTimezone(now))));
    };
    const t = window.setTimeout(tick, 0);
    const iv = window.setInterval(tick, 60_000);
    return () => {
      window.clearTimeout(t);
      window.clearInterval(iv);
    };
  }, []);

  return (
    <svg className="a-land" viewBox={`0 0 ${MAP_W} ${MAP_H}`} aria-hidden focusable="false">
      {tones.map((d, i) => (
        <path key={i} className={`a-land-t${i}`} d={d} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

/** Подпись к свету: что именно освещает карту сейчас. */
export function SunNote() {
  const [text, setText] = useState("Свет — полуденный.");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const sun = sunPosition(now, DEFAULT_LAT, lonFromTimezone(now));
      const time = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
      setText(
        sun.elevation > 0
          ? `Свет — как у вас сейчас, ${time}.`
          : `У вас сейчас ночь, ${time}, — свет на карте погашен.`,
      );
    };
    const t = window.setTimeout(tick, 0);
    const iv = window.setInterval(tick, 60_000);
    return () => {
      window.clearTimeout(t);
      window.clearInterval(iv);
    };
  }, []);

  return <span>{text}</span>;
}
