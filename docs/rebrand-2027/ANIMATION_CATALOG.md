# ANIMATION_CATALOG — раздел A3 мега-промта

Дата: 10 сентября 2026. Ветка `redesign-2027`. Объект — Atlas Secure
(витрина: «VPS-ускоритель» + выделенные серверы).

Документ дополняет, а не повторяет:
`docs/01_ANIMATION_CATALOG.md` (75 приёмов, фаза 1),
`docs/ANIMATION_INVENTORY.md` (что есть на сайте),
`research/05_MOTION.md` (замер движения 21 сайта). Где приём уже был в
прежнем каталоге, стоит ссылка «прежн. №N», и описание не дублируется.

## Как читать таблицы

| Столбец | Значение |
|---|---|
| **Ред.** | редкость 1–5. 1 — шаблон, есть в каждом наборе Webflow; 5 — встречено в 1–2 местах за 2025–2026. Пометка **редкий** — ещё не стал шаблоном |
| **Цена** | стоимость по производительности 1–5. 1 — только композитор (`transform`/`opacity`); 3 — главный поток каждый кадр или один canvas 2D; 5 — отдельная GPU-сцена, компиляция шейдеров, сотни КБ |
| **Чем** | CSS — нативный CSS; GSAP; Motion — motion.dev; Three — Three.js WebGL; WebGPU — только WebGPU/TSL; WA — Web Audio |
| **Fallback** | что видит слабое устройство и что — при `prefers-reduced-motion: reduce` (RM) |
| **Atlas** | есть ли уже. «есть №N» — раздел 12 `src/app/graticule-home.css`; «старый корпус» — компонент в `src/components/brand/`, на новой главной не подключён; «нет» — нет в коде (проверено grep по `src/`) |
| **Смысл для Atlas** | что приём может изображать у продукта про скорость, задержку, канал, шифрование, смену страны — или «не подходит» |

Исходное ограничение из `research/05_MOTION.md`, которое действует на
весь каталог: **по прокрутке Atlas уже даёт 491 при медиане 330**, в
покое 0,03 при нуле у 14 из 20 референсов. Значит, любой новый
scroll-linked приём должен кого-то вытеснить, а холостой — почти
запрещён. Подробный расчёт — в разделе «Бюджет движения» в конце.

---

## 1. Preloader / intro

