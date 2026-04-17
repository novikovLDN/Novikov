"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PremiumPage from "@/components/PremiumPage";
import { useI18n } from "@/lib/i18n";

const SECTIONS = (en: boolean) => [
  { id: "intro", n: "01", t: en ? "Introduction" : "Введение" },
  { id: "nologs", n: "02", t: en ? "No-logging policy" : "Отсутствие логирования" },
  { id: "collected", n: "03", t: en ? "Information collected" : "Собираемая информация" },
  { id: "purposes", n: "04", t: en ? "Processing purposes" : "Цели обработки" },
  { id: "storage", n: "05", t: en ? "Storage and protection" : "Хранение и защита" },
  { id: "thirdparty", n: "06", t: en ? "Third-party disclosure" : "Передача третьим лицам" },
  { id: "cookies", n: "07", t: "Cookies" },
  { id: "rights", n: "08", t: en ? "User rights" : "Права пользователя" },
  { id: "contact", n: "09", t: en ? "Contact" : "Контакты" },
];

export default function PrivacyPage() {
  const { locale } = useI18n();
  const en = locale === "en";
  const [active, setActive] = useState("intro");

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    SECTIONS(en).forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [en]);

  const sections = SECTIONS(en);

  return (
    <PremiumPage>
      <div className="plx-legal-wrap">
        <aside className="plx-legal-toc">
          <div className="plx-legal-toc-label">{en ? "On this page" : "На странице"}</div>
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} style={active === s.id ? { color: "var(--pl-t1)", borderLeftColor: "var(--pl-accent)" } : undefined}>
              {s.n} · {s.t}
            </a>
          ))}
        </aside>

        <div className="plx-legal-body">
          <header className="plx-legal-header">
            <h1>{en ? "Privacy Policy" : "Политика конфиденциальности"}</h1>
            <div className="plx-legal-meta">
              <span>{en ? "Updated" : "Обновлено"}<strong>{en ? "March 23, 2026" : "23 марта 2026"}</strong></span>
              <span>{en ? "Effective" : "Действует с"}<strong>{en ? "April 1, 2026" : "1 апреля 2026"}</strong></span>
              <span>{en ? "Version" : "Версия"}<strong>2.4</strong></span>
            </div>
          </header>

          <section id="intro" className="plx-legal-sec">
            <h2><span className="plx-legal-num">01</span>{en ? "Introduction" : "Введение"}</h2>
            <p>{en
              ? "This Privacy Policy establishes the procedures for collection, processing, storage, and protection of information provided by Users of Atlas Secure. The Service operates in accordance with data minimization principles and respect for privacy. By using the Service, you confirm your agreement with this Policy."
              : "Настоящая Политика устанавливает порядок сбора, обработки, хранения и защиты информации, предоставляемой Пользователями сервиса Atlas Secure. Сервис работает в соответствии с принципами минимизации данных и уважения к конфиденциальности. Используя Сервис, вы подтверждаете согласие с настоящей Политикой."}</p>
          </section>

          <section id="nologs" className="plx-legal-sec">
            <h2><span className="plx-legal-num">02</span>{en ? "No-logging policy" : "Отсутствие логирования"}</h2>
            <p>{en
              ? "The Service adheres to a strict no-logs policy. We do not record, store, or monitor:"
              : "Сервис придерживается строгой политики no-logs. Мы не записываем, не храним и не мониторим:"}</p>
            <ul>
              <li>{en ? "Internet traffic content and destination addresses" : "Содержимое интернет-трафика и адреса назначения"}</li>
              <li>{en ? "Connection IP addresses (original or assigned)" : "IP-адреса подключения (исходные и назначаемые)"}</li>
              <li>{en ? "DNS queries or resolution logs" : "DNS-запросы и логи резолвинга"}</li>
              <li>{en ? "Session timestamps or connection duration" : "Метки времени сессий и продолжительность"}</li>
              <li>{en ? "Per-user bandwidth or data volumes" : "Объём трафика в привязке к Пользователю"}</li>
              <li>{en ? "Information about visited resources" : "Информацию о посещаемых ресурсах"}</li>
            </ul>
          </section>

          <section id="collected" className="plx-legal-sec">
            <h2><span className="plx-legal-num">03</span>{en ? "Information collected" : "Собираемая информация"}</h2>
            <p>{en ? "For operation, the Service collects the minimum necessary information:" : "Для работы Сервис собирает минимально необходимый объём:"}</p>
            <ul>
              <li><strong>Email</strong> — {en ? "account identification and verification codes" : "идентификация аккаунта и коды верификации"}</li>
              <li><strong>{en ? "Password hash" : "Хэш пароля"}</strong> — {en ? "bcrypt-derived, irreversible" : "bcrypt-деривация, необратима"}</li>
              <li><strong>{en ? "Subscription dates" : "Даты подписки"}</strong> — {en ? "plan management and renewals" : "управление тарифом и продления"}</li>
              <li><strong>{en ? "Referral code" : "Реферальный код"}</strong> — {en ? "bonus program accounting" : "учёт бонусной программы"}</li>
              <li><strong>{en ? "Payment metadata" : "Метаданные платежа"}</strong> — {en ? "transaction ID, amount, status. Card data never stored." : "ID транзакции, сумма, статус. Данные карты не хранятся."}</li>
            </ul>
          </section>

          <section id="purposes" className="plx-legal-sec">
            <h2><span className="plx-legal-num">04</span>{en ? "Processing purposes" : "Цели обработки"}</h2>
            <p>{en
              ? "Information is used exclusively for: service provision, authentication, subscription management, payment processing, referral program operation, service notifications, and abuse prevention. The Service does not use information for advertising and does not share it for marketing."
              : "Информация используется исключительно для: предоставления услуг, аутентификации, управления подписками, обработки платежей, работы реферальной программы, сервисных уведомлений и предотвращения злоупотреблений. Сервис не использует информацию в рекламных целях и не передаёт её для маркетинга."}</p>
          </section>

          <section id="storage" className="plx-legal-sec">
            <h2><span className="plx-legal-num">05</span>{en ? "Storage and protection" : "Хранение и защита"}</h2>
            <p>{en
              ? "Information is stored on protected servers with industry-standard encryption at rest and in transit. Passwords are stored exclusively as bcrypt hashes. Sessions are transmitted via httpOnly, SameSite=Strict, secure cookies."
              : "Информация хранится на защищённых серверах с шифрованием at-rest и in-transit. Пароли хранятся исключительно в виде bcrypt-хэшей. Сессии передаются через httpOnly, SameSite=Strict, secure cookies."}</p>
          </section>

          <section id="thirdparty" className="plx-legal-sec">
            <h2><span className="plx-legal-num">06</span>{en ? "Third-party disclosure" : "Передача третьим лицам"}</h2>
            <p>{en
              ? "The Service does not sell, rent, or otherwise share information with third parties for commercial purposes. Disclosure is limited to: (a) the payment processor for transaction processing, and (b) responses to lawful requests from competent authorities with appropriate legal process."
              : "Сервис не продаёт, не сдаёт в аренду и не передаёт информацию третьим лицам в коммерческих целях. Передача возможна только: (а) платёжному оператору для обработки транзакции и (б) в ответ на законные запросы компетентных органов с соблюдением установленных процедур."}</p>
          </section>

          <section id="cookies" className="plx-legal-sec">
            <h2><span className="plx-legal-num">07</span>Cookies</h2>
            <p>{en
              ? "The Service uses only functional cookies: session (authentication) and verification. Analytics, advertising, and cross-site tracking cookies are not used."
              : "Сервис использует только функциональные cookies: сессионный (аутентификация) и верификационный. Аналитические, рекламные и cross-site tracking cookies не используются."}</p>
          </section>

          <section id="rights" className="plx-legal-sec">
            <h2><span className="plx-legal-num">08</span>{en ? "User rights" : "Права пользователя"}</h2>
            <p>{en ? "Users may at any time:" : "Пользователь вправе в любое время:"}</p>
            <ul>
              <li>{en ? "Request a copy of all data associated with their account" : "Запросить копию всех данных, связанных с аккаунтом"}</li>
              <li>{en ? "Demand deletion of account and all associated data" : "Потребовать удаления аккаунта и всех связанных данных"}</li>
              <li>{en ? "Withdraw consent to data processing" : "Отозвать согласие на обработку данных"}</li>
              <li>{en ? "Export data in a machine-readable format" : "Экспортировать данные в машиночитаемом формате"}</li>
            </ul>
          </section>

          <section id="contact" className="plx-legal-sec">
            <h2><span className="plx-legal-num">09</span>{en ? "Contact" : "Контакты"}</h2>
            <p>
              {en ? "For data processing inquiries or to exercise your rights, contact us via " : "По вопросам обработки данных и реализации прав обращайтесь через "}
              <a href="https://t.me/atlassecure_bot" target="_blank" rel="noopener noreferrer">@atlassecure_bot</a>
              {en ? " or email " : " или по email "}
              <a href="mailto:privacy@atlas.secure">privacy@atlas.secure</a>.
            </p>
            <p style={{ marginTop: 24 }}>
              <Link href="/contact" className="pl-cta-btn-dark" style={{ fontSize: 13, padding: "10px 20px" }}>
                {en ? "Contact DPO" : "Связаться с DPO"} <span className="pl-arrow">→</span>
              </Link>
            </p>
          </section>
        </div>
      </div>
    </PremiumPage>
  );
}
