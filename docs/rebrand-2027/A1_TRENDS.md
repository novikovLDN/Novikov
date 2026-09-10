# A1 — Тренды визуального стиля 2026→2027

Дата: 10 сентября 2026. Раздел A1 мега-промта
(`MEGA_PROMPT_agency_redesign_2026-2027.md`), объект — Atlas Secure.

**Метод.** 22 поисковых запроса и около 35 прочитанных страниц
(WebSearch / WebFetch). Браузер не использовался. Замеры, которые уже
есть в репозитории, не повторялись, на них ссылки:
`research/03_AGENCY_TEARDOWN.md` (18 студий),
`research/04_COLOR_2027.md` (28 сайтов, цвет по площади),
`research/05_MOTION.md` (21 сайт, движение и плотность). Для свежих
победителей Awwwards прочитаны карточки сайтов: теги, цвета, стек.

**Как читать источники.** Их три класса, и вес у них разный:

| класс | примеры | чему верим |
|---|---|---|
| первичный: карточка награды, спецификация, документация производителя | awwwards.com/sites/*, github.com/w3c, platform.claude.com | факт |
| разбор практика с кодом | Codrops, kube.io | технике и ограничениям |
| блог агентства или вендора | studiomeyer.io, theplusaddons.com, fireart.studio, kittl.com | направлению, но **не цифрам**: проценты вроде «+23% глубины прокрутки» — их собственные, без методики. В тексте такие помечены «(данные вендора)» |

Статистика запросов ИИ-краулеров к llms.txt взята из вторичных блогов,
первоисточник не найден: **[не проверено]**.

---

## Сводка: что показали свежие награды (август–сентябрь 2026)

Карточки шести последних Site of the Day / Site of the Month:

| сайт | студия | дата | цвета с карточки | стек с карточки |
|---|---|---|---|---|
| [Cerebrium](https://www.awwwards.com/sites/cerebrium) | Louis Paquet | 10.09.2026 SOTD | `#172B76` `#902177` | GSAP, Three.js, WebGL, Cinema 4D |
| [USAvionix](https://www.awwwards.com/sites/usavionix) | basement.studio | 09.09.2026 SOTD | `#000` `#fff` | WebGL, Next.js, 3D |
| [Why Zero](https://www.awwwards.com/sites/why-zero) | Sindhur Dutta | 07.09.2026 SOTD | `#FFFFFF` `#01C654` | GSAP, Three.js, Blender |
| [ERA Residence](https://www.awwwards.com/sites/era-residence) | The First The Last | SOTM август 2026 | `#B5CEDB` `#F8BBCB` | GSAP, Webflow |
| [Floema](https://www.awwwards.com/sites/floema) | Bürocratik | SOTM май 2026 | `#E9E778` `#241F21` | WebGL, GSAP, Nuxt |
| [Oryzo AI](https://www.awwwards.com/sites/oryzo-ai) | Lusion | SOTM апрель 2026 | `#100904` `#FF8539` | WebGL, GSAP, Three.js |

Полный список SOTM 2026 — [awwwards.com/websites/sites_of_the_month](https://www.awwwards.com/websites/sites_of_the_month/),
последние SOTD — [awwwards.com/websites/sites_of_the_day](https://www.awwwards.com/websites/sites_of_the_day/).

Что видно:

1. **GSAP во всех шести, WebGL в пяти из шести.** Единственное
   исключение (ERA Residence) — Webflow с параллаксом и видео. Жюри
   2026 года награждает сцену, а не вёрстку. Это совпадает с выводом 2
   из `03_AGENCY_TEARDOWN.md` (холст у 13 из 18 студий).
2. **Цвет не сходится в одно семейство.** Два монохромных корпуса,
   один пастельный, три с тёмно-коричневым или угольным вместо
   чёрного. Кислотный лайм встречается (Floema `#E9E778`, Why Zero
   `#01C654`), но не доминирует. Вывод `04_COLOR_2027.md` о двух
   семействах (ультрамарин и лайм) относится к студийным сайтам
   и продуктовым брендам, у победителей конкурса палитра шире.
3. **У каждого сайта есть Developer Award.** Высокая оценка по
   разработке стала условием SOTD, одного визуального приёма уже
   недостаточно.

---

## 1. Tactile / neo-brutalism

**Что это в 2026.** Рецепт, который измерил
[theplusaddons (3.09.2026)](https://theplusaddons.com/blog/neo-brutalism-web-design/):
рамка 2–5px почти чёрная, жёсткая тень без размытия
(`box-shadow: 6px 6px 0 #000`), плоская насыщенная заливка без
градиента, радиус 4–8px. Отдельно от него существует «tactile
brutalism»: сырая геометрия, резкий контраст, зерно и сканлайны как
доказательство ручной работы
([Fireart](https://fireart.studio/blog/the-best-web-design-trends/),
[Pixso](https://pixso.net/articles/neo-brutalism-design/)).

**Что удержалось.** Стиль ушёл в компоненты и массовые бренды: есть
библиотека [neobrutalism.dev](https://neobrutalism.dev), его в
продакшене использует [feastables.com](https://feastables.com).
[Setproduct (5.06.2026)](https://www.setproduct.com/blog/retro-brutalist-ui-design-2026)
относит к устоявшемуся «жёсткие 2px рамки, системные шрифты, нулевой
радиус».

**Что сдулось.** Как признак авторства он больше не работает: раз есть
библиотека компонентов, это уже набор. Theplusaddons перечисляет, где
стиль проваливается: длинное чтение, отрасли, где решает доверие
(финансы, медицина, право), плотные данные. Там же поправка к
хрестоматийному примеру: у [Gumroad](https://gumroad.com) на главной
жёстких теней уже нет.

**Живые примеры.** [neobrutalism.dev](https://neobrutalism.dev) ·
[feastables.com](https://feastables.com) · [gumroad.com](https://gumroad.com) ·
[are.na](https://www.are.na) · [98.css](https://jdan.github.io/98.css/)

**Для Atlas.**
- Берём: нулевой радиус и волосяную линию (они уже в системе) и
  плотный контраст чёрного по белому.
- Не берём: жёсткую смещённую тень, толстую рамку, насыщенную заливку
  плашек.
- Почему: Atlas продаёт шифрование и стабильность, то есть ровно ту
  категорию доверия, где по theplusaddons стиль проваливается.
  Смещённая тень к тому же противоречит правилу «теней нет».

---

## 2. Anti-grid brutalism против bento

**Состояние.** По промежуточному итогу
[studiomeyer (8.05.2026)](https://studiomeyer.io/en/blog/webdesign-trends-2026-reality-check)
bento удержался и стал раскладкой по умолчанию. Их же цифра «на 23%
больше глубины прокрутки» — данные вендора. Anti-grid там записан как
новое контр-движение: «deliberately broken layouts, raw HTML
aesthetics». Примеры у них слабые (The Browser Company, v0.dev).
[Inkbot](https://inkbotdesign.com/bento-grid-design/) пишет об «Active
Grid»: ячейка при наведении разворачивается, а не меняет цвет.

**Честная оценка.** Bento в 2027 году уместен как информационная
плотность в продукте: кабинет, панель, сравнение. Как первое
впечатление на витрине это шаблон, и Anthropic прямо называет его
признаком сгенерированной страницы: в текущей версии скилла
[frontend-design](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md)
пункт 4 — «content chopped into identical rounded cards». Anti-grid
как стиль переоценён: чтобы сломанная сетка читалась как решение,
нужна сильная типографика. Obys говорит то же прямо:
«You can break the grid only if you understand it»
([Codrops, 6.03.2026](https://tympanus.net/codrops/2026/03/06/obys-the-small-studio-designing-big-digital-narratives/)).

**Живые примеры.** [apple.com](https://www.apple.com) (bento как канон) ·
[arc.net](https://arc.net) · [ERA Residence](https://www.awwwards.com/sites/era-residence)
(горизонтальные секции вместо ячеек) ·
[grids.obys.agency](https://grids.obys.agency) (манифест сетки от Obys)

**Для Atlas.**
- Берём: рваную сетку по колонкам (`[data-col]`, она уже в системе)
  при одном шаге колонки на весь корпус.
- Не берём: bento на публичных страницах и «хаотичный» anti-grid.
- Почему: рваная сетка у нас держится на общем модуле, поэтому
  нарушение читается как жест. Bento оставляем кабинету, где нужна
  плотность, а не впечатление.

---

## 3. Kinetic typography / typography-as-architecture

**Что удержалось.** Кинетический набор в первом экране и в переходах.
Эталон 2025–2026 годов — сайт кинетического типографа Mat Voyce от
Uncommon Studio: Awwwards SOTD и номинация на GSAP Site of the Year
([карточка](https://www.awwwards.com/sites/mat-voyce),
[кейс](https://www.awwwards.com/case-study-mat-voyce-designing-a-digital-home-for-a-kinetic-creative.html)).
Разбор [Hon Tran (27.06.2026)](https://www.hontran.dev/blog/best-award-winning-websites-2026)
отмечает главное: «animation never blocks reading». Параллельно
заголовок набирают во всю ширину окна вместо картинки
([Fireart](https://fireart.studio/blog/the-best-web-design-trends/)).

**Что сдулось.** Текст, который движется в теле страницы. Studiomeyer
записал кинетическую типографику в «переобещавшие»: она мешает
экранным дикторам и поисковым роботам и выжила только в заголовках
первого экрана и в переходах. [Digital Silk (3.02.2026)](https://www.digitalsilk.com/web-design/web-trends/kinetic-typography/)
перечисляет риски: движение задерживает смысл, растёт CLS, текст
отстаёт на средних телефонах.

**Живые примеры.** [Mat Voyce](https://www.awwwards.com/sites/mat-voyce) ·
[Uncommon Studio](https://uncommonstudio.com.au/detail/mat-voyce) ·
[Obys Typography Principles](https://www.awwwards.com/sites/typography-principles) ·
[Codrops: scroll-driven dual-wave text (15.01.2026)](https://tympanus.net/codrops/2026/01/15/building-a-scroll-driven-dual-wave-text-animation-with-gsap/)

**Для Atlas.**
- Берём: заголовок, выключенный по ширине колонки (`100cqw / k`), и
  вариативную ось веса по прокрутке — всё это уже есть. Кинетика
  живёт в одном месте, в первом экране.
- Не берём: побуквенный набор в каждом заголовке сцены и бегущий текст
  без содержания.
- Почему: по `03_AGENCY_TEARDOWN.md` выключку по ширине не делает ни
  один из 18 студийных сайтов, это наш собственный ход. Больше
  кинетики не нужно: `05_MOTION.md` показал 491 по прокрутке при
  медиане 330, то есть движения уже слишком много.

---

## 4. Chromatic extremes

**Что удержалось.** Монохромный корпус плюс один насыщенный акцент.
Замер `04_COLOR_2027.md`: цветного корпуса нет ни у одного из 28
сайтов, насыщенный акцент попадает в два семейства — электрический
ультрамарин и кислотный лайм. Карточки Awwwards 2026 (таблица выше)
дополняют: у победителей конкурса есть ещё третий путь, тёплый тёмный
вместо чёрного (Oryzo `#100904`, Floema `#241F21`).

**Что сдулось или спорно.** «Тёмный режим с неоном» у победителей
2026 года не встретился ни разу. Вендорские обзоры пишут об уходе от
«клинического белого» к тёплому
([Davey & Krista](https://daveyandkrista.com/2026-brand-color-trends/),
[We Design Marbella](https://wedesignmarbella.com/web-design-color-trends-for-2026-2027/)).
При этом Anthropic в текущем frontend-design называет тёплый кремовый
фон (около `#F4F1EA`) **первым** признаком сгенерированной страницы, а
«почти чёрный фон с одним ярким кислотно-зелёным акцентом» —
**вторым**. Получается, что оба «модных» пути — тёплый белый и лайм на
чёрном — к концу 2026 года стали дефолтом модели.

**Живые примеры.** [Why Zero](https://www.awwwards.com/sites/why-zero)
(белый + `#01C654`) · [Floema](https://www.awwwards.com/sites/floema)
(`#E9E778` на угольном) · [Oryzo AI](https://www.awwwards.com/sites/oryzo-ai)
(оранжевый на тёмно-коричневом) · [lusion.co](https://lusion.co/)
(`#0016EC` + `#C1FF00`, из `04_COLOR`) ·
[Cerebrium](https://www.awwwards.com/sites/cerebrium) (синий + маджента)

**Для Atlas.**
- Берём: чистый белый `#FFFFFF` и чистый чёрный `#000000`, ультрамарин
  на бумаге, лайм на плите — только для измеренного.
- Не берём: неон на тёмном и тёплый off-white.
- Почему: правило «цвет = измерено» даёт цвету смысл, и в этом Atlas
  отличается от кластера №2 (лайм как украшение). Чистый белый вместо
  кремового уводит от кластера №1. Риск: лайм на чёрной плите
  визуально совпадает с кластером №2, поэтому площадь лайма держим
  минимальной, это числа, а не заливки.

---

## 5. Organic / imperfect

**Что удержалось.** Сильнее всего в графическом дизайне и упаковке, в
вебе слабее. В отчёте [Kittl (30.06.2026)](https://www.kittl.com/blogs/graphic-design-trends-2026/)
первым трендом года стоит «Naive Design» («wobbly doodles»), девятым —
«Grainy Blur». [Studio 2am (11.04.2026)](https://studio2am.co/blogs/news/proof-of-hand-why-designers-are-reaching-for-imperfection-in-2026)
формулирует это как «proof of hand» и приводит рост поисков на 30% —
это данные Adobe за 2024 год, не за 2026. [Adobe Creative Trends 2026](https://business.adobe.com/resources/creative-trends-report.html)
и Behance-подборки
([пример](https://www.behance.net/gallery/239027109/Design-Trends-2026))
говорят о «human touch».

**Что в вебе.** Среди свежих наград органика — редкость. Ближайший
пример — [Digital Anthro](https://www.awwwards.com/sites/digital-anthro-website)
(номинант Awwwards, 30.07.2026): облако точек фотограмметрии поверх
рисованных растений. Organic blob shapes studiomeyer записал в
провалившиеся: они остались на брендовых лендингах и ушли из B2B.

**Для Atlas.**
- Берём: идею «доказательства руки», но в своём материале. У нас это
  доказательство **устройства**: живые показания отклика и частоты
  кадров с машины читателя. Это тот же сигнал «здесь не шаблон», только
  выраженный замером.
- Не берём: рукописные шрифты, каракули, мятую бумагу, зерно на
  светлом.
- Почему: рукописное на сервисе шифрования читается как
  несерьёзность. А зерно на светлом корпусе при непрозрачности выше ~3%
  выглядит грязью, это уже зафиксировано в `docs/01_RESEARCH.md` (п. 16).

---

## 6. Retro-futurism / Y2K / chrome / glitch / CRT

**Что удержалось.** Дизеринг, ASCII и полутон как шейдерный материал.
Это самая живая ветка ретро в 2026 году:
[Codrops: Efecto (4.01.2026)](https://tympanus.net/codrops/2026/01/04/efecto-building-real-time-ascii-and-dithering-effects-with-webgl-shaders/)
разбирает Floyd–Steinberg и Atkinson в реальном времени;
[Codrops о Unicorn Studio (4.03.2026)](https://tympanus.net/codrops/2026/03/04/webgl-for-designers-creating-interactive-shader-driven-graphics-directly-in-the-browser/)
показывает ASCII-дизер готовым слоем в редакторе для дизайнеров. У
Kittl 2026 рядом стоят «Signal Graphics» (эфирные заставки 90-х),
«Surveillance Design» (сетки, HUD, таймкоды) и в почётных упоминаниях
Frutiger Aero.

**Что сдулось.** Хромовые градиенты, пузырчатое lo-fi 3D и пиксельные
шрифты. Setproduct прямо пишет, что они «may peak and fade over the
next two to three years». Раз дизер стал пресетом в Unicorn Studio,
к 2027 году это будет шаблон: чем доступнее инструмент, тем быстрее
приём перестаёт что-то значить.

**Живые примеры.** [poolsuite.net](https://poolsuite.net) (Y2K) ·
[Efecto / Codrops](https://tympanus.net/codrops/2026/01/04/efecto-building-real-time-ascii-and-dithering-effects-with-webgl-shaders/) ·
[Codrops: Dithering Shader](https://tympanus.net/Development/DitheringShader/) ·
[system.css](https://sakofchit.github.io/system.css/)

**Для Atlas.**
- Берём: из «Surveillance Design» только одно — приборную полосу с
  таймкодом и показаниями, и то потому, что показания настоящие
  (`LivePing`, `SignalTrace`).
- Не берём: хром, глитч, CRT-кривизну, дизер как фон.
- Почему: глитч означает поломку, а продукт продаёт отсутствие просадок.
  Глитч на сайте ускорителя противоречит обещанию. Дизер к 2027 году
  станет пресетом.

---

## 7. AI-native эстетика и анти-AI-полировка

**Что это к концу 2026.** Первичный источник теперь — сама Anthropic.
Блог [Improving frontend design through Skills (12.11.2025)](https://claude.com/blog/improving-frontend-design-through-skills)
вводит «distributional convergence»: «Safe design choices–those that
work universally and offend no one–dominate web training data». В
текущей версии скилла
[frontend-design](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md)
(версия, установленная в этом окружении в сентябре 2026) перечислены
пять кластеров, вокруг которых собирается сгенерированный дизайн:

1. тёплый кремовый фон (около `#F4F1EA`), контрастная антиква,
   терракотовый акцент;
2. почти чёрный фон с одним ярким кислотно-зелёным или
   киноварным акцентом;
3. газетная вёрстка: волосяные линейки, **нулевой радиус**, плотные
   колонки;
4. SaaS-набор: одинаковые скруглённые карточки, серая тень,
   градиентные заливки;
5. шаблонная обвязка: разреженные ПРОПИСНЫЕ надзаголовки, мета через
   «·», тонированный почти-чёрный `#0B0B0B` вместо чёрного,
   моноширинный шрифт для мелких подписей данных, «→» в конце ссылки.

Документация модели [Sonnet 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5)
добавляет механизм: общие запреты («не используй этот цвет»)
переводят модель на другую фиксированную палитру, а не дают
разнообразия.

**Анти-AI как тренд.** Это «proof of hand» из п. 5 и «Punk Grunge»
у Kittl. Честная оценка: анти-AI-полировка сама стала стилем с
узнаваемым набором (зерно, наивный рисунок), и её тоже воспроизводят
генераторы — см. статью [illustration.app](https://www.illustration.app/blog/how-to-design-anti-ai-aesthetics-without-traditional-skills)
о том, как получить «анти-AI» эстетику без навыков. Шероховатость
отличает от шаблона ровно до тех пор, пока её не начали делать
автоматически.

**Живые примеры AI-native.** [Cerebrium](https://www.awwwards.com/sites/cerebrium)
(ИИ-инфраструктура: WebGL-глобус, калькулятор цены) ·
[Why Zero](https://www.awwwards.com/sites/why-zero) ·
[Oryzo AI](https://www.awwwards.com/sites/oryzo-ai): Lusion подаёт
пробковую подставку под чашку как запуск ИИ-продукта; прочтение как
пародию на жанр — моя интерпретация **[не проверено]**.

**Для Atlas.**
- Берём: список кластеров как чек-лист ревью каждого экрана.
  Отличаться от генератора должен смысл и предмет, а не фактура.
- Не берём: шероховатость как приём.
- Почему: главный вывод этого раздела — **редакционный корпус Atlas
  частично совпадает с кластерами 3 и 5**. Разбор — в разделе
  «Противоречия с CLAUDE.md».

---

## 8. Liquid glass / spatial UI в вебе

**Что работает в браузере.** Мало что.
[kube.io (4.09.2025)](https://kube.io/blog/liquid-glass-css-svg/):
«Only Chrome currently supports using SVG filters as backdrop-filter»,
а любое изменение формы пересобирает карту смещения. В W3C
[svgwg #1142 (25.06.2026)](https://github.com/w3c/svgwg/issues/1142)
только открыли запрос на стандартизацию преломления фона и упоминают
баг WebKit 245510. [The Plus Addons](https://theplusaddons.com/blog/liquid-glass-ui/)
разбирает, насколько близко подходит CSS. Библиотеки на WebGL
([liquidGL](https://github.com/naughtyduk/liquidGL)) не видят живой
DOM под собой: WebGL не может читать пиксели страницы из соображений
безопасности (тот же svgwg #1142).

**Что сдулось.** Glassmorphism 2.0: по studiomeyer падение кадров на
15–30% (данные вендора), выжил только в навигации и модалках.
Liquid glass с Awwwards SOTD 2026 не найден ни одного **[поиск не дал
результатов, не значит, что их нет]**.

**Для Atlas.**
- Не берём ничего.
- Почему: стекло поднимает плоскость, а в системе поднятой плоскости
  нет. Эффект работает только в Chromium и стоит кадров на средних
  телефонах, а покупатель ускорителя замечает просадку первым. Старая
  рекомендация `docs/01_RESEARCH.md` п. 19 (стеклянная шапка) этим
  отменяется.

---

## 9. Editorial art direction (Obys)

**Что удержалось.** Это самая устойчивая ветка. Obys в
июле 2026 перезапустили сайт
([The New Obys, Awwwards 1.07.2026](https://www.awwwards.com/the-new-obys.html)).
Работа началась со шрифта: собственный неогротеск OTF Obys NG. Стек:
Bun, React только как серверный шаблонизатор, собственная система
движения на rAF и Web Animations API, WebGL, обычный CSS. Принципы
оттуда же: «clarity comes not from adding more, but from having the
confidence to leave things out», движение — «functional guide, not
decoration». [Codrops (6.03.2026)](https://tympanus.net/codrops/2026/03/06/obys-the-small-studio-designing-big-digital-narratives/):
«We often approach websites the way editors approach long-form
publications».

**Что под вопросом.** Сама редакционная форма — линейки, нулевой
радиус, колонки — к концу 2026 года попала в кластер №3 AI-дефолтов.
Obys держатся на собственном шрифте и на 1201 узле плотного набора в
первом экране (`05_MOTION.md`), а не на линейках.

**Живые примеры.** [obys.agency](https://obys.agency/) ·
[The New Obys](https://www.awwwards.com/the-new-obys.html) ·
[grids.obys.agency](https://grids.obys.agency) ·
[Typography Principles](https://www.awwwards.com/sites/typography-principles) ·
[exoape.com](https://www.exoape.com/) · [locomotive.ca](https://locomotive.ca/en)

**Для Atlas.**
- Берём: постерный первый кадр, работу вычитанием, движение как
  указатель.
- Не берём: линейку как главный признак стиля.
- Почему: отличие Obys даёт шрифт, нарисованный под студию, и
  плотность. У Atlas шрифт свободный (Sofia Sans), поэтому его роль
  должна взять **выключка по ширине** и **материал** (поле сигнала),
  а не линейки и колонки.

---

## 10. Machine Experience (MX): llms.txt, agents.json, WebMCP

**llms.txt.**
- Google Search: не нужен. [Search Engine Journal (20.05.2026)](https://www.searchenginejournal.com/googles-llms-txt-guidance-depends-on-which-product-you-ask/575431/):
  руководство Google относит llms.txt к тактикам, которые можно
  пропустить. Mueller сравнил его с meta keywords, Illyes подтвердил,
  что поддержки нет.
- Google Chrome: проверяет. Lighthouse 13.3.0 (7.05.2026) включил
  категорию Agentic Browsing по умолчанию, и в ней есть аудит llms.txt:
  файл доступен в корне, есть H1, есть ссылки; 404 = Not Applicable,
  ошибка 5xx = провал
  ([pikaseo](https://pikaseo.com/articles/google-llms-txt-lighthouse-contradiction-2026)).
- Anthropic публикует свои файлы:
  [platform.claude.com/llms.txt](https://platform.claude.com/llms.txt)
  и `code.claude.com/docs/llms.txt` (ссылка на него стоит в шапке
  [документации Claude Code](https://code.claude.com/docs/en/best-practices)).
- Краулеры почти не запрашивают файл: 408 обращений из 500 млн визитов
  ИИ-ботов, внедрение около 10% по выборке SE Ranking
  ([geojacker](https://geojacker.com/llms-txt),
  [limy](https://limy.ai/blog/llms-txt-in-2026-the-full-guide)) —
  **[не проверено, первоисточник не найден]**.

**WebMCP.** Черновик W3C Community Group (23.04.2026), «not on the
Standards Track». Реализация есть только в Chrome 146 за флагом
([studiomeyer, май 2026](https://studiomeyer.io/en/blog/webmcp-reality-check-may-2026)).
API — `navigator.modelContext.registerTool()`
([DataCamp](https://www.datacamp.com/tutorial/webmcp-tutorial)).
Об origin trial в Chrome 149, объявленном на Google I/O 19.05.2026,
пишет [dev.to](https://dev.to/ai-agent-economy/webmcp-in-2026-which-browsers-support-navigatormodelcontext-complete-compatibility-status-1oe4),
studiomeyer о нём не упоминает **[не проверено]**.

**agents.json.** Стандарта нет: минимум три несовместимые
спецификации с одним именем
([jmilinovich](https://github.com/jmilinovich/agents.json),
[wild-card-ai, v0.1.0](https://github.com/wild-card-ai/agents-json),
[jsonagents.org](https://jsonagents.org/)).

**Итог по MX.** llms.txt стоит ноль и проверяется Lighthouse, но на
выдачу в поиске не влияет. WebMCP реален, но экспериментален.
agents.json — пока шум.

**Для Atlas.**
- Берём: статический `llms.txt` (сейчас в `src/` и `public/` нет ни
  llms.txt, ни robots, ни sitemap — `find` ничего не нашёл). Кроме
  того — семантический HTML и единственную точку structured data
  (`SiteJsonLd`).
- Отложено: WebMCP-инструменты «узнать задержку до узла» и «сравнить
  тарифы» — как прогрессивное улучшение с проверкой
  `'modelContext' in navigator`, после выхода из origin trial.
- Не берём: agents.json.
- Ограничение: llms.txt — публичный текст, поэтому на него
  распространяется словарь витрины: «VPS-ускоритель», без слова «VPN»
  и без названий протоколов. Числа — только из `plans.ts`,
  `locations.ts`, `remnawave.ts`.

---

## Trend Matrix

| тренд | зрелость | риск устареть к 2027 | берём | как адаптируем для Atlas |
|---|---|---|---|---|
| Neo-brutalism (толстая рамка, жёсткая тень, заливка) | peak → fading | высокий: стал библиотекой компонентов | нет | нулевой радиус и волосяная линия уже в системе; тень и заливку не берём |
| Tactile (зерно, сканлайны) | peak | высокий | нет | фактура на светлом = грязь; материал даёт поле сигнала |
| Bento как первый экран | peak (дефолт) | высокий на витрине, низкий в продукте | только кабинет | витрина — рваная сетка на одном модуле `--gh-col` |
| Anti-grid brutalism | emerging | средний: держится на типографике | частично | нарушение сетки только одно на экран и всегда на общем модуле |
| Kinetic typography в теле страницы | fading | высокий | нет | — |
| Kinetic / архитектурная типографика в первом экране | peak | низкий, если не мешает чтению | да (уже) | выключка `100cqw/k`, ось веса; один кинетический момент на страницу |
| Монохромный корпус + один насыщенный акцент | peak, устойчиво | низкий | да (уже) | цвет = измерено; ультрамарин на бумаге, лайм на плите |
| Неон на тёмном | fading | высокий | нет | — |
| Тёплый off-white | peak | высокий: кластер AI-дефолта №1 | нет | остаётся `#FFFFFF` |
| Organic / naive / hand-drawn | peak в графике, emerging в вебе | средний | нет в форме | «доказательство устройства» вместо «доказательства руки»: живые показания |
| Y2K / chrome / pixel | fading | высокий (2–3 года по Setproduct) | нет | — |
| Glitch / CRT | fading | высокий; противоречит продукту | нет | — |
| Дизер / ASCII / полутон шейдером | peak | высокий: пресет в Unicorn Studio | нет | при нужде 1-битной отрисовки холста — только как способ показать данные, не фон |
| AI-native (сцена + глобус + калькулятор) | peak | средний | нет как стиль | — |
| Анти-AI-шероховатость | peak | высокий: её генерируют | нет | отличие через предмет и замер, чек-лист пяти кластеров |
| Liquid glass в вебе | emerging (платформа не готова) | н/д: стандарта нет | нет | — |
| Editorial art direction (Obys) | peak, устойчиво | средний: форма в кластере №3 | да, по сути | постерный кадр и вычитание; отличие — выключка и материал, а не линейки |
| llms.txt | peak по внедрению, спорно по эффекту | низкий: дёшево | да | статический файл по словарю витрины |
| WebMCP | emerging | низкий: стандарт идёт | позже | инструменты «задержка» и «тарифы» с проверкой наличия API |
| agents.json | emerging, раздроблен | высокий | нет | — |
| WebGL-сцена как условие SOTD | peak | низкий | уже есть холсты | `SignalField` и `SignalTrace`; второй холст запрещён CLAUDE.md |

---

## Противоречия с текущим «Редакционным корпусом» (CLAUDE.md)

Каждый пункт — с тем, что его подтверждает и что опровергает.

### 1. Главное: форма корпуса совпадает с AI-дефолтами

**Что пишет CLAUDE.md.** Нулевой радиус — «не приём, а материал».
Линейка и инверсия заменяют тень. Дисплей всегда прописными. Лайм на
чёрной плите.

**Что опровергает.** Текущий frontend-design от Anthropic называет
«broadsheet-style layout with hairline rules, zero border-radius,
dense newspaper-like columns» кластером №3, а «near-black background
with a single bright acid-green accent» — кластером №2. Скилл при этом
сам входит в обязательный процесс Atlas (CLAUDE.md, «Design
Standard»). То есть геометрия и палитра, которыми CLAUDE.md
обосновывает уход от SaaS-набора, к сентябрю 2026 года стали
признаком сгенерированной страницы.

**Что подтверждает корпус.**
- Скилл оговаривает: «All traits are legitimate for some briefs… Where
  the brief pins down a visual direction, follow it exactly».
- Замер `04_COLOR_2027.md`: ноль радиуса у 8 из 28 референсов (obys,
  locomotive, exoape, antinomy, immersive, resn, activetheory,
  Perplexity) — редакционный лагерь существует у студий.
- Три пункта кластера №5 Atlas уже обходит: чёрный чистый `#000`, а не
  тонированный; моноширинного нет; разделителя «·» в правилах нет.

**Вывод.** Корпус оставлять можно, но отличие Atlas от генератора
должно держаться на том, чего у генератора нет: выключка по ширине,
цвет только для измеренного, настоящие показания с устройства. На
линейке и нулевом радиусе оно больше не держится.

**Сверено с кодом главной.** В комментарии `Home.tsx` (стр. 36–38)
прямо сказано, что капслок-надзаголовков, строк через «·», «→» в
кнопках и моноширинных меток на странице нет. В
`graticule-home.css` прописные стоят только у дисплейных строк
(`.gh-h2`, `.gh-lap-title`, `.gh-price-figure`), а не у подписей.
Одно отклонение всё же есть: `Home.tsx:188` —
`готово · {CLOSEST.cities[0]}`. Это ровно мета-строка через среднюю
точку из кластера №5.

### 2. «Каждый блок анимирован: load / scroll / hover / idle. Без исключений»

**Противоречит:**
- frontend-design: «fade-and-slide-up entrances on each section and
  hover transitions on every card are the generic default and read as
  AI-generated»;
- `05_MOTION.md`: движения по прокрутке у Atlas 491 при медиане 330,
  у 14 из 20 референсов нулевой покой;
- самому CLAUDE.md, где сказано «холостого движения ровно два»;
- Obys: «Motion as a functional guide, not decoration».

**Подтверждает** только мега-промт (раздел 0, п. 4; раздел 7).

**Предложение.** Переписать требование: у каждого блока **определено**
поведение в четырёх состояниях, и «нет движения, намеренно» —
допустимое значение.

### 3. «Запрещены счётчики цифр» и бегущие числа

В CLAUDE.md одновременно стоят запрет «счётчики цифр» и
`@property` для бегущих чисел, `RollingNumber`, `--lap-n`. Это не
противоречие по смыслу, если развести так: запрещён отсчёт ради
эффекта (0 → 19 стран), разрешён показ меняющегося измеренного
значения (процент прогресса сцены, отклик). Формулировку стоит
уточнить, иначе следующий заход прочитает её буквально.

### 4. Цвет и корпус — подтверждено

- Чистый `#FFFFFF` против тёплого off-white: подтверждено. Тёплый
  кремовый — кластер №1.
- `#000` против `#0B0B0B`: подтверждено. Тонированный почти-чёрный —
  в кластере №5.
- «Моноширинной в системе нет»: подтверждено. Моноширинный для
  подписей данных — в кластере №5.

### 5. Тени, стекло, mesh-градиенты — подтверждено

Отказ от теней в CLAUDE.md сходится и с данными studiomeyer о
glassmorphism, и с отсутствием стандарта для liquid glass.
Рекомендации старого `docs/01_RESEARCH.md` (п. 16–19: off-white, тени
как единственная глубина, mesh-градиенты, стеклянная шапка)
противоречат и CLAUDE.md, и этому разделу. Их нужно считать
отменёнными.

### 6. «Второй холст нельзя» против победителей Awwwards

Пять из шести проверенных победителей 2026 года работают на WebGL.
CLAUDE.md разрешает один холст прибора и одно поле сигнала. Это
осознанное ограничение ради скорости, а скорость — предмет продукта.
Противоречие с «нормой жанра» есть, но аргумент CLAUDE.md сильнее для
этого продукта: сайт ускорителя, который тормозит, опровергает сам
себя.

### 7. Шрифт

CLAUDE.md выбрал Sofia Sans замером по оси веса. У Obys отличие даёт
собственный шрифт (OTF Obys NG), а `research/02_AGENCIES.md` (вывод 3)
показал: у студий гарнитура собственная или лицензионная. Свободный
гротеск — слабое место относительно эталона ребрендинга. Решение —
либо лицензионный шрифт с кириллицей, либо сохранить Sofia Sans и
держать отличие на выключке. Это вопрос к фазе B, а не к A1.
