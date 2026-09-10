# PIPELINE — Claude Code + MCP для 3D, видео и ассетов (раздел A5)

Дата среза: 10 сентября 2026. Машина: macOS (Darwin 25.6), Claude Code
2.1.267, Node 22.14, Blender 5.2.0 в `/Applications`. Все версии пакетов
сняты `npm view` / `pip index versions` / GitHub API в день написания.
Что проверить не удалось, помечено **[не проверено]**.

Коротко, до таблиц:

1. **Blender-коннекторов два, и оба слушают порт 9876.** Официальный
   (Blender Lab, анонс Anthropic 28.04.2026) и open-source `blender-mcp`
   (ahujasid, 1.9.1). Одновременно их запускать нельзя.
2. **`claude mcp list` пишет `blender ✔ Connected`, но Blender этой
   машины ни одного аддона не содержит.** Каталог
   `~/Library/Application Support/Blender/5.2/` содержит только
   `config/`. «Connected» значит только то, что процесс `uvx blender-mcp`
   поднялся, а до Blender этот мост пока не дотягивается: первый же
   вызов `mcp__blender__*` упадёт.
3. **Для оптимизации ассетов в цепочке не хватает трёх бинарников:**
   `gltf-transform`, `ktx` (KTX-Software ≥ 4.4.0) и `ffmpeg`. Агент
   `asset-forge` обещает KTX2, но собрать KTX2 здесь сейчас нечем.
4. **Главное препятствие не в 3D, а в скриншотах.** Сайт никогда не
   отдаёт стабильный кадр (`docs/00_AUDIT.md`, раздел 5), поэтому
   Playwright `toHaveScreenshot()` и цикл «правка шейдера → скриншот
   обратно в Claude» не работают, пока в приложении нет флага
   `?static=1`.
5. **По CLAUDE.md второй холст запрещён** («Один холст на сайте —
   `SignalTrace`»). Любая R3F-сцена из фазы D — это решение владельца
   о пересмотре правила, а не просто задача сборки.

---

## 1. Фактическое состояние машины (только чтение)

### MCP (`claude mcp list`)

| Сервер | Транспорт | Статус | Замечание |
|---|---|---|---|
| `context7` | `npx -y @upstash/context7-mcp@latest` (4.0.7) | ✔ | Дублируется с `plugin:context7:context7` (HTTP) |
| `playwright` | `npx -y @playwright/mcp@latest --caps=vision,pdf,devtools` (0.0.80) | ✔ | Дублируется с `plugin:playwright:playwright` без caps |
| `chrome-devtools` | `npx -y chrome-devtools-mcp@latest` (1.9.0) | ✔ | Есть `lighthouse_audit`, `performance_*` |
| `blender` | `uvx blender-mcp` (PyPI 1.9.1) | ✔ процесс / **✘ аддон не установлен** | Порт 9876, телеметрия включена по умолчанию |
| `plugin:figma:figma` | HTTP `https://mcp.figma.com/mcp` | ! Needs authentication | `docs/ASSUMPTIONS.md` |
| Google Drive / Gmail / Calendar | claude.ai | к пайплайну не относятся | — |

Дубли `context7` и `playwright` вдвое раздувают список инструментов в
контексте каждой сессии, а пользы от этого нет. Предложение: оставить
по одному экземпляру (пользовательский `playwright` с caps,
плагинный `context7`).

### Скиллы

- `~/.claude/skills/` содержит 52 скилла. Скиллы `remotion-*`,
  `web-quality-audit`, `performance`, `accessibility`, `core-web-vitals`,
  `seo`, `best-practices` и `stop-slop` — это **симлинки на
  `~/.agents/skills/`**, то есть установлены глобально через
  `npx skills add`, а не в проект.
- **`.claude/skills/` в проекте не существует**, хотя `.gitignore:49`
  его игнорирует. Remotion-скиллы на другой машине и в CI не появятся.
