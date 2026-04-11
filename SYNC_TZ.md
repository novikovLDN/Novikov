# ТЗ синхронизации: Сайт Atlas Secure ↔ Бот ATCbot

## Авторизация

Все запросы к `/api/bot/*` требуют заголовок:
```
X-Bot-Api-Key: <значение BOT_API_KEY из .env>
```

---

## 1. БАЛАНС

### Владелец: БОТ

Сайт хранит баланс в `users.balance` (INTEGER, копейки) только для отображения. Пополнение, оплата, вывод — только через бот. Единственное, что сайт пишет в баланс самостоятельно — **кешбэк рефереру при оплате через YooKassa**.

### `POST /api/bot/sync-balance` — синхронизация баланса

**Когда вызывать:** периодически или после каждого изменения баланса в боте.

**Request:**
```json
{
  "telegramId": "123456789",
  "balance": 100000
}
```
- `balance` — текущий баланс бота в **копейках** (100000 = 1000.00₽)

**Логика сайта:**
1. Ищет все транзакции кешбэка с `synced_to_bot = false` для этого пользователя
2. Считает `unsyncedTotal` = сумма всех неотсинченных транзакций
3. `correctBalance = botBalance + unsyncedTotal`
4. Обновляет `users.balance = correctBalance`
5. Помечает все эти транзакции `synced_to_bot = true`
6. Возвращает `pendingCashback` — бот **ДОЛЖЕН** прибавить эти суммы к своему балансу

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "user@mail.com",
    "balance": 102990,
    "balanceRubles": 1029.90,
    "previousBalance": 100000,
    "pendingCashback": [
      {
        "id": "tx-uuid-1",
        "amount": 2990,
        "amountRubles": 29.90,
        "description": "Кешбэк 10% от покупки 299₽",
        "relatedUserId": "buyer-uuid",
        "createdAt": "2026-04-11T12:00:00.000Z"
      }
    ],
    "pendingCashbackTotal": 2990,
    "pendingCashbackTotalRubles": 29.90
  }
}
```

**Действие бота после ответа:**
```python
if response["pendingCashback"]:
    for cb in response["pendingCashback"]:
        # Прибавить cb["amount"] (копейки) к балансу бота
        database.increase_balance(
            telegram_id,
            cb["amountRubles"],
            source="site_referral",
            description=cb["description"]
        )
```

Если `pendingCashback` пустой — баланс бота не менялся со стороны сайта, ничего делать не нужно.

### Пример полного цикла синхронизации баланса

```
Бот: баланс = 100000 коп (1000.00₽)

Между синхронизациями на сайте произошло:
  → Реферал оплатил 299₽ через YooKassa
  → Сайт начислил кешбэк 10% = 2990 коп (29.90₽)
  → balance_transactions: { amount: 2990, synced_to_bot: false }
  → users.balance на сайте: 100000 + 2990 = 102990

Бот вызывает POST /api/bot/sync-balance { balance: 100000 }
  → Сайт: botBalance=100000, unsyncedTotal=2990
  → correctBalance = 100000 + 2990 = 102990
  → Помечает транзакцию synced_to_bot = true
  → Response: { balance: 102990, pendingCashback: [{amount: 2990}] }

Бот получает ответ:
  → Прибавляет 2990 коп к своему балансу
  → Бот: баланс = 100000 + 2990 = 102990 коп (1029.90₽)
  → Обе стороны = 102990 ✓
```

### `GET /api/bot/sync-balance?telegram_id=123456789` — проверка баланса

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "user@mail.com",
    "balance": 102990,
    "balanceRubles": 1029.90,
    "pendingCashbackCount": 0,
    "pendingCashbackTotal": 0,
    "pendingCashbackTotalRubles": 0
  }
}
```

---

## 2. РЕФЕРАЛЬНАЯ СИСТЕМА (кешбэк)

### Уровни лояльности

| Оплативших рефералов | Кешбэк | Уровень       |
|----------------------|--------|---------------|
| 0–24                 | **10%**| Стартовый     |
| 25–49                | **25%**| Продвинутый   |
| 50+                  | **45%**| Партнёр       |

Считается по `paidReferrals` — количеству рефералов, которые хотя бы раз оплатили.

### Когда сайт начисляет кешбэк самостоятельно

