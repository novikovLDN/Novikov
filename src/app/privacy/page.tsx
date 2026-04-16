"use client";

import PremiumPage from "@/components/PremiumPage";
import { useI18n } from "@/lib/i18n";

export default function PrivacyPage() {
  const { locale } = useI18n();

  return (
    <PremiumPage title={locale === "ru" ? "Политика конфиденциальности" : "Privacy Policy"}>
      <div className="pl-legal">
        <p className="pl-legal-date">{locale === "ru" ? "Последнее обновление: 23 марта 2026 г." : "Last updated: March 23, 2026"}</p>

        <section>
          <h2>{locale === "ru" ? "1. Введение" : "1. Introduction"}</h2>
          <p>{locale === "ru" ? "Настоящая Политика конфиденциальности устанавливает порядок сбора, обработки, хранения и защиты информации, предоставляемой Пользователями сервиса Atlas Secure. Сервис осуществляет деятельность в соответствии с принципами минимизации данных и уважения к конфиденциальности. Используя Сервис, вы подтверждаете согласие с настоящей Политикой." : "This Privacy Policy establishes the procedures for collection, processing, storage, and protection of information provided by Users of Atlas Secure. The Service operates in accordance with data minimization principles and respect for privacy. By using the Service, you confirm your agreement with this Policy."}</p>
        </section>

        <section>
          <h2>{locale === "ru" ? "2. Принцип отсутствия логирования" : "2. No-Logging Policy"}</h2>
          <p>{locale === "ru" ? "Сервис придерживается строгой политики отсутствия логирования (no-logs policy). Сервис не осуществляет запись, хранение или мониторинг: содержимого интернет-трафика, IP-адресов подключений, DNS-запросов, временных меток сессий, объёма данных в привязке к Пользователю, информации о посещаемых ресурсах." : "The Service adheres to a strict no-logs policy. The Service does not record, store, or monitor: internet traffic content, connection IP addresses, DNS queries, session timestamps, per-user data volumes, or information about visited resources."}</p>
        </section>

        <section>
          <h2>{locale === "ru" ? "3. Собираемая информация" : "3. Information Collected"}</h2>
          <p>{locale === "ru" ? "Для функционирования Сервис собирает минимально необходимый объём информации:" : "For operation, the Service collects the minimum necessary information:"}</p>
          <ul>
            <li><strong>Email</strong> — {locale === "ru" ? "идентификация учётной записи и отправка кодов верификации" : "account identification and verification codes"}</li>
            <li><strong>{locale === "ru" ? "Хэш пароля" : "Password hash"}</strong> — {locale === "ru" ? "криптографически защищённая производная пароля (bcrypt)" : "cryptographically protected password derivative (bcrypt)"}</li>
            <li><strong>{locale === "ru" ? "Дата и срок подписки" : "Subscription dates"}</strong> — {locale === "ru" ? "управление тарифным планом" : "subscription plan management"}</li>
            <li><strong>{locale === "ru" ? "Реферальный код" : "Referral code"}</strong> — {locale === "ru" ? "участие в реферальной программе" : "referral program participation"}</li>
            <li><strong>{locale === "ru" ? "Данные платежей" : "Payment data"}</strong> — {locale === "ru" ? "ID транзакции, сумма, статус. Данные карт не хранятся." : "transaction ID, amount, status. Card data is not stored."}</li>
          </ul>
        </section>

        <section>
          <h2>{locale === "ru" ? "4. Цели обработки" : "4. Processing Purposes"}</h2>
          <p>{locale === "ru" ? "Информация используется для: предоставления услуг, аутентификации, управления подписками, обработки платежей, функционирования реферальной программы, уведомлений и предотвращения злоупотреблений. Сервис не использует информацию в рекламных целях и не передаёт её для маркетинга." : "Information is used for: service provision, authentication, subscription management, payment processing, referral program operation, notifications, and abuse prevention. The Service does not use information for advertising or share it for marketing."}</p>
        </section>

        <section>
          <h2>{locale === "ru" ? "5. Хранение и защита" : "5. Storage and Protection"}</h2>
          <p>{locale === "ru" ? "Информация хранится на защищённых серверах с современным шифрованием. Пароли хранятся как bcrypt-хэши. Сессии передаются через httpOnly secure cookies." : "Information is stored on protected servers with modern encryption. Passwords are stored as bcrypt hashes. Sessions are transmitted via httpOnly secure cookies."}</p>
        </section>

        <section>
          <h2>{locale === "ru" ? "6. Передача третьим лицам" : "6. Third-Party Disclosure"}</h2>
          <p>{locale === "ru" ? "Сервис не продаёт и не передаёт информацию. Передача возможна только платёжному оператору для обработки платежа или по запросу компетентных органов в соответствии с законодательством." : "The Service does not sell or share information. Disclosure is possible only to the payment processor for transaction processing or upon lawful request from competent authorities."}</p>
        </section>

        <section>
          <h2>{locale === "ru" ? "7. Cookies" : "7. Cookies"}</h2>
          <p>{locale === "ru" ? "Сервис использует только функциональные cookies: сессионный и верификационный. Аналитические, рекламные и отслеживающие cookies не используются." : "The Service uses only functional cookies: session and verification. Analytics, advertising, and tracking cookies are not used."}</p>
        </section>

        <section>
          <h2>{locale === "ru" ? "8. Права пользователя" : "8. User Rights"}</h2>
          <p>{locale === "ru" ? "Пользователь вправе: запросить информацию о хранящихся данных, потребовать удаления учётной записи, отозвать согласие на обработку." : "Users may: request information about stored data, demand account deletion, withdraw consent to data processing."}</p>
        </section>

        <section>
          <h2>{locale === "ru" ? "9. Контакты" : "9. Contact"}</h2>
          <p>{locale === "ru" ? "По вопросам обработки данных обращайтесь через" : "For data processing inquiries, contact us via"} <a href="https://t.me/atlassecure_bot" target="_blank" rel="noopener noreferrer">@atlassecure_bot</a>.</p>
        </section>
      </div>
    </PremiumPage>
  );
}
