# ⚙️ Конституция проекта «Kyanchir»

Последнее обновление: 2025‑10‑18

Этот документ фиксирует актуальное устройство приложения, архитектурные договорённости и зоны риска. Используйте его как исходную точку перед планированием задач, ревью и внедрением новых фич.

## 1. Картина проекта на сегодня

| Зона | Статус | Комментарий |
| --- | --- | --- |
| Витрина | ⚠️ Требует оптимизации | Главная и каталог помечены `force-dynamic`, тянут весь ассортимент без пагинации и кэша. Нужно ограничивать выборки и внедрить caching/ISR.【F:src/app/(site)/page.tsx†L7-L47】【F:src/app/(site)/catalog/page.tsx†L1-L51】 |
| Корзина и checkout | ⚠️ Тестовая оплата ЮKassa | Корзина хранится в zustand/persist, checkout пишет заказ через `/api/orders`, после транзакции создаётся платёж в ЮKassa и возвращается ссылка на оплату. Пока доступен только тестовый магазин, уведомления ещё не реализованы.【F:src/store/useCartStore.ts†L1-L112】【F:src/app/api/orders/route.ts†L1-L220】【F:src/lib/payments/yookassa.ts†L1-L210】【F:src/app/(site)/checkout/page.tsx†L1-L260】 |
| Админка | ⚠️ Риски консистентности | Обновление остатков вызывает внешнее API и Prisma вне транзакции и без retry/логирования. Требуется service‑слой и аудит ролей.【F:src/app/api/admin/products/update-stock/route.ts†L13-L54】 |
| Конфигурации | ⚠️ Исправить ошибки | `tsconfig.json` содержит ошибочный путь `route.ts.дtkk`, `vercel.json` публикует `cron_secret`, NextAuth relies on env secrets — вынести в переменные окружения и починить include.【F:tsconfig.json†L1-L30】【F:vercel.json†L1-L9】 |
| Качество и тесты | ⚠️ Низкое покрытие | Всего два node:test файла, нет e2e, bundle‑аналитики и мониторинга. Настройте Lighthouse/Sentry и расширьте тесты для стора и API.【F:tests/lib-utils.test.ts†L1-L32】【F:tests/ui-components.test.tsx†L1-L128】 |
| Завершённые элементы | ✅ Стабильно | Конфиги Prettier/PostCSS, `tsconfig.seed.json`, админ-конструктор дизайн-системы (шрифты, палитры, иконки) и базовые "dumb"-компоненты подтверждены и поддерживаются.【F:postcss.config.mjs†L1-L20】【F:prettier.config.js†L1-L15】【F:src/components/admin/settings/DesignSystemForm.tsx†L1-L120】 |
| Дизайн-система | ✅ Управляется из админки | Выбор шрифтов (Manrope, PT Mono), палитры и отступов выполняется через настройки, данные хранятся в Prisma и транслируются в CSS-переменные и Tailwind-токены при рендере макета.【F:src/lib/settings/design-system.ts†L1-L200】【F:src/app/layout.tsx†L1-L140】 |

## 2. Архитектура и слои

### 2.1 App Router
- `src/app/(site)` — публичная витрина, полностью на серверных компонентах. Каталог и карточка товара собирают данные напрямую через Prisma без промежуточных сервисов.【F:src/app/(site)/page.tsx†L1-L60】【F:src/components/ProductDetails.tsx†L1-L420】
- `src/app/(site)/cart` и `/checkout` — клиентские страницы, которые используют zustand‑сторы для состояния и обращения к API заказов; `/checkout` после оформления показывает ссылку на оплату, если ЮKassa настроена.【F:src/app/(site)/cart/page.tsx†L18-L120】【F:src/app/(site)/checkout/page.tsx†L1-L260】
- `src/app/admin` — административные страницы и API. Авторизация проверяется через NextAuth и роли из БД; добавляйте `getServerSession` в каждую новую точку входа.【F:src/app/admin/dashboard/page.tsx†L1-L120】【F:src/app/api/admin/products/update-stock/route.ts†L13-L26】
- `src/app/api` — REST‑маршруты. Используются Zod‑схемы для валидации (`/api/orders`) и Prisma‑транзакции для критичных операций. Новые ручки должны повторять этот подход.【F:src/app/api/orders/route.ts†L1-L189】

