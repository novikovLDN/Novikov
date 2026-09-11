import type { Metadata } from "next";
import Link from "next/link";
import AtlasShell from "@/components/atlas/AtlasShell";
import Corner from "@/components/atlas/Corner";
import "@/app/work-atlas.css";
import "./install-ios.css";

/**
 * /install-ios — как добавить кабинет Atlas на экран «Домой» iPhone и
 * iPad (владелец, 11.09.2026: «инструкция шаг за шагом, рендеры iPhone 17
 * Pro Max из Blender — наш дашборд в Safari, куда нажимать, текстом рядом»).
 *
 * Сюда ведёт нижний лист из кабинета (IosInstallSheet) и подсказка
 * IosInstallBanner. Шаги — для Safari в iOS 26 («•••» → «Поделиться» →
 * «На экран «Домой»» → «Добавить»), с оговоркой для iOS 18 и раньше.
 * Рендеры — public/media/ios/ (сцена Blender «AtlasIphone»).
 */
export const metadata: Metadata = {
  title: "Atlas на iPhone",
  description: "Как добавить кабинет Atlas на экран «Домой» iPhone и iPad — пять касаний в Safari.",
  alternates: { canonical: "/install-ios" },
};

const STEPS: { t: string; d: string; tip?: string; alt: string }[] = [
  {
    t: "Откройте меню Safari",
    d: "Внизу справа, рядом с адресной строкой, нажмите «•••».",
    tip: "В iOS 18 и раньше этот шаг не нужен: кнопка «Поделиться» — квадрат со стрелкой — стоит прямо в нижней панели Safari.",
    alt: "iPhone: кабинет Atlas в Safari, отмечена кнопка «•••» справа внизу",
  },
  {
    t: "Нажмите «Поделиться»",
    d: "Первый пункт меню — с квадратом и стрелкой вверх.",
    alt: "iPhone: открыто меню Safari, отмечен пункт «Поделиться»",
  },
  {
    t: "Выберите «На экран „Домой“»",
    d: "Пункт с плюсом в квадрате. Если его не видно — прокрутите список вниз.",
    alt: "iPhone: лист «Поделиться», отмечен пункт «На экран „Домой“»",
  },
  {
    t: "Нажмите «Добавить»",
    d: "Оставьте включённым «Открыть как веб-приложение» — так Atlas откроется во весь экран, без адресной строки.",
    alt: "iPhone: экран добавления, включено «Открыть как веб-приложение», отмечена кнопка «Добавить»",
  },
  {
    t: "Готово",
    d: "На экране «Домой» появилась иконка Atlas. Нажмите её — сразу откроется ваш кабинет.",
    alt: "iPhone: экран «Домой» с иконкой Atlas Secure",
  },
];

export default function InstallIosPage() {
  return (
    <AtlasShell sheetNo="25" sheetTitle="Atlas на iPhone" headCta={{ href: "/dashboard", label: "Кабинет" }} footer="compact">
      <main id="main" className="a-main ios">
        <section className="a-sheet ios-hero" data-sheet="25" aria-labelledby="ios-title">
          <div className="a-field ios-hero-grid">
            <div>
              <p className="ios-kicker a-settle">Для iPhone и iPad · Safari · около 30 секунд</p>
              <h1 id="ios-title" className="ios-h1 a-settle" style={{ ["--i" as string]: 1 }}>
                Atlas на экране «Домой»
              </h1>
              <p className="a-lead a-settle" style={{ ["--i" as string]: 2 }}>
                Пять касаний — и кабинет открывается как приложение: во весь экран и без адресной строки.
              </p>
              <ul className="ios-perks a-settle" style={{ ["--i" as string]: 3 }}>
                <li><b>Одно касание</b> — ключ и подписка сразу под рукой</li>
                <li><b>Во весь экран</b> — без панелей браузера</li>
                <li><b>Уведомления о продлении</b> — на iPhone они приходят только приложениям с экрана «Домой»</li>
              </ul>
              <div className="a-actions a-settle" style={{ ["--i" as string]: 4 }}>
                <a href="#step-1" className="a-btn a-btn-primary">Показать по шагам</a>
                <Link href="/dashboard" className="a-btn a-btn-quiet">Вернуться в кабинет</Link>
              </div>
            </div>
            <figure className="ios-hero-art">
              <img src="/media/ios/hero.webp" alt="iPhone 17 Pro Max с кабинетом Atlas на экране" width={1400} height={1400} />
            </figure>
          </div>
        </section>

        <ol className="ios-steps">
          {STEPS.map((s, k) => (
            // Телефон на рендерах нечётных шагов смотрит экраном влево —
            // ставим его справа от текста, чётных — слева: экран всегда
            // обращён к тексту шага.
            <li key={s.t} id={`step-${k + 1}`} className="a-sheet ios-step" data-sheet="25" data-flip={k % 2 ? undefined : ""}>
              <div className="a-field ios-step-grid">
                <figure className="ios-shot">
                  <img src={`/media/ios/step${k + 1}.webp`} alt={s.alt} width={1200} height={1500} loading="lazy" />
                </figure>
                <div className="ios-card">
                  {k < STEPS.length - 1 && <Corner href={`#step-${k + 2}`} label="Следующий шаг" />}
                  <p className="ios-step-no">
                    <b className="a-num">{k + 1}</b> / {STEPS.length}
                  </p>
                  <h2 className="ios-h2">{s.t}</h2>
                  <p className="ios-text">{s.d}</p>
                  {s.tip && <p className="ios-tip">{s.tip}</p>}
                  <span className="ios-rail" aria-hidden><i /></span>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <section className="a-sheet ios-done" data-sheet="25" aria-labelledby="ios-done-title">
          <div className="a-field">
            <div className="ios-done-card">
              <h2 id="ios-done-title" className="ios-h2">Не получилось?</h2>
              <p className="ios-text">
                Пункт «На экран „Домой“» есть только в Safari. Если кабинет открыт в другом браузере — скопируйте
                адрес и откройте его в Safari. Остались вопросы — напишите в поддержку, поможем.
              </p>
              <div className="a-actions">
                <Link href="/dashboard" className="a-btn a-btn-invert">Открыть кабинет</Link>
                <Link href="/support" className="a-btn a-btn-line">Поддержка</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </AtlasShell>
  );
}
