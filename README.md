# 🛍️ Платформа «Kyanchir»

Next.js 14‑приложение для электронной коммерции, которое объединяет витрину, личный кабинет покупателя, административную панель и интеграции с внешними сервисами. Репозиторий содержит и фронтенд, и серверную часть, поэтому единые стандарты разработки и аккуратная работа с данными критичны.

> 📚 **Перед началом работы прочитайте [README_KYANCHIR.md](./README_KYANCHIR.md).** Там описаны архитектурные договорённости и правила, которые нельзя нарушать.

## 📌 Ключевые особенности

- **Next.js App Router** с серверными компонентами, Server Actions и кастомными API‑маршрутами.【F:src/app/(site)/page.tsx†L1-L60】【F:src/app/api/orders/route.ts†L1-L189】
- **Prisma + PostgreSQL (Neon)** как основной источник данных и слой доступа к БД.【F:prisma/schema.prisma†L1-L336】
- **Auth.js (NextAuth)** с авторизацией по email/паролю и Telegram Login, ролью администратора и адаптером Prisma.【F:src/lib/auth.ts†L1-L103】
- **Модуль корзины и чек‑аута** на zustand с локальным хранением, страницами `/cart` и `/checkout`, API создания заказа и формированием платежа в ЮKassa.【F:src/store/useCartStore.ts†L1-L112】【F:src/app/(site)/checkout/page.tsx†L1-L260】【F:src/app/api/orders/route.ts†L1-L220】【F:src/lib/payments/yookassa.ts†L1-L210】
- **Интеграции**: МойСклад, Telegram Bot API, SendGrid, CDEK и фоновые задачи Vercel Cron (см. гайд по настройке).【F:src/lib/moysklad-api.ts†L1-L160】【F:docs/operations/cron.md†L1-L12】
- **Админ-конструктор дизайн-системы** с управлением шрифтами, цветовой палитрой, типографикой, отступами и каталогом SVG-иконок, который синхронизирует токены с фронтендом через CSS-переменные.【F:src/app/admin/settings/design-system/page.tsx†L1-L74】【F:src/components/admin/settings/DesignSystemForm.tsx†L1-L120】
- **Админ-управление пользователями** с поиском, фильтрами, обновлением ролей и удалением аккаунтов прямо в панели администратора.【F:src/components/admin/users/UsersTable.tsx†L1-L212】【F:src/components/admin/users/UserActions.tsx†L1-L211】【F:src/app/api/admin/users/[userId]/route.ts†L1-L60】

## 📊 Текущее состояние (обновлено 2025‑04‑06)

| Направление | Статус | Комментарий |
| --- | --- | --- |
| Корзина и checkout | ⚠️ Тестовая оплата ЮKassa | Корзина и оформление заказа работают, `/api/orders` создаёт заказ, инициирует платёж через ЮKassa и возвращает ссылку на оплату. Пока используется тестовый магазин, боевые ключи нужно добавить после верификации профиля.【F:src/store/useCartStore.ts†L1-L112】【F:src/app/api/orders/route.ts†L1-L220】【F:src/lib/payments/yookassa.ts†L1-L210】【F:src/app/(site)/checkout/page.tsx†L1-L260】 |
| Каталог и главная | ⚠️ Требуют оптимизации | Страницы `/(site)` помечены как `force-dynamic` и загружают весь ассортимент без пагинации и кеширования.【F:src/app/(site)/page.tsx†L7-L47】【F:src/app/(site)/catalog/page.tsx†L1-L51】 |
| Конфигурации и секреты | ⚠️ Частично закрыто | `tsconfig.json` исправлен, cron вынесен в инфраструктуру, но отсутствуют `BOT_API_SECRET` и ключи YooKassa — см. свежий аудит.【F:tsconfig.json†L1-L26】【F:docs/SECURITY_AUDIT.md†L4-L33】 |
| Дизайн-система | ✅ Управляется из админки | Глобальные шрифты (Manrope, PT Mono), палитры и размеры типографики задаются через новый редактор, изменения подхватываются публичным фронтом и Tailwind-токенами.【F:src/app/layout.tsx†L1-L140】【F:src/lib/settings/design-system.ts†L1-L200】【F:src/components/admin/settings/DesignSystemForm.tsx†L1-L120】|
| Админские API | ⚠️ Нужны транзакции и валидация | Эндпоинт обновления остатков обращается к МойСклад и Prisma вне транзакции, ошибки логируются только в консоль.【F:src/app/api/admin/products/update-stock/route.ts†L1-L56】 |
| Качество кода | ⚠️ Частичное покрытие | Тестов мало (2 node:test сценария), bundle‑анализ и мониторинг не настроены.【F:tests/lib-utils.test.ts†L1-L32】【F:tests/ui-components.test.tsx†L1-L128】 |
| Завершённые задачи | ✅ Подтверждено | Конфиги Prettier/PostCSS, `tsconfig.seed.json`, система шрифтов и "глупые" UI‑компоненты соответствуют требованиям и не требуют изменений сейчас.【F:postcss.config.mjs†L1-L20】【F:prettier.config.js†L1-L15】【F:src/app/fonts.ts†L1-L120】 |