### 2.2 Бизнес‑модули
- **Каталог**: Prisma `product.findMany` + редуцирование к структуре `ProductWithInfo`. Требуется pagination DTO и кеширование (unstable_cache/ISR).【F:src/app/(site)/catalog/page.tsx†L1-L51】
- **Корзина**: zustand + `persist` в localStorage. Идентификатор позиции — `productSizeId`, количество ограничивается остатками. При добавлении проверяются размеры и сток, уведомления через `useAppStore`. Любые новые операции должны уважать `maxQuantity` и `clampQuantity` в сторах.【F:src/store/useCartStore.ts†L1-L112】【F:src/components/ProductDetails.tsx†L304-L376】
- **Заказы**: API `/api/orders` валидирует payload, проверяет остатки и создаёт заказ с позициями. После транзакции обновляет `productSize.stock` и инициирует платёж через `src/lib/payments/yookassa.ts`, сохраняя `paymentTransactionId`. Любые новые сценарии (отмена, частичный возврат) также должны проходить через `$transaction` и учитывать статусы платежей.【F:src/app/api/orders/route.ts†L1-L220】【F:src/lib/payments/yookassa.ts†L1-L210】
- **Интеграции**: библиотека `src/lib/moysklad-api.ts` синхронизирует остатки, `src/lib/telegram.ts` и `src/lib/mail.ts` отвечают за коммуникации. Секреты загружаются из env, поэтому при локальном запуске обязательны ключи.【F:src/lib/moysklad-api.ts†L1-L160】【F:src/lib/telegram.ts†L1-L200】
- **Платежи (ЮKassa)**: модуль `src/lib/payments/yookassa.ts` собирает данные для чека, нормализует телефон, добавляет ИНН/ФИО ИП в `supplier`, выбирает тестовый или боевой магазин по `YOOKASSA_MODE` и создаёт платёж через REST API.【F:src/lib/payments/yookassa.ts†L1-L210】
- **Дизайн-система**: `src/lib/settings/design-system.ts` хранит настройки цвета, типографики, отступов и библиотеку шрифтов; админская форма (`DesignSystemForm`) управляет этими данными и синхронизирует значения с Tailwind через CSS-переменные.【F:src/lib/settings/design-system.ts†L1-L200】【F:src/components/admin/settings/DesignSystemForm.tsx†L1-L120】

### 2.3 Утилиты и инфраструктура
- `src/lib/prisma.ts` реализует singleton Prisma Client; любой доступ к БД должен идти через него, чтобы избежать множественных соединений в dev.【F:src/lib/prisma.ts†L1-L60】
- Шифрование PII выносится в `src/lib/encryption.ts` и снабжено директивой `server-only`. Любая работа с персональными данными должна использовать эти хелперы.【F:src/lib/encryption.ts†L1-L80】
- Глобальные настройки UI находятся в `src/app/layout.tsx`, `src/app/globals.css`, `src/app/fonts.ts` и `src/lib/settings/design-system.ts`. Стили управляются Tailwind + custom токены, которые заполняются данными из дизайн-системы.【F:src/app/layout.tsx†L1-L180】【F:src/app/globals.css†L1-L160】【F:src/lib/settings/design-system.ts†L1-L200】【F:tailwind.config.ts†L1-L240】

## 3. Конфигурации и стандарты

- **package.json**: перед `next build` всегда выполняется `prisma generate`. Команды `db:seed` (`tsx prisma/seed.ts`) и `db:reset` используют реальные миграции — запускайте их только на локальных/стейджинг базах.【F:package.json†L5-L28】
- **next.config.mjs**: отключает ESLint во время билда (`ignoreDuringBuilds`), добавляет security headers и rewrite/redirect правила. Любые изменения проверяйте через `npm run build` и предварительно запускайте `npm run lint`.【F:next.config.mjs†L1-L140】
- **tailwind.config.ts**: содержит кастомные брейкпоинты (в т. ч. `kyanchir-lg`), типографику на `clamp` и палитру `brand.*`, `feedback.*`. Новые токены добавляйте через `theme.extend`.【F:tailwind.config.ts†L1-L220】
- **prettier.config.js** + `eslint.config.mjs`: обязательны для каждого PR. Tailwind-классы автоматически сортируются, а ESLint использует пресет `next/core-web-vitals`. Не отключайте правила без обсуждения.【F:prettier.config.js†L1-L15】【F:eslint.config.mjs†L1-L160】
- **tsconfig.json**: исправьте путь `route.ts.дtkk` перед запуском `tsc --noEmit`. После правки включите проверку типов в CI. До исправления скрипт падает на неверном глифе.【F:tsconfig.json†L1-L30】
- **vercel.json**: хранит cron‑секрет в URL. Перенесите секрет в `VERCEL_CRON_SECRET` и проверяйте подпись в хэндлере, иначе любой сможет дернуть синк продуктов.【F:vercel.json†L1-L9】
- **ЮKassa env**: модуль платежей читает `YOOKASSA_MODE`, пары `YOOKASSA_TEST_*`/`YOOKASSA_*`, а также данные ИП (`YOOKASSA_MERCHANT_INN`, `YOOKASSA_MERCHANT_FULL_NAME`). Без них платёж не создастся, поэтому обеспечьте значения в `.env.local` на стейдже и проде.【F:src/lib/payments/yookassa.ts†L1-L210】
- **Playwright скриншоты**: скрипт `npm run screenshot -- --url ...` использует Playwright и хранится в `scripts/capture-screenshot.ts`; поддерживает параметры размера, задержки и `--fullPage` для визуальных регрессов.【F:package.json†L6-L35】【F:scripts/capture-screenshot.ts†L1-L117】