При каждом успешном платеже через YooKassa (webhook или polling), если у покупателя есть `referredBy` (реферальный код пригласившего):

```
Покупатель платит 299₽ → YooKassa webhook → creditReferrerOnPayment(buyerId, 299, paymentId)

Расчёт:
  → Реферер: paidReferrals=3, getCashbackPercent(3)=10%
  → rewardKopecks = round(299 * 10 / 100 * 100) = 2990 копеек (29.90₽)

Запись в БД:
  → UPDATE users SET balance = balance + 2990, paid_referrals = paid_referrals + 1
  → INSERT INTO balance_transactions (synced_to_bot = FALSE)
  → INSERT INTO referral_rewards (идемпотентность по buyer_id + purchase_id)
```

**Защиты:**
- Самореферал заблокирован (referrer.id !== buyer.id)
- Кешбэк не дублируется — UNIQUE на `(buyer_id, purchase_id)` в `referral_rewards`
- Без суммы покупки — только инкрементирует `paidReferrals`, кешбэк не начисляет

### `POST /api/bot/sync-referrals` — синхронизация рефералов

**Когда вызывать:** после изменения реферальных данных в боте.

**Request:**
```json
{
  "telegramId": "123456789",
  "referrals": 15,
  "paidReferrals": 5,
  "referralCode": "ABC123"
}
```

**Логика:** берёт MAX от бота и сайта по каждому полю — данные никогда не теряются.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "referrals": 15,
    "paidReferrals": 5,
    "referralCode": "SITE1234",
    "siteReferralCode": "SITE1234",
    "botReferralCode": "ABC123",
    "balance": 102990,
    "balanceRubles": 1029.90,
    "cashbackPercent": 10,
    "loyaltyTier": "Стартовый",
    "nextTier": "Продвинутый",
    "referralsToNextTier": 20
  }
}
```

---

## 3. ПОДПИСКА

### `POST /api/bot/extend` — продление подписки после оплаты в боте

**Request:**
```json
{
  "telegramId": "123456789",
  "days": 30,
  "plan": "basic",
  "amount": 299,
  "paymentId": "bot-payment-uuid-123"
}
```

| Поле         | Тип    | Обязательное | Описание                                                    |
|--------------|--------|--------------|-------------------------------------------------------------|
| `telegramId` | string | Да           | Telegram ID пользователя                                    |
| `days`       | number | Да           | Количество дней продления                                   |
| `plan`       | string | Нет          | "basic" или "plus"                                          |
| `amount`     | number | Нет          | Сумма покупки в **рублях** (для расчёта кешбэка рефереру)   |
| `paymentId`  | string | Нет          | Уникальный ID платежа (для идемпотентности кешбэка)         |

**Логика сайта:**
1. Продляет подписку (от текущего конца или от now, если истекла)
2. Если VPN-ключ был удалён (подписка истекала) — генерирует новый `xrayUuid`, `vpnKey`, `subToken`
3. Обновляет `subscriptionPlan`
4. Если передан `amount` — начисляет кешбэк рефереру (`synced_to_bot = false`)
5. Создаёт уведомление пользователю на сайте

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "user@mail.com",
    "daysLeft": 30,
    "subscriptionEnd": "2026-05-11T12:00:00.000Z",
    "vpnKey": "https://...",
    "subscriptionPlan": "basic",
    "referralReward": {
      "referrerId": "referrer-uuid",
      "percent": 10,
      "rewardAmount": 29.90
    }
  }
}
```

`referralReward` = `null` если у покупателя нет реферера, или если `amount` не передан.

**Важно:** кешбэк, начисленный здесь, появится в `pendingCashback` при следующем вызове `POST /api/bot/sync-balance`. Бот должен забрать его оттуда.

### `POST /api/bot/sync` — перезапись подписки

**Request:**
```json
{
  "telegramId": "123456789",
  "action": "overwrite_site",
  "subscriptionEnd": "2026-05-11T12:00:00.000Z",
  "plan": "basic"
}
```

