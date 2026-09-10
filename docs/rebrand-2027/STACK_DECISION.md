# STACK_DECISION — технологический стек Atlas Secure, 2026→2027

Раздел A4 мега-промта. Дата: **10 сентября 2026**.

Как проверено: версии — `npm view <pkg> version time --json` (10.09.2026);
поддержка браузерами — caniuse `fulldata-json` (обновлён 24.08.2026),
региональный файл caniuse `RU.json` (июль 2026), MDN
browser-compat-data (ветка `main`, 10.09.2026), webstatus.dev API
(Baseline); вес библиотек — **замер**: файл дистрибутива с jsDelivr,
`gzip -9`, 10.09.2026. Документация — context7 (three.js), официальные
блоги и страницы лицензий. Всё, что проверить не удалось, помечено
**[не проверено]**.

Этот файл не отменяет ADR-0001…0012, а достраивает их слоями, которых
там нет (3D, шейдеры, ассеты, device-tier), и исправляет два факта,
которые на сегодня неверны (см. §13).

---

## 0. Итог одним экраном

**Рекомендованный стек**

| Слой | Решение | Версия (10.09.2026) |
|---|---|---|
| Фреймворк | Next.js App Router, остаёмся (ADR-0001) | `next` 16.3.4 |
| React | 19.2.x, **не** 19.3.0 (вышел 09.09.2026, R3F его не допускает) | `react`/`react-dom` 19.2.8 |
| Стили | Tailwind v4 + собственные токены (ADR-0002) | `tailwindcss` 4.3.3 |
| 3D | **vanilla** Three.js, `WebGPURenderer` + TSL, авто-откат на WebGL 2; одна сцена, один lazy-остров | `three` 0.186.0 (r186) |
| React-обвязка 3D | **не берём** R3F/Drei/pmndrs-postprocessing (см. §2.3) | — |
| Пост-обработка | встроенные TSL-узлы three (`PostProcessing`) | в составе `three` |
| Шейдеры | TSL; GLSL только в существующих 2D-холстах | в составе `three` |
| Анимации | GSAP (ScrollTrigger, SplitText, Flip) — pin/scrub/разбивка текста | `gsap` 3.15.0, `@gsap/react` 2.1.2 |
| Скролл | нативный `animation-timeline` как основной путь **с фолбэком**, GSAP на pin, Lenis только на витрине | `lenis` 1.3.26 |
| Ассеты | glTF 2.0 + Meshopt + KTX2 (gltf-transform) | `@gltf-transform/cli` 4.5.0 (dev) |
| Gaussian Splats | отложено; если понадобится — нативный r186 + SPZ, не Spark | в составе `three` |
| Шрифты | `next/font` с вариативной осью + урезанный набор знаков для дисплейного начертания | `glyphhanger` 6.0.0 (dev) |
| Device tier | свой детектор + `@pmndrs/detect-gpu` с локальными бенчмарками | `@pmndrs/detect-gpu` 6.0.21 |
| RUM | `web-vitals` → свой эндпоинт | `web-vitals` 6.2.1 |
| CMS | нет (ADR-0008); если понадобится — Payload внутри Next | (`payload` 3.89.0) |
| Хостинг | Railway + Cloudflare (ADR-0012) **+ снять риск Cloudflare в РФ** | — |
| Аналитика | self-hosted cookieless (Umami) **на сервере в РФ** | Umami v3.3.1 (Docker) |

**Если бюджет/сроки меньше:** без Three.js вообще. Первый экран держит
существующее Canvas2D-поле (`SignalField`) плюс один полноэкранный
фрагментный шейдер на голом WebGL 2 (~3–5 КБ своего кода), CSS
scroll-driven + GSAP ScrollTrigger, AVIF-постер для слабых устройств.
Экономия: 190–300 КБ gz на 3D-чанке, ни одной новой зависимости,
ноль рисков с WebGPU-покрытием в РФ (§11). Эффект «материала во весь
экран», который замер `research/05_MOTION.md` назвал главным разрывом,
этим уже достигается.

---

## 1. Исходные условия, из которых следует выбор

1. **Продукт работает и приносит деньги** (`docs/04_ARCHITECTURE.md`
   §0): 58 API-маршрутов, вход по коду и passkey, YooKassa, Remnawave,
   web-push, PostgreSQL. Любой слой стека оценивается ещё и по цене
   миграции живой кассы.
2. **Аудитория — русскоязычная, в основном из РФ.** Отсюда два
   ограничения, которых нет в мега-промте для «агентства»:
   браузерная доля РФ (Яндекс Браузер 26,1 % — StatCounter, август
   2026) и сетевые блокировки (Cloudflare, часть IP Vercel).
3. **3D в проекте сейчас нет** (grep `three|@react-three` по `src/` —
   0 файлов). GSAP с ScrollTrigger + SplitText подключён в одном модуле
   (`src/components/brand/motion.tsx`), Lenis — там же. Canvas 2D —
   в 7 файлах (`getContext(`).
4. Бюджеты проекта строже порогов Google (`docs/03_DESIGN_SYSTEM.md`
   §7): JS первой загрузки ≤ 180 КБ gz, шрифты ≤ 100 КБ, LCP ≤ 2,0 с,
   CLS ≤ 0,05, Lighthouse ≥ 95.

---

## 2. Фреймворк

Критерии разнесены на два столбца, как требует задача: «3D-тяжёлая
витрина + SEO + скорость Claude Code» и «цена миграции существующего
продукта». Оценка 1–5, 5 — лучше.

