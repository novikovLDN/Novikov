import Link from "next/link";
import BrandMark from "@/components/pixel/BrandMark";
import { FOOTER_COLUMNS, LEGAL_LINKS, FOUNDED } from "@/lib/nav";
import { COUNTRY_COUNT } from "@/lib/locations";
import { TRIAL_DAYS } from "@/lib/brand-facts";
import { plural } from "@/lib/ru-words";

/**
 * Подвал «Атлас-издания».
 *
 * Полный (витрина). Разбор владельца 11.09.2026: после финала сайт
 * кончался «разделами» и мелкими реквизитами — «слишком пусто». Теперь
 * это тёмная плита: бренд, фраза пользы и главное действие, четыре
 * колонки ссылок (состав — FOOTER_COLUMNS в src/lib/nav.ts), контурное
 * имя во всю ширину, строка реквизитов.
 *
 * Компактный (рабочие экраны — кабинет, вход, оплата, новое
 * устройство, админка): одна строка реквизитов без разделов. Владелец:
 * «дашборд не должен пролистываться ниже нашего онлайна; на экранах из
 * дашборда разделы не нужны».
 *
 * Команды здесь нет: имён и портретов в исходных данных нет, а
 * выдумывать их запрещено (ТЗ 15.5).
 */
export default function AtlasFooter({ variant = "full" }: { variant?: "full" | "compact" }) {
  const year = new Date().getFullYear();
  const span = year > FOUNDED ? `${FOUNDED}–${year}` : String(FOUNDED);
  const where = `${COUNTRY_COUNT} ${plural(COUNTRY_COUNT, ["стране", "странах", "странах"])}`;
  const legal = (
    <p className="a-foot-legal">
      {LEGAL_LINKS.map((l) => (
        <Link key={l.href} href={l.href} prefetch={false}>{l.label}</Link>
      ))}
    </p>
  );

  if (variant === "compact") {
    return (
      <footer className="a-foot-compact">
        <div className="a-field a-foot-base">
          <p>© {span} Atlas Secure, часть группы QoDev, Гонконг · серверы в {where}</p>
          {legal}
        </div>
      </footer>
    );
  }

  const trial = `${TRIAL_DAYS} ${plural(TRIAL_DAYS, ["день", "дня", "дней"])}`;

  return (
    <footer className="a-foot">
      <div className="a-field">
        <div className="a-foot-top">
          <div className="a-foot-brand">
            <Link href="/" className="a-mark" aria-label="Atlas Secure — на главную">
              <BrandMark size={22} />
              <span>atlas secure</span>
            </Link>
            <p className="a-foot-pitch">
              VPS-ускоритель для телефона и компьютера. <span>Сайты, видео и приложения открываются сразу.</span>
            </p>
            <div className="a-actions">
              <Link href="/auth" prefetch={false} className="a-btn a-btn-invert">Попробовать {trial} бесплатно</Link>
              <Link href="/pricing" className="a-btn a-btn-line">Тарифы</Link>
            </div>
          </div>

          <nav className="a-foot-cols" aria-label="Разделы сайта">
            {FOOTER_COLUMNS.map((c, i) => (
              <div key={c.title} style={{ ["--i" as string]: i + 1 }}>
                <p className="a-wide a-foot-h">{c.title}</p>
                <ul>
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} prefetch={false}>{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="a-foot-word" aria-hidden>
          <p>atlas secure</p>
        </div>

        <div className="a-foot-base">
          <p>© {span} Atlas Secure · часть группы QoDev, Гонконг (SAR) · серверы в {where}</p>
          {legal}
        </div>
      </div>
    </footer>
  );
}
