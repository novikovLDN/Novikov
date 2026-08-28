# MTS Wide fonts

Корпоративный шрифт МТС, доступный по лицензии (см. `COPYRIGHT.txt`).

## Что лежит

| Weight | Файл                     | Fallback-веса, которые тоже подхватываются |
| ------ | ------------------------ | ------------------------------------------ |
| 500 Medium | `MTSWide-Medium.woff2` | 400 (Regular) — используем Medium как самый близкий |
| 700 Bold   | `MTSWide-Bold.woff2`   | 600, 800, 900 — используем Bold           |

Regular (400) и Black (900) в официальной сборке нам не выдали — маппим на Medium и Bold соответственно, чтобы CSS-веса `font-weight: 400/500/600/700/800/900` всегда рендерились в MTS Wide, а не в фейковой полужирности Inter.

## @font-face

Живёт в `src/app/globals.css` в самом верху. Веса объявлены через диапазон (`font-weight: 400 500;` и `font-weight: 600 900;`) — это валидный CSS4-синтаксис, все современные браузеры понимают.

## Использование

- CSS-переменная: `var(--font-mts-wide)`
- Утилитарный класс: `.font-mts-wide`
- Hero-заголовок использует Bold (700).

## Как проверить в проде

1. Открой DevTools → Network → Fonts.
2. Должны прогружаться `MTSWide-Medium.woff2` (~31 KB) и `MTSWide-Bold.woff2` (~31 KB), статус 200.
3. Выбери элемент с `.font-mts-wide` → Computed → `font-family` показывает `"MTS Wide"`.

## Как обновить

Если МТС пришлёт новую версию — TTF-файлы конвертируются в WOFF2 через `fonttools + brotli`:

```
pip install fonttools brotli
python -c "from fontTools.ttLib import TTFont; f=TTFont('MTSWide-Bold-XXXX.ttf'); f.flavor='woff2'; f.save('public/fonts/MTSWide-Bold.woff2')"
```

TTF-оригиналы в репе не хранить — только WOFF2 (в ~2.5 раза легче, лучше кэшируется, все браузеры поддерживают).