Перезаписывает `subscriptionEnd` и `subscriptionPlan` на сайте значениями из бота. VPN-ключи **не трогает**.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "user@mail.com",
    "subscriptionEnd": "2026-05-11T12:00:00.000Z",
    "subscriptionPlan": "basic",
    "telegramLinked": true
  }
}
```

---

## 4. СТАТУС

### `GET /api/bot/status?telegram_id=123456789` — полный статус пользователя

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "user@mail.com",
    "telegramId": "123456789",
    "telegramLinked": true,
    "daysLeft": 25,
    "hoursLeft": 14,
    "minutesLeft": 32,
    "isExpired": false,
    "hasActiveSubscription": true,
    "subscriptionEnd": "2026-05-11T12:00:00.000Z",
    "subscriptionPlan": "basic",
    "vpnKey": "https://...",
    "xrayUuid": "uuid",
    "referralCode": "SITE1234",
    "referrals": 15,
    "paidReferrals": 5,
    "balance": 102990,
    "balanceRubles": 1029.90,
    "cashbackPercent": 10,
    "loyaltyTier": "Стартовый"
  }
}
```

Если подписка истекла — `vpnKey` и `xrayUuid` = `null`.

---

## 5. ЧТО НЕ СИНХРОНИЗИРУЕТСЯ

| Данные                             | Причина                          |
|------------------------------------|----------------------------------|
| **VPN-ключи** (vpnKey, xrayUuid)  | Каждая сторона хранит свои       |
| **Пароль**                         | Только на сайте                  |
| **Оплата с баланса на сайте**      | Не реализована, только через бот |

---

## 6. ПОРЯДОК ВЫЗОВОВ ДЛЯ БОТА

### При оплате подписки в боте:
```
1. Активировать подписку в боте
2. POST /api/bot/extend { telegramId, days, plan, amount, paymentId }
3. POST /api/bot/sync-balance { telegramId, balance }
   → Забрать pendingCashback если есть
```

### Периодическая синхронизация:
```
1. POST /api/bot/sync-balance { telegramId, balance }
   → Забрать pendingCashback
2. POST /api/bot/sync-referrals { telegramId, referrals, paidReferrals }
```

### Проверка статуса:
```
GET /api/bot/status?telegram_id=123456789
```

---

## 7. ОШИБКИ

Все эндпоинты возвращают ошибки в формате:
```json
{ "success": false, "error": "Описание ошибки" }
```

| HTTP | Когда                                        |
|------|----------------------------------------------|
| 401  | Неверный или отсутствующий `X-Bot-Api-Key`   |
| 400  | Не переданы обязательные поля                |
| 404  | Пользователь не найден по `telegramId`       |
| 500  | Внутренняя ошибка сервера                    |

---

## 8. СХЕМА БД (релевантные таблицы)

### users (ключевые поля)
```sql
balance INTEGER NOT NULL DEFAULT 0          -- Копейки
referral_code TEXT UNIQUE NOT NULL          -- 8-символьный код
referred_by TEXT                            -- Код пригласившего
referrals INTEGER NOT NULL DEFAULT 0       -- Сколько пригласил
paid_referrals INTEGER NOT NULL DEFAULT 0  -- Сколько из них оплатили
subscription_end TIMESTAMPTZ NOT NULL      -- Конец подписки
subscription_plan TEXT DEFAULT 'trial'     -- trial|basic|plus
```

### balance_transactions
```sql
id TEXT PRIMARY KEY
user_id TEXT NOT NULL
amount INTEGER NOT NULL                    -- Копейки
type TEXT NOT NULL                         -- 'cashback'
source TEXT                                -- 'referral'
description TEXT                           -- 'Кешбэк 10% от покупки 299₽'
related_user_id TEXT                       -- ID покупателя
synced_to_bot BOOLEAN NOT NULL DEFAULT TRUE -- FALSE = ещё не забрал бот
created_at TIMESTAMPTZ DEFAULT NOW()
```

### referral_rewards
```sql
id TEXT PRIMARY KEY
referrer_id TEXT NOT NULL                  -- Кто получил кешбэк
buyer_id TEXT NOT NULL                     -- Кто купил
purchase_id TEXT                           -- ID платежа (идемпотентность)
purchase_amount INTEGER NOT NULL           -- Сумма покупки (копейки)
percent INTEGER NOT NULL                   -- 10, 25 или 45
reward_amount INTEGER NOT NULL             -- Сумма кешбэка (копейки)
created_at TIMESTAMPTZ DEFAULT NOW()

UNIQUE INDEX (buyer_id, purchase_id)       -- Защита от дубликатов
```
