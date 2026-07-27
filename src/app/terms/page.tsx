"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PremiumPage from "@/components/PremiumPage";
import { useI18n } from "@/lib/i18n";

const SECTIONS = (en: boolean) => [
  { id: "general", n: "01", t: en ? "General provisions" : "Общие положения" },
  { id: "subject", n: "02", t: en ? "Subject of agreement" : "Предмет Соглашения" },
  { id: "registration", n: "03", t: en ? "Registration" : "Регистрация" },
  { id: "plans", n: "04", t: en ? "Subscription plans" : "Тарифные планы" },
  { id: "payment", n: "05", t: en ? "Payment" : "Оплата" },
  { id: "restrictions", n: "06", t: en ? "Usage restrictions" : "Ограничения" },
  { id: "quality", n: "07", t: en ? "Service quality" : "Качество услуг" },
  { id: "liability", n: "08", t: en ? "Liability" : "Ответственность" },
  { id: "contact", n: "09", t: en ? "Contact" : "Контакты" },
];

export default function TermsPage() {
  const { locale } = useI18n();
  const en = locale === "en";
  const [active, setActive] = useState("general");

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => { for (const e of entries) if (e.isIntersecting) setActive(e.target.id); },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    SECTIONS(en).forEach((s) => { const el = document.getElementById(s.id); if (el) obs.observe(el); });
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
            <h1>{en ? "Terms of Service" : "Условия предоставления услуг"}</h1>
            <div className="plx-legal-meta">
              <span>{en ? "Updated" : "Обновлено"}<strong>{en ? "March 23, 2026" : "23 марта 2026"}</strong></span>
              <span>{en ? "Effective" : "Действует с"}<strong>{en ? "April 1, 2026" : "1 апреля 2026"}</strong></span>
              <span>{en ? "Version" : "Версия"}<strong>3.1</strong></span>
            </div>
          </header>

          <section id="general" className="plx-legal-sec">
            <h2><span className="plx-legal-num">01</span>{en ? "General provisions" : "Общие положения"}</h2>
            <p>{en
              ? "These Terms govern the legal relationship between Atlas Secure (the Service) and the User. Acceptance of this Agreement is made through registration, use of the Service, or payment of a subscription, and is full and unconditional."
              : "Настоящие Условия регулируют правоотношения между Atlas Secure (Сервис) и Пользователем. Акцепт Соглашения осуществляется путём регистрации, использования Сервиса или оплаты подписки и является полным и безоговорочным."}</p>
          </section>

          <section id="subject" className="plx-legal-sec">
            <h2><span className="plx-legal-num">02</span>{en ? "Subject of agreement" : "Предмет Соглашения"}</h2>
            <p>{en
              ? "The Service provides access to secure connection technology: traffic encryption (VLESS/Reality, VMess, Trojan), IP address masking, access to server infrastructure in multiple jurisdictions, and technical support within the limits of the selected plan."
              : "Сервис предоставляет доступ к технологии защищённого соединения: шифрование трафика (VLESS/Reality, VMess, Trojan), маскирование IP-адреса, доступ к серверной инфраструктуре в различных юрисдикциях и техническую поддержку в рамках выбранного тарифного плана."}</p>
          </section>

          <section id="registration" className="plx-legal-sec">
            <h2><span className="plx-legal-num">03</span>{en ? "Registration" : "Регистрация"}</h2>
            <p>{en
              ? "To access the Service, the User must register with a valid email address. The User is responsible for the security of their credentials and all actions performed under their account. The Service reserves the right to suspend or terminate accounts that violate these Terms."
              : "Для доступа к Сервису Пользователь обязан пройти регистрацию с действительным адресом email. Пользователь несёт ответственность за сохранность учётных данных и все действия, совершённые с использованием его аккаунта. Сервис вправе приостанавливать или прекращать действие аккаунтов, нарушающих Условия."}</p>
          </section>

          <section id="plans" className="plx-legal-sec">
            <h2><span className="plx-legal-num">04</span>{en ? "Subscription plans" : "Тарифные планы"}</h2>
            <p>{en
              ? "Pricing and features of all plans are published on the Pricing page. The Service reserves the right to modify pricing at any time; changes do not affect periods that have already been paid."
              : "Стоимость и характеристики всех тарифных планов публикуются на странице Тарифов. Сервис оставляет за собой право изменять стоимость в любое время; изменения не затрагивают уже оплаченные периоды."}</p>
            <ul>
              <li><strong>Trial</strong> — {en ? "3 days free, no payment required" : "3 дня бесплатно, без оплаты"}</li>
              <li><strong>{en ? "Telegram bonus" : "Telegram бонус"}</strong> — +7 {en ? "days" : "дней"}</li>
              <li><strong>{en ? "Referral bonus" : "Реферальный бонус"}</strong> — +20 {en ? "days per paid referral" : "дней за оплаченного реферала"}</li>
            </ul>
          </section>

          <section id="payment" className="plx-legal-sec">
            <h2><span className="plx-legal-num">05</span>{en ? "Payment" : "Оплата"}</h2>
            <p>{en
              ? "Payment is processed through an authorized payment operator. The payment window is 15 minutes from session creation. Subscription activation is automatic upon confirmation from the payment operator."
              : "Оплата производится через авторизованного платёжного оператора. Срок оплаты — 15 минут с момента создания платёжной сессии. Активация подписки происходит автоматически после подтверждения от оператора."}</p>
          </section>

          <section id="restrictions" className="plx-legal-sec">
            <h2><span className="plx-legal-num">06</span>{en ? "Usage restrictions" : "Ограничения использования"}</h2>
            <p>{en ? "The Service may not be used for:" : "Сервис запрещено использовать для:"}</p>
            <ul>
              <li>{en ? "Distribution of malware or unauthorized access attempts" : "Распространения вредоносного ПО или попыток несанкционированного доступа"}</li>
              <li>{en ? "Distribution of child sexual abuse material (CSAM)" : "Распространения материалов сексуального насилия в отношении детей"}</li>
              <li>{en ? "Mass email spam or commercial bulk messaging" : "Массовых рассылок спама или коммерческих рассылок"}</li>
              <li>{en ? "Attacks on third-party systems (DoS, exploitation, bruteforce)" : "Атак на сторонние системы (DoS, эксплуатация, брутфорс)"}</li>
              <li>{en ? "Violation of applicable laws in the User's jurisdiction" : "Нарушения законодательства юрисдикции Пользователя"}</li>
            </ul>
          </section>

          <section id="quality" className="plx-legal-sec">
            <h2><span className="plx-legal-num">07</span>{en ? "Service quality" : "Качество услуг"}</h2>
            <p>{en
              ? "The Service is provided on an 'as is' basis with a 99.98% uptime SLA. The Service makes reasonable efforts to ensure continuity but does not guarantee uninterrupted operation, specific speeds, or availability of individual servers. Credits are issued automatically for any breach of the monthly SLA."
              : "Сервис предоставляется на условиях «как есть» с SLA по аптайму 99.98%. Сервис прилагает разумные усилия для обеспечения непрерывности, но не гарантирует бесперебойную работу, определённую скорость или доступность конкретных серверов. Кредиты начисляются автоматически при нарушении месячного SLA."}</p>
          </section>

          <section id="liability" className="plx-legal-sec">
            <h2><span className="plx-legal-num">08</span>{en ? "Liability" : "Ответственность"}</h2>
            <p>{en
              ? "The Service's total liability is limited to the amount paid by the User for the current subscription period. Refunds are available within 14 days of payment if the Service is discontinued through the Service's fault. The Service is not liable for User actions or third-party services."
              : "Совокупная ответственность Сервиса ограничивается суммой, уплаченной Пользователем за текущий период подписки. Возврат средств возможен в течение 14 дней с момента платежа при прекращении услуг по вине Сервиса. Сервис не несёт ответственности за действия Пользователя или сторонние сервисы."}</p>
          </section>

          <section id="contact" className="plx-legal-sec">
            <h2><span className="plx-legal-num">09</span>{en ? "Contact" : "Контакты"}</h2>
            <p>
              {en ? "For all inquiries, contact us via " : "По всем вопросам обращайтесь через "}
              <a href="https://t.me/atlas_suppbot" target="_blank" rel="noopener noreferrer">@atlas_suppbot</a>
              {en ? " or email " : " или по email "}
              <a href="mailto:support@atlas.secure">support@atlas.secure</a>.
            </p>
            <p style={{ marginTop: 24 }}>
              <Link href="/contact" className="pl-cta-btn-dark" style={{ fontSize: 13, padding: "10px 20px" }}>
                {en ? "Contact support" : "Связаться с поддержкой"} <span className="pl-arrow">→</span>
              </Link>
            </p>
          </section>
        </div>
      </div>
    </PremiumPage>
  );
}