| | Next.js 16.3.4 | Astro 7.3.2 | SvelteKit 2.70.3 (Svelte 5.57.0) | Nuxt 4.5.2 |
|---|---|---|---|---|
| Дата версии | 31.08.2026 | 08.09.2026 | 18.08.2026 | 05.08.2026 |
| JS по умолчанию на статической странице | фреймворк ~70 КБ (замер ADR-0001) | 0 (острова) | малый рантайм | рантайм Vue |
| 3D-экосистема | R3F 9.7 / v10 alpha, vanilla three | любой остров (React/Svelte/vanilla) | Threlte 8.6.0 | TresJS 5.8.3 |
| SEO / метаданные | RSC + `metadata`, уже настроено | отличное, SSG | хорошее | хорошее |
| Скорость Claude Code | **5**: 16.2–16.3 поставляют `AGENTS.md` с документацией, first-party skills, agent devtools (блог Next.js, 16.2 от 18.03.2026, 16.3 от 03.08.2026) | **4**: Astro 7 отдельно продвигает связку «Claude Code + Astro»; `.astro` синтаксис модели знают хуже JSX | 3: Svelte 5 runes моложе, примеров меньше | 3 |
| **Итог: витрина с 3D** | 4 | **5** | 4 | 3 |
| Цена миграции продукта | **5** — 0 работы | 1 — переписать вход, оплату, вебхуки; либо два приложения (ADR-0001 вариант Б) | 1 — полный переписанный продукт | 1 — полный переписанный продукт |
| Владелец / риск | Vercel | Cloudflare (купил команду Astro 16.01.2026, проект остаётся open source) | Vercel | Vercel (NuxtLabs с 2025) [не проверено] |
| **Итог: для Atlas** | **выбор** | не оправдан | нет | нет |

**Решение: Next.js 16.3.4, как в ADR-0001.** Если бы сайт начинался с
нуля и был чистой витриной, выиграл бы Astro 7: ноль JS вне островов,
Rust-компилятор, Vite 8/Rolldown. Но разница — ~70 КБ фреймворка на
витрине, а цена — переписанная касса или второе приложение с общим
заголовком в двух местах. Эти 70 КБ дешевле вернуть дисциплиной
импортов (одна утечка — gsap в корневой разметке — уже найдена).

Что взять из Next 16.3, чего сейчас нет:
- **React Compiler** (стабилен, в 16.3 — Rust-реализация в Turbopack) —
  убирает ручные `useMemo` вокруг моушн-хуков. Включать после замера
  INP, не вслепую.
- **Cache Components / PPR** — витрина и так статична; полезно для
  `/dashboard` (оболочка статична, данные стримятся).
- **React View Transitions** — в Next всё ещё экспериментальны.
  Межстраничные — только как прогрессивное улучшение (ADR-0003 п.4
  остаётся в силе: ручной `startViewTransition` уже доказал вред).

---

## 3. 3D

### 3.1 Сравнение движков и инструментов

Вес — замер дистрибутива с jsDelivr (`gzip -9`), **без tree-shaking**;
реальный чанк после сборщика будет меньше.

| | Версия / дата | Лицензия | Вес (gz) | WebGPU | Для Atlas |
|---|---|---|---|---|---|
| **Three.js** `three/webgpu` | 0.186.0 / 08.09.2026 | MIT | `three.webgpu.min` 199 КБ + `three.core.min` 101 КБ = **~300 КБ** | да, откат на WebGL 2 встроен | **основа** |
| Three.js `WebGLRenderer` | то же | MIT | `three.module.min` 87 КБ + core 101 КБ = **~188 КБ** | нет | путь «бюджетно» |
| React Three Fiber | 9.7.0 / 31.07.2026; v10.0.0-alpha.5 / 08.09.2026 | MIT | + reconciler | v9: через асинхронный `gl` [не проверено на прототипе]; v10 alpha: «first-class WebGPU и TSL» | не берём |
| Drei | 10.7.8; 11.0.0-alpha.7 | MIT | зависит от импорта | большая часть хелперов написана под GLSL/`ShaderMaterial` | не берём |
| pmndrs `postprocessing` | 6.39.5 / 09.09.2026 | Zlib [не проверено] | 112 КБ | только `WebGLRenderer` | не берём |
| Babylon.js | 9.26.0 / 10.09.2026 | Apache-2.0 | [не проверено — ES-модули, бандл не собирался] | да, зрелый | избыточен |
| PlayCanvas | 2.22.1 / 08.09.2026 | MIT | **615 КБ** | да | избыточен, сильнее в splats и редакторе |
| Spline runtime | 2.0.44 / 10.09.2026 | проприетарный экспорт | загрузчик 35 КБ + файл сцены + свой движок в рантайме | [не проверено] | только прототип |
| Unicorn Studio | `unicornstudio-react` 2.2.10 | SaaS, коммерческий тариф платный (~$14–20/мес по обзорам) [цены не проверены на официальной странице] | [не проверено] | WebGL | только прототип шейдерного фона |
| Rive | `@rive-app/canvas` 2.42.0 | рантайм MIT, редактор платный | JS 98 КБ + wasm **759 КБ** (lite-wasm 336 КБ) | — | не нужен: иконки — свой набор (CLAUDE.md) |

### 3.2 Главная развилка: WebGPU-путь и WebGL-путь не совместимы по экосистеме

Это не написано в мега-промте, а решает всё остальное:

- `WebGPURenderer` понимает только **Node-материалы / TSL**. Всё, что
  написано на `ShaderMaterial`/`onBeforeCompile` (большая часть Drei,
  `three-custom-shader-material`, `postprocessing` 6.x), с ним не
  работает.
