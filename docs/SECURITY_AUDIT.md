# Kyanchir Store — аудит безопасности (апрель 2025)

## ✅ Исправленные проблемы
- **Утечка cron-секрета**: файл `vercel.json` удалён из репозитория; расписание теперь настраивается через Vercel Scheduler с использованием переменной окружения `CRON_SECRET`. Подробный гайд находится в `docs/operations/cron.md`.【F:docs/operations/cron.md†L1-L12】
- **Несогласованный UI кнопки «В корзину»**: добавлен конфиг `src/config/payments.ts` и временный режим тестовой оплаты. При наличии `NEXT_PUBLIC_TEST_PAYMENT_URL` кнопка переводит пользователя на тестовый платёж, не создавая заказа локально.【F:src/config/payments.ts†L1-L14】【F:src/components/ProductDetails.tsx†L329-L376】【F:src/components/site/product/AddToCartButton.tsx†L33-L66】
- **Ошибочный include в `tsconfig.json`**: удалена битая запись `route.ts.дtkk`, что возвращает работоспособность `tsc --noEmit`.【F:tsconfig.json†L1-L26】

## ⚠️ Обнаруженные риски и план действий
| Риск | Статус | Решение |
| --- | --- | --- |
| API `/api/admin/products/update-stock/route.ts` по-прежнему выполняет обновление остатков вне транзакции и без retry. | 🔥 Критический | Вынести логику в Server Action с `prisma.$transaction` и журналированием ошибок. |
| Cron-синк требует авторизации через админскую сессию, что мешает безопасно запускать задачу из планировщика. | ⚠️ Средний | Создать отдельный сервисный токен и альтернативный эндпоинт только для cron-запусков. См. `docs/operations/cron.md`. |
| YooKassa интеграция не настроена: отсутствуют ключи `YOOKASSA_*`, а код платежей не покрыт тестами. | ⚠️ Средний | Добавить переменные окружения и e2e-тест оплаты после подключения боевых ключей. |
| В проекте нет централизованного логирования и алертов. | ⚠️ Средний | Подключить Sentry или Logtail, расширить `src/lib/monitoring.ts`. |

## 🔑 Проверка переменных окружения
Ниже — срез по env-ключам, упомянутым в кодовой базе.

| Переменная | Статус | Примечание |
| --- | --- | --- |
| `DATABASE_URL` | ✅ Есть в .env (не проверена связность) | Требует живой БД для smoke-тестов. |
| `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD`, `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_FROM` | ✅ Есть | Провести почтовый smoke-тест после развертывания. |
| `AUTH_SECRET`, `NEXTAUTH_URL` | ✅ Есть | Проверить валидность JWT после деплоя. |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET` | ✅ Есть | Нужна проверка вебхука на стейджинге. |
| `TELEGRAM_SUPPORT_BOT_TOKEN`, `TELEGRAM_SUPPORT_WEBHOOK_SECRET`, `TELEGRAM_ADMIN_IDS` | ✅ Есть | Требуются e2e-тесты бота поддержки. |
| `MOYSKLAD_API_TOKEN` | ✅ Есть | Выполнить ручной тест синхронизации товаров. |
| `CRON_SECRET` | ⚠️ Есть, но переносится в переменные окружения | Настроить в Vercel Scheduler. |
| `ENCRYPTION_KEY`, `ENCRYPTION_SALT` | ✅ Есть | Секреты не проверялись на формат, требуется unit-тест шифрования. |
| `BOT_API_SECRET` | ❌ Отсутствует | Без него недоступна авторизация через Telegram bot API. |
| `YOOKASSA_*` (`YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`, `YOOKASSA_TEST_SHOP_ID`, `YOOKASSA_TEST_SECRET_KEY`, `YOOKASSA_MODE`, `YOOKASSA_RETURN_URL`, `YOOKASSA_RECEIPT_ENABLED`, `YOOKASSA_RECEIPT_VAT_CODE`, `YOOKASSA_TAX_SYSTEM_CODE`, `YOOKASSA_MERCHANT_FULL_NAME`, `YOOKASSA_MERCHANT_INN`) | ❌ Отсутствуют | Блокируют запуск оплаты; нужно запросить ключи у платёжного провайдера. |
| `NEXT_PUBLIC_TEST_PAYMENT_URL`, `NEXT_PUBLIC_TEST_PAYMENT_KEY`, `NEXT_PUBLIC_ENABLE_TEST_PAYMENT_REDIRECT` | ⚠️ Добавлены | Для активации тестового платежа задайте URL и ключ в .env. |

> ℹ️ Физическая проверка внешних сервисов (БД, SendGrid, Telegram, YooKassa) в офлайн-окружении невозможна. Запланируйте smoke-тесты сразу после деплоя на staging.

## 📌 Следующие шаги
1. Подготовить Server Action для синхронизации остатков и закрыть уязвимость гонок данных в админских эндпоинтах.
2. Завести секрет `BOT_API_SECRET` и покрыть Telegram API unit-тестами авторизации.
3. Подключить YooKassa ключи и переписать checkout под реальный платёжный флоу.
4. Настроить мониторинг и алертинг (Sentry/Logtail) и обновить `src/lib/monitoring.ts`.
