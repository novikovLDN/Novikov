"use client";

import PremiumPage from "@/components/PremiumPage";
import { useI18n } from "@/lib/i18n";

export default function TermsPage() {
  const { locale } = useI18n();

  return (
    <PremiumPage title={locale === "ru" ? "Условия предоставления услуг" : "Terms of Service"}>
      <div className="pl-legal">
        <p className="pl-legal-date">{locale === "ru" ? "Последнее обновление: 23 марта 2026 г." : "Last updated: March 23, 2026"}</p>

        <section>
          <h2>{locale === "ru" ? "1. Общие положения" : "1. General Provisions"}</h2>
          <p>{locale === "ru" ? "Настоящие Условия регулируют правоотношения между Atlas Secure и Пользователем. Акцепт настоящего Соглашения осуществляется путём регистрации, использования Сервиса или оплаты подписки и является полным и безоговорочным." : "These Terms govern the relationship between Atlas Secure and the User. Acceptance of this Agreement is made through registration, use of the Service, or payment of a subscription and is full and unconditional."}</p>
        </section>

        <section>
          <h2>{locale === "ru" ? "2. Предмет Соглашения" : "2. Subject of Agreement"}</h2>
          <p>{locale === "ru" ? "Сервис предоставляет доступ к технологии защищённого соединения: шифрование трафика, защита IP-адреса, доступ к серверной инфраструктуре в различных юрисдикциях и техническая поддержка в рамках тарифного плана." : "The Service provides access to secure connection technology: traffic encryption, IP address protection, access to server infrastructure across jurisdictions, and technical support within the subscription plan."}</p>
        </section>

        <section>
          <h2>{locale === "ru" ? "3. Регистрация" : "3. Registration"}</h2>
          <p>{locale === "ru" ? "Для получения доступа Пользователь обязан пройти регистрацию с действительным адресом электронной почты. Пользователь несёт ответственность за сохранность учётных данных и все действия, совершённые с использованием его учётной записи." : "To access the Service, the User must register with a valid email address. The User is responsible for the security of credentials and all actions performed under their account."}</p>
        </section>

        <section>
          <h2>{locale === "ru" ? "4. Тарифные планы" : "4. Subscription Plans"}</h2>
          <p>{locale === "ru" ? "Стоимость и характеристики тарифных планов размещаются на странице тарифов. Сервис оставляет за собой право изменять стоимость, при этом изменение не затрагивает уже оплаченные периоды." : "Plan pricing and features are listed on the Pricing page. The Service reserves the right to change pricing; changes do not affect already paid periods."}</p>
        </section>

        <section>
          <h2>{locale === "ru" ? "5. Оплата" : "5. Payment"}</h2>
          <p>{locale === "ru" ? "Оплата осуществляется через авторизованного платёжного оператора. Срок оплаты — 15 минут с момента создания сессии. Активация подписки — автоматическая после подтверждения платежа." : "Payment is processed through an authorized payment operator. Payment window is 15 minutes from session creation. Subscription activation is automatic upon payment confirmation."}</p>
        </section>

        <section>
          <h2>{locale === "ru" ? "6. Ограничения использования" : "6. Usage Restrictions"}</h2>
          <p>{locale === "ru" ? "Запрещается использовать Сервис для: распространения вредоносного ПО, несанкционированного доступа к системам третьих лиц, распространения незаконного контента, нарушения прав интеллектуальной собственности и спама." : "It is prohibited to use the Service for: distributing malware, unauthorized access to third-party systems, distributing illegal content, intellectual property violations, and spam."}</p>
        </section>

        <section>
          <h2>{locale === "ru" ? "7. Качество услуг" : "7. Service Quality"}</h2>
          <p>{locale === "ru" ? "Сервис предоставляется на условиях «как есть» (as is). Сервис прилагает разумные усилия для обеспечения непрерывности, но не гарантирует бесперебойную работу, определённую скорость или доступность серверов." : "The Service is provided 'as is'. The Service makes reasonable efforts to ensure continuity but does not guarantee uninterrupted operation, specific speeds, or server availability."}</p>
        </section>

        <section>
          <h2>{locale === "ru" ? "8. Ответственность" : "8. Liability"}</h2>
          <p>{locale === "ru" ? "Совокупная ответственность Сервиса ограничивается суммой, уплаченной за текущий период подписки. Возврат средств возможен в течение 14 дней с момента платежа при прекращении услуг по вине Сервиса." : "Total liability of the Service is limited to the amount paid for the current subscription period. Refunds are available within 14 days of payment if the Service is discontinued due to the Service's fault."}</p>
        </section>

        <section>
          <h2>{locale === "ru" ? "9. Контакты" : "9. Contact"}</h2>
          <p>{locale === "ru" ? "По всем вопросам обращайтесь через" : "For all inquiries, contact us via"} <a href="https://t.me/atlassecure_bot" target="_blank" rel="noopener noreferrer">@atlassecure_bot</a>.</p>
        </section>
      </div>
    </PremiumPage>
  );
}
