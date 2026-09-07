"use client";

import { useRef, useState } from "react";
import { LOCATIONS } from "@/lib/locations";
import { usePrefersReducedMotion } from "./motion";

/**
 * ДЕМОНСТРАЦИЯ ДОСТУПА — интерактивный кусок продукта на витрине.
 *
 * Практика 2026: первый экран уходит от картинки к взаимодействию, и
 * отклик интерфейса на действие человек читает как признак
 * компетентности. Здесь это буквально: вводишь адрес — видишь, как
 * выглядит доступ до и после.
 *
 * ЧЕСТНОСТЬ. Это ДЕМОНСТРАЦИЯ, а не проверка. Мы не стучимся никуда с
 * чужой машины и не утверждаем, что конкретный сайт прямо сейчас
 * закрыт: узнать это можно только с устройства самого человека.
 * Поэтому подпись под полем говорит прямо, что показывается вид
 * ответа, а не результат запроса. Точка выхода и задержка берутся из
 * src/lib/locations.ts — из тех же чисел, что и в атласе.
 *
 * Без скрипта поле остаётся обычной формой и ничего не ломает.
 */
const NEAREST = [...LOCATIONS].sort((a, b) => a.latencyMs - b.latencyMs)[0];

type Stage = "idle" | "run" | "done";

export default function AccessProbe({ compact = false }: { compact?: boolean }) {
  const [host, setHost] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [lines, setLines] = useState<string[]>([]);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const reduced = usePrefersReducedMotion();

  const clean = (raw: string) =>
    raw.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "").toLowerCase();

  const run = (e: React.FormEvent) => {
    e.preventDefault();
    const target = clean(host) || "example.com";
    timers.current.forEach(clearTimeout);
    timers.current = [];

    const script = [
      `цель: ${target}`,
      "без Atlas — соединение не установлено",
      `через Atlas · ${NEAREST.cities[0]} — открыто за ${NEAREST.latencyMs} мс`,
    ];

    if (reduced) {
      setLines(script);
      setStage("done");
      return;
    }

    setLines([]);
    setStage("run");
    script.forEach((line, i) => {
      timers.current.push(
        setTimeout(() => {
          setLines((p) => [...p, line]);
          if (i === script.length - 1) setStage("done");
        }, 320 + i * 520),
      );
    });
  };

  const term = (
    // Состояние выведено в атрибут: оговорка про демонстрацию на
    // узком экране показывается ровно тогда, когда есть что
    // оговаривать, — до ввода она занимала бы место зря, а после
    // ввода скрывать её нельзя.
    <form className="b-probe-term" data-stage={stage} onSubmit={run}>
          <div className="b-term-bar" aria-hidden>
            <span className="b-term-dot" />
            atlas@probe — проверка доступа
          </div>

          <div className="b-probe-field">
            <label htmlFor="probe-host" className="b-probe-prompt" aria-hidden>
              $ atlas check
            </label>
            <span className="b-sr">
              <label htmlFor="probe-host">Адрес сайта для демонстрации</label>
            </span>
            <input
              id="probe-host"
              className="b-probe-input"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="example.com"
              autoComplete="off"
              spellCheck={false}
              inputMode="url"
            />
            <button type="submit" className="b-probe-go">
              {stage === "run" ? "…" : "Проверить"}
            </button>
          </div>

          <pre className="b-probe-out" role="status" aria-live="polite">
            {lines.length === 0
              ? "> ожидание ввода"
              : lines.map((l, i) => (
                  <span key={l} className={`b-term-line ${i === 2 ? "b-probe-ok" : "b-term-out"}`}>
                    {"> "}
                    {l}
                  </span>
                ))}
          </pre>

      <p className="b-probe-note">
        Демонстрация: показывает вид ответа, а не результат запроса к сайту.
        Проверить доступ можно только с вашего устройства — для этого и есть
        три бесплатных дня.
      </p>
    </form>
  );

  // Внутри первого экрана — только сам терминал: заголовок и
  // объяснение там уже есть, и повторять их незачем.
  if (compact) return term;

  return (
    <section className="b-section b-probe" aria-labelledby="probe-title">
      <div className="b-shell b-probe-inner">
        <div className="b-probe-copy">
          <p className="b-label b-label-sys">Демонстрация</p>
          <h2 id="probe-title" className="b-lg">
            Введите адрес — покажем, как это выглядит
          </h2>
          <p className="b-body">
            Слева то, что видит браузер без нас. Справа — то же самое через
            ближайшую точку выхода.
          </p>
        </div>
        {term}
      </div>
    </section>
  );
}