> Полную историю аудитов и незакрытых задач смотрите в файлах `roadmap_tx_td` и `STATUS.md` в корне репозитория.

## 🚀 Быстрый старт

1. **Установка**
   ```bash
   git clone <repo-url>
   cd kyanchir-store
   npm install
   ```
2. **Переменные окружения**
   - Скопируйте `.env.example` в `.env.local` (если образца нет — создайте файл вручную).
   - Минимальный набор:
     - `DATABASE_URL`
     - `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
     - ключи интеграций (Telegram, SendGrid, CDEK, МойСклад и т. д.)
      - `NEXT_PUBLIC_TEST_PAYMENT_URL`, `NEXT_PUBLIC_TEST_PAYMENT_KEY` для включения тестового платежа (опционально)
3. **Миграции и сиды**
   ```bash
   npx prisma migrate dev
   npm run db:seed   # опционально для локальных данных
   ```
4. **Запуск dev-сервера**
   ```bash
   npm run dev
   ```
   Приложение будет доступно на [http://localhost:3000](http://localhost:3000).

## 🧰 Основные команды

| Команда | Назначение |
| --- | --- |
| `npm run dev` | Next.js в режиме разработки. |
| `npm run build` | Production-пайплайн: unit-тесты → `prisma migrate deploy` → `prisma generate` → `next build` с записью отчёта в `data/build-reports.json` (локально можно выставить `SKIP_DB_MIGRATIONS=1`, если нет доступа к БД; для CI доступен аварийный режим `SKIP_DB_MIGRATIONS_ON_LOCK=1`, который пропускает шаг деплоя при advisory lock — миграции в этом случае нужно выкатывать отдельно).【F:package.json†L5-L28】【F:scripts/build-with-quality-checks.mjs†L1-L170】【F:scripts/prisma-migrate-deploy-with-retry.mjs†L1-L200】 |
| `npm run start` | Локальный запуск собранного приложения. |
| `npm run lint` | ESLint + проверка форматирования. |
| `npm run typecheck` | Проверка типов TypeScript (`tsc --noEmit`). |
| `npm run test` | node:test (минимальный набор unit/компонентных тестов). |
| `npm run analyze:deps` | Анализ неиспользуемых и пропущенных зависимостей через Knip. |
| `npm run analyze:graph` | Поиск циклических зависимостей и тяжёлых связей между модулями через Madge. |
| `npm run db:seed` | Наполнение базы тестовыми данными (`tsx prisma/seed.ts`). |
| `npm run db:reset` | Сброс схемы и повторный сид (⚠️ без подтверждения). |
| `npm run prisma:studio` | Prisma Studio для просмотра базы. |

## 💳 Подключение ЮKassa

Интеграция ЮKassa встроена в API оформления заказа: после успешной транзакции Prisma создаётся платёж и возвращается ссылка на оплату. Чтобы активировать платежи, пропишите переменные окружения в `.env.local`:

```bash
# Режим работы
YOOKASSA_MODE=test        # установите live после верификации магазина

# Тестовые реквизиты (используйте реальные после подтверждения профиля)
YOOKASSA_TEST_SHOP_ID=1174757
YOOKASSA_TEST_SECRET_KEY=test_************************

# Боевые реквизиты (заполняются после получения от ЮKassa)
YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=

