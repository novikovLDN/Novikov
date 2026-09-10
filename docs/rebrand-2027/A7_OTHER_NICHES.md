# A7 — Стиль из других ниш для направления «Атлас»

Ребрендинг Atlas Secure, фаза B → C. Дата: 10 сентября 2026. Основание:
`CONCEPTS.md` (направление 2 «Атлас»), `00_PHASE_A_REPORT.md`, метод —
`MEGA_PROMPT_agency_redesign_2026-2027.md`.

Поправка владельца, дословно: «атлас, но стильно, трендово и
нестандартно, не под VPN-стилистику, а под стиль и тренды других
ниш». Поэтому в этой выборке нет ни одного хостинга, VPN, dev-tools или
SaaS. Источник языка: мода, ювелирка и часы, отели и тревел,
архитектура и ландшафт, музеи и галереи, издательства и архивы, музыка,
кино, предметный дизайн.

## Оглавление

0. [Метод и оговорки](#0-метод-и-оговорки)
1. [Выборка: 32 адреса, 30 замерено](#1-выборка)
2. [Разбор 30 сайтов](#2-разбор-30-сайтов)
3. [Сводная таблица замера](#3-сводная-таблица-замера)
4. [Тренды этих ниш 2026→2027 в цифрах](#4-тренды-этих-ниш-20262027-в-цифрах)
5. [Десять решений для «Атласа»](#5-десять-решений-для-атласа)
6. [Что в концепции «Атласа» звучит как VPN и чем это заменить](#6-что-в-концепции-атласа-звучит-как-vpn-и-чем-это-заменить)
7. [Шрифтовые пары с кириллицей](#7-шрифтовые-пары-с-кириллицей)
8. [Что не удалось проверить](#8-что-не-удалось-проверить)
9. [Источники](#9-источники)

---

## 0. Метод и оговорки

**Отбор.** Только сайты с отметкой 2025–2026 на живой витрине:
Awwwards (SOTD, SOTM, Honorable Mention, Nominee, с датой на карточке)
или Siteinspire (дата публикации на странице сайта). Каждая карточка
открыта, живой адрес взят с неё. Приоритет — сайты с мотивом карты,
маршрута, архива, каталога, указателя. Таких в выборке 12 из 30.

**Замер.** Headless Chromium (headless shell 1243, SwiftShader),
окно 1440×900. Скрипт `docs/rebrand-2027/refs/a7-probe.cjs` сделан на
основе `a2-probe.cjs`. Добавлено:

- hex-цвета фона `body`/`html`, фона под точкой (50%, 75%) экрана и
  цвета текста;
- загруженные гарнитуры (`document.fonts`, статус `loaded`) и три
  гарнитуры с наибольшим объёмом видимого текста;
- крупнейший HTML-текст первого экрана: кегль, насыщенность, регистр
  (`text-transform`), трекинг, цвет;
- доля первого экрана под `<img>`/`<video>`;
- закрытие баннера cookie по тексту кнопки до снимка;
- снимок с `animations: 'disabled'`, если обычный виснет (не
  понадобился ни разу). Ожидание 6,5 с. The Watch, Tandjung Sari и
  Kronborg перемерены с ожиданием 18 с.

Сырой JSON — `docs/rebrand-2027/refs/a7-probe.json`, кадры —
`docs/rebrand-2027/refs/a7/<имя>.jpg`.

**Где замер врёт, честно:**

1. «Крупнейший текст» видит только HTML-текст. Заголовки в SVG, на
   холсте или картинкой не считаются. Поэтому у Eladio Dieste,
   Siena Film, Whole Earth Index и Tandjung Sari реальный крупнейший
   набор больше замеренного — это видно на кадрах.
2. «Доля под изображением» не видит CSS-фоны и холст. У Eladio Dieste
   фото — фон, замер даёт 0%, кадр — 100%. Поэтому раздел 4 делит
   первые экраны по кадрам, а не по этой цифре.
3. `startViewTransition` в бандле найден у 15 из 30, но это часто код
   роутера Next/Nuxt. Использованием считается только правило
   `@view-transition`/`::view-transition` в CSS того же источника:
   7 из 30. Чужие стили замер не читает, так что это нижняя граница.
4. Нативные scroll-driven-анимации (`ScrollTimeline`/`ViewTimeline`)
   считаются по `document.getAnimations()`. JS-анимации GSAP туда не
   попадают, поэтому «бесконечные анимации» — это CSS/WAAPI, а не всё
   холостое движение. Холостой rAF отдельно: частота вызовов
   `requestAnimationFrame` за 2 с покоя.
5. Даты Siteinspire — даты публикации на витрине, а не запуска сайта.

---

## 1. Выборка

32 адреса, 30 ответили. Brunello Cucinelli и Cartier отдали безголовому
браузеру `403 Access Denied` (Akamai), как и в A2.

| # | Сайт | Ниша | Признание, дата | Кто сделал | URL |
|---|---|---|---|---|---|
| 1 | White Desert | тревел-люкс, экспедиции | Awwwards HM + Developer, 07.08.2026 | Malvah, Geoff Dawes, Usudo | https://white-desert.com/ |
| 2 | ishikawa.co — Walkable Atlas | личный медиа-архив, издательство | Awwwards HM, 16.08.2026 | Hidekazu Ishikawa | https://ishikawa.co/en/ |
| 3 | Tracing Art (Getty) | музей, архив провенанса | Awwwards SOTD 22.07.2025, SOTM июль 2025 | Resn, Getty | https://www.getty.edu/tracingart/ |
| 4 | Eladio Dieste | архитектура, наследие | Awwwards HM, 01.08.2026 | ++hellohello, Pablo Picart, Ismael Martínez, SEB® | https://www.eladiodieste.com/ |
| 5 | Reed Hilderbrand | ландшафтная архитектура | Siteinspire, август 2026 | [не проверено] | https://reedhilderbrand.com |
| 6 | Mosby's Files | архитектурный архив | Awwwards SOTD, 13.08.2026 | Tubik | https://www.mosbyfiles.com/ |
| 7 | Whole Earth Index | архив изданий | Siteinspire, 08.09.2026 | не указано | https://wholeearth.info/ |
| 8 | archivio-uno | архив независимых журналов | Siteinspire, 06.07.2026 | не указано | https://archivio-uno.com/ |
| 9 | James Joyce Tower | музей писателя | Siteinspire, август 2026 | [не проверено] | https://joycetower.ie |
| 10 | Kronborg | музей, замок (Nationalmuseet) | Siteinspire, август 2026 | [не проверено] | https://kronborg.dk |
| 11 | Mennour | галерея | Siteinspire, 15.05.2026 | Atelier trois | https://mennour.com |
| 12 | Centre de la photographie Genève | институция фотографии | Siteinspire, июль 2026 | [не проверено] | https://centrephotogeneve.ch |
| 13 | Cecilie Bahnsen | мода | Awwwards HM, 28.07.2026 | Signifly | https://ceciliebahnsen.com |
| 14 | Miu Miu — A House that we shaped | мода, промо | Awwwards SOTD + Developer, 25.08.2026 | Merci Michel | https://immersivebags.miumiu.com/ |
| 15 | Weekend Max Mara — The Tuscan Journey Begins | мода, промо-путешествие | Awwwards HM, 25.07.2026 | MONOGRID | https://weekend-mm-2026-pasticcino-bag-master.monogrid.io/en/ |
| 16 | The Watch (FS 60P) | часы | Awwwards SOTD + Developer, 17.08.2026 | 60fps | https://thewatch.60fps.fr/ |
| 17 | Coutumes | ювелирка | Siteinspire, май 2026; Awwwards Nominee 05.09.2026 | index | https://www.coutumes.com |
| 18 | KUBE Saint-Tropez | отель | Awwwards Nominee, 27.08.2026 | Digidop | https://www.kubehotel-saint-tropez.com/fr |
| 19 | Tandjung Sari | отель | Awwwards HM, 05.08.2026 | Fleava | https://www.tandjungsarihotel.com/ |
| 20 | Vander Hotel | отель | Awwwards Nominee, 29.08.2026 | .RAW | https://www.vanderhotel.com |
| 21 | Hedwig: Curated Travel | тревел | Awwwards HM, 19.04.2026 | catarisso | https://hedwigtravel.com/ |
| 22 | Kononenko Architectural Bureau | архитектура | Awwwards SOTD, 23.08.2026 | Reksa Andhika, Artem Shcherban | https://kononenkogroup.com |
| 23 | Franklin Azzi | архитектура, интерьер | Siteinspire, 24.08.2026 | Base Design | https://franklinazzi.fr/en |
| 24 | Stephen Kent Johnson | фотография интерьеров | Siteinspire, август 2026 | [не проверено] | https://stephenkentjohnson.com |
| 25 | Paul Kalkbrenner | музыка | Awwwards SOTD, 02.09.2026 | HOLOGRAPHIK, Ilja van Eck | https://www.paulkalkbrenner.net/ |
| 26 | Beats in Space | радио, лейбл | Siteinspire, 06.07.2026 | Thomas Hervé Studio | https://www.beatsinspace.net/ |
| 27 | Paysages Studio | звуковые среды | Awwwards HM, 15.07.2026 | Demande Spéciale | https://paysages.studio/ |
| 28 | Big Sur | керамика, предметы | Awwwards HM, 04.08.2026 | Katarina Markina | https://bigsurceramics.com |
| 29 | Siena Film Foundation | кино | Awwwards SOTD 18.03.2025, SOTM март 2025 | Niccolò Miranda, Federico, G-NS Studio | https://siena.film |
| 30 | Aardvark Book Club | книги, клуб | Awwwards SOTD, 30.08.2026 | FUTURE THREE®, Eduard Bodak, Dylan Brouwer | https://aardvarkbookclub.com |
| — | Brunello Cucinelli — AI E-com | мода | Awwwards SOTD, 09.07.2026 | makemepulse | https://shop.brunellocucinelli.com/en-gb/ai — **403** |
| — | Cartier Watches & Wonders 2026 | часы | Awwwards SOTD, 25.05.2026 | Immersive Garden | https://www.cartier.com/en-fr/watchesandwonders — **403** |

По нишам: отели и тревел 5, архитектура и ландшафт 5, музеи и
галереи 5, издательства и архивы 5, мода 3, музыка и звук 3, часы и
ювелирка 2, кино 1, предметы 1. **Парфюмерии нет**: нашлись только
Awwwards HM 2021 года (Apotheke, 22.06.2021) и 2024 года (Rahasya,
01.11.2024), оба старше порога. См. раздел 8.

«Nominee» у Awwwards — не награда, а поданная работа с голосами. Такие
сайты (Vander, KUBE, Coutumes) взяты за арт-дирекцию. У Coutumes есть
ещё публикация Siteinspire.

---

## 2. Разбор 30 сайтов

Формат: ниша · главная идея · одна техника для «Атласа» · чем
реализовано (по замеру) · слабое место. Кадр первого экрана —
`refs/a7/<имя>.jpg`.

### Мотив карты, маршрута, архива (12)

**1. White Desert** — тревел-люкс. `white-desert.jpg`
- **Идея.** Место как заголовок. «ANTARCTICA» набрано во всю ширину
  поверх фильма, рядом маленький курсив: «Luxury and adventure in the
  most remote place on Earth».
- **Техника.** Название места в ширину колонки плюс строка антиквы-
  курсивом, смещённая к краю. Волосяные вертикали колонок видны прямо
  поверх видео: сетка — отдельный слой, а не рамка.
- **Замер.** Фон `#FFFFFF`, текст `#1F2A44`. Oswald 256 px прописными,
  Cardinal Classic Long (курсив подписи), Inter Tight. Next.js, GSAP +
  ScrollTrigger, Lenis, Motion, правило `@view-transition` в CSS.
  Видео 100% первого экрана. 3 бесконечные анимации, JS 3,9 МБ.
- **Слабое.** Oswald — самая типовая бесплатная узкая гарнитура.
  Навигация плашками-«кнопками» как в шаблоне.

**2. ishikawa.co — Walkable Atlas** — медиа-архив. `walkable-atlas.jpg`
- **Идея.** Шесть изданий автора — мир, по которому идёшь (Act I,
  горизонталь). В конце мир «раскалывается, падает вместе с
  путешественником и собирается в вертикальную карту, которая помнит
  путь» (Act II, making-of).
- **Техника.** **Маршрут в финале становится указателем**. Прогулка —
  не аттракцион, а способ собрать оглавление. HTML читается без JS:
  «информация отрисована на сервере, JS поднимает её в атлас».
- **Замер.** Фон `#FFFFFF`, текст `#1F1F1F`. Ishikawa Klee (рукописная),
  Helvetica Neue, SF Mono. 6 холстов, только 2D, ни одной библиотеки.
  По making-of: не больше 1400 частиц, p95 кадра 14,2 мс,
  reduced-motion сохраняет оба акта. 25 бесконечных анимаций.
- **Слабое.** Управление A/D — ворота к содержанию. Милый человечек —
  тон детской книги, а не люкса.

**3. Tracing Art (Getty)** — музей, провенанс. `getty-tracing-art.jpg`
- **Идея.** Путь предмета между владельцами за пять веков. Он показан
  хронологией (1669–1944) и сетью людей, а не картой (разделы «Tracing
  a Painting Through Time», «Artists as Collectors»).
- **Техника.** **Биография объекта**: одна вещь проходит по оси
  времени, у каждой остановки подпись с именем и датой. Для «Атласа» —
  путь соединения читателя как цепочка подписанных остановок, а не
  граф сети.
- **Замер.** Фон белый (прозрачный), текст `#000000`. Bardford
  (антиква) 54 px строчными + Graphik. WebGL 2, three r167, GSAP +
  ScrollTrigger + SplitText, Lenis, Nuxt. 0 бесконечных.
- **Слабое.** Центрованный заголовок в окружении летающих картинок —
  частый ход. WebGL ради плавающих изображений тяжёл.

**4. Eladio Dieste** — архитектура. `eladio-dieste.jpg`
- **Идея.** Имя инженера разнесено по двум углам кадра («Eladio» слева
  сверху, «Dieste» справа снизу). Работы — хронология 1947–1986.
- **Техника.** **Навигация лежит на одной горизонтальной линии через
  весь экран** (Inicio · Obra · Vida · Carrera · English), поверх
  фотографии кирпичного свода. Это линия рамки листа, и она же меню.
- **Замер.** Фон `#000000`, цвет текста `#A55F2D` (кирпич), бумага
  набора `#EADFD2`. Одна самохостная гарнитура-гротеск. 2D-холст,
  GSAP + ScrollTrigger + SplitText, Lenis, Next.js. 0 бесконечных,
  JS 848 КБ.
- **Слабое.** Гигантское имя не HTML-текст: крупнейший замеренный
  текст 18 px. Для поиска и скринридера заголовка нет [вывод по замеру].

**5. Reed Hilderbrand** — ландшафтная архитектура. `reed-hilderbrand.jpg`
- **Идея.** Проект показан как полевое наблюдение. Видео зелени в
  эллипсе, по краю эллипса точки, как пикеты съёмки. Подпись курсивом:
  «Sep 2024, 83°F / Overcast clouds».
- **Техника.** **Показание как подпись к кадру**: дата, температура,
  облачность в голосе натуралиста. Это та же позиция «измерено, а не
  заявлено», только без приборной эстетики.
- **Замер.** Lyon (антиква, Commercial Type) + Basel. 5 видео,
  2D-холст, SvelteKit, GSAP + ScrollTrigger, `@view-transition` в CSS.
  JS 217 КБ — самый лёгкий из видео-сайтов. 0 бесконечных.
- **Слабое.** Эллипс — декоративная маска. Тёмный видео-кадр тяжёл для
  LCP [не замерено].

**6. Mosby's Files** — архитектурный архив. `mosby-files.jpg`
- **Идея.** Архив ранних американских архитекторов — папки с
  ярлыками. «CSS-only skeuomorphic folder system, where navigation is
  part of the concept» (карточка Awwwards).
- **Техника.** **Ярлыки папок = навигация**: корешки выступают над
  стопкой. Для «Атласа» — корешки листов, стопка карт.
- **Замер.** Фон `#191919`, текст `#FDFAF7`. Founders Grotesk (узкий
  заголовок), Signifier (антиква, имена), IBM Plex Mono (описания).
  GSAP + SplitText, Lenis, Nuxt. Холста нет, 0 бесконечных.
- **Слабое.** Пять насыщенных основных цветов — «баухаус для детей».
  Абзацы моноширинным утомляют.

**7. Whole Earth Index** — архив изданий. `whole-earth.jpg`
- **Идея.** Почти полный архив Whole Earth Catalog 1968–2002: шесть
  серий в сетке, у каждой свой исторический логотип.
- **Техника.** **Нумерация кругом ① — ⑥ в углу ячейки** и волосяная
  сетка. Указатель издания, а не меню.
- **Замер.** Фон `#000000`, текст `#FFFFFF`. Whole Earth Modern (антиква
  с моно-метрикой, запасная — «Century Schoolbook Monospace»), Whole
  Earth Mono. Next.js, ни анимаций, ни rAF в покое, JS 929 КБ.
- **Слабое.** Своего бренда почти нет, сайт — оболочка для сканов.

**8. archivio-uno** — архив журналов. `archivio-uno.jpg`
- **Идея.** Главная — таблица каталога: title · year · country ·
  size (cm) · pages · print run · color/mono. Шапка — это заголовки
  колонок (archive, search, visit, about, submission) с фильтрами.
- **Техника.** **Каталог как интерфейс с измеренными колонками**
  («size (cm)», «print run»). Для «Атласа» — указатель стран и городов
  таблицей: страна · город · ориентировочно, мс · есть сервер.
- **Замер.** Белый фон, `#000000`. Baikal VAR. SvelteKit, 736
  изображений, 1069 видимых узлов, 0 анимаций, JS 297 КБ.
- **Слабое.** Плотность на грани нечитаемого. Красная наклейка
  перекрывает таблицу.

**9. James Joyce Tower** — музей писателя. `joyce-tower.jpg`
- **Идея.** Место как начало пути: «Ours is the Omphalos» и «It all
  begins with us» лесенкой, между ними строка подписей.
- **Техника.** **Светлая антиква в предложном регистре, 125 px** плюс
  строка-этикетка моноширинным разрядкой: «START YOUR ULYSSES JOURNEY ·
  VISIT JOYCE TOWER MUSEUM · SANDYCOVE POINT, DUBLIN BAY». Название
  места набрано как подпись на карте.
- **Замер.** apris (антиква) 125 px, насыщенность 300, без прописных.
  Poppins — навигация, моноширинный — подписи. GSAP + SplitText, swup
  (переходы страниц), `@view-transition`. 0 бесконечных.
- **Слабое.** Poppins в навигации. Закатное фото на грани стока.

**10. Kronborg** — музей-замок. `kronborg.jpg`
- **Идея.** Имя замка огромной антиквой прописными как шапка издания.
  По фото идёт тонкая линия-арка — рамка, повторяющая архитектуру.
- **Техника.** **Краска текста — ультрамарин `#0B11A0`, а не чёрный.**
  Одна «вторая краска» печати на весь набор (13,11:1 на белом).
- **Замер.** Фон `#FFFFFF`, текст `#0B11A0`. Suisse Works (антиква)
  88 px прописными, трекинг −2,64 px, Suisse Intl. Motion, Nuxt.
  0 бесконечных в первом экране, 3 после прокрутки.
- **Слабое.** Окно согласия cookie закрывает центр первого экрана: это
  Usercentrics в shadow DOM, скрипт его не закрыл. Золотая кнопка
  плюс ультрамарин — два акцента.

**11. Beats in Space** — радио и лейбл. `beats-in-space.jpg`
- **Идея.** Архив эфиров как карточный каталог. У каждой карточки
  номер, дата, длительность: «AM220 09 11 2026», «01:01:37».
- **Техника.** **Каталожный номер + дата + длительность как
  типографика карточки.** Для листа «Атласа» — «Лист 03 · 10 09 2026 ·
  19 стран».
- **Замер.** Фон `#F8F2FF` (сиреневый оттенок), текст `#000000`, marmo.
  Next.js, Motion. 20 бесконечных анимаций (бегущие строки), JS 6,3 МБ.
- **Слабое.** Шумно: 20 бегущих анимаций и лаймовая полоса плеера.

**12. Weekend Max Mara — The Tuscan Journey Begins** — мода, промо. `maxmara-tuscan.jpg`
- **Идея.** Коллекция как поездка на поезде по главам. В конце
  подарок: «Explore every chapter and receive a special gift».
- **Техника.** **Путь как главы с «билетом»**: карточка с рваными
  краями, пройденные главы отмечены.
- **Замер.** Nimbus Sans Extd 92 px прописными. WebGL 2, three r183,
  GSAP + ScrollTrigger + SplitText, jQuery. Предложение включить звук,
  ворота «Start now». JS 5 МБ. Средняя оценка жюри 9,09.
- **Слабое.** Рисованное «под Уэса Андерсона» — клише. Ворота, звук и
  5 МБ JS.

### Мода, часы, ювелирка (5)

**13. Cecilie Bahnsen** — мода. `cecilie-bahnsen.jpg`
- **Идея.** Кутюр-магазин, где всё несёт фотография. Логотип —
  разреженная антиква прописными.
- **Техника.** **Сдержанность интерфейса**: весь HTML-текст до 20 px,
  крупнейший элемент — изображение. Для «Атласа» — крупнейшим
  элементом должна быть карта, а не заголовок.
- **Замер.** Neue Haas Unica. Shopify, Swiper, WebGL нет. 89%
  первого экрана — фото. JS 8,4 МБ.
- **Слабое.** Типовая раскладка модного Shopify.

**14. Miu Miu — A House that we shaped** — мода, промо. `miumiu-house.jpg`
- **Идея.** Трёхмерный дом, в котором ищешь сумки.
- **Техника.** **Выключка словами и разрядкой в узкой колонке**:
  «A … HOUSE / THAT … WE / S H A P E D» — прямоугольник из слов,
  разнесённых к краям.
- **Замер.** Тёмно-синяя плита (карточка: `#0C0F60`, `#265ADF`), Work
  Sans 54 px, 700, прописными, трекинг 4 px. WebGL 2, three.js.
  Предложение включить звук, ворота «Enter».
- **Слабое.** Ворота и звук. Work Sans — типовой Google-шрифт.

**15. The Watch (FS 60P)** — часы. `the-watch.jpg`
- **Идея.** Часы в реальном времени WebGL между двумя половинами
  названия «FS | 60P». За ними кольцо шкалы из сегментов.
- **Техника.** **Предмет между словами заголовка** + кольцо шкалы как
  графика. Подпись «MODEL / 146GR», «Color / Silver Steel» — паспорт
  изделия.
- **Замер.** Фон `#EBEBEB`, Nekst 60 px прописными + Inter. WebGL 2,
  three r162, GSAP + ScrollTrigger, Lenis. «Now loading» дольше 6,5 с,
  кадр снят через 18 с.
- **Слабое.** Прелоадер. Без GPU первый экран пуст.

**16. Coutumes** — мужская ювелирка. `coutumes.jpg`
- **Идея.** Ювелирный лейбл устроен как журнал: «SEPTEMBER EDITION» в
  узком гротеске поверх диптиха фото, в меню «Magazine».
- **Техника.** **Сайт как выпуск**: номер и месяц издания. Для
  «Атласа» — «Издание сентября 2026», листы как тетради выпуска.
- **Замер.** Фон `#FFFFFF`/`#ECE9E2`. Plaak 3 (узкий гротеск) 173 px
  прописными `#F9AF26`, Exposure (вариативная антиква) в навигации.
  Shopify, GSAP + SplitText, `@view-transition`.
- **Слабое.** Жёлтое по фото местами нечитаемо. Кадр перекрыт баннером
  cookie.

**17. Brunello Cucinelli — AI E-com** и **Cartier W&W 2026** — не
замерены, 403. Описание по карточкам: у Brunello «pageless, intent-led
e-commerce» (makemepulse), у Cartier — «scrolling-based universe
navigation», three.js и GLSL (Immersive Garden).

### Отели и тревел (4)

**18. KUBE Saint-Tropez** — отель. `kube.jpg`
- **Идея.** Средиземноморская жизнь фотографиями.
- **Техника.** Глифическая антиква тонким начертанием прописными
  (Saphion, 300) — хоспиталити-люкс. Для «Атласа» это пример того,
  **чего избегать**: такой набор в нише уже код «бутик-отель».
- **Замер.** Фон `#FDF9F4`. Saphion 43 px + Inter Variable. Webflow,
  GSAP, Lenis, jQuery. JS 11,6 МБ. Всплывающее предложение при загрузке.
- **Слабое.** Всплывающее окно, Inter, лаймовая кнопка, 11,6 МБ.

**19. Tandjung Sari** — отель, Бали. `tandjung-sari.jpg`
- **Идея.** Историческая гостиница как горизонтальный рассказ.
- **Техника.** **Вертикальная рейка слева как корешок книги**: знак,
  меню, WhatsApp — всё в одной узкой полосе.
- **Замер.** Фон `#F1ECDE`, текст `#544F45`, знак `#7A1D31` (8,69:1).
  Optima, Adobe Caslon Pro, Helvetica. Nuxt, GSAP + SplitText, Lenis,
  OGL. Интро-логотип дольше 6,5 с.
- **Слабое.** Интро. Крем плюс тёмно-красный — классическая палитра
  отеля.

**20. Vander Hotel** — отель. `vander-hotel.jpg`
- **Идея.** Городская гостиница: маленькие снимки разбросаны вокруг
  заголовка.
- **Техника.** **Изображения как пометки на полях**: маленькие кадры по
  краям главного набора, а не герой во весь экран.
- **Замер.** Фон `#F4F2F1`, текст `#353230`. Söhne Buch 86 px
  прописными. Webflow, GSAP.
- **Слабое.** Рукописное «In the heart of the city» и кнопка в
  нарисованном овале — клише.

**21. Hedwig: Curated Travel** — тревел. `hedwig.jpg`
- **Идея.** Путешествия как плёночные снимки и редакционный текст.
- **Техника.** **Навигация по четырём углам** (ABOUT, OFFERINGS, READ,
  CONTACT). Кадр — лист, у которого подписаны углы.
- **Замер.** Белый фон, текст `#282828`, гротеск xgnl. Readymag, Motion.
  Фото 90% первого экрана. JS 11 МБ.
- **Слабое.** На кадре «READ» наезжает на абзац. Вес Readymag.

### Архитектура, интерьер, фотография (3)

**22. Kononenko Architectural Bureau** — архитектура. `kononenko.jpg`
- **Идея.** Рендеры во весь кадр, минимальный индекс.
- **Техника.** **Одно слово строки другой гарнитурой**: «Kononenko
  Architectural» гротеском, «Bureau» антиквой. Смешанная строка без
  цвета и без размера.
- **Замер.** Белый фон, две самохостные гарнитуры (гротеск и антиква).
  WebGL 2, three r184, GSAP, Lenis, Nuxt.
- **Слабое.** Рендеры CGI близки к стоку. Заголовок всего 60 px.

**23. Franklin Azzi** — архитектура и интерьер. `franklin-azzi.jpg`
- **Идея.** Бюро как указатель с поиском. Первый экран — слово
  «SEARCH», под ним сетка проектов.
- **Техника.** **Верхняя строка из трёх слов по ширине**: «OFFICE —
  FRANKLIN AZZI — NOTICE». Крайние слова — навигация, середина — имя.
- **Замер.** Фон `#FAF7F4`, текст `#262626`. Helvetica Condensed Bold
  76 px прописными, трекинг 3 px. Next.js, без библиотек анимации.
  JS 745 КБ.
- **Слабое.** Серое «SEARCH» на бумаге почти не видно.

**24. Stephen Kent Johnson** — фотография интерьеров. `stephen-kent-johnson.jpg`
- **Идея.** Контактный лист: весь архив сразу, без героя.
- **Техника.** **Мозаика плотностью «лист контролек»** — объект первого
  экрана из самого материала.
- **Замер.** Фон `#E4E4E4`, текст `#808080`. DIN 2014 Narrow. WordPress,
  jQuery, 279 изображений, JS 117 КБ.
- **Слабое.** Иерархии нет. 279 картинок на старте.

### Музеи, галереи, институции (2)

**25. Mennour** — галерея. `mennour.jpg`
- **Идея.** Главная — это текущая выставка.
- **Техника.** **Паспорт выставки как заголовок**: художник / название /
  даты / адрес — четыре строки по центру. Этикетка вместо слогана.
- **Замер.** Белый фон, MennourText 37 px, 700, прописными + MierB.
  Nuxt, Swiper. rAF в покое 0.
- **Слабое.** Карусель с круглыми стрелками — шаблон e-com.

**26. Centre de la photographie Genève** — институция. `centre-photo-geneve.jpg`
- **Идея.** Одна насыщенная краска поверх фотографии, больше ничего.
- **Техника.** **Идентичность держит один цвет набора** — оранжевый
  `#FFA500` (10,63:1 на чёрном).
- **Замер.** Фон `#000000`, гротеск stand-font 96 px. Nuxt, GSAP +
  SplitText.
- **Слабое.** Мелкие даты оранжевым по пёстрому фото нечитаемы.

### Музыка, звук, предметы, кино (4)

**27. Paul Kalkbrenner** — музыка. `kalkbrenner.jpg`
- **Идея.** Имя одной строкой через экран, между словами фотография
  размером с букву. Внизу полоса «Now playing / Sound OFF».
- **Техника.** **Изображение внутри строки.** Для «Атласа» — фрагмент
  изолиний между словами первого заголовка.
- **Замер.** ABC Diatype Plus Variable 150 px, 700, трекинг −7,5 px.
  Webflow, GSAP + SplitText, Lenis, Barba. **JS 27 МБ** — самый тяжёлый
  в выборке.
- **Слабое.** Вес. Приём «фото в строке» уже встречается часто.

**28. Paysages Studio** — звуковые среды. `paysages.jpg`
- **Идея.** Спокойные «пейзажи» звука: фото в размытых круглых окнах,
  текст машинописью.
- **Техника.** **Серо-зелёная бумага `#E7E9D2` и тёмно-зелёная краска
  `#3B4639`** вместо чёрного. Ближайший в выборке фон к бумаге «Атласа»
  `#ECEEE9`. Логотип строчной антиквой («paysages»), подпись «S T U D I O»
  разрядкой.
- **Замер.** Tarnac (антиква) + Rational TW Text (машинописная). Framer,
  Lenis, `@view-transition`. 2 бесконечные анимации.
- **Слабое.** В продакшне шрифт «Tarnac Unlicensed Trial» — триальная
  версия. Размытые круги расплывчаты по смыслу.

**29. Big Sur** — керамика. `big-sur.jpg`
- **Идея.** Ручная керамика: диптих «фото на столе / УФ-скан синим».
- **Техника.** **Живые часы в шапке** («08:06:13 PM») — показание
  момента вместо слогана.
- **Замер.** Белый фон. Monument Grotesk Variable, Gravity Variable,
  Diatype Variable. Чистый JS, `@view-transition`. 0 бесконечных.
- **Слабое.** Пиксельные чёрные фигуры случайны. Навигация неясна.

**30. Siena Film Foundation** — кино. `siena-film.jpg`
- **Идея.** Продакшн как фильм: логотип-титр, дальше лента кадров.
- **Техника.** **Переход страницы как монтажная склейка** (Taxi.js).
- **Замер.** Фон `#000000`, текст `#FAF7EF`. P22 Parrish Roman (титр),
  Neue Brucke, NB International. WebGL 2 со своим GLSL, GSAP, Lenis,
  Taxi, Webflow. Ворота «ENTER».
- **Слабое.** Ворота: содержимое за кликом.

**Контрпример. Aardvark Book Club** — книги. `aardvark.jpg`. Жёлтый
`#FFD24A`, Champ 120 px, «пилюли», 3D-книги на 2D-холсте, Barba.
Жюри дало SOTD, но это язык массового DTC. Для «Атласа» переносить
нечего. Полезно как граница: игривость и пилюли — не та ниша.

---

## 3. Сводная таблица замера

«Фон под центром» — первый непрозрачный фон под точкой (50%, 75%) в
момент снимка. `прозр.` значит, что у `body` и `html` фон не задан, то
есть белый по умолчанию. «∞» — бесконечные CSS/WAAPI-анимации первого
экрана.

| Сайт | Фон body/html → под центром | Цвет текста | Гарнитуры (по объёму текста) | Крупнейший HTML-текст | Холст | Библиотеки · платформа | ∞ | JS, КБ |
|---|---|---|---|---|---|---|---|---|
| white-desert | #FFFFFF → #FFFFFF | #1F2A44 | Cardinal Classic Long, Inter Tight, Oswald | 256 px, 400, ПРОПИСНЫЕ, Oswald | — | GSAP, Lenis, motion, @view-transition · next | 3 | 3979 |
| walkable-atlas | #FFFFFF → #FFFFFF | #1F1F1F | Ishikawa Klee, Avenir Next, SF Mono, Helvetica Neue | 13 px, 400, Helvetica Neue | 2D ×6 | — | 25 | 1145 |
| getty-tracing-art | прозр. → — | #000000 | Graphik, Bardford | 54 px, 400, Bardford | WebGL ×1 | three r167, GSAP, SplitText, Lenis · nuxt | 0 | 1410 |
| eladio-dieste | #000000 → #000000 | #A55F2D | font (самохост) | 18 px, 500 (имя не HTML) | 2D ×1 | GSAP, SplitText, Lenis · next | 0 | 848 |
| reed-hilderbrand | прозр. → #FFFFFF | #000000 | Lyon, Basel | 18 px, 400, Lyon | 2D ×1 | GSAP, @view-transition · sveltekit | 0 | 217 |
| mosby-files | #191919 → #581E70 | #FDFAF7 | IBM Plex Mono, Signifier, Founders Grotesk | 26 px, 400, Signifier | — | GSAP, SplitText, Lenis · nuxt | 0 | 3000 |
| whole-earth | #000000 → #000000 | #FFFFFF | Whole Earth Modern, Whole Earth Mono | 24 px, 400 (логотипы картинками) | — | — · next | 0 | 929 |
| archivio-uno | прозр. → — | #000000 | Baikal VAR | 16 px, 400 | — | — · sveltekit | 0 | 297 |
| joyce-tower | #000000 → #000000 | #000000 | poppins, apris | 125 px, 300, apris | — | GSAP, SplitText, swup, @view-transition | 0 | 2569 |
| kronborg | #FFFFFF → #FFFFFF | #0B11A0 | Suisse Intl, Suisse Works | 88 px, 400, ПРОПИСНЫЕ, Suisse Works | — | motion · nuxt | 0 | 5167 |
| mennour | прозр. → — | #000000 | MierB, MennourText | 37 px, 700, ПРОПИСНЫЕ, MennourText | — | swiper · nuxt | 0 | 3209 |
| centre-photo-geneve | #000000 → #000000 | #000000 (набор #FFA500) | stand-font | 96 px, 400 | — | GSAP, SplitText · nuxt | 0 | 570 |
| cecilie-bahnsen | прозр. → — | #000000 | Neue Haas Unica | 20 px, 400 | — | swiper · shopify | 0 | 8399 |
| miumiu-house | #FFFFFF → #FFFFFF (плита #0C0F60) | #FFFFFF | Work Sans | 54 px, 700, ПРОПИСНЫЕ | WebGL ×1 | three | 1 | 1352 |
| maxmara-tuscan | прозр. → — | #FFFFFF | Nimbus Sans, Nimbus Sans Extd | 92 px, 700, ПРОПИСНЫЕ | WebGL ×1 | three r183, GSAP, SplitText | 0 | 5009 |
| the-watch | прозр. → #EBEBEB | #FFFFFF | Inter, Nekst | 60 px, 400, ПРОПИСНЫЕ, Nekst | WebGL ×1 | three r162, GSAP, Lenis | 0 | 989 |
| coutumes | #FFFFFF → #ECE9E2 | #000000 | Exposure, Plaak 6, Plaak 3 | 173 px, 400, ПРОПИСНЫЕ, Plaak 3 | — | GSAP, SplitText, swiper, @view-transition · shopify | 0 | 2346 |
| kube | #FDF9F4 → оверлей | #000000 | Inter Variable, Saphion | 43 px, 300, ПРОПИСНЫЕ, Saphion | — | three (в бандле), GSAP, Lenis, swiper, @view-transition · webflow | 0 | 11596 |
| tandjung-sari | #F1ECDE → #F1ECDE | #544F45 | Helvetica, Optima, Adobe Caslon Pro | 28 px, 400, Optima | — | GSAP, SplitText, Lenis, ogl · nuxt | 0 | 1722 |
| vander-hotel | #F4F2F1 → #F4F2F1 | #353230 | Söhne Buch | 86 px, 400, ПРОПИСНЫЕ | — | GSAP · webflow | 0 | 2778 |
| hedwig | #FFFFFF → #FFFFFF | #282828 | xgnl | 32 px, 500 | — | motion · readymag | 0 | 10963 |
| kononenko | #FFFFFF → #FFFFFF | #000000 | n, h (гротеск + антиква) | 60 px, 400 | WebGL ×1 | three r184, GSAP, Lenis · nuxt | 0 | 1798 |
| franklin-azzi | #FAF7F4 → #D9D9D9 | #262626 | Helvetica (Condensed) | 76 px, 700, ПРОПИСНЫЕ | — | — · next | 1 | 745 |
| stephen-kent-johnson | #E4E4E4 → #E4E4E4 | #808080 | DIN 2014 Narrow, DIN 2014 | 14 px, 400, ПРОПИСНЫЕ | — | — · wordpress | 0 | 117 |
| kalkbrenner | #000000 → #FFFFFF | #000000 | ABC Diatype Plus Variable | 150 px, 700 | — | GSAP, SplitText, Lenis, barba · webflow | 2 | 27057 |
| beats-in-space | #F8F2FF → #F8F2FF | #000000 | marmo | 22 px, 400 | — | motion · next | 20 | 6335 |
| paysages | #E7E9D2 → #E7E9D2 | #000000 (набор #3B4639) | Rational TW Text, Tarnac | 24 px, 350 | — | Lenis, motion, @view-transition · framer | 2 | 1675 |
| big-sur | #FFFFFF → #FFFFFF | #000000 | Gravity, Monument Grotesk, Diatype (Variable) | 18 px, 400 | — | @view-transition | 0 | 1625 |
| siena-film | #000000 → #000000 | #FAF7EF | Neue Brucke, P22 Parrish Roman, NB International | 12 px (титр не HTML) | WebGL ×1 | GSAP, SplitText, Lenis, taxi · webflow | 0 | 1059 |
| aardvark | #FFFFFF → #FFD24A | #000000 | Degular, Champ | 120 px, 700 | 2D ×2 | GSAP, SplitText, Lenis, barba · webflow | 0 | 504 |

---

## 4. Тренды этих ниш 2026→2027 в цифрах

База — 30 замеренных сайтов. Где цифра получена по кадру, а не
скриптом, это сказано.

### 4.1 Типографика

| Показатель | Значение | Кто |
|---|---|---|
| Антиква в главной роли (крупнейший набор или титр) | **8 / 30** | Getty, Joyce Tower, Whole Earth, Kronborg, Siena, Paysages, KUBE, Tandjung Sari |
| Антиква во второй роли (подпись, курсив, одно слово строки) | 5 / 30 | White Desert, Coutumes, Mosby's Files, Reed Hilderbrand, Kononenko |
| Только гротеск | 17 / 30 | остальные |
| Гротеск и антиква в одном кадре или строке | 5 / 30 | Kononenko, White Desert, Mosby's, Reed Hilderbrand, Coutumes |
| Крупнейший HTML-текст прописными | 11 / 30 | чаще мода и отели (Miu Miu, Max Mara, White Desert, Coutumes, KUBE, Vander) |
| Строчные или регистр предложения | **19 / 30** | в том числе все главные антиквы, кроме Kronborg, KUBE и Siena |
| Медиана крупнейшего HTML-текста | **40 px** | размах 12–256 px; ≥ 86 px у 9 из 30 |
| Моноширинный | 5 / 30, всегда кеглем подписи | Mosby's, Joyce Tower, Whole Earth, Paysages, Walkable Atlas |
| Хотя бы одна гарнитура из Google Fonts | 5 / 30 | White Desert (Oswald, Inter Tight), Miu Miu (Work Sans), KUBE и The Watch (Inter), Joyce Tower (Poppins) |

Выводы:

1. **Антиква вернулась, но не газетная.** 13 из 30 используют антикву.
   В главной роли она крупная и светлая: apris 300 при 125 px (Joyce),
   Bardford при 54 px (Getty). В регистре предложения — 5 из 8. Это
   надпись, а не шапка газеты. Концепция «Атласа» (Literata строчными,
   opsz 72) совпадает с трендом.
2. **Моно в этих нишах — этикетка, а не голос.** Ни один сайт не
   набирает крупные числа моноширинным. Моно встречается только в
   подписях вроде «SANDYCOVE POINT, DUBLIN BAY». Показания «Атласа»
   моноширинным звучали бы как терминал (раздел 6).
3. **Смешение гарнитур в одной строке** (Kononenko, «Bureau» антиквой)
   — дешёвый авторский приём без цвета и размера.
4. **Лицензионные гарнитуры — норма**: 25 из 30 обходятся без Google
   Fonts. Замеренные гарнитуры: Lyon, Graphik, Suisse Works/Intl,
   Söhne, Signifier, Founders Grotesk, ABC Diatype, Monument Grotesk,
   Neue Haas Unica, Saphion, Plaak, Exposure, Optima, Adobe Caslon,
   P22 Parrish, DIN 2014, собственные гарнитуры (MennourText, Whole
   Earth Modern, Ishikawa Klee). Кириллица подтверждена страницей
   фаундри только у **Lyon, Graphik** (Commercial Type) и **ABC
   Diatype** (Dinamo, отдельная версия «Кириллица»). У остальных —
   [не проверено].

### 4.2 Цвет бумаги и краски

| Бумага | Число | Кто и hex |
|---|---|---|
| Чисто белая `#FFFFFF` | 12 / 30 | Cecilie, White Desert, Coutumes, Hedwig, Kononenko, Getty, Mennour, archivio-uno, Walkable Atlas, Kalkbrenner, Big Sur, Kronborg |
| Тёплая светлая (крем) | 4 / 30 | Tandjung `#F1ECDE`, Franklin Azzi `#FAF7F4`, KUBE `#FDF9F4`, Vander `#F4F2F1` — **все четыре отели или архитектура** |
| Холодная или нейтральная тонированная | 4 / 30 | Paysages `#E7E9D2` (серо-зелёная), The Watch `#EBEBEB`, Stephen Kent Johnson `#E4E4E4`, Beats in Space `#F8F2FF` |
| Насыщенная | 1 / 30 | Aardvark `#FFD24A` |
| Тёмная | 7 / 30 | `#000000` ×5 (Eladio, Joyce, Whole Earth, Centre photo, Siena), Mosby `#191919`, плита Miu Miu `#0C0F60` |
| Не определяется (видео/иллюстрация во весь кадр) | 2 / 30 | Reed Hilderbrand, Max Mara |

**Краска не чёрная у 6 из 30:** Kronborg `#0B11A0` (ультрамарин),
Paysages `#3B4639` (тёмно-зелёная), White Desert `#1F2A44` (синяя
ночь), Eladio `#A55F2D` (кирпич), Vander `#353230`, Tandjung `#544F45`.

**Акцент — один насыщенный цвет, если он вообще есть:** Centre photo
`#FFA500`, Coutumes `#F9AF26`, Tandjung `#7A1D31`, Kronborg — золото
кнопки. Два и больше насыщенных цвета только у двух сайтов (Mosby's,
Aardvark), и оба читаются как детские.

Для «Атласа» это значит: тёплый крем — код хоспиталити (4 из 4 в
выборке), холодная серо-зелёная бумага `#ECEEE9` из концепции стоит
рядом с Paysages `#E7E9D2` и в нишевый код отеля не попадает.

### 4.3 Композиция

По кадрам первого экрана:

- **Фото или видео во весь кадр — 13 / 30** (Cecilie, White Desert,
  Coutumes, KUBE, Hedwig, Kononenko, Eladio, Reed, Joyce, Centre photo,
  Kronborg, Tandjung, Stephen Kent Johnson).
- **Изображение как вставка в типографику — 9 / 30** (Vander, Mennour,
  Franklin Azzi, Getty, Kalkbrenner, Beats in Space, Big Sur,
  archivio-uno, Paysages).
- **Без фотографии — 8 / 30** (Miu Miu, Max Mara — иллюстрация,
  Mosby's, Whole Earth, Walkable Atlas, Aardvark, The Watch, Siena).
- **Указатель или таблица вместо героя — 5 / 30** (archivio-uno,
  Whole Earth, Beats in Space, Stephen Kent Johnson, Mosby's).
- **Набор, выключенный по ширине или разнесённый к краям — 5 / 30**
  (White Desert, Franklin Azzi, Miu Miu, Kalkbrenner, Eladio).
- Медиана видимых узлов в первом экране — **81**.

Пустота работает у тех, кто ставит одну вещь в кадр: Kalkbrenner (имя
на белом), Walkable Atlas (человечек на линии), The Watch (часы на
сером). Сетка там, где она есть, объявлена: волосяные вертикали поверх
фильма у White Desert, сетка ячеек у Whole Earth, колонки таблицы у
archivio-uno.

### 4.4 Изображение против чистой типографики

Фотография в этих нишах остаётся главным материалом: она есть у 22 из
30. Но 8 из 30 обходятся без неё, и это как раз архивы и указатели
(Whole Earth, Mosby's, Walkable Atlas). «Атласу» стоковая фотография
запрещена (CLAUDE.md), своих съёмок нет. Значит, его путь — второй
кластер: объект из собственного материала (лист карты) и типографика.
Замер показывает, что жюри этот путь принимает: Mosby's — SOTD,
Walkable Atlas — HM.

### 4.5 Моушн

| Показатель | Значение |
|---|---|
| Ноль бесконечных анимаций в первом экране | **23 / 30**, медиана 0 |
| Больше 5 бесконечных | 2 / 30: Walkable Atlas 25, Beats in Space 20 |
| Нативные scroll-driven (`ScrollTimeline`/`ViewTimeline`) | **0 / 30** |
| GSAP | 17 / 30 (ScrollTrigger 17, SplitText 11) |
| Lenis | 12 / 30 |
| Motion (ex-Framer Motion) | 5 / 30 |
| WebGL-холст | 6 / 30 (three.js у 5; у Siena свой GLSL) |
| Любой холст | 10 / 30 |
| Механизм перехода страниц | 10 / 30: `@view-transition` в CSS у 7, Barba у 2, swup и Taxi по одному |
| Ворота или прелоадер дольше 6,5 с | 5 / 30: Miu Miu, Max Mara, Siena, The Watch, Tandjung — все промо или люкс |
| Предложение включить звук | 5 / 30: Miu Miu, Max Mara, Kalkbrenner, Walkable Atlas, Paysages |
| rAF в покое > 0 | 23 / 30, медиана 85 вызовов/с (в основном цикл Lenis) |
| JS первого захода | медиана 1,7 МБ; от 117 КБ (Stephen Kent Johnson) до 27 МБ (Kalkbrenner) |

Характер моушна: **тихий покой, событие — переход страницы.** Холостое
движение почти всегда нулевое. Где движение есть, оно отвечает на руку
или на смену страницы (swup у Joyce, Taxi у Siena, `@view-transition` у
White Desert, Reed, Paysages, Big Sur). Нативный CSS scroll-timeline в
этих нишах не встречается ни разу: он остаётся приёмом разработчиков,
а не люкса.

### 4.6 Навигация

Классическая шапка с логотипом по центру — у большинства (Cecilie,
Mennour, Coutumes, KUBE, Vander, Joyce, Kronborg, Big Sur, White
Desert). Нестандартная — у 11 из 30, и все варианты — метафоры листа
или архива:

| Метафора | Сайт |
|---|---|
| Четыре угла кадра | Hedwig |
| Одна линия через экран | Eladio Dieste |
| Три слова по ширине | Franklin Azzi |
| Вертикальная рейка-корешок | Tandjung Sari |
| Ярлыки папок | Mosby's Files |
| Заголовки колонок каталога | archivio-uno |
| Нумерованные ячейки ① — ⑥ | Whole Earth Index |
| Раскрывающийся указатель «+» | Beats in Space |
| Ходьба клавишами | Walkable Atlas |
| Полоса «сейчас играет» | Kalkbrenner, Beats in Space |
| Живые часы в шапке | Big Sur |

---

## 5. Десять решений для «Атласа»

Каждое решение — спецификация, а не запрет. Контраст посчитан по
WCAG 2.2.

1. **Бумага холодная, не кремовая. Вторая краска печатная, а не
   сигнальная.** Бумага `#ECEEE9`, краска `#15171A` (15,37:1) — как в
   концепции. Тёплый крем в выборке — 4 из 4 у отелей и архитектуры,
   поэтому он даст «бутик-отель». Синь `#1D3FA8` (7,72:1) переходит в
   роль краски самой карты (вода, территория, подписи местности), как
   ультрамарин набора у Kronborg. Киноварь `#B8321A` (5,12:1) остаётся
   единственным цветом-событием: маршрут читателя.
   Ссылки: Paysages (`#E7E9D2` + `#3B4639`), Kronborg (`#0B11A0`
   набором), The Watch (`#EBEBEB`).

2. **Антиква — надпись на листе: светлая, крупная, в регистре
   предложения.** Literata, opsz 72, wght 300, 96–128 px на 1440, без
   прописных. В выборке 19 из 30 крупных наборов не прописные, в том
   числе все главные антиквы, кроме трёх.
   Ссылки: Joyce Tower (apris 300, 125 px), Getty (Bardford 54 px),
   контрпример — KUBE (прописная глифика = код отеля).

3. **Смешанная строка вместо цветовой разметки.** Номер листа
   гротеском, название места курсивом антиквы в той же строке: «Лист 03
   *Тарифы*», «до *Франкфурта*». Отличие держит гарнитура, а не цвет.
   Ссылки: Kononenko («Bureau» антиквой), White Desert (узкий гротеск +
   курсив Cardinal), Mosby's (Founders Grotesk + Signifier).

4. **Числа — табличными цифрами антиквы, моно убрать.** Показания
   набираются Literata с `font-variant-numeric: tabular-nums
   lining-nums`: `tnum` и `lnum` в файле Literata есть (проверено по
   таблице признаков, см. раздел 8). Если моно остаётся, то только как
   этикетка ≤ 12 px прописными с разрядкой +0,12em. В нишах моно — 5 из
   30, и везде в кегле подписи.
   Ссылки: Joyce Tower (моно-этикетка места), Whole Earth (моно курсивом
   в сноске), Mosby's (Plex Mono только в описаниях).

5. **Показание — подпись к кадру, в голосе натуралиста.** Вместо
   первой строки «как у Mullvad» — подпись курсивом к карте: «10
   сентября 2026, 20:06. Москва. До ближайшего сервера — 38 мс».
   Та же честность, другая ниша.
   Ссылки: Reed Hilderbrand («Sep 2024, 83°F, Overcast clouds»), Big Sur
   (живые часы в шапке), Beats in Space («AM220 09 11 2026 · 01:01:37»).

6. **Указатель листов — каталожная таблица.** Навигация по сайту и
   список локаций — таблица с колонками: «№ · лист · что на нём» и
   «страна · город · ориентировочно, мс · сервер есть/нет». Колонки
   сортируются, числа из `locations.ts`. Мини-карта в меню не нужна:
   таблица сама и есть указатель атласа.
   Ссылки: archivio-uno (колонки «size (cm)», «print run»), Whole Earth
   (нумерация ①–⑥), Eladio Dieste (работы по годам 1947–1986).

7. **Навигация на рамке листа, а не в стеклянной шапке.** Слова меню
   стоят на линии рамки: одна волосяная линия через ширину, пункты на
   ней, углы подписаны номером листа и изданием.
   Ссылки: Eladio Dieste (меню на одной линии через экран), Franklin
   Azzi (три слова по ширине), Hedwig (четыре угла).

8. **Маршрут — главы с подписанными остановками. В финале он
   складывается в указатель.** Прокрутка прочерчивает пунктир пути от
   города читателя, у каждой остановки подпись антиквой-курсивом. В
   конце главной линия сворачивается в таблицу решения 6 — тот же жест,
   что Act II у Walkable Atlas. Никаких ворот и игрового управления.
   Ссылки: Walkable Atlas (путь → вертикальная карта), Tracing Art
   (биография объекта по остановкам), Max Mara (путешествие главами).

9. **Кусок карты внутри строки заголовка.** Между словами первой
   строки вставлен фрагмент изолиний высотой в строчную букву: «от
   вашего города ▭ до ближайшего сервера». Объект первого экрана
   рождается из набора, а не стоит рядом с ним.
   Ссылки: Paul Kalkbrenner (фото между «Paul» и «Kalkbrenner»), The
   Watch (часы между «FS» и «60P»).

10. **Моушн: переход листа — событие, покой — тишина.** Смена страницы
    идёт через View Transitions как перелистывание (в нишах механизм
    перехода есть у 10 из 30). Холостого движения нет, кроме маршрута:
    23 из 30 сайтов держат ноль бесконечных анимаций. Ворот и
    прелоадеров нет: в выборке они есть только у промо и люкса (5 из
    30). Оговорка: `@view-transition { navigation: auto }` в App Router
    с `<Link>` не срабатывает (`00_PHASE_A_REPORT.md`), путь для
    Next 16 — [не проверено].
    Ссылки: Joyce Tower (swup + `@view-transition`), Reed Hilderbrand
    (`@view-transition`, JS 217 КБ), Siena (Taxi как монтажная склейка).

---

## 6. Что в концепции «Атласа» звучит как VPN и чем это заменить

Разобран раздел «Направление 2. Атлас» в `CONCEPTS.md` и приёмы,
которые он берёт из «Прибора» (A1–A5 в `ANIMATION_CATALOG.md`).

| # | Что в концепции | Почему звучит как VPN или инфраструктура | Чем заменить | Опора |
|---|---|---|---|---|
| 1 | Референсы: mullvad.net, oxide.computer, ghostty.org, planetscale.com | Буквально VPN, серверная стойка, терминал, СУБД | Reed Hilderbrand, Walkable Atlas, Whole Earth Index, archivio-uno, Joyce Tower, Kronborg, Paysages | раздел 2 |
| 2 | Martian Mono для показаний и координат | Моно = терминал. По метаданным Google Fonts гарнитуру делали Roman Shamin и Evil Martians, студия dev-tools | Табличные цифры Literata. Моно — не больше этикетки или никак | решение 4; моно 5/30, всегда кеглем подписи |
| 3 | «Изолинии задержки, каждая линия +10 мс» с цифрами на линиях | Тепловая карта сети, мониторинг | Изохроны как на туристической карте: линии без цифр, гравюрный штрих. Одно число — в подписи к карте | решение 5 |
| 4 | Легенда из двух субъектов: «сеть и узлы — синь, вы — киноварь» | Легенда сетевой диаграммы или дашборда | Синь — краска карты (вода, территория), без роли «сеть». Киноварь — только маршрут | решение 1; Kronborg |
| 5 | Слово «узел» («ближайший узел», «узла пока нет») | Инженерный жаргон, а CLAUDE.md сам запрещает инженерные термины на витрине | «Город с сервером», «ближайший сервер», на 404 — «здесь сервера пока нет». Точный словарь — решение владельца | CLAUDE.md, «Инженерных терминов на витрине нет» |
| 6 | Рамка с делениями координат по краю | Видоискатель, HUD, sci-fi-интерфейс | Поле листа как у издания: номер листа, выпуск, дата печати, масштаб. Координаты — только на одном листе, где есть карта | Whole Earth ①–⑥, Coutumes «September edition», Beats in Space |
| 7 | WebGL-квад с фрагментным шейдером изолиний | Шейдерное поле — AI-кластер и техно-демо (A1) | Штрих SVG или Canvas 2D, отрисованный без скрипта. Движение — только прочерчивание | Walkable Atlas: Canvas 2D, не больше 1400 частиц; WebGL в нишах у 6 из 30 |
| 8 | «Живое значение читателя первой строкой, как у Mullvad» | Прямая цитата VPN-сервиса «проверьте своё соединение» | Подпись-наблюдение к карте курсивом | Reed Hilderbrand |
| 9 | A1 «Рукопожатие вместо прелоадера» | «Рукопожатие» — TLS handshake, словарь протокола | «Лист раскладывается»: первый переход — развёртка листа по сгибам, без ожидания | Siena (склейка), Walkable Atlas |
| 10 | A3 «Шифр-шов» | Визуализация шифрования — прямой код VPN | Убрать. Шов листа (сгиб карты) без символов шифра | CLAUDE.md, «Два языка продукта» |
| 11 | A5 «Страница меряет саму себя» (длительность кадров, `SignalTrace`) | FPS-метр — инструмент разработчика | Убрать с публичных листов. Остаётся одно показание о читателе | решение 5 |
| 12 | «Маршрут по диагонали через все листы, игнорируя сетку» | Похоже на трассировку пути пакета | Пунктир пути с подписями городов антиквой-курсивом. Диагональ оставить как нарушение сетки | Walkable Atlas (пунктир земли), Max Mara (главы пути) |
| 13 | Темп «плоттер» в партитуре | Инженерное устройство | «Перо»: постоянная скорость остаётся, меняется словарь партитуры. Мелочь, но слово попадёт в промты фазы D | — |

**Что в концепции уже звучит как ниши и остаётся:** номер листа («Лист
03 — Тарифы»), белое пятно на 404, строчная антиква, холодная бумага,
нулевой радиус, отказ от прелоадеров. Это совпадает с издательствами и
архивами выборки.

---

## 7. Шрифтовые пары с кириллицей

### 7.1 Бесплатные (Google Fonts)

Кириллица проверена 10.09.2026 запросом
`https://fonts.googleapis.com/css2?family=…` с браузерным User-Agent:
в ответе искался блок `/* cyrillic */` с диапазоном `U+0400-045F`.
Оси и дизайнеры — из `https://fonts.google.com/metadata/fonts`.

| Пара | Дисплей: оси | Текст: оси | Какую нишу даёт | Кириллица |
|---|---|---|---|---|
| **Literata + Sofia Sans** (базовая, как в концепции) | Literata: opsz 7–72, wght 200–900, курсив (TypeTogether) | Sofia Sans: wght 1–1000 | книга, атлас, издательство | ✓ / ✓ |
| **Playfair + Ysabeau** | Playfair (вариативная 2023, не Playfair Display): opsz 5–1200, wdth 87,5–112,5, wght 300–900 | Ysabeau: wght 1–1000 (Christian Thalmann) | мода, журнал: высокий контраст на больших opsz | ✓ / ✓ |
| **Roboto Serif + Onest** | Roboto Serif: opsz 8–144, wdth 50–150, wght 100–900, GRAD (Commercial Type / Greg Gazdowicz) | Onest: wght 100–900 | музей, галерея. Ось ширины даёт узкую антикву для подписей на карте | ✓ / ✓ |
| **Noto Serif Display + Golos Text** | Noto Serif Display: wdth 62,5–100, wght 100–900 | Golos Text: wght 400–900 | архив, указатель: узкая антиква вместо узкого гротеска (как Founders у Mosby's) | ✓ / ✓ |
| **Source Serif 4 + Geologica** | Source Serif 4: opsz 8–60, wght 200–900 | Geologica: wght 100–900, SHRP, CRSV, slnt | каталог, архитектура | ✓ / ✓ |
| **Cormorant Garamond + Commissioner** | Cormorant Garamond: wght 300–700 | Commissioner: wght 100–900, FLAR, VOLM | отель, парфюм. **Риск:** это код KUBE/Tandjung | ✓ / ✓ |

Ещё с кириллицей, для подбора: Brygada 1918 (wght 400–700), Piazzolla
(opsz 8–30, wght 100–900), Spectral, EB Garamond (wght 400–800), Lora,
Vollkorn, Alegreya, PT Serif, Old Standard TT, Prata, Oranienbaum,
Forum, STIX Two Text, IBM Plex Serif; из гротесков — Manrope, Wix
Madefor Display/Text, Unbounded, Rubik, Roboto Flex.

`tnum`, `lnum`, `onum` найдены в таблице признаков файлов Literata,
Playfair и Roboto Serif из репозитория `google/fonts` (поиск тегов в
бинарнике, см. раздел 8).

**Без кириллицы — не брать, как бы модно ни выглядели:** Instrument
Serif, Fraunces, Newsreader, Bodoni Moda, DM Serif Display, Young Serif,
Libre Caslon Display, Italiana, Cinzel, Marcellus, Crimson Pro, Gelasio,
Petrona, Besley, Libre Baskerville; Instrument Sans, Bricolage
Grotesque, Space Grotesk, Schibsted Grotesk, Host Grotesk, Funnel
Display, Familjen Grotesk, Albert Sans, Public Sans, Mona Sans, Hubot
Sans, Big Shoulders Display, Bebas Neue, Anybody, Afacad Flux, Reddit
Sans; DM Mono, Azeret Mono, Red Hat Mono, Spline Sans Mono, Reddit Mono.

**Ловушка: только `cyrillic-ext`.** У Gloock, Fragment Mono и Hanken
Grotesk в ответе есть только блок `cyrillic-ext` с диапазоном
`U+0460-052F…`. Базовых русских букв `U+0400-045F` там нет, русский
текст не наберётся.

**Моноширинные с кириллицей** — IBM Plex Mono, JetBrains Mono, Martian
Mono, Geist Mono, Ubuntu Sans Mono. У всех дизайнеры из IT (IBM,
JetBrains, Evil Martians, Vercel, Canonical). Ещё один аргумент убрать
моно с витрины.

### 7.2 Платные: кириллица подтверждена страницей фаундри

| Пара | Фаундри | Что написано на странице |
|---|---|---|
| **Lyon + Graphik** | Commercial Type | Lyon и Graphik: «Cyrillic: Belarusian, Bulgarian, Russian, Serbian, Ukrainian». У Graphik отдельная коллекция Graphik Cyrillic. Lyon в выборке — у Reed Hilderbrand, Graphik — у Getty |
| **Canela + Graphik** | Commercial Type | Canela: тот же список кириллических языков |
| **GT Sectra + GT America** | Grilli Type | обе: «Cyrillic-alphabet languages: … Russian … Ukrainian …» (длинный список) |
| **ABC Arizona** (одна суперсемья: Serif, Sans, Flare, Text, Mix, три ширины) | Dinamo | отдельный продукт «Arizona Кириллица Cyrillic» |
| **ABC Diatype** / **ABC Favorit** | Dinamo | отдельные «Diatype Кириллица Cyrillic» и «ABC Favorit Cyrillic». Diatype в выборке — у Kalkbrenner и Big Sur |
| **PP Neue Montreal** | Pangram Pangram | «Latin, Cyrillic, Greek, Vietnamese, and Arabic» |
| **Lava** | Typotheque | среди скриптов указан «Cyrillic» |

**Подтверждено «нет кириллицы»:** GT Alpina и GT Super (Grilli Type,
«Latin-alphabet languages» только), PP Editorial New (Pangram Pangram,
только латиница; «Serbian» в списке — латиница).

**Не проверено:** Klim (Söhne, Signifier, Tiempos, Founders Grotesk) —
на странице раздел «Language support» не раскрылся. Swiss Typefaces
(Suisse Works, Suisse Intl) — страница не открывалась в этой сессии.
Brownfox (Formular и др.) — на странице нет данных о скриптах. CSTM
Fonts — 401. Type Today — кириллица в образце на главной есть,
конкретные гарнитуры не открывались.

Рекомендация: база — **Literata + Sofia Sans**, ноль затрат и
совпадение с трендом (антиква-надпись, строчные). Если дать бюджет
(QUESTIONS №16) — **Lyon Display + Graphik** или **ABC Arizona**: у
обоих вариантов кириллица подтверждена, и обе гарнитуры встречаются в
живой выборке ниш.

---

## 8. Что не удалось проверить

1. **Brunello Cucinelli и Cartier W&W 2026** — `403 Access Denied` от
   Akamai безголовому браузеру. Данные только с карточек Awwwards.
2. **Парфюмерия.** Сайта 2025–2026 не найдено. Поиск упёрся в лимит
   сессии: 200 из 200 запросов WebSearch израсходованы. Godly, Lapa,
   FWA, Fonts In Use, It's Nice That и Brand New не просмотрены
   постранично: первые два не отдают список без JS, остальные поиск
   не нашёл по нужным запросам.
3. **Кадры с перекрытием:** Kronborg (окно Usercentrics в shadow DOM),
   Tandjung Sari (окно cookie после интро), Coutumes (баннер cookie
   остался, хотя скрипт нажал «Accept»), KUBE (промо-окно). Замеры цвета
   и гарнитур у них сделаны по DOM и от окна не зависят. «Фон под
   центром» у KUBE — оверлей окна.
4. **Крупнейший набор в SVG или картинкой** не измерен (Eladio Dieste,
   Siena, Whole Earth, Tandjung Sari). Кегль в таблице — нижняя граница.
5. **Даты запуска сайтов из Siteinspire** (Whole Earth, archivio-uno,
   Mennour, Reed Hilderbrand, Kronborg, Joyce Tower, Centre photo,
   Stephen Kent Johnson, Franklin Azzi, Beats in Space) — известна дата
   публикации на витрине в 2026 году, год запуска [не проверено].
   Авторы Reed Hilderbrand, Joyce Tower, Kronborg, Centre photo и
   Stephen Kent Johnson [не проверено].
6. **Награды Walkable Atlas от CSS Design Awards** — со слов самого
   сайта, независимо [не проверено].
7. **`tnum`/`lnum` в Literata, Playfair, Roboto Serif** — найдены
   поиском тегов в бинарнике TTF (fontTools не установлен). Живой набор
   табличных цифр в браузере не проверялся.
8. **Кириллица Söhne, Suisse, Signifier, Tiempos, Founders Grotesk,
   Formular, Kazimir** — страницы фаундри её не показали (раздел 7.2).
9. **Переходы страниц через `@view-transition` в Next 16 App Router** —
   не проверено. В `00_PHASE_A_REPORT.md` записано, что правило в
   `brand.css` не срабатывает с `<Link>`.
10. **LCP и производительность** этих сайтов не замерялись: только вес
    JS первого захода и холостой rAF.

---

## 9. Источники

Карточки и витрины (все открыты 10.09.2026):

- Awwwards, Sites of the Day — https://www.awwwards.com/websites/sites_of_the_day/
- Awwwards, Sites of the Month — https://www.awwwards.com/websites/sites_of_the_month/
- Awwwards, категории: https://www.awwwards.com/websites/luxury/, https://www.awwwards.com/websites/fashion/, https://www.awwwards.com/websites/architecture/, https://www.awwwards.com/websites/hotel-restaurant/, https://www.awwwards.com/websites/music-sound/, https://www.awwwards.com/websites/travel-tourism/, https://www.awwwards.com/websites/culture-education/
- https://www.awwwards.com/sites/white-desert
- https://www.awwwards.com/sites/ishikawa-co-walkable-atlas
- https://www.awwwards.com/sites/tracing-art
- https://www.awwwards.com/sites/eladio-dieste
- https://www.awwwards.com/sites/mosbys-files
- https://www.awwwards.com/sites/cecilie-bahnsen
- https://www.awwwards.com/sites/miu-miu-a-house-that-we-shaped
- https://www.awwwards.com/sites/the-tuscan-journey-begins
- https://www.awwwards.com/sites/the-watch
- https://www.awwwards.com/sites/coutumes
- https://www.awwwards.com/sites/kube-saint-tropez
- https://www.awwwards.com/sites/tandjung-sari
- https://www.awwwards.com/sites/vander-hotel
- https://www.awwwards.com/sites/hedwig-curated-travel
- https://www.awwwards.com/sites/kononenko-architectural-bureau
- https://www.awwwards.com/sites/paul-kalkbrenner
- https://www.awwwards.com/sites/paysages-studio
- https://www.awwwards.com/sites/big-sur
- https://www.awwwards.com/sites/siena-film-foundation
- https://www.awwwards.com/sites/aardvark-book-club
- https://www.awwwards.com/sites/brunello-cucinelli-ai-e-com
- https://www.awwwards.com/sites/cartier-watches-wonders-2026
- https://www.awwwards.com/sites/apotheke-perfume, https://www.awwwards.com/sites/rahasya-fragrances (отсеяны по дате)
- Siteinspire: https://www.siteinspire.com/websites/category/galleries-and-museums, https://www.siteinspire.com/websites/category/record-labels, https://www.siteinspire.com/websites/category/publishing, https://www.siteinspire.com/websites/category/fashion, https://www.siteinspire.com/websites/category/architecture
- https://www.siteinspire.com/website/13591-whole-earth-index
- https://www.siteinspire.com/website/13479-archivio-uno
- https://www.siteinspire.com/website/13460-mennour
- https://www.siteinspire.com/website/13488-beats-in-space
- https://www.siteinspire.com/website/13523-franklin-azzi
- Making-of Walkable Atlas — https://ishikawa.co/en/making-of/

Шрифты:

- Google Fonts CSS API — https://fonts.googleapis.com/css2 (запросы по каждой гарнитуре)
- Google Fonts metadata — https://fonts.google.com/metadata/fonts
- Файлы для проверки признаков — https://github.com/google/fonts (`ofl/literata`, `ofl/playfair`, `ofl/robotoserif`)
- Commercial Type: https://commercialtype.com/catalog/graphik, https://commercialtype.com/catalog/canela, https://commercialtype.com/catalog/lyon
- Grilli Type: https://www.grillitype.com/typeface/gt-sectra, https://www.grillitype.com/typeface/gt-america, https://www.grillitype.com/typeface/gt-alpina, https://www.grillitype.com/typeface/gt-super
- Dinamo: https://abcdinamo.com/typefaces/arizona, https://abcdinamo.com/typefaces/diatype, https://abcdinamo.com/typefaces/favorit
- Pangram Pangram: https://pangrampangram.com/products/neue-montreal, https://pangrampangram.com/products/editorial-new
- Typotheque: https://www.typotheque.com/fonts/lava
- Type Today: https://type.today/en
- Не дали ответа о кириллице: https://klim.co.nz/fonts/soehne/, https://klim.co.nz/fonts/tiempos-headline/, https://brownfox.org/, https://cstmfonts.com/

Замер: `docs/rebrand-2027/refs/a7-probe.cjs`,
`docs/rebrand-2027/refs/a7-probe.json`, кадры
`docs/rebrand-2027/refs/a7/*.jpg` (30 файлов).
