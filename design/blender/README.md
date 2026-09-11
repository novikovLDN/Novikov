# Сцены Blender

Исходники 3D-рендеров сайта (Blender 5.2). Готовые кадры лежат в `public/media/`.

| Файл | Что внутри | Куда рендерится |
|---|---|---|
| `atlas_iphone.blend` | Сцена «AtlasIphone»: iPhone 17 Pro Max, экран — текстура из `iphone-screens/screen1–5.png`, отметка касания | `public/media/ios/hero.webp`, `step1–5.webp` (1200×1500, прозрачный фон) |
| `atlas_laptop.blend` | Ноутбук раздела 06 главной, крышка открывается за 60 кадров | `public/media/laptop/f00–f59.webp`, `poster.jpg` |
| `atlas_globe2_blocks.blend` | Глобус раздела 03 (прежняя видеоверсия; сейчас на сайте глобус реального времени `GlobeGL.tsx`) | `public/media/globe2.jpg` — постер-заглушка |

## Экраны iPhone

`iphone-screens/ios.html` — HTML-макет Safari iOS 26 с кабинетом Atlas, шаг
выбирается параметром `?step=1…5`. Снимки 1290×2796 делает
`shots.cjs` (Playwright):

```bash
node design/blender/iphone-screens/shots.cjs <путь к playwright> "$PWD/design/blender/iphone-screens"
```

После обновления снимков — перерендер в `atlas_iphone.blend` и перекодирование
в WebP.