- Blender-скиллы (`turntable`, `dolly-rotate`, `crane-shot`,
  `perfect-loop`, `slow-zoom`, `dynamic-full-loop`, `image-to-3d`,
  `multi-image-to-3d`, `product-polish`, `polyhaven-*`,
  `threejs-export`) взяты из
  [kevinbadi/blender-skills](https://github.com/kevinbadi/blender-skills)
  (последний push 04.04.2026). Им нужен **ahujasid**-аддон
  («Blender 5.x with blender-mcp addon»), а `image-to-3d` ещё и ключ Meshy.
- `blender-toolkit` взят из Dev-GOM/claude-code-marketplace и держит
  собственный аддон и конфиг, независимый от MCP.
- Скиллы `threejs-*` — это справочники по API, в сценах они не участвуют.
- `baseline-ui` — из [ibelick/ui-skills](https://github.com/ibelick/ui-skills).

### Саб-агенты (`.claude/agents/`, фронтматтер)

| Агент | model | Инструменты | Разрыв с реальностью |
|---|---|---|---|
| creative-director | opus | WebSearch, WebFetch, Read | — |
| motion-composer | opus | Read, Grep | — |
| creative-dev-3d | opus | Read/Edit/Write/Bash + context7 | в `package.json` нет `three`/R3F |
| frontend-builder | sonnet | Read/Edit/Write/Bash + context7 | «вызывай design-critic» — у агента нет `Agent` в tools, вызвать он не сможет |
| design-critic | opus | Playwright (скриншот) | скриншоты на этом сайте не снимаются |
| perf-guard | sonnet | Playwright + chrome-devtools (Lighthouse, trace) | годен; бюджет glTF < 2 MB проверять нечем без `gltf-transform` |
| a11y-check | sonnet | Playwright | — |
| asset-forge | opus | Bash + 9 инструментов blender (Poly Haven) | нет Sketchfab/Rodin/Hunyuan/Meshy-инструментов; нет `ktx`, `gltf-transform`, `ffmpeg`, Remotion-проекта |

### Хуки и настройки

- `.claude/settings.json` проекта содержит только `enabledPlugins`
  (`pr-review-toolkit`). **Хуков нет.**
- В `~/.claude/settings.json` `hooks` пустой.

### Локальные бинарники

| Инструмент | Есть | Версия / где взять |
|---|---|---|
| `uv` / `uvx` | да | `~/.local/bin` |
| Blender | да | 5.2.0, `/Applications/Blender.app`, **без MCP-аддонов** |
| `gltf-transform` | нет | npm 4.5.0 |
| `ktx` (KTX-Software) | нет | GitHub release v4.4.2, `.pkg` для Darwin arm64. **brew-cask не существует** (проверено) |
| `gltfpack` | нет | npm 1.2.0; нативный бинарник лучше (см. §4) |
| `ffmpeg` | нет | brew 9.0.1 |
| `lighthouse` | нет (глобально) | npm 13.4.1; есть через chrome-devtools MCP |
| `@playwright/test` | нет | npm 1.63.0 |
| `manim` | нет | PyPI 0.21.0 |

---

## 2. Схема пайплайна

```
                    ┌──────────────── БРИФ ─────────────────┐
                    │ creative-director → motion-composer    │
                    │ (правило / нарушение / партитура)      │
                    └───────────────┬───────────────────────┘
                                    │
   ┌────────────────────────────────┼──────────────────────────────────┐
   │                                │                                  │
   ▼ 3D-ОБЪЕКТ                      ▼ ВИДЕО                            ▼ ДИЗАЙН
 ┌───────────────────────┐   ┌──────────────────────┐   ┌──────────────────────────┐
 │ A. процедурно (bpy)    │   │ Remotion (React)     │   │ Figma MCP (read: токены, │
 │    execute_blender_code│   │ токены сайта → TSX   │   │ переменные, скриншот)    │
 │ B. Poly Haven (CC0)    │   │ remotion-* skills    │   │ Spline V2 MCP (сцена)    │
 │ C. text/image→3D:      │   │ ↓                    │   └────────────┬─────────────┘
 │    Rodin / Hunyuan /   │   │ npx remotion render  │                │ [руки: авторизация,
 │    Meshy  [платно]     │   │ ↓                    │                │  выбор фрейма]
 └──────────┬────────────┘   │ ffmpeg: AV1/HEVC,    │                ▼
            │ [руки: ретопо, │ WebM-alpha, постер   │        frontend-builder
            │  UV, масштаб,  └──────────┬───────────┘
            │  стиль]                   │
            ▼                           ▼
 ┌─────────────────────────────┐   public/media/*.{mp4,webm}
 │ Blender: материалы бренда   │
 │ (чёрный/белый/ультрамарин), │
 │ get_viewport_screenshot     │◄── цикл «правка → скриншот вьюпорта» (MCP, автоматом)
 │ экспорт glTF 2.0 (.glb)     │
 └──────────┬──────────────────┘
            ▼
 ┌─────────────────────────────────────────────────────────────────┐
 │ gltf-transform (CLI, автоматом)                                 │
 │  inspect → dedup/weld/prune → simplify → meshopt|draco          │
 │  → uastc (normal/ORM) + etc1s (baseColor) [нужен ktx ≥4.4.0]    │
 │  → inspect (треугольники, VRAM, байты)                          │
 └──────────┬──────────────────────────────────────────────────────┘
            ▼  hook: бюджет ≤ 2 MB на сцену, иначе exit 2
 public/models/*.glb
            ▼
 ┌─────────────────────────────────────────────────────────────────┐
 │ R3F / three r186: useGLTF + Draco/Meshopt/KTX2 loaders          │
 │ WebGPURenderer (TSL) + WebGL-fallback, device-tier, reduced-mo  │
 └──────────┬──────────────────────────────────────────────────────┘
            ▼
 ┌─────────────────────────────────────────────────────────────────┐
 │ ПРОВЕРКА: ?static=1 → CDP-скриншот 8 ширин → design-critic      │
 │           chrome-devtools lighthouse_audit → perf-guard         │
 │           Playwright keyboard/snapshot → a11y-check             │
 └─────────────────────────────────────────────────────────────────┘

 Ветка «фото → сплат» (для Atlas — вне приоритета, см. §5):
 телефон/видео → Luma | Polycam | Postshot | Brush(WebGPU) → .ply
   → splat-transform → .spz / .sog     → three r186 GaussianSplat (малые сцены)
   → Spark 2 build-lod → .rad          → @sparkjsdev/spark (большие, стриминг)
```

**Где автоматизирует MCP, а где нужны руки**

| Шаг | Автоматом через Claude Code | Руками |
|---|---|---|
| Процедурная модель (bpy) | да: `execute_blender_code` + скриншот вьюпорта | оценка силуэта |
| Поиск/импорт CC0 (Poly Haven) | да, 4 инструмента MCP | выбор из выдачи |
| Sketchfab | поиск и превью да | **проверка лицензии каждой модели** |
| Text/image → 3D (Rodin, Hunyuan, Meshy) | запрос, опрос статуса, импорт | ретопология, UV, чистка артефактов, масштаб, «стиль бренда» почти всегда переделывается |
| Материалы и свет | да | арт-оценка |
| Экспорт glTF | да (`bpy.ops.export_scene.gltf`) | — |
| Draco/Meshopt/KTX2 | да, CLI | выбор ETC1S vs UASTC по слотам |
| Встраивание в R3F | да (creative-dev-3d + context7) | — |
| Визуальная проверка | только после `?static=1` | финальный вкус |
| Видео Remotion | да, от TSX до MP4 | монтажный ритм, звук |

---

## 3. Таблица инструментов

Зрелость: 1 — эксперимент, 5 — стандарт индустрии. «Время» — честная
оценка для **этого** проекта, а не вообще.

| Инструмент | Что делает | Установка (проверенная) | Здесь | Зрел. | Время / маркетинг |
|---|---|---|---|---|---|
| **Blender MCP официальный** (Blender Lab) | Естественно-языковой интерфейс к Python API Blender: анализ и отладка сцены, пакетные скрипты, добавление инструментов в UI | Расширение ZIP с [blender.org/lab/mcp-server](https://www.blender.org/lab/mcp-server/) → Install from Disk; сервер: `git clone https://projects.blender.org/lab/blender_mcp.git`, запуск `uv --directory <repo>/mcp run blender-mcp` ([griptape docs](https://docs.griptapenodes.com/en/stable/guides/mcp/servers/blender/)). Blender ≥ 5.1 | нет | 3 | Экономит на bpy-рутине. Интеграций с библиотеками ассетов **нет** |
| **blender-mcp** (ahujasid) | Мост к Blender: сцена, объекты, материалы, произвольный Python, скриншот вьюпорта + Poly Haven, Sketchfab, Poly Pizza, Hyper3D Rodin, Hunyuan3D | `uvx blender-mcp install-addon` → Blender: Preferences → Add-ons → «MCP for Blender» → N-панель → Start MCP Server. MCP уже зарегистрирован: `uvx blender-mcp` | MCP да, **аддон нет** | 3 | Экономит на поиске ассетов и превизе. `execute_blender_code` исполняет любой Python |
| Poly Haven (через MCP) | HDRI, PBR-текстуры, модели, CC0 | в аддоне ahujasid, ключ не нужен | нет (аддон) | 4 | Реально экономит: CC0 без юристов |
| Sketchfab (через MCP) | Поиск/загрузка моделей | `BLENDERMCP_SKETCHFAB_API_KEY` | нет | 3 | Лицензии разные, ручная проверка |
| Hyper3D Rodin (Gen-2/2.5) | Text/image → 3D, самая детальная геометрия | `BLENDERMCP_HYPER3D_API_KEY` | нет | 3 | Для абстрактных объектов Atlas скорее маркетинг |
| Hunyuan3D 3.1 | Image → 3D; 3.x через Tencent Cloud API, open-source только 2.x | ключ в аддоне | нет | 3 | То же |
| **Meshy MCP** (официальный) | Text/image/multi-image → 3D, remesh, retexture, rig | `claude mcp add meshy -- npx -y @meshy-ai/meshy-mcp-server` (npm 0.5.1); имя переменной ключа **[не проверено]**; нужен план Pro+ | нет | 3 | Скиллы kevinbadi зависят от него |
| kevinbadi/blender-skills | Камерные пролёты, turntable, polish, Poly Haven-сцены | `git clone` → `.claude/skills/` | да (глобально) | 2 | Продуктовая съёмка; Atlas не продаёт физический продукт |
| blender-toolkit (Dev-GOM) | Примитивы, материалы, ретаргет Mixamo | плагин маркетплейса | да | 2 | Второй мост к Blender, конфликтует по смыслу с MCP |
| **gltf-transform CLI** | inspect/validate, dedup/weld/prune/simplify, draco/meshopt, uastc/etc1s (KTX2), webp/avif, resize | `npm i -D @gltf-transform/cli` (4.5.0) | нет | 5 | Экономит: одна команда вместо ручной оптимизации |
| **KTX-Software** (`ktx`) | Кодер Basis Universal для `uastc`/`etc1s` в gltf-transform (требует ≥ 4.4.0, `toktx.ts`) | `KTX-Software-4.4.2-Darwin-arm64.pkg` с [GitHub releases](https://github.com/KhronosGroup/KTX-Software/releases) → `sudo installer -pkg … -target /` | нет | 5 | Обязателен для KTX2 |
| gltfpack (meshoptimizer) | Альтернатива: meshopt + `-tc` KTX2 одним бинарником | нативный бинарник с [releases](https://github.com/zeux/meshoptimizer/releases); npm 1.2.0 **не умеет сжимать текстуры** (README) | нет | 5 | Быстрее gltf-transform на больших файлах |
| three r186 `GaussianSplat` | Нативный рендер сплатов: PLY/SPLAT/SPZ/KSPLAT/glTF `KHR_gaussian_splatting`, +7 КБ | в составе `three@0.186.0` | нет (`three` не в deps) | 2 | Только SH0, без LoD и стриминга (август 2026) |
| **Spark** (`@sparkjsdev/spark`) | Сплаты для three: LoD, стриминг `.rad`, 100M+ сплатов на WebGL2 | `npm i @sparkjsdev/spark` (2.1.0) | нет | 4 | Лучший веб-рендер сплатов 2026 |
| splat-transform (PlayCanvas) | Конвертация/сжатие PLY → SPZ/SOG, чистка | `npm i -g @playcanvas/splat-transform` (3.4.2); синтаксис **[не проверено]** | нет | 4 | Нужен, если сплаты вообще будут |
| Brush | Обучение сплатов на WebGPU, в т.ч. в браузере (Chrome/Edge) | [ArthurBrussee/brush](https://github.com/ArthurBrussee/brush), релиз v0.3.0 (09.2025) | нет | 2 | Proof of concept по словам автора |
| Luma AI | Облачная сборка сплата из видео, экспорт PLY | приложение/веб | — | 3 | Бесплатно; Flythroughs закрыты с 01.01.2026 |
| Polycam | LiDAR + сплаты, 15+ форматов; PLY только на Pro | приложение | — | 4 | Платно для PLY |
| **Remotion** + agent skills | Программное видео из React/TSX | проект: `npx create-video@latest` **[не проверено]**; скиллы: `npx skills add remotion-dev/skills` | скиллы да (глобально), пакета нет | 4 | Реально экономит на тизерах в токенах сайта |
| FFmpeg | Транскод AV1/HEVC/WebM-alpha, постеры, нарезка | `brew install ffmpeg` (9.0.1) | нет | 5 | Без него Remotion-выход не доводится до веба |
| FFmpeg-скиллы | Обёртки естественного языка над ffmpeg | например [digitalsamba/claude-code-video-toolkit](https://github.com/digitalsamba/claude-code-video-toolkit/blob/main/.claude/skills/ffmpeg/SKILL.md) | нет | 2 | Маркетинг: Claude знает ffmpeg и без скилла |
| Manim + скиллы | Математические анимации (3b1b) | `pip install manim` (0.21.0); скилл [adithya-s-k/manim_skill](https://github.com/adithya-s-k/manim_skill) | нет | 3 | Для Atlas не нужен |
| **Figma MCP** (remote) | Чтение: компоненты, переменные, layout, скриншот; запись на канвас | `claude plugin install figma@claude-plugins-official` (стоит) → `/mcp` → авторизация | да, **не авторизован** | 4 чтение / 2 запись | Экономит, только если макеты живут в Figma. У Atlas источник правды — `graticule.css` |
| **Spline V2 MCP** | С 20.08.2026 встроен в десктоп-Spline, регистрируется в Claude Code сам; объекты, материалы, свет, камеры, частицы | [Spline V2](https://blog.spline.design/spline-v2); сторонний `pip install spline-mcp` (0.5.3) не нужен | нет | 2 | Три недели от релиза; runtime `@splinetool/runtime` тяжелее своей сцены |
| Rive MCP | Управление редактором Rive: артборды, state machines, data binding | встроен в Rive Editor Early Access | нет | 1 | По выдаче поиска помечен deprecated в пользу Rive AI Agent, страница доков отдаёт 404 **[частично проверено]** |
| Unicorn Studio | No-code WebGL-эффекты, runtime ~50 КБ, свой AI-агент (Legend-план) | `unicornstudio-react` (2.2.10) | нет | 3 | MCP не найден. Слой эффектов поверх — второй холст |
| Генерация изображений: GPT Image 2, Nano Banana 2/Pro, FLUX.2, Seedream 5.0 | Растровая генерация; FLUX.2 [dev] — LoRA (до 4 адаптеров) для стиля бренда | API провайдеров / fal | нет | 4 | **На сайт Atlas не идёт** (запрет стока в CLAUDE.md). Мудборды — да |
| Генерация видео: Veo 3.1, Kling 3.0, Runway Gen-4.5, Seedance 2.0 | Text/image → видео; Veo — нативный звук | API провайдеров | нет | 4 | Для витрины ~0: сток по сути |
| Sora 2 API | — | — | — | 0 | **Отключается 24.09.2026**, замены у OpenAI нет |
| Удаление фона: rembg, BRIA RMBG 2.0, BiRefNet, BEN v2 | Альфа-маски | `pip install rembg` (2.0.84); лицензия весов RMBG 2.0 **[не проверено]** | нет | 4 | Нужно только при фотоматериале, которого нет |
| Апскейл: Topaz API, Magnific, Real-ESRGAN/Upscayl | Увеличение растра | API / локально | нет | 4 | Не нужно |
| **Playwright MCP** | Навигация, snapshot, скриншот, трассы, видео | стоит (`--caps=vision,pdf,devtools`) | да | 4 | Скриншоты на этом сайте висят (ждут стабильный кадр) |
| **chrome-devtools-mcp** | Lighthouse, performance trace + insights, CDP-скриншот, эмуляция | стоит; флаги `--headless`, `--isolated`, `--slim`, `--no-usage-statistics` | да | 4 | Реально экономит perf-guard |
| `@playwright/test` | `toHaveScreenshot()` визуальные регрессии, `maxDiffPixels`, `stylePath` | `npm i -D @playwright/test` (1.63.0) + `npx playwright install chromium` | нет | 5 | Сработает только с `?static=1` |
| Lighthouse CLI | JSON-отчёт по CWV-лабе | `npm i -D lighthouse` (13.4.1) | нет | 5 | Для хуков надёжнее MCP |
| `@lhci/cli` | Lighthouse CI с ассертами | `npm i -D @lhci/cli` (0.15.1, последний релиз 06.2025) | нет | 3 | Для CI; темп релизов упал |
| web-quality-skills (Addy Osmani) | Аудиты perf/a11y/SEO/CWV | стоит; или `npx skills add addyosmani/web-quality-skills` | да | 4 | Полезно как чек-лист |
| ui-skills (ibelick) | Анти-«слоп» UI | `npx ui-skills get baseline-ui` (0.2.4) | частично | 3 | — |
| context7 | Актуальные доки библиотек | стоит | да | 5 | Реально экономит: three/R3F меняются ежемесячно |
| `npx skills` (vercel-labs) | Установщик agent skills | `npx skills add <owner/repo>` (1.5.25) | использован | 4 | Ставит в `~/.agents/skills` |
| Claude Code hooks | Детерминированные проверки на событиях | `.claude/settings.json` → `hooks` | нет | 5 | Самая дешёвая автоматизация из всех (см. §8) |
| Sub-agent hooks (фронтматтер) | Хуки, живущие только пока работает агент | поле `hooks:` в `.claude/agents/*.md` | нет | 4 | Позволяет повесить tsc только на frontend-builder |

---

## 4. Пайплайн «текст → 3D → оптимизация → glTF → R3F»

### Какой из двух Blender-мостов выбрать

| | Официальный (Blender Lab) | ahujasid `blender-mcp` |
|---|---|---|
| Кто держит | разработчики Blender; Anthropic — патрон Blender Development Fund | сообщество, 28k звёзд, push 07.09.2026 |
| Установка | расширение ZIP + `uv run` из клона | `uvx blender-mcp install-addon` |
| Blender | ≥ 5.1 | ≥ 3.0 |
| Ассеты | нет | Poly Haven, Sketchfab, Poly Pizza, Rodin, Hunyuan3D |
| Скиллы kevinbadi | не рассчитаны | рассчитаны |
| Порт | 9876 | 9876 |
| Безопасность | исполняет Python | исполняет Python; есть `BLENDER_MCP_SAFE_MODE=1` |
| Телеметрия | **[не проверено]** | включена по умолчанию; `DISABLE_TELEMETRY=true` |

Рекомендация: **ahujasid**, потому что под него уже написаны скиллы и
агент `asset-forge`. Официальный держать в запасе для отладки сцен и
не запускать одновременно. Сообщение mcp.film о том, что репозиторий
ahujasid с августа отдаёт 404, **ложное**: GitHub API 10.09.2026
отвечает, push был три дня назад.

### Где ломается (по документации и отзывам)

- Мост пишет «Connected», но аддон в Blender не запущен. Именно это
  состояние сейчас на этой машине.
- Сложные запросы надо дробить: README ahujasid прямо советует разбивать
  операции на шаги.
- CDN Poly Pizza за Cloudflare блокирует IP датацентров и VPN. Для
  сервиса, чья команда сидит за VPN, это практический риск.
- Сетка text-to-3D не имеет рёберных петель, quad-remesh распределяет
  петли равномерно. Для веба это лишние треугольники и грязные UV.
- Официальный аддон: синхронизация репозитория `lab.blender.org` падает
  за антивирусом, фаерволом или VPN, помогает ставить с диска
  ([zenn.dev](https://zenn.dev/shintama/articles/blender-official-mcp-claude?locale=en)).

### Честная оценка для Atlas

Атлас продаёт ускоритель и серверы, а не физический предмет. Правдоподобные
3D-объекты — серверная стойка для `/vds` или сам знак бренда в объёме.
Их **быстрее и чище строить процедурно** (`execute_blender_code`, 50–300
строк bpy) или вообще в TSL, чем генерировать Rodin/Meshy: генератор
отдаст фотореалистичную фактуру, которая спорит с системой «бумага и
краска», и её придётся перекрашивать руками. Text-to-3D здесь скорее
маркетинг.

### Команды оптимизации (после установки из §7)

```bash
gltf-transform inspect  in.glb
gltf-transform optimize in.glb mid.glb --compress meshopt --texture-compress webp
# KTX2 вместо webp (нужен ktx ≥ 4.4.0):
gltf-transform uastc mid.glb mid2.glb \
  --slots "{normalTexture,occlusionTexture,metallicRoughnessTexture}" \
  --level 4 --rdo --rdo-lambda 4 --zstd 18
gltf-transform etc1s mid2.glb out.glb --quality 255
gltf-transform inspect  out.glb      # треугольники, VRAM, размер → в отчёт asset-forge
```

Синтаксис `optimize … --compress … --texture-compress …` и `uastc`/`etc1s`
взят из README и документации gltf-transform 4.x. Требование
`KTX_SOFTWARE_VERSION_MIN = '4.4.0'` взято из `packages/cli/src/transforms/toktx.ts`.

---

## 5. Пайплайн «фото/видео → Gaussian Splat → сайт»

| Звено | Вариант 2026 | Формат выхода |
|---|---|---|
| Съёмка + обучение | Luma (бесплатно, облако), Polycam (LiDAR, PLY на Pro), Postshot (локально) **[не проверено отдельно]**, Brush (WebGPU, в т.ч. браузер) | `.ply` |
| Чистка/сжатие | splat-transform (PlayCanvas), SuperSplat (редактор в браузере) | `.spz` (Niantic, в 2–5 раз меньше `.splat`), `.sog` |
| LoD/стриминг | Spark 2 (Tiny-LoD в браузере, Bhatt-LoD офлайн) | `.rad` |
| Рендер | Spark 2.1 (WebGL2, стриминг, 100M+) или three r186 `GaussianSplat` (7 КБ, SH0, без LoD) | — |

Жизнеспособно: **SPZ** для малых объектов через нативный three,
**RAD** через Spark для больших сцен. PLY — только промежуточный.
Обучение в браузере (Brush) пока демонстрация, не продакшн-инструмент.

Для Atlas: блок «команда сплатом» из мега-промта упирается в ТЗ 15.5
(«имена сотрудников не выдумываются») и в отсутствие подтверждённой
команды и офиса. **Сплаты для фазы D не рекомендую**, пока владелец не
даст реальный объект съёмки.

---

## 6. Изображения, видео и визуальный язык бренда

Ограничение проекта жёстче рынка: «Никаких сторонних библиотек, эмодзи
и стоковых иллюстраций» (CLAUDE.md), вся графика процедурная
(`docs/ASSUMPTIONS.md`). Сгенерированная картинка на витрине — тот же
сток, только дешевле. Поэтому:

- **На сайт:** ни растровой, ни видео-генерации. Материал первого экрана —
  `SignalField`, показание — `SignalTrace`, всё из кода.
- **Допустимо внутри команды:** мудборды для creative-director, быстрые
  раскадровки. FLUX.2 [dev] + LoRA на 15–30 кадрах собственного сайта
  держит стиль лучше, чем промт ([fal](https://fal.ai/models/fal-ai/flux-2/lora)).
- **Видео для соцсетей:** Remotion из тех же токенов (`--g-ink`,
  `--g-chart`, Sofia Sans), а не Veo/Kling. Кадр детерминирован, шрифт
  тот же, цвет «измерено» не нарушен. Здесь Claude Code экономит
  по-настоящему.
- **Строить на Sora 2 нельзя:** API отключается 24.09.2026
  ([OpenAI Help](https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation)).
- Удаление фона и апскейл понадобятся, только если появится реальный
  фотоматериал (скриншоты клиентов-приложений на `/devices`).

---

## 7. Итерация шейдеров с live-preview

Рабочий цикл, реально доступный в этом репо:

```
правка TSL/GLSL ──► Next 16 Turbopack HMR ──► /lab/shader?static=1&t=1.5
      ▲                                              │
      │                                chrome-devtools take_screenshot (CDP)
      └──── Claude смотрит PNG, правит ◄─────────────┘
```

1. **Отдельный маршрут-стенд** (`src/app/lab/shader/…`, закрыт от
   индексации). Время приходит из query-параметра, `uTime` заморожен.
   Детерминированный кадр — единственный способ получить скриншот на
   сайте, который «не отдаёт стабильный кадр никогда».
2. **TSL предпочтительнее GLSL:** это обычный JS/TS, HMR и `tsc` работают
   из коробки. Для `.glsl` Next 16.2 даёт import attributes:
   `import src from './f.glsl' with { turbopackLoader: 'raw-loader', turbopackAs: '*.js' }`
   ([Next 16.2](https://nextjs.org/blog/next-16-2-turbopack)). Нужен
   `raw-loader` в devDeps, версия **[не проверено]**.
3. **Скриншот обратно:** Playwright MCP ждёт `document.fonts.ready` и
   два стабильных кадра, на живом слое он зависает (`00_AUDIT.md`,
   раздел 5). Через CDP `Page.captureScreenshot` (chrome-devtools MCP)
   ожидания стабильности нет. Что именно ждёт `take_screenshot` у
   chrome-devtools-mcp, **[не проверено]**.
4. **Блокер среды:** репозиторий на iCloud-Рабочем столе. HMR отдавал
   старый CSS, `.next` получал конфликтные копии (`ASSUMPTIONS.md`).
   Цикл «правка → кадр» ненадёжен, пока проект не перенесён из `~/Desktop`.

Где маркетинг: «Claude пишет шейдер с первой попытки». На практике
приходится 3–8 итераций со скриншотом, и без замороженного времени
сравнивать кадры нельзя.

---

## 8. Организация проекта для Claude Code: предложения по хукам

**Только предложения. Ничего не установлено.** Формат по
[Hooks reference](https://code.claude.com/docs/en/hooks): exit 2
блокирует и возвращает stderr Claude; `async: true` уводит проверку в
фон; `asyncRewake: true` будит Claude при exit 2; `${CLAUDE_PROJECT_DIR}`
указывает на корень. В Stop-хуке обязательна проверка
`stop_hook_active`, иначе возникает бесконечный цикл.

### H1. PostToolUse → `tsc` (фоном, будит только при ошибке)

```json
{
  "matcher": "Edit|Write",
  "hooks": [{
    "type": "command",
    "if": "Edit(src/**/*.{ts,tsx})",
    "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/tsc.sh",
    "async": true, "asyncRewake": true, "timeout": 120,
    "statusMessage": "tsc --noEmit"
  }]
}
```
`tsc.sh`: `npx tsc --noEmit -p tsconfig.json` (инкрементальный
`tsconfig.tsbuildinfo` уже есть), при ошибке пишет первые 30 строк в
stderr и выходит с кодом 2. Синхронный вариант на iCloud-диске будет
тормозить каждую правку.

### H2. PostToolUse → страж правил CLAUDE.md (grep, < 1 с, синхронно)

Дешёвая машинная проверка того, что сейчас держится на памяти модели.
Скрипт читает `tool_input.file_path` из stdin и выходит с кодом 2 с
причиной, если в изменённом файле есть:
- хекс-цвет в `src/components/**` (правило «токены, не хекс»);
- `bg-white/[`, `text-white/` в `src/app/dashboard/**`;
- `cursor: none`;
- `font-family` с Inter, Roboto или Arial;
- слово `VPN` в `src/app/**` вне `api/`, `dashboard/` и `admin/`
  (решение от 08.09.2026);
- «безлимит устройств», «аптайм», «магистраль»;
- эмодзи в TSX;
- импорт иконок из `lucide`, `react-icons` или `heroicons`.

### H3. PreToolUse Bash → защита от дорогих и опасных команд

- `git add .env` / `git commit` с `.env` в индексе → exit 2.
- `rm -rf .next` → предупреждение через `systemMessage`: на iCloud это
  около 25 минут.

### H4. PostToolUse Write → бюджет 3D-ассета

`matcher: "Write|Bash"`, фильтр `public/**/*.{glb,gltf}`:
`gltf-transform inspect` → если файл больше 2 MB (бюджет perf-guard)
или в нём есть текстуры не в KTX2/WebP, выход с кодом 2 и числами.
Работает только после установки `@gltf-transform/cli`.

### H5. PreToolUse `mcp__blender__execute_blender_code` → журнал

Пишет код в `docs/rebrand-2027/blender-log/<время>.py` и не блокирует.
Это аудит того, что делал агент в Blender, и возможность повторить
сцену без MCP. Запуск моста — только с `BLENDER_MCP_SAFE_MODE=1`.

### H6. Stop → скриншоты и Lighthouse (фоном, только если трогали UI)

```json
{
  "hooks": [{
    "type": "command",
    "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/stop-visual.sh",
    "async": true, "asyncRewake": true, "timeout": 300
  }]
}
```
`stop-visual.sh`:
1. Выход с кодом 0, если `stop_hook_active` равен true, если в
   `git diff --name-only` нет `src/app|src/components|*.css` или если на
   `:3000` нет сервера.
2. CDP-скриншоты `?static=1` на 375/768/1440 в `docs/audit/screens/`.
3. `npx lighthouse http://localhost:3000/?static=1 --only-categories=performance,accessibility --output=json --output-path=…`.
   Флаги Lighthouse 13 **[не проверено отдельно]**.
4. Выход с кодом 2, если perf < 90, CLS > 0.1 или есть ошибки консоли.

Без `?static=1` этот хук бесполезен, поэтому флаг — первая задача фазы D.

### H7. SessionStart → проверка среды

Предупреждает, если `pwd` лежит в `~/Desktop` (iCloud), если на
`localhost:9876` никто не слушает (аддон Blender не запущен) или если в
`PATH` нет `ktx`, `gltf-transform` или `ffmpeg`.

### H8. Хуки в фронтматтере саб-агентов

- `frontend-builder`: `hooks.PostToolUse` → H1+H2 синхронно, только
  пока работает этот агент.
- `asset-forge`: `hooks.PostToolUse` → H4.
- Удалить из `frontend-builder` фразу «вызывай design-critic и
  perf-guard»: у агента нет инструмента `Agent`. Порядок вызова держит
  главная сессия (Workflow per screen, CLAUDE.md).

### Визуальные регрессии Playwright (для CI, не хук)

`@playwright/test`, `toHaveScreenshot()` с `animations: 'disabled'`,
`stylePath`, прячущим `SignalField` и `SignalTrace`, и `maxDiffPixels`.
Базовые снимки снимать в одной ОС: имя файла включает платформу
(`…-chromium-darwin.png`), и рендер различается между машинами
([playwright.dev](https://playwright.dev/docs/test-snapshots)).

---

## 9. Что установить для фазы D (точные команды)

Не выполнялось. Порядок — по зависимостям.

```bash
# 0. Среда: перенести репозиторий с iCloud-Рабочего стола (вручную).

# 1. Blender-мост (ahujasid) — аддон внутрь Blender 5.2
uvx blender-mcp install-addon
#   Blender → Edit → Preferences → Add-ons → «MCP for Blender» → Enable
#   3D Viewport → N → вкладка MCP → Start MCP Server
#   перерегистрировать с безопасным режимом и без телеметрии:
claude mcp remove blender
claude mcp add blender -e BLENDER_MCP_SAFE_MODE=1 -e DISABLE_TELEMETRY=true -- uvx blender-mcp

# 2. Оптимизация ассетов
npm i -D @gltf-transform/cli            # 4.5.0
#   KTX-Software ≥ 4.4.0 (brew-cask нет):
#   скачать KTX-Software-4.4.2-Darwin-arm64.pkg с github.com/KhronosGroup/KTX-Software/releases
sudo installer -pkg KTX-Software-4.4.2-Darwin-arm64.pkg -target /
brew install ffmpeg                     # 9.0.1

# 3. 3D-слой (только после решения владельца о втором холсте)
npm i three @react-three/fiber @react-three/drei   # 0.186.0 / 9.7.0 / 10.7.8

# 4. Проверки
npm i -D @playwright/test lighthouse    # 1.63.0 / 13.4.1
npx playwright install chromium

# 5. Дизайн-MCP
#   в сессии Claude Code: /mcp → figma → Authenticate

# 6. По необходимости (платно, ключи)
claude mcp add meshy -- npx -y @meshy-ai/meshy-mcp-server   # план Meshy Pro+
#   ключи Rodin/Sketchfab/Hunyuan — в настройках аддона Blender

# 7. Remotion-проект для тизеров (отдельная папка, не внутри Next)
npx create-video@latest                 # [не проверено]
npx skills add remotion-dev/skills      # уже стоит глобально; для CI — в проект
```

Уборка, которая экономит контекст: убрать дубли `context7` и
`playwright` из `claude mcp list`.

---

## 10. Где Claude Code/MCP экономит время, а где это маркетинг

| Реально экономит | Маркетинг или спорно для Atlas |
|---|---|
| context7 против устаревшей памяти о three/R3F | «Text-to-3D за минуту»: сетка и фактура вне стиля, ретопо руками |
| gltf-transform одной командой в хуке | Сплаты команды и офиса: нет объекта съёмки |
| chrome-devtools `lighthouse_audit` + trace для perf-guard | Генеративные картинки и видео на витрине (запрещено) |
| Remotion-тизеры из тех же токенов | Rive MCP (deprecated), Spline MCP (3 недели от релиза) |
| bpy-рутина через `execute_blender_code` | FFmpeg-скиллы: Claude знает ffmpeg сам |
| Хуки H1/H2: правила CLAUDE.md проверяет машина | Manim: не тот жанр |
| Poly Haven CC0 для HDRI и материалов рендера | Figma MCP при источнике правды в CSS |

---

## 11. Чего не хватает для фазы D

1. Флаг `?static=1` в приложении: без него не работают design-critic,
   визуальные регрессии, H6 и цикл шейдеров.
2. Решение владельца о втором холсте и R3F (CLAUDE.md сейчас запрещает).
3. Аддон Blender (выбрать один мост; порт 9876 общий).
4. `@gltf-transform/cli`, `ktx` ≥ 4.4.0, `ffmpeg`.
5. `three`, `@react-three/fiber`, `@react-three/drei` в `package.json`.
6. `@playwright/test`, `lighthouse`, конфиг Playwright и базовые снимки.
7. Хуки H1–H8 в `.claude/settings.json` (сейчас пусто).
8. Авторизация Figma MCP (если макеты вообще будут в Figma).
9. Ключи Meshy, Rodin, Sketchfab и Hunyuan — только при осознанном
   решении использовать генерацию.
10. Инструменты `asset-forge`: добавить `mcp__blender__search_sketchfab_models`,
    `…_generate_hyper3d_*` и `…_hunyuan*`, если генерация нужна. Remotion
    перенести в проектные скиллы для воспроизводимости.
11. Перенос репозитория с iCloud-диска.

## 12. Не проверено

- Точная команда регистрации официального Blender MCP в Claude Code:
  страницы `blender.org/lab/mcp-server` и `projects.blender.org/…/wiki`
  отдали 403; команда восстановлена по документации Griptape.
- Телеметрия официального Blender MCP.
- Статус Rive MCP: страница доков 404, deprecated известно только из
  поисковой выдачи.
- Синтаксис `splat-transform`, Postshot, лицензия весов BRIA RMBG 2.0.
- Имя переменной окружения для ключа Meshy MCP.
- `npx create-video@latest` как текущая команда создания Remotion-проекта.
- Ждёт ли `take_screenshot` у chrome-devtools-mcp стабильного кадра.
- Флаги Lighthouse 13 (`--only-categories`, `--output-path`) отдельно не
  перепроверялись.
- Версия `raw-loader` для GLSL-импорта.
- Совместимость аддона ahujasid с Blender 5.2 (скиллы заявляют «5.x»).
- Цены генеративных API взяты из агрегаторов, а не с прайс-страниц
  провайдеров.

## Источники

- Anthropic, Claude for Creative Work (28.04.2026): https://www.anthropic.com/news/claude-for-creative-work
- 9to5Mac о девяти коннекторах: https://9to5mac.com/2026/04/28/anthropic-releases-9-new-claude-connectors-for-creative-tools-including-blender-and-adobe/
- Digital Production, Anthropic — патрон Blender: https://digitalproduction.com/2026/04/30/anthropic-funds-blender-ships-claude-connector/
- Официальный Blender MCP: https://projects.blender.org/lab/blender_mcp · https://www.blender.org/lab/mcp-server/
- Griptape, запуск официального сервера: https://docs.griptapenodes.com/en/stable/guides/mcp/servers/blender/
- Установка официального аддона, проблемы: https://zenn.dev/shintama/articles/blender-official-mcp-claude?locale=en
- ahujasid/blender-mcp: https://github.com/ahujasid/blender-mcp
- kevinbadi/blender-skills: https://github.com/kevinbadi/blender-skills
- Meshy MCP: https://github.com/meshy-dev/meshy-mcp-server · https://www.meshy.ai/mcp
- Сравнение text-to-3D 2026: https://learn.rundiffusion.com/ai-3d-model-generators/ · https://www.3daistudio.com/blog/best-3d-model-generation-apis-2026
- Hunyuan3D 3.1: https://replicate.com/tencent/hunyuan-3d-3.1 · https://github.com/tencent-hunyuan/hunyuan3d-2.1
- glTF Transform CLI: https://gltf-transform.dev/cli · https://github.com/donmccurdy/glTF-Transform
- gltfpack: https://github.com/zeux/meshoptimizer/tree/master/gltf
- KTX-Software: https://github.com/KhronosGroup/KTX-Software/releases
- three r186 GaussianSplat: https://radiancefields.com/three.js-merges-a-native-gaussian-splat-renderer-for-webgpu-in-r186 · https://github.com/mrdoob/three.js/releases/tag/r186
- Spark 2.0: https://www.worldlabs.ai/blog/spark-2.0 · https://sparkjs.dev/docs/new-features-2.0/
- Brush: https://github.com/ArthurBrussee/brush · https://radiancefields.com/gaussian-splatting-in-browser-brush
- Luma Flythroughs sunset: https://radiancefields.com/luma-ai-to-sunset-flythroughs-on-january-1-2026
- Экспорт сплатов, SPZ: https://medium.com/@Jamesroha/gaussian-splatting-a-complete-student-guide-to-3d-capture-in-2026-1195a6265870 · https://learn.poly.cam/hc/en-us/articles/42506758152084-Export-Gaussian-Splats-from-Polycam-to-Unreal-Engine
- splat-transform: https://github.com/playcanvas/splat-transform
- Remotion Agent Skills: https://www.remotion.dev/docs/ai/skills · https://github.com/remotion-dev/skills
- FFmpeg-скиллы: https://github.com/digitalsamba/claude-code-video-toolkit · https://github.com/MastroMimmo/ffmpeg-skill
- Manim-скиллы: https://github.com/adithya-s-k/manim_skill · https://github.com/Yusuke710/manim-skill
- Figma MCP для Claude Code: https://help.figma.com/hc/en-us/articles/39888612464151-Claude-Code-and-Figma-Set-up-the-MCP-server · https://www.builder.io/blog/figma-remote-mcp
- Spline V2 + MCP (20.08.2026): https://blog.spline.design/spline-v2 · https://thenewstack.io/spline-v2-mcp-agents/ · https://cgpress.org/archives/spline-v2-brings-ai-agents-webgpu-and-mcp-server.html
- Rive MCP: https://mcpservers.org/servers/rive-mcp · https://community.rive.app/c/announcements/rive-x-mcp-connect-rive-to-ai-tools
- Unicorn Studio: https://www.unicorn.studio/docs/ · https://www.unicorn.studio/docs/changelog/
- Изображения 2026: https://www.atlascloud.ai/blog/tips/2026-ai-image-api-benchmark-gpt-image-2-vs-nano-banana-2-pro-vs-seedream-5-0 · https://www.aifreeapi.com/en/posts/nano-banana-2-vs-midjourney-vs-gpt-image-vs-flux2
- FLUX.2 LoRA: https://fal.ai/models/fal-ai/flux-2/lora · https://docs.bfl.ml/flux_2/flux2_klein_training
- Видео 2026: https://www.buildmvpfast.com/api-costs/ai-video · https://modelslab.com/blog/api/veo-3-1-vs-kling-3-sora-2-ai-video-api-cost-2026
- Отключение Sora 2 API: https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation · https://developers.openai.com/api/docs/guides/video-generation
- Удаление фона: https://fal.ai/learn/tools/best-background-remover-apis-2026 · https://huggingface.co/briaai/RMBG-2.0
- Апскейл: https://www.topazlabs.com/api · https://letsenhance.io/blog/all/best-upscaler-apis/
- Next 16.2 Turbopack import attributes: https://nextjs.org/blog/next-16-2-turbopack
- chrome-devtools-mcp: https://github.com/ChromeDevTools/chrome-devtools-mcp
- Playwright visual comparisons: https://playwright.dev/docs/test-snapshots
- Claude Code hooks: https://code.claude.com/docs/en/hooks
- Claude Code sub-agents (поле `hooks` во фронтматтере): https://code.claude.com/docs/en/sub-agents
- web-quality-skills: https://github.com/addyosmani/web-quality-skills · ui-skills: https://github.com/ibelick/ui-skills · skills CLI: https://github.com/vercel-labs/skills
