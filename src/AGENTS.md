# 🧠 Source Agent — правила для папки `src`

## Архитектура и маршруты
1. **App Router**: публичные страницы лежат в `src/app/(site)`, админка — в `src/app/admin`, API — в `src/app/api`. Поддерживайте эту сегментацию и не смешивайте роли в одном сегменте.【F:src/app/(site)/page.tsx†L1-L90】【F:src/app/admin/settings/design-system/page.tsx†L1-L74】【F:src/app/api/orders/route.ts†L1-L243】
2. **Долг по витрине**: страницы `/(site)` помечены `force-dynamic` и вытаскивают весь каталог без пагинации. Любые правки витрины должны снижать нагрузку на Prisma (лимиты, `unstable_cache`, фильтры).【F:src/app/(site)/page.tsx†L8-L90】【F:src/app/(site)/catalog/page.tsx†L7-L70】
3. **Server Components**: по умолчанию делайте страницы серверными. К клиентским (`'use client'`) переходите только при необходимости интерактивности и отделяйте бизнес-логику в сторы/хуки.【F:src/app/(site)/checkout/page.tsx†L1-L200】【F:src/store/useCartStore.ts†L1-L141】

## Работа с данными и интеграциями
1. **Prisma**: при работе с несколькими таблицами используйте `$transaction` и проверки остатков. В API заказа это уже реализовано — повторно используйте подход при создании новых операций.【F:src/app/api/orders/route.ts†L60-L166】
2. **Внешние сервисы**: интеграции (ЮKassa, МойСклад, Telegram) лежат в `src/lib`. Импортируйте их только из серверных модулей и храните секреты в системных настройках или env.【F:src/lib/payments/yookassa.ts†L1-L200】【F:src/lib/moysklad-api.ts†L1-L200】
3. **Мониторинг**: используйте `src/lib/monitoring.ts` и `src/lib/performance.ts` как центральные точки логирования/метрик. Не дублируйте прямые `console.*` в бизнес-коде — вместо этого прокидывайте события через эти утилиты и расширяйте их при необходимости.【F:src/lib/monitoring.ts†L1-L38】【F:src/lib/performance.ts†L1-L38】

## Клиентское состояние
1. **Zustand**: храните корзину и UI-состояния в сторах внутри `src/store`. Компоненты должны вызывать методы стора, а не держать локальные дубли бизнес-логики.【F:src/store/useCartStore.ts†L1-L141】
2. **Checkout flow**: `CheckoutPage` очищает корзину и показывает результат после `POST /api/orders`. Любые изменения должны сохранять этот контракт и обновлять API-ответ, если поля меняются.【F:src/app/(site)/checkout/page.tsx†L78-L200】【F:src/app/api/orders/route.ts†L203-L243】
3. **ProductDetails**: при работе с карточкой товара используйте существующие проверки остатков и интеграцию с тестовым платежом, чтобы не ломать UX.【F:src/components/ProductDetails.tsx†L329-L376】

## Безопасность и доступ
1. **Админские роуты**: проверяйте роль через `getServerSession` и не полагайтесь на фронтенд. Пример проверки смотрите в `update-stock` — его нужно переписать на транзакции, но авторизация там корректная.【F:src/app/api/admin/products/update-stock/route.ts†L15-L53】
2. **server-only**: для модулей с секретами добавляйте `import 'server-only';` в начале файла, как в ЮKassa-утилитах, чтобы предотвратить случайный импорт в клиентский бандл.【F:src/lib/payments/yookassa.ts†L1-L198】
3. **Телеметрия и ошибки**: при ловле исключений сохраняйте контекст (id заказа, пользователь, интеграция) и передавайте в `logError`, чтобы в будущем легко подключить Sentry/Logtail.【F:src/lib/monitoring.ts†L22-L34】

## Тестирование
- Обновляя бизнес-логику, дополняйте node:test-сценарии в `tests/`. Используйте рендер через `react-dom/server`, как в существующих примерах, и проверяйте основные флоу корзины/checkout после каждого PR.【F:tests/ui-components.test.tsx†L1-L29】【F:tests/lib-utils.test.ts†L1-L32】