# Дополнительные настройки
YOOKASSA_RETURN_URL=https://kyanchir.ru/checkout/success
YOOKASSA_MERCHANT_INN=503125980428
YOOKASSA_MERCHANT_FULL_NAME="ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ КОЛЕСНИКОВА ЯНА РУСЛАНОВНА"
YOOKASSA_TAX_SYSTEM_CODE=6          # при необходимости измените под систему налогообложения
YOOKASSA_RECEIPT_VAT_CODE=1         # код ставки НДС (1 = 20%)
YOOKASSA_RECEIPT_ENABLED=true       # выключите, если чеки формируются внешней кассой
```

После первичной настройки секретов все ключевые параметры можно обновлять из административной панели — страница **«ЮKassa»** доступна по адресу `/admin/yookassa`. Форма позволяет переключать режимы test/live, редактировать ИНН, ОГРНИП и банковские реквизиты, а также заменять секретные ключи без доступа к серверу. Просмотреть сохранённые данные можно на странице `/admin/yookassa/preview`.【F:src/app/admin/yookassa/page.tsx†L1-L63】【F:src/components/admin/yookassa/YookassaSettingsForm.tsx†L1-L466】【F:src/app/admin/yookassa/preview/page.tsx†L1-L164】

Аналогичный подход теперь доступен и для интеграции с **МойСклад**: отдельная страница `/admin/moysklad` отображает статус сохранённого токена, позволяет протестировать новый ключ через API `entity/organization` и мгновенно обновить значение в `SystemSetting` без перезапуска фоновых процессов.【F:src/app/admin/moysklad/page.tsx†L1-L63】【F:src/components/admin/moysklad/MoyskladSettingsForm.tsx†L1-L168】【F:src/lib/settings/moysklad.ts†L1-L48】

Для подготовки подключения **СДЭК** добавлена страница `/admin/sdek` с формой управления тестовыми и боевыми реквизитами, параметрами отправителя и webhook-секретом; данные хранятся в `SystemSetting` и доступны через REST-эндпоинт `/api/admin/settings/sdek` для дальнейших сервисов доставки.【F:src/app/admin/sdek/page.tsx†L1-L24】【F:src/components/admin/sdek/SdekSettingsForm.tsx†L1-L275】【F:src/lib/settings/sdek.ts†L1-L285】【F:src/app/api/admin/settings/sdek/route.ts†L1-L78】

> ⚠️ **Важно:** тестовый магазин работает только в режиме `YOOKASSA_MODE=test`. После получения боевых ключей обновите переменные и перезапустите приложение. Телефон клиента нормализуется до формата `+7...` автоматически, поэтому просите вводить российские номера без разделителей. 【F:src/app/api/orders/route.ts†L1-L220】【F:src/lib/payments/yookassa.ts†L1-L210】【F:src/app/(site)/checkout/page.tsx†L1-L260】

Информация о продавце (ИНН и ФИО ИП) автоматически добавляется в `supplier` каждого товара чека и в метаданные платежа, поэтому фискальные требования выполняются без дополнительных настроек на фронтенде.【F:src/lib/payments/yookassa.ts†L70-L190】

## 🗂 Структура проекта

- `src/app` — маршруты Next.js (страницы, API, layout'ы).【F:src/app/(site)/page.tsx†L1-L60】
- `src/components` — UI-компоненты витрины, админки и общие блоки.【F:src/components/ProductDetails.tsx†L1-L420】
- `src/store` — zustand‑сторы приложения (корзина, UI уведомления).【F:src/store/useCartStore.ts†L1-L112】
- `src/lib` — хелперы, интеграции и доменные сервисы (Prisma, Auth, API клиентов).【F:src/lib/prisma.ts†L1-L60】【F:src/lib/moysklad-api.ts†L1-L160】
- `scripts` — вспомогательные CLI-инструменты (например, снятие скриншотов через Playwright).【F:scripts/capture-screenshot.ts†L1-L117】
- `prisma` — схема и миграции базы данных.【F:prisma/schema.prisma†L1-L336】
- `tests` — авто-тесты и вспомогательные фикстуры.【F:tests/ui-components.test.tsx†L1-L128】
- `Old/`, `roadmap_tx_td`, `STATUS.md` — архивные материалы и исторические аудиты (не подключены к приложению).

## 🔁 Критические пользовательские потоки

- **Добавление в корзину** — `ProductDetails` вызывает `useCartStore.addItem`, контролирует остатки по выбранному размеру и показывает уведомления.【F:src/components/ProductDetails.tsx†L329-L376】
- **Страница корзины** — `/cart` позволяет менять количество и удалять позиции, пересчитывая итоговую сумму на клиенте.【F:src/app/(site)/cart/page.tsx†L18-L120】
- **Чек-аут** — `/checkout` собирает контактные данные, отправляет POST `/api/orders`, очищает корзину и показывает ссылку на оплату, если платеж сформирован.【F:src/app/(site)/checkout/page.tsx†L1-L260】
- **Создание заказа** — API валидирует входные данные, проверяет остатки, создаёт заказ, уменьшает сток в транзакции Prisma и инициирует платёж в ЮKassa при наличии конфигурации.【F:src/app/api/orders/route.ts†L1-L220】【F:src/lib/payments/yookassa.ts†L1-L210】
- **Вход через Telegram** — кнопка на `/login` мгновенно открывает клиентского бота `@kyanchir_store_bot`, который запрашивает контакт (ссылка на политику/оферту добавляется в запрос), собирает email и либо создаёт новый доступ, либо объединяет аккаунт через проверочный код. После нажатия «Авторизоваться» в чате бот завершает процесс и сообщает об успешном входе на сайте.【F:src/app/(site)/(auth)/login/page.tsx†L1-L340】【F:src/lib/telegram.ts†L1-L420】

## ⚠️ Известные ограничения

- Интеграция с ЮKassa работает в тестовом режиме: после верификации профиля нужно переключить `YOOKASSA_MODE=live` и добавить боевые ключи. Email/Telegram уведомления остаются в планах.【F:src/lib/payments/yookassa.ts†L1-L210】【F:src/app/api/orders/route.ts†L1-L220】
- Каталог и главная страница не кешируются и не ограничивают выборку, что создаёт нагрузку на БД при росте ассортимента.【F:src/app/(site)/page.tsx†L7-L47】【F:src/app/(site)/catalog/page.tsx†L1-L51】
- Отсутствуют `BOT_API_SECRET` и ключи `YOOKASSA_*`, поэтому Telegram login и платежи недоступны в production — смотрите свежий аудит.【F:docs/SECURITY_AUDIT.md†L17-L31】
- Админские API должны работать в транзакциях и логировать ошибки централизованно (сейчас — `console.error`).【F:src/app/api/admin/products/update-stock/route.ts†L33-L52】

## 🔒 Работа с данными и безопасностью

- Личные данные пользователей шифруются и обрабатываются только на сервере (`server-only`). Следите, чтобы серверные модули не импортировались в клиентские компоненты.【F:src/lib/encryption.ts†L1-L80】
- Секреты, токены и cron‑ключи нельзя коммитить в репозиторий. Перед публикацией проверяйте `.env*`, инструкции по cron и middleware.
- Авторизация администратора строится на NextAuth ролях — защищайте административные роуты через `getServerSession` и проверку роли.【F:src/app/api/admin/products/update-stock/route.ts†L13-L20】
- Проверяйте актуальный список секретов и статус их наличия в `docs/SECURITY_AUDIT.md` перед релизами.【F:docs/SECURITY_AUDIT.md†L4-L33】
- Настройку фоновых задач Vercel Cron выполняйте по инструкции `docs/operations/cron.md` — секреты хранятся в Vercel Env, а не в репозитории.【F:docs/operations/cron.md†L1-L12】

## 🧪 Тестирование и контроль качества

- Перед коммитами запускайте `npm run lint` и `npm run test` — это быстрые проверки, которые ловят большинство регрессий.【F:package.json†L5-L28】
- Каждый `npm run build` прогоняет полный пайплайн и обновляет `data/build-reports.json`, хранящий результаты пяти последних сборок (статус, длительность шагов, коммит).【F:scripts/build-with-quality-checks.mjs†L1-L170】【F:data/build-reports.json†L1-L1】
- Для ручной проверки корзины/чек-аута используйте dev-режим и Prisma Studio для просмотра заказов.
- CI на Vercel выполняет `npm run build`; проверку типов (`tsc --noEmit`) нужно запускать вручную до фикса опечаток в `tsconfig.json`.

## 📸 Скриншоты для дизайн-ревью

- `npm run screenshot -- --url <страница> --out artifacts/preview.png --fullPage` — снимает скриншот через Playwright, помогает документировать состояние витрины или админки без ручного открытия браузера.【F:package.json†L6-L35】【F:scripts/capture-screenshot.ts†L1-L117】

## 🔗 Полезные ссылки

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma](https://www.prisma.io/docs)
- [Auth.js](https://authjs.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

Если найдёте расхождения между документацией и кодом — создайте issue или предложите pull request. Обновляйте README при изменениях бизнес-логики, API или запуска окружения.