| № | Приём | Где увидеть | Ред. | Цена | Чем | Fallback / RM | Atlas | Смысл для Atlas |
|---|---|---|---|---|---|---|---|---|
| 1.1 | **Счётчик 0→100%** перед входом | [goodgrowth.com](https://goodgrowth.com/) (цифры с «0» вместо «O» под логотип) | 1 | 1 | CSS / GSAP | число сразу 100 / без счётчика | нет | **не подходит.** Счётчик загрузки врёт: он показывает таймер, а не загрузку. Для продукта «измерено, а не заявлено» — прямое противоречие. Замена — авторский приём A1 |
| 1.2 | **Boot-sequence** «вставьте диск», вращающийся диск, звук, расписанный по часам Web Audio | [goodgrowth.com](https://goodgrowth.com/), [разбор Codrops, 27.08.2026](https://tympanus.net/codrops/2026/08/27/goodgrowth-boot-sequences-spinning-discs-and-the-art-of-the-portfolio/) | 4 **редкий** | 2 | GSAP + WA | пропуск интро / RM: сразу финальный кадр, звук выключен | нет | не на витрину: заставляет ждать. Годится как одноразовая сцена первого входа в кабинет («ключ создаётся») — там ожидание настоящее |
| 1.3 | **Прелоадер показывает типы контента**, которые сейчас грузятся | [The Lookback, Codrops 03.03.2026](https://tympanus.net/codrops/2026/03/03/the-lookback-a-digital-capsule-for-better-off-studios-creative-past/) | 3 | 1 | CSS / GSAP | список без анимации | нет | частично: честная версия — показывать реальные ресурсы из Resource Timing. См. A1 |
| 1.4 | **Миниатюры веером → спираль внутрь** (угол и радиус твинятся раздельно, без пути) | [Goodgrowth, тот же разбор](https://tympanus.net/codrops/2026/08/27/goodgrowth-boot-sequences-spinning-discs-and-the-art-of-the-portfolio/) | 4 **редкий** | 2 | GSAP | статичная сетка | нет | подходит как жест: 19 точек стран сходятся к ближайшему узлу. Только один раз, ≤900 мс |
| 1.5 | **Логотип → навигация** (знак в центре уезжает в шапку) | [не проверено: живого примера 2025–26 не нашёл] | 1 | 1 | View Transitions / GSAP Flip | знак сразу в шапке | нет | не подходит: логотип Atlas не меняется (CLAUDE.md), а жест шаблонный |
| 1.6 | **Нулевой прелоадер**: сервер отдаёт конечный кадр, вход — `@starting-style` + scroll-triggered анимация | [Chrome: scroll-triggered animations (Chrome 145)](https://developer.chrome.com/blog/scroll-triggered-animations) | 3 | 1 | CSS | без поддержки — страница уже в конечном виде | частично: 12.1 «базовые состояния» уже гарантируют конечный кадр без скрипта; `@starting-style` и `animation-trigger` в коде нет | **ядро.** LCP не ждёт анимацию. Для сайта про скорость прелоадер — самопризнание в медленности |

## 2. Hero-экран

| № | Приём | Где увидеть | Ред. | Цена | Чем | Fallback / RM | Atlas | Смысл для Atlas |
|---|---|---|---|---|---|---|---|---|
| 2.1 | **Шейдерный фон: dithering / mesh gradient** из готовой библиотеки | [Paper Shaders](https://shaders.paper.design/), [Dithering](https://shaders.paper.design/dithering), [Mesh Gradient](https://shaders.paper.design/mesh-gradient) | 1 | 3 | WebGL (zero-dep) | статичный кадр / RM: `speed=0` | нет | mesh gradient — **не подходит** (SaaS-клише 2025–26). Двухцветный dithering — возможен как «шум канала», но это второй холст: запрещено правилом «один холст» |
| 2.2 | **ASCII / dithering в реальном времени** на шейдере, палитры | [Efecto, Codrops 04.01.2026](https://tympanus.net/codrops/2026/01/04/efecto-building-real-time-ascii-and-dithering-effects-with-webgl-shaders/) | 2 | 3 | WebGL | статичная картинка | старый корпус: `brand/AsciiWall.tsx` | к 2026 ASCII стал модой; держать только если знаки что-то значат (например, реальные адреса узлов) |
| 2.3 | **Shape-aware ASCII**: глиф подбирается по форме, а не по яркости | [Codrops 04.09.2026](https://tympanus.net/codrops/2026/09/04/beyond-the-luminance-ramp-a-shape-aware-ascii-renderer-in-three-js/) | 5 **редкий** | 4 | Three | растровый снимок | нет | нет объекта, который стоило бы так рисовать. Не подходит |
| 2.4 | **Поле частиц/штрихов, отвечающее курсору** | [Canvas Grid Mouse Effect, CodePen 28.04.2026](https://codepen.io/creativeocean/full/emBOove) | 2 | 3 | canvas 2D / WebGL | статичное поле / RM: не запускается | **есть**: `graticule/SignalField.tsx` (~2000 штрихов) | уже работает как «стружка над магнитом»: поле показывает направление сигнала. Сохранить; развитие — A2 |
| 2.5 | **Кинетический заголовок по ширине колонки** | [matvoyce.tv](https://matvoyce.tv/) (GSAP SOTM, февраль 2025, [список SOTY](https://gsap.com/SOTY-2025/)) | 3 | 1 | CSS | обычный набор | **есть**: `--gh-k-*`, выключка без JS | это авторская черта Atlas: ни у одного из 18 разобранных сайтов строки не выключены. Сохранить |
| 2.6 | **Видео/карта внутри букв** (`background-clip: text`) | [не проверено: живого примера 2025–26 не нашёл] | 2 | 2 | CSS | сплошная заливка | нет (прежн. №14) | «внутри слова идёт поток». Возможен, но это второй зрительный объект первого экрана рядом с полем — перегруз |
| 2.7 | **Текст рассыпается в пыль** (MSDF + шум + частицы + селективный bloom) | [Gommage, Codrops 28.01.2026](https://tympanus.net/codrops/2026/01/28/webgpu-gommage-effect-dissolving-msdf-text-into-dust-and-petals-with-three-js-tsl/), [Text Destruction, 22.07.2025](https://tympanus.net/codrops/2025/07/22/interactive-text-destruction-with-three-js-webgpu-and-tsl/) | 4 | 5 | WebGPU / TSL | обычный текст | нет | метафора «просадка рассыпает картинку». Цена несоразмерна; дешёвый аналог — `PixelDissolve` из `pixel/effects.tsx` |
| 2.8 | **3D-объект продукта, вращается по прокрутке** | [Lando Norris — Awwwards SOTY 2025](https://www.awwwards.com/sites/lando-norris), [кейс OFF+BRAND](https://www.itsoffbrand.com/our-work/lando-norris) | 2 | 5 | WebGL + Rive | постер | нет | **не подходит**: у ускорителя нет физического объекта. Стойка VDS — единственный кандидат, и то только на `/vds` |
| 2.9 | **Интерактивный 3D-кластер** (икосаэдр → кластер, шум, пост) | [Codrops 12.08.2026](https://tympanus.net/codrops/2026/08/12/creating-an-interactive-3d-cluster-with-three-js-tsl-and-three-start/) | 3 | 5 | WebGPU / TSL | статичный рендер | нет | «узлы сети». Смысл есть, но это типовой «абстрактный 3D-блоб» 2026 года — клише в зародыше |

## 3. Scroll-driven / scrollytelling

| № | Приём | Где увидеть | Ред. | Цена | Чем | Fallback / RM | Atlas | Смысл для Atlas |
|---|---|---|---|---|---|---|---|---|
| 3.1 | **Закреплённая сцена со сменой шагов** | [Sticky Grid Scroll, Codrops 02.03.2026](https://tympanus.net/Tutorials/StickyGridScroll/) | 1 | 1 | CSS `sticky` + `view()` | блоки подряд | **есть**: манифест (`.gh-beat` sticky), три шага №9 | сохранить. Не добавлять новых: сцен с закреплением уже три |
| 3.2 | **Секвенция 3D-сцен по прокрутке**, неактивные сцены не рендерятся вовсе | [shader.se](https://shader.se), [разбор Codrops 19.05.2026](https://tympanus.net/codrops/2026/05/19/80s-business-tech-seamless-scene-transitions-inside-shader-ses-scroll-driven-webgpu-pipeline/) | 4 | 5 | R3F + TSL (WebGPU/WebGL) + Lenis | статичные кадры | нет | не на главную. Урок полезен сам по себе: вне кадра проход рендера пропускается целиком — так уже сделан `SignalTrace` |
| 3.3 | **Image sequence на canvas** (Apple-приём: кадр = позиция прокрутки) | [ribbit.dk](https://ribbit.dk) (GSAP SOTM, декабрь 2025; [разбор iliketoplay](https://iliketoplay.dk/insights/scoll-animations/)), [GSAP Vault: туториал](https://gsapvault.com/blog/scroll-image-sequence-tutorial) | 1 | 4 (сотни кадров трафика) | GSAP + canvas | постер / RM: один кадр | нет | не подходит: нечего снимать покадрово, и это второй холст |
| 3.4 | **Горизонталь внутри вертикали** | [Horizontal Parallax Gallery, Codrops 19.02.2026](https://tympanus.net/Tutorials/HorizontalParallaxGallery/index2.html) | 1 | 1 | CSS `scroll()` | вертикальный список | **есть** №7 (состав подписки) | сохранить одну. Вторую горизонталь не заводить |
| 3.5 | **Камера по пути из Blender** | [Curve Gallery, Codrops 07.07.2026](https://tympanus.net/Tutorials/CurveGallery/) | 3 | 4 | Three + GSAP | слайды | нет | «пролёт по маршруту пакета». Смысл точный, цена высокая; кандидат для `/infrastructure`, не для главной |
| 3.6 | **SVG-карта по прокрутке**: маршрут вычерчивается, точки загораются | [Scroll Map, Codrops 21.05.2026](https://tympanus.net/Tutorials/ScrollMap/), [статья](https://tympanus.net/codrops/2026/05/21/creating-scroll-driven-svg-map-animations-with-gsap/) | 2 | 1 | GSAP или CSS `view()` | готовая карта | частично: №11 контур материков | маршрут «читатель → ближайший узел» по `CLOSEST` из `locations.ts`. Можно без GSAP, на `stroke-dashoffset` |
| 3.7 | **SVG-график по прокрутке**: кривая растёт с чтением | [Scroll Graph, Codrops 21.05.2026](https://tympanus.net/Tutorials/ScrollGraph/) | 3 | 1 | GSAP / CSS | готовый график | нет | **сильный**: график задержки «без/с ускорителем». Цвет — только у измеренной кривой (`--g-chart`). Нужны реальные данные, иначе нарушение правила «числа подтверждены кодом» |
| 3.8 | **SVG-маска между сценами** (следующая вскрывает предыдущую) | [SVG Mask Scroll Transition, Codrops 11.03.2026](https://tympanus.net/Tutorials/SVGMaskScrollTransition/) | 2 | 2 | GSAP ScrollTrigger | резкая смена | частично: №4 шторка, №6 косой срез | достаточно уже сделанного; ещё одна маска — повтор |
| 3.9 | **Telescope zoom**: прокрутка «влетает» в точку | [Telescope Zoom, Codrops 29.10.2025](https://tympanus.net/Tutorials/TelescopeZoom/) | 3 | 2 | GSAP ScrollSmoother | статичный кадр | нет | «влёт в узел»: точка страны на карте становится кадром города. Один раз на сайт |
| 3.10 | **Infinite canvas / pan-anywhere** как навигация | [Infinite Canvas, Codrops 07.01.2026](https://tympanus.net/Tutorials/InfiniteCanvas/) | 3 | 3 | JS + CSS transform | сетка | нет | не подходит: у витрины линейный рассказ, а человек пришёл за ценой |
| 3.11 | **CSS scroll-triggered** (`timeline-trigger` + `animation-trigger`): анимация по времени, запущенная порогом прокрутки, без IntersectionObserver | [Chrome for Developers](https://developer.chrome.com/blog/scroll-triggered-animations), [CSS-Tricks, first look](https://css-tricks.com/css-scroll-triggered-animations-first-look/) | 4 **редкий** | 1 | CSS (Chromium 145+) | без поддержки — конечный кадр | нет | **важен для бюджета**: разовое событие вместо scrub. «Пинг отправлен» при входе показаний в кадр. Такое движение не растёт с прокруткой и не раздувает метрику 491 |
| 3.12 | **`scroll-state()`**: стиль для прилипшего/примагниченного | [Chrome: scroll-state queries](https://developer.chrome.com/blog/css-scroll-state-queries), [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Conditional_rules/Container_scroll-state_queries) | 4 | 1 | CSS (Chromium 133+, не Baseline) | без смены стиля | нет | шапка переворачивается в плиту только в прилипшем состоянии; в ленте состава на телефоне примагниченная ячейка — инверсией |
| 3.13 | **Бесконечная прокрутка-петля** | [Never Ending Story, Codrops 28.05.2026](https://tympanus.net/codrops/2026/05/28/the-never-ending-story-building-a-seamless-infinite-scroll-experience-with-gsap-lenis/) | 3 | 2 | GSAP + Lenis | конечная страница | нет | **не подходит**: у витрины есть конец — цена и кнопка |

## 4. Текст

| № | Приём | Где увидеть | Ред. | Цена | Чем | Fallback / RM | Atlas | Смысл для Atlas |
|---|---|---|---|---|---|---|---|---|
| 4.1 | **SplitText** (строки/слова/знаки, маски, автопересборка при resize) | [AutoSplit + ScrollTrigger, CodePen GSAP](https://codepen.io/GreenSock/pen/GggpRoB), [5 демо на бесплатных плагинах, Codrops 14.05.2025](https://tympanus.net/codrops/2025/05/14/from-splittext-to-morphsvg-5-creative-demos-using-free-gsap-plugins/) | 1 | 2 | GSAP (весь GSAP бесплатен с 2025) | целая строка | **есть**: №13 набор по знакам, `SplitText` в effects | шаблон. Держать ровно в одном месте (финал), как сейчас |
| 4.2 | **Нативный стаггер `sibling-index()`** | [ICS MEDIA, 2026](https://ics.media/en/entry/260116/), [SitePoint](https://www.sitepoint.com/css-siblingindex-and-siblingcount-native-list-staggering-without-javascript/) | 3 | 1 | CSS (Chrome 138, Safari 26.2, Firefox 154 — Baseline с 18.08.2026) | всё появляется разом | нет: №13 держит индекс в инлайн `--i` | техническая замена: убрать `--i` из разметки. Движения не добавляет |
| 4.3 | **Ось веса по прокрутке/курсору** | [Weight following mouse, CodePen](https://codepen.io/freedommayer/pen/OJBbzVg) | 2 | 2 (раскладка) | CSS `font-variation-settings` | постоянный вес | **есть**: №4, №6 (`gh-weight` 500→800) | сейчас вес растёт у каждого заголовка сцены — один приём повторён везде. Оставить в одном месте. См. «Бюджет» |
| 4.4 | **Scramble / decode** | [GSAP ScrambleText, на бесплатных плагинах](https://tympanus.net/codrops/2025/05/14/from-splittext-to-morphsvg-5-creative-demos-using-free-gsap-plugins/) | 1 | 1 | GSAP / свой | готовый текст | **есть**: `Scramble`, `brand/ScrambleLabel.tsx` | только на коротких метках (правило уже есть). Смысл — «расшифровка» |
| 4.5 | **Бегущая строка со скоростью от прокрутки** | [On-Scroll Text Motion, Codrops 19.12.2025](https://tympanus.net/Development/ScrollTextMotion/) | 1 | 1 | CSS / rAF | равномерный ход / RM: стоит | **есть**: лента фактов (12.3), `useMarqueeFlow` | сохранить: это одна из двух холостых вещей, числа в ней из кода |
| 4.6 | **Двойная волна текста** (две колонки встречными синусоидами) | [Dual Wave Text, Codrops 15.01.2026](https://tympanus.net/Tutorials/DualWaveTextAnimation/) | 3 | 2 | GSAP ScrollTrigger + ScrollSmoother | две колонки | нет | не подходит: декоративно, смысла «канала» не несёт |
| 4.7 | **3D-текст по прокрутке** (строки на цилиндре/в перспективе) | [3D Text Scroll, Codrops 04.11.2025](https://tympanus.net/Tutorials/3DTextScroll/) | 2 | 1 | CSS 3D + GSAP | плоский текст | нет | не подходит: ломает выключку по колонке, авторскую черту |
| 4.8 | **Строка искажается под курсором** (линии текста гнутся) | [Line Text Distortion, CodePen 29.05.2025](https://codepen.io/blacklead-studio/full/azOzePJ) | 3 | 2 | canvas / SVG | ровная строка | нет | «помеха на линии» — возможен у слова «просадка», если заменит, а не добавит |
| 4.9 | **Доступный WebGL-текст** (DOM-текст остаётся для SEO и чтецов) | [Accessible WebGL Text, Codrops 05.06.2025](https://tympanus.net/Tutorials/AccessibleWebGLText) | 3 | 3 | Three | DOM-текст | нет | правило, а не приём: если текст когда-нибудь уйдёт в холст, DOM остаётся источником |
| 4.10 | **Контур + заливка** (`-webkit-text-stroke`), контур заливается прокруткой | [не проверено: отдельного живого примера 2025–26 не искал] | 2 | 1 | CSS | залитый текст | **есть**: №2, 12.4 | сохранить |
| 4.11 | **Строка печатается по знакам** (терминал) | [не проверено] | 1 | 1 | JS | готовый текст | старый корпус: `brand/Terminal.tsx` | клише «хакерского» жанра, для ускорителя интернета тон неверный. На новую главную не переносить |

## 5. Изображения и медиа

| № | Приём | Где увидеть | Ред. | Цена | Чем | Fallback / RM | Atlas | Смысл для Atlas |
|---|---|---|---|---|---|---|---|---|
| 5.1 | **Квадратная линза с RGB-сдвигом** за курсором | [Pointer Square Lens, Codrops 25.08.2026](https://tympanus.net/Tutorials/PointerSquareLensDistortion), [статья](https://tympanus.net/codrops/2026/08/25/building-a-mouse-following-square-lens-effect-with-three-js-and-glsl/) | 4 **редкий** | 4 | Three / GLSL | без линзы / RM и coarse: не создаётся | частично: `graticule/InvertLens.tsx` — инверсия `difference` без искажения | Atlas-версия лучше: инверсия бесплатна и не требует холста. Искажение не добавлять |
| 5.2 | **Image trail за курсором** (с гравитацией и отскоком) | [Gravity mouse trail, Codrops 20.05.2026](https://tympanus.net/codrops/2026/05/20/made-with-gsap-building-a-fun-gravity-based-mouse-trail/) | 1 | 2 | GSAP | без следа | частично: `PixelTrail` в effects | **не подходит**: фотографий нет, и trail — клише портфолио 2019–2026 |
| 5.3 | **Пиксельная проявка изображения** | [Pixel Image Effect, 02.02.2026](https://pixelimageeffect.pages.dev/) | 2 | 3 | Three | изображение сразу | частично: `PixelDissolve` в effects | «картинка догружается» — наглядно показывает, что делает плохой канал. Лучше CSS-маской по сетке, без холста |
| 5.4 | **Datamosh в реальном времени** (кадр «течёт» блоками, как битое видео) | [Codrops 02.09.2026](https://tympanus.net/codrops/2026/09/02/breaking-the-frame-building-a-real-time-datamosh-effect-with-three-js/) | 5 **редкий** | 4 | Three | целый кадр | нет | **самый точный образ просадки**: так выглядит видеозвонок на плохом канале. Дешёвая CSS-версия — авторский A4 |
| 5.5 | **Изображение распускается на нити** | [Infinite Loom, Codrops 05.09.2026](https://tympanus.net/codrops/2026/09/05/building-an-infinite-loom-unravelling-images-into-threads-with-three-js/) | 5 **редкий** | 4 | Three | изображение | нет | «канал из нитей». Красиво, но фото нет. Не подходит |
| 5.6 | **Перелайт фото по карте глубины** | [Codrops 19.08.2026](https://tympanus.net/codrops/2026/08/19/relighting-images-with-depth-maps-and-three-js/) | 4 | 3 | Three | плоское фото | нет | только если появятся реальные фото стоек VDS. Сейчас не подходит |
| 5.7 | **Видео, синхронизированное с прокруткой**, с «замочной скважиной» | [Scroll-Synced Video + Keyhole, CodePen 12.06.2025](https://codepen.io/luis-lessrain/pen/zxGjErP) | 2 | 3 | GSAP + video | постер | нет | не подходит: видео нет, и автоплей противоречит правилу «без автовоспроизводимого видео» (прежний каталог) |
| 5.8 | **Liquid glass**: преломление через `feDisplacementMap` в `backdrop-filter` | [kube.io: refraction with CSS and SVG](https://kube.io/blog/liquid-glass-css-svg/) | 1 (к осени 2026 — везде) | 3 | CSS + SVG | Safari/Firefox — просто blur | нет | **не подходит**: displacement работает только в Chromium, а на белой бумаге без поднятых плоскостей стеклу нечего преломлять |
| 5.9 | **Рентген двумя сценами**: жидкая маска открывает вторую сцену под первой | [Fluid X-Ray Reveal, Codrops 23.03.2026](https://tympanus.net/codrops/2026/03/23/building-a-dual-scene-fluid-x-ray-reveal-effect-in-three-js/) | 4 **редкий** | 4 | Three | две картинки рядом | нет | **шифрование**: под курсором видно, как ту же фразу видит провайдер. Дешёвая версия без холста — авторский A3 |

## 6. Навигация и переходы страниц

| № | Приём | Где увидеть | Ред. | Цена | Чем | Fallback / RM | Atlas | Смысл для Atlas |
|---|---|---|---|---|---|---|---|---|
| 6.1 | **Cross-document View Transitions** (`@view-transition { navigation: auto }`) | [CSS-Tricks: gotchas](https://css-tricks.com/cross-document-view-transitions-part-1/) | 2 | 1 | CSS (Chrome 126+, Safari 18.2+; Firefox — источники расходятся) | мгновенная смена | **объявлено, но почти не работает**: `src/app/brand.css:1448`. В Next App Router переход по `<Link>` — soft navigation внутри документа, cross-document переход срабатывает только на жёсткой перезагрузке | либо удалить правило, либо перейти на 6.2. Сейчас это мёртвый код, который создаёт иллюзию, что переходы есть |
| 6.2 | **React `<ViewTransition>` в Next.js 16** (`experimental.viewTransition`, `unstable_ViewTransition`) | [демо Next 16.2+](https://github.com/vito8916/Nextjs-ViewTransition-Demo), [обзор React 19.2 / Next 16](https://www.digitalapplied.com/blog/react-19-2-view-transitions-animate-navigation-nextjs-16) | 2 | 1 | React + CSS | мгновенная смена | нет: `PageTransition.tsx` намеренно убрал `startViewTransition`, он держал кадр замороженным | правильный путь для Next, но API экспериментальный. Брать только для общего элемента (карточка ступени → конфигуратор `/vds`), не для всей страницы |
| 6.3 | **Element-scoped View Transitions** (`Element.startViewTransition()`), остальная страница интерактивна | [Chrome 147](https://developer.chrome.com/blog/element-scoped-view-transitions), [MDN](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API/Using_element-scoped) | 5 **редкий** | 1 | JS + CSS (только Chromium 147+) | мгновенная смена | нет | **смена срока/тарифа** в `PeriodSelector` и **смена страны** в атласе: меняется только блок, шапка и прокрутка живут. Точно в смысле «переключение без перезагрузки» |
| 6.4 | **Barba.js + GSAP**, свои переходы | [Astro + Barba, Codrops 08.04.2026](https://tympanus.net/codrops/2026/04/08/creating-custom-page-transitions-in-astro-with-barba-js-and-gsap/) | 2 | 2 | Barba + GSAP | обычная навигация | нет | не подходит стеку: Barba воюет с роутером Next |
| 6.5 | **Холст, переживающий переход** (WebGPU-канва не пересоздаётся между страницами) | [Persistent Page Transitions, Codrops 30.06.2026](https://tympanus.net/codrops/2026/06/30/building-persistent-page-transitions-with-webgpu-and-vanilla-javascript/) [содержимое статьи не прочитано: сбой загрузки] | 4 **редкий** | 3 | WebGPU + JS | обычный переход | нет | «прибор не выключается при переходе»: `SignalTrace` в корневом layout продолжает писать кадры через смену страницы. Холст остаётся одним — правило соблюдено |
| 6.6 | **Flip-переход из галереи в деталь** | [Infinite Scroll GSAP Gallery + Flip, Codrops 30.07.2026](https://tympanus.net/Tutorials/InfiniteScrollGSAPGallery/) | 2 | 2 | GSAP Flip | мгновенно | нет | ступень VDS → конфигуратор (прежн. №32/52). Выбрать одно из 6.2 или 6.6, не оба |
| 6.7 | **Асинхронные переходы на чистом JS** | [Codrops 26.02.2026](https://tympanus.net/codrops/2026/02/26/building-async-page-transitions-in-vanilla-javascript/) | 2 | 2 | JS | обычная навигация | нет | не нужен при 6.2 |
| 6.8 | **Полноэкранное меню на шейдере** | [не проверено: живого примера 2025–26 не нашёл] | 2 | 4 | Three | обычное меню | нет | не подходит: меню из `nav.ts` короткое, шейдер в нём — украшение |

## 7. Микроинтеракции

| № | Приём | Где увидеть | Ред. | Цена | Чем | Fallback / RM | Atlas | Смысл для Atlas |
|---|---|---|---|---|---|---|---|---|
| 7.1 | **Магнитная кнопка** | Osmo — Community Pick [GSAP SOTY 2025](https://gsap.com/SOTY-2025/) | 1 | 1 | GSAP `quickTo` | обычная кнопка | **есть**: `Magnetic`, одна на сайт | шаблон. Держать одну, как записано |
| 7.2 | **Кастомный курсор-трейлер** | [GSAP Cursor Trailer, CodePen 31.08.2025](https://codepen.io/thingbynemanja/full/ogjaaNE) | 1 | 2 | GSAP | системный курсор | частично: `brand/Cursor.tsx` смонтирован в корневом layout, работает только на `.b-root`; на новой главной — `InvertLens` поверх системного курсора | **клише**, и CLAUDE.md его запрещает. Линза-инвертор — правильная замена |
| 7.3 | **Картинка у курсора при наведении на пункт списка** | [Show cursor image on hover, CodePen GSAP](https://codepen.io/GreenSock/full/PwqrzeG) | 1 | 1 | GSAP | без картинки | нет | не подходит: картинок нет |
| 7.4 | **Пружина на чистом CSS** (`linear()` из выборки пружины) | [Josh W. Comeau: Springs in native CSS](https://www.joshwcomeau.com/animation/linear-timing-function/) | 3 | 1 | CSS | обычная кривая | нет (`linear(` в `src/` нет) | токен easing `--g-e-spring` для отклика на нажатие. Заменяет JS-пружины там, где они только ради кривой |
| 7.5 | **Наведение = инверсия материала** | [не нашёл внешнего референса — авторская черта] | 3 | 1 | CSS | мгновенно | **есть**: 12.4 (`.gh-tier`, `.gh-cell`) | сохранить: единственный отклик, совместимый с правилом «цвет = измерено» |
| 7.6 | **3D-трубки за курсором** | [Tubes Cursor, CodePen 23.09.2025](https://codepen.io/soju22/full/qEbdVjK) | 2 | 4 | Three | нет | нет | **клише** 2025–26 и второй холст. Не подходит |
| 7.7 | **Фонарик по сетке** | [Canvas Grid Mouse Effect](https://codepen.io/creativeocean/full/emBOove) | 2 | 2 | CSS-переменные | ровная сетка | есть в effects (`useGridTorch`), на новой главной не используется | не возвращать: поле сигнала уже отвечает руке |
| 7.8 | **Вспышка из точки нажатия** | [не проверено] | 2 | 1 | CSS | без вспышки | есть в effects (`usePixelBurst`) | «пакет ушёл». Можно на кнопке «Скопировать ключ» в кабинете, где действие реально уходит |

## 8. Layout-анимации

| № | Приём | Где увидеть | Ред. | Цена | Чем | Fallback / RM | Atlas | Смысл для Atlas |
|---|---|---|---|---|---|---|---|---|
| 8.1 | **FLIP с коррекцией искажения масштаба** (`layout`, `layoutId`) | [Motion: layout animations](https://motion.dev/docs/react-layout-animations) | 2 | 2 | Motion | мгновенная перестройка | нет | при смене срока цены переставляются. Но это +~30 КБ библиотеки ради одного места: 6.3 решает то же нативно |
| 8.2 | **GSAP Flip в связке с Three** | [Three JS and FLIP on Scroll, CodePen GSAP](https://codepen.io/GreenSock/pen/GgpMeZp) | 3 | 3 | GSAP Flip | без перехода | нет | не нужен: Three на главной нет |
| 8.3 | **Эластичная сетка**: колонки отстают друг от друга по скорости прокрутки | [Elastic Grid Scroll, Codrops 03.06.2025](https://tympanus.net/Tutorials/ElasticGridScroll/) | 3 | 2 | GSAP ScrollSmoother | обычная сетка | нет | **смысл есть**: отставание колонки = задержка. Но это scroll-linked движение, то есть плюс к метрике 491. Только взамен |
| 8.4 | **Липкая сетка перестраивается, пока кадр держится** | [Sticky Grid Scroll](https://tympanus.net/Tutorials/StickyGridScroll/) | 2 | 1 | CSS | обычная сетка | частично: №7–8 | достаточно |
| 8.5 | **Стопка/поворот карточек на прокрутке** | [3D Image Rotations on Scroll, Codrops 18.06.2026](https://tympanus.net/Development/RotatingOnScrollAnimations/) | 2 | 1 | CSS 3D + GSAP | список | нет (прежн. №46 для `/vds`) | ступени VDS колодой — на `/vds`, не на главной |
| 8.6 | **Куб-галерея** | [Webflow-демо, Codrops 26.05.2026](https://gsap-cubic-scrollable-image-gallery.webflow.io/) | 2 | 1 | GSAP | лента | нет (прежн. №47) | альтернатива 8.5; брать одно |
| 8.7 | **Переход к `height: auto`** (`interpolate-size`, `::details-content`) | [MDN: interpolate-size](https://developer.mozilla.org/en-US/docs/Web/CSS/interpolate-size) | 3 | 1 | CSS (Chromium) | мгновенное раскрытие | **нет**: запланировано прежн. №66/72, в коде отсутствует | FAQ и спецификация сервера. Приём незаметный и дешёвый — брать |

## 9. 3D и WebGPU-only

| № | Приём | Где увидеть | Ред. | Цена | Чем | Fallback / RM | Atlas | Смысл для Atlas |
|---|---|---|---|---|---|---|---|---|
| 9.1 | **Compute-частицы** (500 тыс. на GPU) | [three.js webgpu_compute_particles](https://threejs.org/examples/webgpu_compute_particles.html) | 2 (как демо), 4 (в продакшне) | 5 | WebGPU / TSL | canvas 2D со снижением плотности | нет | «поток пакетов». Поле сигнала уже делает это на 2000 штрихов без WebGPU. Переход оправдан только если поле должно вырасти на порядок, а такой задачи нет |
| 9.2 | **Gaussian Splats**, стриминг с LoD | [Spark](https://sparkjs.dev/), [Spark 2.0 — World Labs, апрель 2026](https://www.worldlabs.ai/blog/spark-2.0) | 3 | 5 | Three + Spark (WebGL2) | постер-снимок | нет | только **реальный** зал дата-центра для `/vds`, снятый своими руками. Сгенерированный или стоковый splat — ложь, прямое противоречие правилу «числа и факты подтверждены» |
| 9.3 | **TSL-пост-обработка** (bloom через `RenderPipeline`, r183) | [three.js webgpu bloom](https://threejs.org/examples/webgpu_postprocessing_bloom.html) | 2 | 4 | WebGPU / TSL | без пост-обработки | нет | не подходит: bloom — это свечение, а корпус Atlas — бумага и краска |
| 9.4 | **Светящиеся трубки на GPU** | [Lit GPU Tubes, Codrops 07.09.2026](https://tympanus.net/codrops/2026/09/07/drawing-with-light-an-exploration-of-lit-gpu-tubes-with-tsl-and-webgpu/) | 4 | 4 | WebGPU / TSL | SVG-линии | нет | «трасса канала». Для `/infrastructure` |
| 9.5 | **Анимированные сетевые пути на MeshLine** (маска по UV, геометрия неподвижна) + щит Френеля | [cerebrium.ai](https://cerebrium.ai/), [разбор Codrops 23.07.2026](https://tympanus.net/codrops/2026/07/23/building-cerebrium-making-serverless-infrastructure-tangible/) | 3 | 4 | Three (WebGL + GLSL) | статичная схема | нет | **ближайший по смыслу референс**: инфраструктура, сделанная осязаемой. Главный урок — ниже, в выводах: команда **ушла с WebGPU/TSL на WebGL**, потому что компиляция узлов TSL на старте занимала около 20 секунд |
| 9.6 | **Физика Rapier** (пиксели видео падают вокселями) | [Codrops 05.01.2026](https://tympanus.net/codrops/2026/01/05/how-to-create-a-pixel-to-voxel-video-drop-effect-with-three-js-and-rapier/) | 3 | 5 | Three + Rapier (WASM) | статичный кадр | нет | не подходит: физика «живых объектов» ничего не говорит о канале |
| 9.7 | **Бесконечная сетка из жидкого стекла** | [Codrops 08.09.2026](https://tympanus.net/codrops/2026/09/08/building-an-infinite-liquid-glass-grid-with-three-js-webgpu-and-tsl/) | 3 | 5 | WebGPU / TSL | плоская сетка | нет | не подходит (см. 5.8) |
| 9.8 | **Мир/глобус на WebGPU** | [False Earth, Codrops 21.04.2026](https://tympanus.net/codrops/2026/04/21/false-earth-from-webgl-limits-to-a-webgpu-driven-world/) | 3 | 5 | WebGPU | плоская карта | нет (карта точками `PresenceMap`) | **клише ниши**: 3D-глобус со светящимися дугами — первый кадр половины VPN-сайтов. Карта точками честнее и дешевле |
| 9.9 | **Процедурная геометрия, инстансы со спрайтами** | [Codrops 11.08.2026](https://tympanus.net/codrops/2026/08/11/exploring-procedural-geometry-with-three-js-and-webgpu/) | 3 | 4 | WebGPU | — | нет | не подходит |
| 9.10 | **Мини-мир как сайт** (WebGL-планета с доставкой) | [Messenger — Awwwards](https://www.awwwards.com/sites/messenger) (Developer SOTY 2025) | 5 | 5 | Three | — | нет | не подходит: игра вместо покупки. Упомянут как планка жанра |

## 10. Звук и сенсоры

| № | Приём | Где увидеть | Ред. | Цена | Чем | Fallback / RM | Atlas | Смысл для Atlas |
|---|---|---|---|---|---|---|---|---|
| 10.1 | **Синтезированные UI-сигналы** (17 сигналов, <5 КБ, без файлов) | [cuelume.dev](https://cuelume.dev/) | 3 | 1 | WA | тишина. Про учёт mute и RM в документации ничего нет — проверять самим | нет | **только opt-in**, только одно событие: «соединение установлено» в кабинете. На витрине звук по умолчанию выключен и не предлагается навязчиво |
| 10.2 | **Звук, расписанный по часам Web Audio**, а не `play()` в кадре | [Goodgrowth](https://tympanus.net/codrops/2026/08/27/goodgrowth-boot-sequences-spinning-discs-and-the-art-of-the-portfolio/) | 4 | 1 | WA | тишина | нет | техническое правило на случай 10.1: иначе звук заикается на счёте |
| 10.3 | **Процедурный звук от энергии визуала** | [Volatile Nexus](https://dasprinzip.com/tinker/day42/), [разбор Codrops 31.08.2026](https://tympanus.net/codrops/2026/08/31/volatile-nexus-tinkering-with-glass-caustics-cubes-and-sound-in-three-js/) | 5 **редкий** | 3 | WA + Three | тишина | нет | «слышно, как идёт канал»: тон от длительности кадра (`SignalTrace`). Эксперимент, не продакшн |
| 10.4 | **Гироскоп на телефоне** (параллакс, наклон поля) | [MDN: `DeviceOrientationEvent.requestPermission()`](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/requestPermission_static) | 2 | 2 | JS | неподвижно. На iOS разрешение только по жесту пользователя | нет | поле сигнала на телефоне отвечает наклону вместо курсора. Цена — лишний диалог разрешения; только по кнопке, не на загрузке |
| 10.5 | **Network Information API** (`effectiveType`, `rtt`, `downlink`, `saveData`) | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API) | 5 **редкий** как приём | 1 | JS (только Chromium, не Baseline) | ничего не показывать | нет (`LivePing` меряет сам) | **прямой смысл**: страница знает класс соединения читателя. Значения браузер огрубляет [степень огрубления не проверена] — показывать только как «оценка браузера», не как замер |
| 10.6 | **Compute Pressure / CPU Performance API**: тир устройства и давление в реальном времени | [Chrome: Compute Pressure](https://developer.chrome.com/docs/web-platform/compute-pressure), [New in Chrome 152](https://developer.chrome.com/blog/new-in-chrome-152) | 5 **редкий** | 1 | JS (Chromium) | тир по умолчанию | нет | не зрелище, а **дроссель**: при давлении `serious` поле сигнала снижает плотность. Прямо поддерживает правило «60 fps на среднем телефоне» |
| 10.7 | **Реакция на время суток** | [не проверено: живого дизайнерского примера 2025–26 не нашёл; поиск выдал только плагины тем] | 2 | 1 | JS | обычный вид | нет | «сейчас у узла в Токио 03:12, нагрузка минимальна» — только если есть реальные данные нагрузки. Без них — украшение |
| 10.8 | **Камера + MediaPipe** (маска на лицо) | [Codrops 06.09.2026](https://tympanus.net/codrops/2026/09/06/building-a-real-time-3d-face-mask-with-mediapipe-threlte-and-three-js/) | 3 | 5 | WASM + Three | — | нет | **не подходит**: сайт про приватность, который просит камеру, — самоубийство тона |

## 11. Idle / ambient

| № | Приём | Где увидеть | Ред. | Цена | Чем | Fallback / RM | Atlas | Смысл для Atlas |
|---|---|---|---|---|---|---|---|---|
| 11.1 | **Нулевой покой**: страница стоит, пока человек ничего не делает | lusion.co, obys.agency, locomotive.ca, activetheory.net — покой 0 ([замер `research/05_MOTION.md`](../../research/05_MOTION.md)) | — | 0 | — | — | **есть**: покой 0,03 | это норма жанра (14 из 20), а не бедность. Сохранить |
| 11.2 | **Дышащее поле в покое** | basement.studio (195), unseen.co (467), immersive-g.com (164) — тот же замер | 3 | 3 | WebGL / canvas | неподвижно | нет | не добавлять: у Atlas поле отвечает руке (разница картинки под курсором 12 419 против 628 в покое), и это сильнее |
| 11.3 | **Бегущая лента фактов** | см. 4.5 | 1 | 1 | CSS | стоит | **есть** (12.3) | одна из двух разрешённых холостых вещей |
| 11.4 | **Мигание живых показаний** раз в 9 с | [не нашёл внешнего референса] | 3 | 1 | CSS | без мигания | **есть** (12.3, `gh-tick`) | «прибор жив». Сохранить |
| 11.5 | **Потеря сигнала при простое** (`data-signal`) | [не нашёл внешнего референса] | 4 | 1 | rAF + CSS-переменные | нет | старый корпус: `brand/MotionField.tsx` | «соединение простаивает — ускоритель держит канал». Смысл есть, но это третья холостая вещь: только взамен 11.4 |
| 11.6 | **Скринсейвер после N секунд бездействия** | [не проверено] | 2 | 2 | JS | нет | нет | **не подходит**: превращает покой в холостое движение, против замера |

## 12. Anti-patterns (таблица клише)

| № | Клише 2026 | Где видно | Почему клише | Чем заменить у Atlas |
|---|---|---|---|---|
| 12.1 | **Fade-up на каждом блоке** | повсеместно; в Atlas — `dv2Rise`, `fadeInUp`, `.px-reveal` в `globals.css` ([инвентаризация, раздел H](../ANIMATION_INVENTORY.md)) | одинаковая реакция у всего = никакой реакции | режиссированный вход по сценам; разовые события — через 3.11 |
| 12.2 | **Параллакс по всей странице** | [iliketoplay: scroll animations 2026](https://iliketoplay.dk/insights/scoll-animations/), [Bubble: trends 2026](https://bubble.io/blog/web-design-trends/) | «переиспользован до клише»; работает только точечно | ни одного параллакса; глубину даёт инверсия |
| 12.3 | **Scroll-jacking** | [Bubble](https://bubble.io/blog/web-design-trends/) | медленно и спорит с откликом на тап | `sticky` + шкала секции (так и сделано №7) |
| 12.4 | **Счётчик цифр 0→N** | запрещён в CLAUDE.md, Design Standard | цифра, которая «набегает», — анимация таймера, а не данных | число сразу; движется только измеренное значение |
| 12.5 | **Бесконечная бегущая строка «без идеи»** (логотипы, «trusted by») | повсеместно | заполняет пустоту движением | лента фактов, где каждое число из кода (уже так) |
| 12.6 | **Кастомный курсор-кружок / трейлер** | [CodePen-трейлеры](https://codepen.io/thingbynemanja/full/ogjaaNE) | однажды убил курсор на всём сайте Atlas (CLAUDE.md) | системный курсор + `InvertLens` |
| 12.7 | **Кинетическая типографика на всей странице** | [Bubble](https://bubble.io/blog/web-design-trends/) цитирует ретроспективу 2026: «больше полировки, чем смысла» | работает как один момент первого экрана, не как стиль всего сайта | вес по прокрутке — в одном месте, а не на каждом `.gh-h2` |
| 12.8 | **Mesh-gradient-hero** | [Paper Shaders](https://shaders.paper.design/mesh-gradient) и 21st.dev — готовый компонент | ставится за минуту — значит, у всех | поле сигнала (материал с поведением) |
| 12.9 | **3D-глобус с дугами** | ниша VPN/хостинга | первый кадр половины конкурентов | карта точками + маршрут до ближайшего узла (3.6) |
| 12.10 | **Liquid glass** | [kube.io](https://kube.io/blog/liquid-glass-css-svg/) | к осени 2026 — след Apple в каждом шаблоне; вне Chromium деградирует до blur | инверсия и линейка |
| 12.11 | **Image trail за курсором** | [Codrops 20.05.2026](https://tympanus.net/codrops/2026/05/20/made-with-gsap-building-a-fun-gravity-based-mouse-trail/) | жанр портфолио с 2019 года | — |
| 12.12 | **Прелоадер-заставка ради заставки** | [Goodgrowth](https://goodgrowth.com/) — хорошо сделано, но для портфолио | для сайта про скорость ожидание — самоопровержение | нулевой прелоадер (1.6) + A1 |
| 12.13 | **Тяжёлый WebGPU там, где хватает CSS** | [Cerebrium: TSL-инициализация ~20 с, откат на WebGL](https://tympanus.net/codrops/2026/07/23/building-cerebrium-making-serverless-infrastructure-tangible/) | компиляция графа узлов на старте съедает LCP | WebGL-first; WebGPU только при измеренной нужде |
| 12.14 | **ASCII/dither ради ASCII** | [Efecto](https://tympanus.net/codrops/2026/01/04/efecto-building-real-time-ascii-and-dithering-effects-with-webgl-shaders/), [Ditther](https://www.ditther.com/) — уже готовые редакторы | когда эффект продаётся как SaaS, он становится шаблоном | растр только там, где он изображает сжатие или помеху |

### Anti-patterns — короткий список

1. Fade-up у всего подряд. У Atlas он всё ещё живёт в `globals.css` на страницах старого корпуса.
2. Параллакс как фон всей страницы.
3. Scroll-jacking и любой перехват колеса.
4. Счётчики 0→N. Сюда же бегущий процент в забеге (`--lap-n`), если он не привязан к реальному измерению — см. «Противоречия».
5. Бегущая строка логотипов.
6. Кастомный курсор, заменяющий системный.
7. Одинаковый приём на всех заголовках (вес по прокрутке у каждого `.gh-h2`).
8. Mesh gradient, liquid glass, 3D-глобус — три готовых решения 2026 года.
9. Звук, который включается сам.
10. Прелоадер, который показывает таймер вместо загрузки.
11. WebGPU как бейдж, а не как ответ на измеренную задачу.
12. Холостое «дыхание» страницы: 14 из 20 референсов его не делают.

---

## Авторские приёмы (в найденных референсах не встречены)

Проверка новизны честная, но ограниченная: я не встретил их ни в
одном из ~75 источников этого каталога и ни в одном из 20 сайтов
замера. Это не доказательство, что их нет нигде.

Общее правило всех пяти: **движется только измеренное**, цвет
получает только измеренное (`--g-chart` на бумаге, `--g-acid` на
плите), и ни один приём не отвечает за появление содержимого.

### A1. «Рукопожатие вместо прелоадера»

**Что.** Прелоадера нет: страница уже отрисована сервером. В первые
~600 мс в приборной полосе проявляются три реальные длительности
запроса `LivePing` к ближайшему узлу: поиск адреса, соединение,
установка шифрования. Три сегмента одной линейки, ультрамарином,
подпись «шифрование установлено за 41 мс».

**Смысл.** Счётчик 0→100% показывает таймер. Здесь показано то, что
действительно произошло при загрузке у этого человека, включая
момент, когда канал стал зашифрованным.

**Реализация.** `PerformanceResourceTiming` запроса пинга:
`domainLookupEnd − domainLookupStart`, `connectEnd − connectStart`,
`connectEnd − secureConnectionStart`. Для межсайтового запроса нужен
заголовок `Timing-Allow-Origin` на узле, без него поля равны нулю.
Сегменты — `transform: scaleX()` одним `@keyframes`, запуск по
`animation-trigger` (3.11) или по классу.

**Fallback / RM.** Нет `Timing-Allow-Origin` или повторное соединение
(поля 0) — полоса не показывается, остаётся обычное показание пинга.
RM — числа сразу, без роста.

**Бюджет.** 0 КБ библиотек, ~40 строк; одно чтение Resource Timing;
3 узла DOM; 0 кадров в покое. В метрику прокрутки не входит.

### A2. «Вязкость = задержка»

**Что.** Поле сигнала сейчас догоняет курсор с постоянной инерцией.
Предлагается сделать постоянную времени догоняния равной **измеренной
задержке читателя** до ближайшего узла. Переключатель в первом
экране «как сейчас / через Atlas» меняет её на задержку из
`locations.ts` для ближайшего узла Atlas. Разницу чувствует рука, а
не глаз.

**Смысл.** Задержку нельзя увидеть, но можно почувствовать. Это
единственный приём каталога, который переводит миллисекунды в
тактильное ощущение.

**Реализация.** В `SignalField.tsx` уже есть rAF: коэффициент
сглаживания `k = 1 − exp(−dt / τ)`, где `τ = rtt` из `LivePing`
(ограничить 8–400 мс, иначе поле «умрёт» на плохом мобильном). Второе
значение `τ` — из `CLOSEST`. Переключатель — `<button aria-pressed>`.

**Fallback / RM.** Пинг не измерен — `τ` по умолчанию, переключателя
нет. RM — поле не запускается, как сейчас. Грубый указатель — поле
отвечает на касание, переключатель остаётся.

**Бюджет.** 0 КБ, одна формула в существующем цикле, ноль новых
холстов. Честность: подпись «ваша задержка сейчас» и «ожидаемая
через узел в N» — второе значение ориентировочное и должно быть
помечено как оценка (`COMPLIANCE-CHECK.md`).

### A3. «Шифр-шов»

**Что.** Горизонтальный шов посреди третьего такта манифеста. Текст
выше шва читается, ниже шва **та же строка** превращается в
шифротекст той же длины, набранный теми же табличными цифрами и
знаками. Шов закреплён, строки проходят сквозь него при прокрутке.
Тот же приём, что №5 («разрезанная строка»), но с содержанием: верх
видит человек, низ — провайдер.

**Смысл.** Шифрование без иконки замка и без слова «военного уровня»:
показано, что именно видит посторонний.

**Реализация.** Два слоя одного текста. Верхний — исходный, нижний —
`data-cipher`: **настоящий** шифротекст, посчитанный на сборке
(AES-GCM со случайным ключом, base64, обрезка до длины строки).
Граница — `clip-path: inset()` на двух слоях, прогресс — `view()`.
Никакого холста и никакого случайного шума в рантайме.

**Fallback / RM.** Без `animation-timeline` шов стоит на середине
строки — статичный разрез тоже читается. RM — то же. Чтец экрана
получает только верхний слой (`aria-hidden` на шифре).

**Бюджет.** 0 КБ JS, 1 анимация на шкале прокрутки. **Заменяет** №5,
счёт не растёт.

### A4. «Датамош медленной дорожки»

**Что.** В сцене забега медленная дорожка сейчас застревает на 61% и
«дёргается». Вместо дёрганья её подпись и полоса распадаются на
блоки 8×8, которые смазываются вбок ступеньками, как видео на плохом
канале (5.4 — Datamosh, но без холста). Быстрая дорожка остаётся
чистой.

**Смысл.** Все знают, как выглядит зависший звонок. Это образ
просадки, а не абстрактная полоса.

**Реализация.** 12–16 плиток: каждая — копия подписи с
`clip-path: inset()` на свою клетку и `transform: translateX()` по
`steps(3)` в том же диапазоне шкалы `--lap`, что и сейчас. Сдвиг
плитки — из `--i` (или `sibling-index()`, 4.2). Только `transform` и
`clip-path`.

**Fallback / RM.** Без поддержки — чистая полоса на 61% с подписью
«не отвечает», как в базовом состоянии 12.1. RM — плитки не
создаются.

**Бюджет.** ~16 узлов DOM, композитор. **Заменяет** кейфреймы
«дёрганья» `gh-lap-slow`, то есть движение перераспределяется, а не
добавляется.

### A5. «Страница меряет саму себя»

**Что.** Полоса прочтения (№1) в конце документа превращается в
показание: «эта страница весит 312 КБ и пришла к вам за 0,48 с».
Вес — сумма `transferSize` из Resource Timing, время —
`responseEnd` навигации. Ультрамарин, потому что это замер.

**Смысл.** Сайт про скорость отчитывается о собственной скорости у
этого читателя. Позиция «измерено, а не заявлено» распространяется
на сам сайт. Риск прямой: страница обязана быть лёгкой, иначе приём
её обличит. Это полезная дисциплина для `perf-guard`.

**Реализация.** `performance.getEntriesByType("navigation"|"resource")`
после `load`. Показ — в существующем финальном блоке, без новых
анимаций: число появляется сразу.

**Fallback / RM.** Нет данных (кэш, `transferSize = 0`) — строка
«страница пришла из кэша вашего браузера», тоже правда. RM — без
изменений.

**Бюджет.** 0 КБ, ~25 строк, 0 анимаций.

**Шестой, запасной — «Прибор не гаснет».** `SignalTrace` поднимается в
корневой layout и продолжает писать длительность кадров через смену
страницы (идея 6.5, но на существующем canvas 2D). Холст остаётся
одним на сайт. Сдерживает: сегодня холст стоит только в первом
экране и встаёт вне кадра, а в layout ему нужен свой постоянный
носитель на всех страницах.

---

## Бюджет движения: сколько реально можно добавить

### Исходные числа (`research/05_MOTION.md`)

| Режим | Atlas | Медиана / норма 20 референсов | Вывод |
|---|---:|---:|---|
| прокрутка (преобразование сверх шага) | **491** | ~330 | **перебор ≈ +50%**. Добавлять можно только взамен |
| покой | 0,03 | 0 у 14 из 20 | в норме. Холостой бюджет исчерпан |
| курсор (геометрия) | 6,16 | 0 у большинства | поле живёт в холсте, геометрия его не видит; пиксельно 12 419 — сильный отклик. Здесь запас есть |
| анимаций на главной | 59, из них 49 на шкале прокрутки | — | плотность scrub-анимаций — главный источник 491 |

### Правило

**Прокрутка — нулевая сумма.** Каждый новый scroll-linked приём
вытесняет как минимум один существующий. Цель — опустить метрику с
491 до 350–400, а не держать на месте.

**Покой — ноль добавлений.** Разрешённых холостых вещей две, и они
заняты.

**Рука и события — свободнее.** Отклик на курсор, касание, нажатие,
переходы и разовые события (`animation-trigger`, View Transitions) не
растут вместе с прокруткой. Бюджет расходуется здесь.

### Что убрать (−5 scroll-анимаций)

| Убрать | Почему |
|---|---|
| №14 «сетка расходится на уходе» (`background-size`) | чистая декорация; к тому же `background-size` не композиторное свойство — пересчёт отрисовки на каждом кадре прокрутки |
| №8 «ячейки входят поворотом плоскости» | это fade-up с наклоном (12.1 в новой одежде) |
| №12 «подпись идёт вдоль меридиана» | декорация; `startOffset` у `textPath` анимируется не во всех движках [не проверено] |
| `gh-weight` у `.gh-h2` в №6 (срез оставить) | один приём повторён на каждом заголовке (12.7); вес остаётся только в манифесте №4 |
| №5 разрезанная строка | заменяется A3 с тем же механизмом и содержанием |

Отдельно, не в метрике главной: удалить мёртвое
`@view-transition { navigation: auto }` из `brand.css` (6.1) и
`dv2Rise`/`fadeInUp`/`.px-reveal` при переводе старых страниц.

### Что добавить (реалистично: 8–10 из каталога)

| Добавить | Режим | Влияние на метрику прокрутки |
|---|---|---|
| A3 шифр-шов | прокрутка | 0 (замена №5) |
| A4 датамош медленной дорожки | прокрутка | ≈0 (замена кейфреймов дёрганья) |
| 3.7 график задержки, прорисовка по прокрутке | прокрутка | +1, компенсировано удалением №14 |
| A1 рукопожатие | событие | 0 |
| A5 страница меряет себя | нет анимации | 0 |
| A2 вязкость = задержка | рука | 0 |
| 3.11 `animation-trigger` для разовых входов показаний | событие | снижает: scrub → разовое |
| 6.3 element-scoped VT на смене срока и страны | событие | 0 |
| 8.7 `interpolate-size` в FAQ и спецификации | событие | 0 |
| 7.4 пружина `linear()` как токен easing | событие | 0 |

Итог: **−5 scroll-анимаций, +3 scroll-анимации**, остальные 7 — вне
прокрутки. Ожидаемая метрика прокрутки — около 400 [оценка, нужен
повторный замер тем же скриптом]. Холостое движение — без изменений.

### Чего из каталога не брать вовсе, при всей моде

WebGPU-сцены на главной (9.1–9.9), второй холст (2.1, 2.3, 5.x на
Three), liquid glass (5.8), звук по умолчанию (10.1–10.3),
image sequence (3.3), бесконечную прокрутку (3.13), курсоры-трейлеры
(7.2, 7.6). Для `/infrastructure` допустима **одна** сцена уровня 9.5
(пути на MeshLine) — WebGL-first, лениво, с постером, и только
если правило «один холст на сайте» будет сознательно пересмотрено
владельцем.

---

## Противоречия с текущим CLAUDE.md

1. **CLAUDE.md противоречит сам себе в вопросе холостого движения.**
   Раздел Design Standard: «Каждый блок анимирован: load / scroll /
   hover / idle. Без исключений». Раздел Motion: «Холостого движения
   ровно два». Замер (14 из 20 — покой 0) на стороне второго.
   Первое правило (оно же требование мега-промта, §0.4 и §7) нужно
   переписать: «у каждого блока есть отклик на прокрутку или руку;
   idle — только у двух».
2. **«Счётчики цифр» запрещены (Design Standard), а раздел Motion
   хвалит `@property` «для бегущих чисел».** Процент в забеге
   (`--lap-n` 0→61/100) и `RollingNumber` — формально счётчики.
   Разграничить: число может двигаться, только если движение
   изображает измеренный процесс, а не «набегание» к заявленному
   значению.
3. **«3D: WebGPU + fallback» (Design Standard) против практики 2026.**
   Cerebrium ушёл с WebGPU/TSL на WebGL из-за ~20 с компиляции на
   старте. Корректнее «WebGL-first, WebGPU — при измеренной нужде».
   Одновременно правило «Один холст на сайте» исключает любую
   3D-сцену; мега-промт требует WebGPU-подпись. Нужно решение
   владельца.
4. **«Кастомного курсора нет»** — а `brand/Cursor.tsx` смонтирован в
   корневом `layout.tsx` и работает на страницах старого корпуса
   (`.b-root`). Формально правило нарушено до конца перевода.
5. **Переходы между страницами.** `brand.css` объявляет
   cross-document View Transition, но в App Router навигация по
   `<Link>` его не вызывает. Ни CLAUDE.md, ни инвентаризация об этом
   не говорят; инвентаризация пишет, что View Transitions «удалены»,
   а правило в CSS осталось.
6. **Прежний каталог (часть III) обещает `interpolate-size`,
   `@starting-style`, `::details-content`, `allow-discrete`.** В коде
   нет ни одного (grep по `src/`). Это не противоречие CLAUDE.md, но
   расхождение документации с кодом.

## Что не удалось проверить

- Полный текст разбора «Persistent Page Transitions» (Codrops,
  30.06.2026): сбой загрузки, описание по заголовку.
- Живые примеры 2025–26 для: логотипа → навигации (1.5), видео в
  тексте (2.6), контура с заливкой (4.10), печатного текста (4.11),
  шейдерного меню (6.8), скринсейвера (11.6), реакции на время суток
  (10.7).
- Поддержка cross-document View Transitions в Firefox на сентябрь
  2026: источники противоречат друг другу.
- Огрубление значений `rtt`/`downlink` в Network Information API.
- Анимируемость `startOffset` у `textPath` во всех движках (№12).
- Победитель GSAP SOTY 2025: страница `gsap.com/SOTY-2025` на момент
  запроса пишет «будет объявлен»; твит Ильи ван Эка называет Osmo, но
  страницей это не подтверждено.
- Сайт Lama Lama (Awwwards SOTM август 2026): упомянут в поиске, URL
  не проверял, в каталог не вошёл.
- Ожидаемая метрика прокрутки ~400 после правок — оценка, нужен
  повторный прогон `research/refs/motion-probe`.
- Браузер (Playwright) по заданию не использовался: живые сайты не
  открывались, всё описано по статьям и разборам.

## Источники (уникальные, 2025–2026)

Codrops, статьи: [Lookback](https://tympanus.net/codrops/2026/03/03/the-lookback-a-digital-capsule-for-better-off-studios-creative-past/) ·
[Goodgrowth](https://tympanus.net/codrops/2026/08/27/goodgrowth-boot-sequences-spinning-discs-and-the-art-of-the-portfolio/) ·
[Efecto](https://tympanus.net/codrops/2026/01/04/efecto-building-real-time-ascii-and-dithering-effects-with-webgl-shaders/) ·
[Shape-aware ASCII](https://tympanus.net/codrops/2026/09/04/beyond-the-luminance-ramp-a-shape-aware-ascii-renderer-in-three-js/) ·
[Gommage](https://tympanus.net/codrops/2026/01/28/webgpu-gommage-effect-dissolving-msdf-text-into-dust-and-petals-with-three-js-tsl/) ·
[Text Destruction](https://tympanus.net/codrops/2025/07/22/interactive-text-destruction-with-three-js-webgpu-and-tsl/) ·
[3D Cluster](https://tympanus.net/codrops/2026/08/12/creating-an-interactive-3d-cluster-with-three-js-tsl-and-three-start/) ·
[Shader.se](https://tympanus.net/codrops/2026/05/19/80s-business-tech-seamless-scene-transitions-inside-shader-ses-scroll-driven-webgpu-pipeline/) ·
[SVG Map/Graph](https://tympanus.net/codrops/2026/05/21/creating-scroll-driven-svg-map-animations-with-gsap/) ·
[Never Ending Story](https://tympanus.net/codrops/2026/05/28/the-never-ending-story-building-a-seamless-infinite-scroll-experience-with-gsap-lenis/) ·
[Free GSAP plugins](https://tympanus.net/codrops/2025/05/14/from-splittext-to-morphsvg-5-creative-demos-using-free-gsap-plugins/) ·
[Square Lens](https://tympanus.net/codrops/2026/08/25/building-a-mouse-following-square-lens-effect-with-three-js-and-glsl/) ·
[Gravity Trail](https://tympanus.net/codrops/2026/05/20/made-with-gsap-building-a-fun-gravity-based-mouse-trail/) ·
[Datamosh](https://tympanus.net/codrops/2026/09/02/breaking-the-frame-building-a-real-time-datamosh-effect-with-three-js/) ·
[Infinite Loom](https://tympanus.net/codrops/2026/09/05/building-an-infinite-loom-unravelling-images-into-threads-with-three-js/) ·
[Relighting](https://tympanus.net/codrops/2026/08/19/relighting-images-with-depth-maps-and-three-js/) ·
[X-Ray Reveal](https://tympanus.net/codrops/2026/03/23/building-a-dual-scene-fluid-x-ray-reveal-effect-in-three-js/) ·
[Barba + Astro](https://tympanus.net/codrops/2026/04/08/creating-custom-page-transitions-in-astro-with-barba-js-and-gsap/) ·
[Persistent WebGPU transitions](https://tympanus.net/codrops/2026/06/30/building-persistent-page-transitions-with-webgpu-and-vanilla-javascript/) ·
[Async transitions](https://tympanus.net/codrops/2026/02/26/building-async-page-transitions-in-vanilla-javascript/) ·
[Lit GPU Tubes](https://tympanus.net/codrops/2026/09/07/drawing-with-light-an-exploration-of-lit-gpu-tubes-with-tsl-and-webgpu/) ·
[Cerebrium](https://tympanus.net/codrops/2026/07/23/building-cerebrium-making-serverless-infrastructure-tangible/) ·
[Rapier voxels](https://tympanus.net/codrops/2026/01/05/how-to-create-a-pixel-to-voxel-video-drop-effect-with-three-js-and-rapier/) ·
[Liquid Glass Grid](https://tympanus.net/codrops/2026/09/08/building-an-infinite-liquid-glass-grid-with-three-js-webgpu-and-tsl/) ·
[False Earth](https://tympanus.net/codrops/2026/04/21/false-earth-from-webgl-limits-to-a-webgpu-driven-world/) ·
[Procedural Geometry](https://tympanus.net/codrops/2026/08/11/exploring-procedural-geometry-with-three-js-and-webgpu/) ·
[Volatile Nexus](https://tympanus.net/codrops/2026/08/31/volatile-nexus-tinkering-with-glass-caustics-cubes-and-sound-in-three-js/) ·
[MediaPipe Face Mask](https://tympanus.net/codrops/2026/09/06/building-a-real-time-3d-face-mask-with-mediapipe-threlte-and-three-js/)

Codrops, демо: [Sticky Grid Scroll](https://tympanus.net/Tutorials/StickyGridScroll/) ·
[Horizontal Parallax Gallery](https://tympanus.net/Tutorials/HorizontalParallaxGallery/index2.html) ·
[Curve Gallery](https://tympanus.net/Tutorials/CurveGallery/) ·
[Scroll Map](https://tympanus.net/Tutorials/ScrollMap/) ·
[Scroll Graph](https://tympanus.net/Tutorials/ScrollGraph/) ·
[SVG Mask Scroll](https://tympanus.net/Tutorials/SVGMaskScrollTransition/) ·
[Telescope Zoom](https://tympanus.net/Tutorials/TelescopeZoom/) ·
[Infinite Canvas](https://tympanus.net/Tutorials/InfiniteCanvas/) ·
[Scroll Text Motion](https://tympanus.net/Development/ScrollTextMotion/) ·
[Dual Wave Text](https://tympanus.net/Tutorials/DualWaveTextAnimation/) ·
[3D Text Scroll](https://tympanus.net/Tutorials/3DTextScroll/) ·
[Accessible WebGL Text](https://tympanus.net/Tutorials/AccessibleWebGLText) ·
[Pointer Square Lens](https://tympanus.net/Tutorials/PointerSquareLensDistortion) ·
[Infinite GSAP Gallery + Flip](https://tympanus.net/Tutorials/InfiniteScrollGSAPGallery/) ·
[Elastic Grid Scroll](https://tympanus.net/Tutorials/ElasticGridScroll/) ·
[Rotating on Scroll](https://tympanus.net/Development/RotatingOnScrollAnimations/) ·
[Cube Gallery](https://gsap-cubic-scrollable-image-gallery.webflow.io/) ·
[Pixel Image Effect](https://pixelimageeffect.pages.dev/)

CodePen: [Canvas Grid Mouse](https://codepen.io/creativeocean/full/emBOove) ·
[AutoSplit](https://codepen.io/GreenSock/pen/GggpRoB) ·
[Variable weight by mouse](https://codepen.io/freedommayer/pen/OJBbzVg) ·
[Line Text Distortion](https://codepen.io/blacklead-studio/full/azOzePJ) ·
[Keyhole video](https://codepen.io/luis-lessrain/pen/zxGjErP) ·
[Cursor Trailer](https://codepen.io/thingbynemanja/full/ogjaaNE) ·
[Cursor image on hover](https://codepen.io/GreenSock/full/PwqrzeG) ·
[Tubes Cursor](https://codepen.io/soju22/full/qEbdVjK) ·
[Three + FLIP](https://codepen.io/GreenSock/pen/GgpMeZp)

Живые сайты: [goodgrowth.com](https://goodgrowth.com/) · [shader.se](https://shader.se) ·
[cerebrium.ai](https://cerebrium.ai/) · [ribbit.dk](https://ribbit.dk) ·
[matvoyce.tv](https://matvoyce.tv/) · [dasprinzip.com/tinker/day42](https://dasprinzip.com/tinker/day42/) ·
[Lando Norris / Awwwards](https://www.awwwards.com/sites/lando-norris) ·
[OFF+BRAND кейс](https://www.itsoffbrand.com/our-work/lando-norris) ·
[Messenger / Awwwards](https://www.awwwards.com/sites/messenger) ·
[GSAP SOTY 2025](https://gsap.com/SOTY-2025/)

Платформа и библиотеки: [Chrome: scroll-triggered](https://developer.chrome.com/blog/scroll-triggered-animations) ·
[CSS-Tricks: scroll-triggered](https://css-tricks.com/css-scroll-triggered-animations-first-look/) ·
[Chrome: scroll-state](https://developer.chrome.com/blog/css-scroll-state-queries) ·
[MDN: scroll-state](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Conditional_rules/Container_scroll-state_queries) ·
[Chrome 147: element-scoped VT](https://developer.chrome.com/blog/element-scoped-view-transitions) ·
[MDN: element-scoped VT](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API/Using_element-scoped) ·
[CSS-Tricks: cross-document VT](https://css-tricks.com/cross-document-view-transitions-part-1/) ·
[Next ViewTransition demo](https://github.com/vito8916/Nextjs-ViewTransition-Demo) ·
[React 19.2 / Next 16 VT](https://www.digitalapplied.com/blog/react-19-2-view-transitions-animate-navigation-nextjs-16) ·
[ICS MEDIA: sibling-index](https://ics.media/en/entry/260116/) ·
[SitePoint: sibling-index](https://www.sitepoint.com/css-siblingindex-and-siblingcount-native-list-staggering-without-javascript/) ·
[Comeau: linear()](https://www.joshwcomeau.com/animation/linear-timing-function/) ·
[MDN: interpolate-size](https://developer.mozilla.org/en-US/docs/Web/CSS/interpolate-size) ·
[Motion: layout](https://motion.dev/docs/react-layout-animations) ·
[three.js compute particles](https://threejs.org/examples/webgpu_compute_particles.html) ·
[three.js webgpu bloom](https://threejs.org/examples/webgpu_postprocessing_bloom.html) ·
[Spark](https://sparkjs.dev/) · [Spark 2.0](https://www.worldlabs.ai/blog/spark-2.0) ·
[Paper Shaders](https://shaders.paper.design/) ·
[kube.io: liquid glass](https://kube.io/blog/liquid-glass-css-svg/) ·
[Cuelume](https://cuelume.dev/) ·
[MDN: DeviceOrientation permission](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/requestPermission_static) ·
[MDN: Network Information API](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API) ·
[Chrome: Compute Pressure](https://developer.chrome.com/docs/web-platform/compute-pressure) ·
[New in Chrome 152](https://developer.chrome.com/blog/new-in-chrome-152) ·
[GSAP Vault: image sequence](https://gsapvault.com/blog/scroll-image-sequence-tutorial)

Критика и тренды: [iliketoplay: scroll animations 2026](https://iliketoplay.dk/insights/scoll-animations/) ·
[Bubble: trends 2026](https://bubble.io/blog/web-design-trends/) ·
[Hon Tran: award-winning sites 2026, judged](https://www.hontran.dev/blog/best-award-winning-websites-2026) ·
[Ditther](https://www.ditther.com/)