- Экосистема pmndrs переходит на WebGPU в **R3F v10 / Drei 11**, а они
  в alpha с января 2026 (alpha.0 — 14.01.2026, alpha.5 — 08.09.2026).
  Мега-промт требует «stable» (§0 п.5).
- R3F 9.7.0 объявляет peer `react >=19 <19.3`. React 19.3.0 вышел
  **вчера**. Поставив R3F, мы привязываем продукт с кассой к версии
  React ради одной сцены на витрине.

**Решение:** vanilla Three.js r186 через `three/webgpu`, одна сцена в
одном клиентском компоненте, `next/dynamic` с `ssr: false`, загрузка
после LCP и только на tier ≥ 2 (§8). Шейдеры и пост-обработка — TSL:
он компилируется и в WGSL, и в GLSL, так что откат на WebGL 2 получает
тот же материал без второй кодовой базы.

`WebGPURenderer` сам откатывается на WebGL 2 при отсутствии WebGPU;
`forceWebGL: true` принудительно включает WebGL-бэкенд (context7,
документация `WebGPURenderer`, r186). Это и есть «WebGL-fallback» из
мега-промта — отдельный рендерер не нужен.

**Когда пересмотреть на R3F:** если на витрине появится больше одной
сцены с общим состоянием и R3F v10 выйдет из alpha с peer на React
19.3+.

### 3.3 Честно о переоценённом

- **WebGPU ≠ быстрее.** На интегрированной графике и mid-tier Android
  WebGPU не быстрее WebGL 2; выигрыш — compute (десятки тысяч частиц) и
  меньше CPU на draw calls. У Atlas нет сцены на 50k частиц, которой
  нужен compute. Покупаем 110 КБ разницы (300 против 188) за
  **единую TSL-кодовую базу**, а не за скорость.
- **Покрытие WebGPU в РФ — 35–61 %, а не 87 %** (§11). Для нашей
  аудитории WebGL 2 — основной путь, а не запасной.
- Полноэкранная 3D-сцена в первом экране — прямая угроза LCP. Первый
  экран должен отрисовываться типографикой и постером **до** загрузки
  `three`, сцена «проявляется» поверх.

---

## 4. Анимации

| | GSAP 3.15.0 | Motion 13.2.0 | Anime.js 4.5.0 | Нативный CSS/WAAPI |
|---|---|---|---|---|
| Дата версии | 13.04.2026 | 02.09.2026 | 22.06.2026 | — |
| Лицензия | **GSAP Standard License, «no charge»**, не OSS. Все плагины бесплатны и для коммерции с 30.04.2025 (текст изменён 30.05.2025). Запрет: использовать GSAP в no-code-инструментах, конкурирующих с визуальным билдером анимаций Webflow. Atlas это не касается | MIT (ядро); Motion+ — £299 разово, отдельная лицензия | MIT | — |
| Вес (gz, замер) | ядро 27 КБ, ScrollTrigger 17, SplitText 3, Flip 9, MorphSVG 9 | полный vanilla-бандл 45 КБ; `scroll()` 5,1 КБ (по документации) | 39 КБ (UMD, полный) | 0 |
| Pin / scrub | лучший в классе | scroll через `ScrollTimeline` при поддержке, pin нет | есть ScrollObserver | pin нет |
| Разбивка текста | SplitText (переписан в 3.13, −50 % веса) | `splitText` только в Motion+ | `splitText` в v4 | нет |
| Уже в проекте | **да** | нет | нет | да (59 анимаций на главной) |

**Решение:** GSAP остаётся единственной JS-библиотекой анимации.
Motion и Anime.js не добавляем: они дублируют GSAP и не закрывают
ничего, что GSAP не закрывает. Вопрос `QUESTIONS.md` №15 («лицензия
GSAP есть?») **закрыт**: SplitText и MorphSVG бесплатны для
коммерческого сайта.

**Связка GSAP + Lenis + 3D** (без R3F):
- один тикер: `gsap.ticker.add(t => lenis.raf(t * 1000))`,
  `gsap.ticker.lagSmoothing(0)`; рендер сцены — в том же тикере, а не
  в отдельном `setAnimationLoop`, чтобы прокрутка и кадр сцены не
  расходились на кадр;
- камера сцены читает прогресс `ScrollTrigger` (scrub), а не
  собственный слушатель `scroll`;
- цикл сцены встаёт при `document.hidden` и когда сцена ушла из кадра
  (IntersectionObserver) — тот же принцип, что уже применён в
  `SignalTrace`.

---

## 5. Скролл

| | Нативный `animation-timeline` | Lenis 1.3.26 | Locomotive Scroll 5.0.1 |
|---|---|---|---|
| Статус | **Не Baseline** (webstatus.dev: `limited`). Chrome/Edge 115+, Safari/iOS 26+. **Firefox — только за флагом** `layout.css.scroll-driven-animations.enabled` (MDN BCD: `preview`; stable WPT-score Firefox 0,09) | стабилен, 2.0 только `dev`-тег (2.0.0-dev.3) | v5 от 15.01.2026 — переписан **поверх Lenis** + IntersectionObserver, 9,4 КБ |
| Покрытие | ≈ 85 % мира; в РФ ≈ 53 % учтённого трафика + Яндекс Браузер (Chromium, вероятно да — [не проверено]) → до ~79 % | 100 % (JS) | 100 % |
| Поток | компоновщик | главный | главный |
| Вес | 0 | 5 КБ | 9,4 КБ |
| Цена | фолбэк для Firefox | ломает `window.scrollTo` (реестр `scroll-top.ts`), двойное сглаживание на тачпадах Apple | та же, что у Lenis, плюс свой API |

