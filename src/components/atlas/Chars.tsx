import { Fragment } from "react";

/**
 * Разбивка заголовка по буквам для анимации появления (`.a-char`,
 * `--i` — номер знака в строке, как и раньше: пробелы тоже считаются).
 *
 * Буквы одного слова лежат в неразрывной обёртке. Каждая буква —
 * inline-block, и без обёртки браузер вправе перенести строку между
 * любыми двумя буквами: на телефоне выходило «серв|еры», «котор|ый»,
 * «в|ас» (QA 12.09.2026). Переносится теперь только по пробелам.
 *
 * Разметка собирается на сервере — до скрипта ничего не мигает; чтец
 * экрана получает строку целиком из aria-label заголовка.
 */
export default function Chars({ text, start = 0 }: { text: string; start?: number }) {
  let pos = start;
  return (
    <>
      {text.split(" ").map((word, w) => {
        const from = pos;
        pos += word.length + 1;
        return (
          <Fragment key={w}>
            {w > 0 ? " " : null}
            <span style={{ whiteSpace: "nowrap" }}>
              {[...word].map((ch, i) => (
                <span key={i} className="a-char" style={{ ["--i" as string]: from + i }}>
                  {ch}
                </span>
              ))}
            </span>
          </Fragment>
        );
      })}
    </>
  );
}
