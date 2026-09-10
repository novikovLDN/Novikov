"use client";

import { useEffect, useState } from "react";

/**
 * Живое показание и живое время.
 *
 * ЧТО ИЗМЕРЯЕТСЯ. Отклик этого сайта с устройства читателя — три
 * запроса к собственному адресу, медиана. Не «пинг до сервера в
 * Минске»: из браузера его не измерить, и приписать числу такой смысл
 * было бы ровно тем, против чего построен бренд. Подпись на странице
 * говорит «отклик этого сайта у вас».
 *
 * Замер один на страницу: сколько бы показаний ни стояло, запросы идут
 * один раз (общее обещание). Живая строка указателя переизмеряет раз в
 * 30 с. Значение уходит в `--a-rtt`: на нём держится «вязкость» —
 * фрагмент карты в первом экране откликается на руку с задержкой,
 * равной времени ответа читателя.
 */

let shared: Promise<number | null> | null = null;

async function sample(): Promise<number | null> {
  const s: number[] = [];
  for (let i = 0; i < 3; i++) {
    const t0 = performance.now();
    try {
      await fetch(`/icon?ping=${i}-${Date.now()}`, { method: "HEAD", cache: "no-store" });
    } catch {
      return null;
    }
    s.push(performance.now() - t0);
  }
  s.sort((a, b) => a - b);
  return Math.round(s[1]);
}

function measure(fresh: boolean): Promise<number | null> {
  if (fresh || !shared) shared = sample();
  return shared;
}

export default function Reading({ live = false }: { live?: boolean }) {
  const [ms, setMs] = useState<number | null>(null);
  const [at, setAt] = useState<number | null>(null);

  useEffect(() => {
    let off = false;
    const run = (fresh: boolean) =>
      measure(fresh).then((v) => {
        if (off || v === null) return;
        setMs(v);
        setAt(Date.now());
        document.documentElement.style.setProperty("--a-rtt", `${v}ms`);
      });
    // После отрисовки: замер не соревнуется с ней за канал.
    const first = window.setTimeout(() => run(false), 1200);
    const again = live ? window.setInterval(() => run(true), 30_000) : 0;
    return () => {
      off = true;
      window.clearTimeout(first);
      if (again) window.clearInterval(again);
    };
  }, [live]);

  return (
    <span className="a-reading a-idle" data-live={ms !== null ? "true" : "false"}>
      <b className="a-num">{ms ?? "…"}</b>
      {" мс"}
      {live ? <Ago at={at} /> : null}
    </span>
  );
}

/** «обновлено N с назад» — меняется текст, не геометрия. */
function Ago({ at }: { at: number | null }) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const iv = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(iv);
  }, []);
  if (!at || !now) return null;
  const s = Math.max(0, Math.round((now - at) / 1000));
  return <span className="a-ago">, обновлено {s}&nbsp;с назад</span>;
}

/**
 * Дата и время у читателя. Сервер времени читателя не знает, поэтому
 * до монтирования стоит нейтральное слово, а не чужие часы.
 */
export function NowStamp({ variant = "full" }: { variant?: "full" | "issue" }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    const t = window.setTimeout(tick, 0);
    const iv = window.setInterval(tick, 30_000);
    return () => {
      window.clearTimeout(t);
      window.clearInterval(iv);
    };
  }, []);

  if (!now) return <span>{variant === "issue" ? "текущий" : "Сегодня"}</span>;

  const date = (
    variant === "issue"
      ? now.toLocaleDateString("ru-RU", { month: "long", year: "numeric" })
      : now.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
  ).replace(/\s?г\.$/, "");
  const time = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  return <time dateTime={now.toISOString()}>{`${date}, ${time}`}</time>;
}