## 4. Правила разработки

1. **Server vs Client**: всё, что касается PII и интеграций, размещайте в `server-only` модулях. Клиентские компоненты импортируют только чистые данные/DTO.
2. **API**: каждый новый маршрут обязан:
   - валидировать вход через Zod или аналогичный слой;
   - возвращать детализированные ошибки (422 для валидации, 409 для конфликтов остатков и т. д.);
   - использовать Prisma `$transaction` при работе с несколькими таблицами.
3. **Стор и состояние**: предпочитайте zustand‑сторы (`src/store`) для клиентского состояния. Не дублируйте бизнес-логику в компонентах — выносите её в хук/стор и покрывайте тестами.
4. **UI и дизайн**: используйте токены из Tailwind-конфига (`text-h1`, `bg-brand.lilac`). Для новых компонентов добавляйте сторибуки или unit-тесты по аналогии с `ui-components.test.tsx`.
5. **Безопасность**: перед деплоем проверяйте, что `.env*` и файлы с секретами не попали в git. Используйте Prisma роли/NextAuth для защиты админских функций.【F:src/app/api/admin/products/update-stock/route.ts†L13-L26】

## 5. Тестирование и наблюдаемость

- **Существующие тесты**: `tests/lib-utils.test.ts` проверяет хелперы, `tests/ui-components.test.tsx` — базовые интеракции UI. Добавьте сценарии для корзины и API заказов по аналогии.【F:tests/lib-utils.test.ts†L1-L32】【F:tests/ui-components.test.tsx†L1-L128】
- **Покрытие**: <10 %. План — добавить unit-тесты для zustand-сторов, API `/api/orders` и критичных утилит (`formatPrice`, интеграции).
- **CI/CD**: Vercel выполняет `npm run build`. После фикса `tsconfig` включите `tsc --noEmit` и линтер в pre-push.
- **Мониторинг**: `src/lib/monitoring.ts` — заглушка. Настройте Sentry/Logflare и централизованный логгер вместо `console.error`. Добавьте перехватчики ошибок в API и middleware.【F:src/lib/monitoring.ts†L1-L36】

## 6. Ближайшие приоритеты

1. **Пагинация и кеш витрины** — ограничить запросы Prisma, внедрить `unstable_cache`/ISR и фильтры на уровне БД.
2. **Checkout 2.0** — вывести ЮKassa из тестового режима, добавить email/Telegram уведомления (`mail.ts`, `telegram.ts`) и страницу истории заказов для пользователей.【F:src/lib/payments/yookassa.ts†L1-L210】【F:src/lib/mail.ts†L1-L120】【F:src/lib/telegram.ts†L1-L200】
3. **Админские транзакции** — переписать `update-stock` и смежные ручки с использованием `$transaction` + аудит логов.
4. **Секреты и конфиги** — убрать захардкоженные ключи, починить `tsconfig`, расширить ESLint/TypeScript проверки в CI.
5. **Наблюдаемость и тесты** — подключить мониторинг, добавить юнит- и e2e-тесты для ключевых потоков (корзина, checkout, каталожный фильтр).

---

Документ должен меняться вместе с кодом. Обновляйте его при каждом изменении архитектуры, конфигурации, критичного бизнес-флоу или правил разработки.