**Решение — гибрид, как в ADR-0003, с поправкой:**
1. Появления, полосы прочтения, параллакс слоёв — нативный
   `animation-timeline` под `@supports`. **Без `@supports` правила не
   писать**: в Firefox (4,65 % РФ по StatCounter) состояние «до
   анимации» иначе останется навсегда. Базовое состояние — конечный
   кадр (это правило уже есть в CLAUDE.md: «без скрипта страница
   отрисована в конечном виде»).
2. Pin и scrub — GSAP ScrollTrigger.
3. Lenis — **только на витрине**, не в кабинете, админке и формах, и не
   поднимается при `prefers-reduced-motion`. Lenis двигает нативную
   прокрутку, поэтому `scroll()`-таймлайны с ним совместимы.
4. Locomotive Scroll не берём: это Lenis плюс обёртка.

---

## 6. Шейдеры

| | TSL (three r186) | GLSL (`ShaderMaterial`) | three-custom-shader-material 6.4.0 | lygia 1.4.1 |
|---|---|---|---|---|
| WebGPU | да (WGSL) и WebGL (GLSL) из одного кода | только WebGL | только WebGL (патч через find-and-replace; three.js сам рекомендует TSL) | библиотека функций, GLSL/WGSL/… |
| Зрелость | в r184–r186: компиляция TSL в 3 раза быстрее, tree-shaking (удалены top-level side effects в r186) | зрелый | последний релиз 12.10.2025 | 07.02.2026 |
| Лицензия | MIT | MIT | MIT | **Prosperity 3.0 + Patron.** Коммерческое использование — **30-дневный пробный период**, дальше — Patron License (спонсорство). Копировать функции в коммерческий сайт без неё нельзя |
| Claude Code | JS-код, типизирован, модель правит как обычный TS | строки шейдера, ошибки видны только в рантайме | — | — |

**Решение:** TSL для всей 3D-сцены. Шум и SDF — встроенные узлы TSL
(`mx_noise_*` из MaterialX) [имена узлов проверить на r186], lygia не
берём без покупки Patron-лицензии. Существующие 2D-холсты
(`SignalField`, `SignalTrace`) остаются на Canvas 2D — переписывать
работающий материал незачем.

**Итерация шейдеров через Claude Code:** отдельный маршрут-песочница
(`src/app/preview/` уже есть) + HMR `next dev` + флаг `?static=1` из
ADR-0010 (фиксирует время `uTime` → стабильный кадр для снимка).
Цикл: правка TSL → снимок Playwright → сравнение с референсом. В этой
фазе снимки делает другой агент; флаг нужен, чтобы снимок вообще был
воспроизводим.

---

## 7. Ассеты

