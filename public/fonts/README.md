# MTS Wide fonts

По лицензии MTS Wide кладём сюда следующие файлы (форматы **woff2** обязательно, **woff** желательно как фолбэк для старых браузеров):

| Weight | file (обязателен)          | file (fallback)           |
| ------ | -------------------------- | ------------------------- |
| 400 Regular  | `MTSWide-Regular.woff2`  | `MTSWide-Regular.woff`  |
| 500 Medium   | `MTSWide-Medium.woff2`   | `MTSWide-Medium.woff`   |
| 700 Bold     | `MTSWide-Bold.woff2`     | `MTSWide-Bold.woff`     |
| 900 Black    | `MTSWide-Black.woff2`    | `MTSWide-Black.woff`    |

Минимум для стартового redesign — Regular и Bold (400 + 700). Medium и Black добавятся, если нужны промежуточные веса.

**@font-face уже прописан** в `src/app/globals.css` (секция «MTS Wide font faces»). При наличии файлов шрифт автоматически подхватится по CSS-переменной `--font-mts-wide`.

**Куда используется:** класс `.font-mts-wide` (или подключение через `var(--font-mts-wide)` в CSS). Пока файлов нет, fallback-стек сработает на Inter / system UI — сайт не сломается.

## Как проверить

После деплоя открой DevTools → Network → Fonts. Должны появиться `MTSWide-*.woff2` со статусом 200. В Elements выбрать элемент с классом `.font-mts-wide` → Computed → `font-family` показывает `"MTS Wide"`.
