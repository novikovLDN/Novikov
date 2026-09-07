"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "./motion";

/**
 * Псевдотерминал.
 *
 * Машинный взгляд на тот же шаг, который рядом описан человеческими
 * словами: слева читатель видит «почта и код», здесь — как это
 * выглядит со стороны системы. Строки набираются по знакам, ответы
 * появляются следом.
 *
 * Это не украшение и не замена текста: содержательное объяснение
 * остаётся обычным абзацем рядом. Если скрипт не отработает или
 * человек попросил меньше движения, терминал просто покажет все
 * строки сразу — смысл не потеряется.
 *
 * Живая область объявлена вежливой: диктор не должен зачитывать
 * каждый набранный знак.
 */
export interface TerminalLine {
  /** Команда набирается по знакам, ответ появляется целиком. */
  kind: "cmd" | "out";
  text: string;
}

export default function Terminal({ lines, step }: { lines: TerminalLine[]; step: number }) {
  const [shown, setShown] = useState<string[]>([]);
  const reduced = usePrefersReducedMotion();
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];

    if (reduced) {
      setShown(lines.map((l) => l.text));
      return;
    }

    setShown([]);
    let delay = 120;
    lines.forEach((line, i) => {
      if (line.kind === "out") {
        delay += 260;
        timers.current.push(
          setTimeout(() => setShown((p) => { const n = [...p]; n[i] = line.text; return n; }), delay),
        );
        return;
      }
      // Команда набирается по знакам — по одному кадру на знак.
      [...line.text].forEach((_, c) => {
        delay += 26;
        timers.current.push(
          setTimeout(() => {
            setShown((p) => { const n = [...p]; n[i] = line.text.slice(0, c + 1); return n; });
          }, delay),
        );
      });
      delay += 120;
    });

    return () => { timers.current.forEach(clearTimeout); timers.current = []; };
  }, [lines, step, reduced]);

  return (
    <div className="b-term" role="status" aria-live="polite">
      <div className="b-term-bar" aria-hidden>
        <span className="b-term-dot" />
        atlas@node — сеанс {String(step + 1).padStart(2, "0")}
      </div>
      <pre className="b-term-body">
        {lines.map((line, i) => (
          <span key={line.text} className={`b-term-line b-term-${line.kind}`}>
            {line.kind === "cmd" ? "$ " : "> "}
            {shown[i] ?? ""}
            {line.kind === "cmd" && shown[i] && shown[i].length < line.text.length && (
              <b className="b-term-caret" aria-hidden />
            )}
          </span>
        ))}
      </pre>
    </div>
  );
}