| Тип | Решение | Инструмент / статус | Почему |
|---|---|---|---|
| Геометрия | glTF 2.0 + **Meshopt** (`EXT_meshopt_compression`) | `@gltf-transform/cli` 4.5.0 (01.09.2026), `meshoptimizer` 1.2.0 | декодер легче Draco, быстрее распаковка; Draco (`draco3d` 1.5.7, последний релиз 17.01.2024) — только если модель уже в Draco |
| Текстуры | **KTX2** (ETC1S для цвета, UASTC для нормалей) | `KTX2Loader.detectSupport(renderer)` работает с `WebGPURenderer` — официальный пример `webgpu_loader_texture_ktx2` (context7) | меньше GPU-памяти, чем PNG/AVIF, декод на GPU |
| Gaussian Splats | **отложено** | three r186: `GaussianSplatMesh` на TSL, WebGPU и WebGL, форматы PLY/SPLAT/**SPZ**/KSPLAT/glTF `KHR_gaussian_splatting` (PR #33950, влит 08.08.2026, milestone r186). Spark 2.1.0 (18.05.2026): LoD, стриминг `.RAD`, SOG, но работает на `WebGLRenderer`, и `spark.module.min.js` весит **1,7 МБ gz** (замер; wasm внутри) | Снимать нечего: команды выдумывать нельзя (ТЗ 15.5), офиса/стоек для съёмки нет. Если появится реальный объект — нативный r186 + SPZ, ≤ 300k сплатов, ≤ 8 МБ, только tier 3 |
| Видео | не нужно на витрине | AV1: 79 % полная + 15 % частичная (Safari — только с аппаратным декодером); HEVC полно только в Safari; прозрачность — HEVC-alpha для Safari + VP9-WebM-alpha для Chromium/Firefox [связка по caniuse-заметкам не перепроверена] | процедурная графика дешевле и честнее |
| Постер / фолбэк | AVIF-кадр сцены | — | tier 0–1 и reduced-motion |

Бюджет ассетов на сцену: ≤ 1,5 МБ всего, ≤ 50k треугольников, ≤ 2
текстуры 1024² KTX2, ≤ 30 draw calls.

---

## 8. Производительность

### 8.1 Пороги

| Метрика | Google «good», p75 (web.dev, обновление 31.10.2024, изменений на 2025–2026 не объявлено) | Бюджет Atlas |
|---|---|---|
| LCP | ≤ 2,5 с | ≤ 2,0 с (mobile, 4G) |
| INP | ≤ 200 мс | ≤ 150 мс на кабинете и формах |
| CLS | ≤ 0,1 | ≤ 0,05 |
| Кадр | — | 60 fps на mid-tier телефоне 2024 (класс Snapdragon 7s Gen 2 / Mali-G68): кадр 16,7 мс, из них сцене ≤ 8 мс |
| JS первой загрузки | — | ≤ 180 КБ gz; 3D-чанк **вне** этого бюджета, грузится после LCP |

### 8.2 Device tier

| Tier | Условие | Что получает |
|---|---|---|
| 0 | `prefers-reduced-motion`, `Save-Data`, `navigator.deviceMemory ≤ 2`, tier 0–1 по detect-gpu | AVIF-постер, CSS-анимации без холостого слоя |
| 1 | WebGL 2 есть, GPU слабый | Canvas 2D-материал (как сейчас), без 3D |
| 2 | WebGL 2, средний GPU | 3D-сцена на WebGL-бэкенде, DPR ≤ 1,5, без пост-обработки |
| 3 | `navigator.gpu.requestAdapter()` вернул адаптер + сильный GPU | WebGPU-бэкенд, DPR ≤ 2, пост-обработка TSL |

`@pmndrs/detect-gpu` 6.0.21 (06.09.2026) по умолчанию тянет
бенчмарк-данные с внешнего CDN — выложить их локально (`benchmarksURL`),
иначе запрос уйдёт за рубеж и может упереться в блокировки. Плюс
динамический даунгрейд: если медиана кадра за 2 с > 20 мс — tier вниз.

### 8.3 OffscreenCanvas и воркеры

OffscreenCanvas — 94,7 % (caniuse), Safari 26 полностью. Но перенос
`WebGPURenderer` в воркер для одной сцены — сложность без выигрыша:
главная угроза INP у нас — не рендер, а гидратация и слушатели.
Воркеры — только для тяжёлого вычисления (сортировка сплатов у r186
уже своя). Рендер в воркере через three r186 — **[не проверено]**.

### 8.4 Замер в поле

`web-vitals` 6.2.1 → `navigator.sendBeacon` на свой эндпоинт, без
cookie. Lighthouse CI в конвейере (ADR-0010) — лабораторная проверка;
полевые данные — единственное доказательство, что бюджет выполнен у
пользователей в РФ, а не на машине разработчика.

---

## 9. Типографика

| | Решение |
|---|---|
| Гарнитура | Sofia Sans + Sofia Sans Condensed, вариативная ось `wght` 1–1000 (`src/app/fonts.ts`) — оставляем |
| Загрузка | `next/font/google`: самостоятельная раздача, `size-adjust` для фолбэка (CLS ≈ 0), `unicode-range` по подмножествам |
| **Замер веса** (woff2, Google Fonts, 10.09.2026) | Sofia Sans: cyrillic 24 КБ, latin 39 КБ, latin-ext 17 КБ, cyrillic-ext 3 КБ. Condensed: 25 / 40 / 18 / 3 КБ. Русская страница с цифрами и латиницей тянет cyrillic + latin обоих — **≈ 128 КБ при бюджете 100 КБ** |
| Как уложиться | Condensed по CLAUDE.md набирается **только прописными** и только в дисплейном слое → урезать его до реально используемых знаков (`glyphhanger` 6.0.0 или `subfont` 7.2.3), подключить через `next/font/local`. Ожидаемо −40…60 КБ [оценка, не замер] |
| `font-display` | `swap` для текста; для дисплейного — `swap` + размеры через `size-adjust` (иначе заголовок, выключенный по ширине через `--gh-k-*`, прыгнет) |
| Кинетика | `font-weight`/`font-variation-settings` у одного элемента, не у каждой буквы — ось вызывает пересчёт раскладки (уже учтено в коде) |

---

## 10. Доступность при WebGL

- `prefers-reduced-motion` (95,8 % поддержки): 3D-цикл не
  запускается, показывается постер; Lenis не поднимается; pin-сцены
  становятся обычными блоками.
- `<canvas aria-hidden="true">` + то же содержание текстом в DOM рядом
  (узлы сети из `locations.ts` — списком). Холст не несёт ни одного
  факта, которого нет в тексте.
- Сцена не перехватывает фокус и колесо; клавиатурная навигация идёт
  по DOM.
- Движение дольше 5 с (холостой слой) — кнопка паузы (WCAG 2.2.2).
- `webglcontextlost` / `device.lost` у WebGPU → переход на постер, а не
  чёрный прямоугольник.
- Кольцо фокуса — единственное цветовое исключение по CLAUDE.md;
  в 3D-сцене фокус не рисуется.

---

## 11. WebGPU по браузерам — сентябрь 2026

**Статус Baseline: `limited`** (webstatus.dev, 10.09.2026) — WebGPU
**не** Baseline, хотя входит в Interop 2026.

| Браузер | С версии | Ограничения (MDN BCD / caniuse-заметки) |
|---|---|---|
| Chrome desktop | 113 | Windows, macOS, ChromeOS; Linux — с 144 и **только Intel Gen12+** |
| Chrome Android | 121 | Android 12+, GPU Qualcomm и ARM (блог Chrome «New in WebGPU 121») |
| Edge | 113 | как Chrome |
| Samsung Internet | 24 | — |
| Safari macOS | 26 | caniuse: «частично» — по умолчанию только на macOS 26 Tahoe+ |
| Safari iOS / iPadOS | 26 | полная |
| Firefox desktop | 141 | частично: Windows с 141; macOS Tahoe на Apple silicon с 145, старые macOS на Apple silicon с 147; **нет на Intel Mac и Linux**; нет в service workers |
| Firefox Android | — | не поддерживается |
| Яндекс Браузер | ? | **[не проверено]** — Chromium-основа, включён ли WebGPU по умолчанию, не подтверждено |

**Проценты**

| Срез | Полная | Частичная | Источник |
|---|---|---|---|
| Мир | **83,99 %** | 2,95 % | caniuse `webgpu`, данные от 24.08.2026 |
| РФ, учтённый caniuse трафик | **32,8 %** | 2,5 % | caniuse `RU.json` (июль 2026) × таблица поддержки; сумма агентов в файле ≈ 66 % трафика РФ |
| РФ с поправкой на Яндекс Браузер | 35 % (если WebGPU в Яндексе нет) … ~61 % (если есть) | | Яндекс Браузер 26,1 % — StatCounter, август 2026 |

Вывод для стека: для аудитории Atlas WebGL 2 — основной путь
(WebGL 2 — 95,7 % мира). Поэтому единственный разумный WebGPU-вариант —
тот, где один и тот же TSL-код работает на обоих бэкендах, то есть
`WebGPURenderer` с авто-откатом, а не отдельная WebGPU-сцена «с
фолбэком».

---

## 12. CMS и инфраструктура

### 12.1 CMS

| | Payload 3.89.0 | Sanity 6.13.1 | Strapi 5.53.0 | MDX / типизированные модули |
|---|---|---|---|---|
| Где живёт | внутри Next-приложения, та же PostgreSQL | SaaS | отдельный сервер | репозиторий |
| Лицензия / владелец | MIT; Figma (покупка 2025); Payload Cloud не принимает новые проекты | проприетарный SaaS | MIT + EE | — |
| Данные | у нас | у Sanity за рубежом (аккаунты редакторов — ПДн) | у нас | у нас |
| Кто меняет контент без разработчика | да | да | да | нет |

**Решение: ADR-0008 в силе — CMS нет.** Главная ценность бренда —
«числа подтверждены кодом»; CMS открывает путь мимо
`COMPLIANCE-CHECK.md`. Если блог появится — Payload внутри того же
Next и той же базы (второго сервиса нет), с правилом «числовое
утверждение публикуется только со строкой в `COMPLIANCE-CHECK.md`».
Для длинных текстов без CMS — `@next/mdx` 16.3.4.

### 12.2 Хостинг

| | Railway + Cloudflare (сейчас) | Vercel | Cloudflare Workers (`@opennextjs/cloudflare` 1.20.6) | Self-host в РФ |
|---|---|---|---|---|
| Next.js 16 | полностью (standalone) | эталон | через адаптер OpenNext | полностью |
| Доступность из РФ | **риск**: с июня 2025 Роскомнадзор фильтрует часть IP Cloudflare; с 2024 блокируется TLS с ECH, который Cloudflare включает по умолчанию → рукопожатие висит 5–10 с или обрывается | часть IP Vercel заблокирована в РФ (Vercel Community, конец 2025–2026) | тот же риск Cloudflare | без сетевого риска |
| Цена миграции | 0 | перенос базы/очередей/вебхуков | переписать под Workers-рантайм | перенос |

**Решение:** ADR-0012 остаётся, но с новым пунктом, которого в нём
нет: **выключить ECH в зоне Cloudflare и замерить открытие витрины из
сетей РФ (мобильные операторы и домашние провайдеры)**. Если замер
плохой — витрину (статику) раздавать с российского CDN, API оставить
как есть. На Vercel не переезжаем.

### 12.3 Аналитика без cookie-баннера «в лоб»

С 01.07.2025 поправки к 152-ФЗ запрещают первичное хранение ПДн
граждан РФ в базах за рубежом; зарубежные счётчики Роскомнадзор
считает трансграничной передачей (обзоры Хабр/vc.ru/Robokassa).
Cookieless-счётчик сам по себе проблему не снимает: IP-адрес на
практике считается ПДн.

**Решение:** Umami v3.3.1 (20.08.2026) или Plausible CE v3.2.1
(15.05.2026) — self-hosted **на сервере в РФ**, без cookie, IP
усекается. Плюс `web-vitals` на свой эндпоинт. Vercel Analytics,
Google Analytics, Cloudflare Web Analytics — нет. Нужен ли баннер при
такой схеме — вопрос к юристу, а не к стеку.

---

## 13. Изменения в `package.json`

Установленные сейчас версии (из `package-lock.json`): next 16.2.1,
react 19.2.4, tailwindcss 4.2.2, gsap 3.15.0, lenis 1.3.26.

### Обновить

| Пакет | Сейчас | Ставить | Примечание |
|---|---|---|---|
| `next` | 16.2.1 | **16.3.4** | минор |
| `react`, `react-dom` | 19.2.4 | **19.2.8** | **не 19.3.0**: вышел 09.09.2026, R3F 9.7/10-alpha объявляют `<19.3`; даже без R3F — дать релизу отстояться |
| `tailwindcss`, `@tailwindcss/postcss` | 4.2.2 | **4.3.3** | минор |
| `@types/react`, `@types/react-dom`, `@types/node`, `@types/bcryptjs` | в `dependencies` | в `devDependencies` | типы не нужны в рантайме |

### Добавить (только после утверждения 3D в фазе B)

| Пакет | Версия | Куда | Зачем |
|---|---|---|---|
| `three` | **0.186.0** (точно, без `^`) | dependencies | r-релизы ломают API без semver |
| `@types/three` | **0.185.4** | devDependencies | типов r186 ещё нет (последние — 04.08.2026); ожидать пробелов в r186-API |
| `@pmndrs/detect-gpu` | 6.0.21 | dependencies | tier (§8.2) |
| `web-vitals` | 6.2.1 | dependencies | RUM (§8.4) — можно добавить сразу, 3D не нужен |
| `@gltf-transform/cli` | 4.5.0 | devDependencies | Meshopt + KTX2 (KTX2-сжатие требует `toktx` из KTX-Software в системе [не проверено на этой машине]) |
| `glyphhanger` | 6.0.0 | devDependencies | урезать Condensed (§9) (нужны Python `fonttools` [не проверено]) |

### Убрать

| Пакет | Почему |
|---|---|
| `autoprefixer` | не подключён в `postcss.config.mjs` (там только `@tailwindcss/postcss`, у Tailwind v4 свои префиксы через Lightning CSS) |
| `nodemailer`, `@types/nodemailer` | grep по `src/` не находит ни одного импорта; письма идут через `resend`. Проверить скрипты вне `src/` перед удалением |
| `uuid`, `@types/uuid` (необязательно) | 8 файлов; заменимо на `crypto.randomUUID()` (Node ≥ 20). Не приоритет |

### Сознательно не добавляем

`@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`,
`postprocessing`, `motion`, `animejs`, `locomotive-scroll`,
`@sparkjsdev/spark`, `@mkkellogg/gaussian-splats-3d` (последний релиз
25.01.2025), `three-custom-shader-material`, `lygia`,
`@splinetool/*`, `@rive-app/*`, `unicornstudio-react`, любую CMS,
`@vercel/analytics`.

---

## 14. Риски

| Риск | Вероятность | Что делаем |
|---|---|---|
| 3D-чанк (~190–300 КБ gz + ассеты) бьёт LCP/INP на Android | высокая | загрузка после LCP на `requestIdleCallback`, только tier ≥ 2, постер до готовности, perf-guard в CI |
| Покрытие WebGPU в РФ 35–61 % | факт | TSL на обоих бэкендах; WebGPU — улучшение, не требование |
| `@types/three` отстаёт от r186 | факт | локальные `declare module` на новые API, не `any` |
| three r-релиз ломает API | средняя | точная версия, обновление отдельным PR с визуальным снимком |
| Firefox без `animation-timeline` | факт | каждое правило под `@supports`, базовое состояние — конечный кадр |
| Cloudflare в РФ (ECH/IP-фильтрация) | высокая, уже происходит | выключить ECH, замер из РФ, план Б — российский CDN для статики |
| React 19.3 и экосистема | средняя | держать 19.2.8 до обновления peer-зависимостей |
| GSAP-лицензия — не OSS, владелец Webflow может её менять | низкая | использование не попадает в запрет; зафиксировать дату текста лицензии (30.05.2025) |
| lygia скопирована в код без лицензии | средняя (соблазн) | правило в CLAUDE.md: lygia не использовать без Patron |
| Двойное сглаживание Lenis на тачпадах Apple | известная | Lenis только на витрине, `syncTouch: false`, проверка на устройстве |

---

## 15. Что противоречит текущему CLAUDE.md и документам фазы 1–4

1. **CLAUDE.md, раздел Motion, и `docs/01_RESEARCH.md` находка 1**:
   «`animation-timeline` … работают во всех основных движках с
   середины 2026». **Неверно на 10.09.2026**: Firefox — только за
   флагом (MDN BCD `preview`, webstatus.dev `limited`). «Полоса
   прочтения считает `animation-timeline` — ни слушателя, ни rAF» →
   в Firefox полосы нет. Нужен `@supports` у каждого приёма (частично
   уже есть) и честная формулировка в CLAUDE.md.
2. **`docs/01_RESEARCH.md` находка 4**: «Interop 2026 довёл WebGPU до
   всех основных браузеров». **Неверно**: Baseline `limited`; Firefox
   без Linux, Intel Mac и Android; Chrome на Linux — только Intel
   Gen12+. В РФ — 35–61 %.
3. **CLAUDE.md: «Один холст на сайте… Второй холст заводить нельзя» и
   «Второе поле заводить нельзя»** против «Design Standard: 3D: WebGPU
   + fallback» и мега-промта (R3F Canvas в базе фазы D). 3D-сцена —
   это второй холст. Нужно решение владельца: либо 3D заменяет
   `SignalField` как «один материал», либо 3D нет (путь «бюджетно»).
   Заодно: `getContext(` встречается в 7 файлах — формулировка «один
   холст» стоит перепроверить по фактически смонтированным на главной.
4. **CLAUDE.md: «Motion. Всё нативное, ноль библиотек»** — в проекте
   GSAP (ScrollTrigger + SplitText) и Lenis, и ADR-0003 оставляет GSAP
   на pin/scrub. Формулировка верна только для CSS-раздела главной.
5. **CLAUDE.md: «Каждый блок анимирован: load / scroll / hover / idle.
   Без исключений»** против «Холостого движения ровно два» в том же
   файле и замера `research/05_MOTION.md` (у 14 из 20 референсов покой
   нулевой). Стек-аргумент: холостой слой — постоянный rAF, то есть
   батарея и INP. Оставлять правило «ровно два».
6. **ADR-0003 / `QUESTIONS.md` №15** («лицензия GSAP?») — закрыт:
   все плагины бесплатны для коммерции с 30.04.2025.
7. **ADR-0012** не учитывает фильтрацию Cloudflare в РФ — при
   аудитории из РФ это главный инфраструктурный риск витрины.
8. **`docs/03_DESIGN_SYSTEM.md` §7 «Шрифты ≤ 100 КБ»** против текущих
   двух семейств: замер ≈ 128 КБ.
9. **CLAUDE.md, «Tech Stack» и «Project Structure»** устарели:
   «Email: Nodemailer» (в `src/` не импортируется, работает `resend`),
   «In-memory data store» (в проекте PostgreSQL), «Xray UUID» (выдача —
   через Remnawave). На стек это не влияет, но вводит агентов в
   заблуждение.
10. **`docs/04_ARCHITECTURE.md` §1**: «react последняя 19.2.8» и «zod
    4.5.4» — на 10.09.2026 есть react 19.3.0 (ставить не надо, §13) и
    zod 4.6.1.

---

## 16. Не удалось проверить

- Включён ли WebGPU по умолчанию в **Яндекс Браузере** (26 % РФ) —
  отсюда вилка 35–61 %.
- Покрытие scroll-driven animations в Яндекс Браузере (Chromium-основа
  делает «да» вероятным, но не подтверждено).
- Работа R3F 9.7 с асинхронным `gl`-фабрикой `WebGPURenderer` и под
  App Router Next 16.3 (Next подменяет `react` своей вшитой сборкой) —
  не собиралось; R3F в итоговый стек не входит.
- Вес Babylon.js 9 в бандле; вес рантайма и цены Unicorn Studio по
  официальной странице (страница отдала только заголовок).
- Лицензия pmndrs `postprocessing` (помечена Zlib по памяти).
- Точные имена TSL-узлов шума в r186 (`mx_noise_*`).
- `WebGPURenderer` в `OffscreenCanvas`/воркере на r186.
- Связка HEVC-alpha + VP9-alpha по заметкам caniuse не перепроверена.
- Экономия от урезания Condensed (−40…60 КБ) — оценка, не замер.
- Системные зависимости `toktx` и `fonttools` на машине сборки.
- Полевые CWV Atlas из РФ — их просто ещё нет (§8.4).

---

## Источники (проверено 10.09.2026)

Версии и даты — `npm view` (реестр npm), таблица в §0 и §13.

- caniuse, fulldata-json (данные от 24.08.2026): https://github.com/Fyrd/caniuse/blob/main/fulldata-json/data-2.0.json
- caniuse, регион RU (июль 2026): https://github.com/Fyrd/caniuse/blob/main/region-usage-json/RU.json
- MDN BCD, `animation-timeline`: https://github.com/mdn/browser-compat-data/blob/main/css/properties/animation-timeline.json
- MDN BCD, `GPU`: https://github.com/mdn/browser-compat-data/blob/main/api/GPU.json
- webstatus.dev, WebGPU: https://api.webstatus.dev/v1/features/webgpu
- webstatus.dev, scroll-driven animations: https://api.webstatus.dev/v1/features/scroll-driven-animations
- Chrome, New in WebGPU 121 (Android): https://developer.chrome.com/blog/new-in-webgpu-121
- Firefox и scroll-driven animations за флагом (Firefox 152): https://cssawwwards.com/blog/css-scroll-driven-animations-guide-2026
- Interop 2026: https://webkit.org/blog/17818/announcing-interop-2026/ · https://hacks.mozilla.org/2026/02/launching-interop-2026/
- StatCounter, браузеры РФ, август 2026: https://gs.statcounter.com/browser-market-share/all/russian-federation
- web.dev, Core Web Vitals: https://web.dev/articles/vitals
- Next.js blog (16.1, 16.2, 16.3): https://nextjs.org/blog
- Astro 7.0: https://astro.build/blog/astro-7/
- Cloudflare купил Astro (16.01.2026): https://www.cloudflare.com/press/press-releases/2026/cloudflare-acquires-astro-to-accelerate-the-future-of-high-performance-web-development/
- three.js releases: https://github.com/mrdoob/three.js/releases
- three.js PR #33950, Gaussian splats (влит 08.08.2026, r186): https://github.com/mrdoob/three.js/pull/33950
- three.js `WebGPURenderer`, `forceWebGL`, KTX2 + WebGPU (context7 `/mrdoob/three.js`): https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_loader_texture_ktx2.html
- R3F v10 alpha: https://github.com/pmndrs/react-three-fiber/discussions/3665
- Spark 2.0: https://sparkjs.dev/docs/new-features-2.0/ · https://github.com/sparkjsdev/spark
- GSAP Standard License: https://gsap.com/standard-license · Webflow, GSAP free: https://webflow.com/blog/gsap-becomes-free
- Motion `scroll()`: https://motion.dev/docs/scroll · Motion+: https://motion.dev/plus
- Lenis releases: https://github.com/darkroomengineering/lenis/releases
- Locomotive Scroll v5: https://scroll.locomotive.ca/docs/ · https://github.com/locomotivemtl/locomotive-scroll/releases
- lygia license (Prosperity 3.0): https://github.com/patriciogonzalezvivo/lygia/blob/main/LICENSE.md
- Payload и Figma: https://techsy.io/en/blog/payload-cms-guide
- Cloudflare в РФ: https://habr.com/ru/news/922532/ · https://secretmag.ru/technologies/rossiyan-otklyuchayut-ot-otkrytogo-interneta-cherez-blokirovku-cloudflare-chto-eto-znachit-i-kak-rabotaet.htm
- Vercel IP в РФ: https://community.vercel.com/t/ip-i-was-provided-by-vercel-for-my-custom-domain-is-blocked-by-russia/32366
- 152-ФЗ и зарубежная аналитика: https://habr.com/ru/companies/click/articles/915364/ · https://robokassa.com/blog/articles/zapret-google-analytics-v-rossii-s-1-iyulya-2025-goda-chto-nuzhno-znat-biznesu/
- Umami releases: https://github.com/umami-software/umami/releases · Plausible CE: https://github.com/plausible/analytics/releases
- Unicorn Studio (обзоры, цены не с официальной страницы): https://abduzeedo.com/webgl-design-tool-unicorn-studio-shaders
- Замеры веса: jsDelivr `https://cdn.jsdelivr.net/npm/<pkg>@<ver>/…`, `gzip -9`; шрифты — `fonts.googleapis.com/css2`, woff2 по подмножествам.
