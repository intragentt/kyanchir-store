🤖 KYANCHIR AGENTS: PROJECT INTELLIGENCE
Актуальная документация проекта (обновлено: 2025‑10‑07)

## 📊 Project Health Snapshot
- Общий статус: **52 %** — витрина и checkout работают, но остаются критические долги по производительности и безопасности.
- Architecture Quality: 55/100 — структура App Router стабильна, но страницы витрины всё ещё `force-dynamic` и перегружают БД.【F:src/app/(site)/page.tsx†L7-L47】【F:src/app/(site)/catalog/page.tsx†L1-L51】
- Feature Completeness: 45/100 — корзина и оформление заказа реализованы, отсутствуют оплаты, уведомления и личный кабинет заказов.【F:src/store/useCartStore.ts†L1-L112】【F:src/app/api/orders/route.ts†L64-L189】
- Production Readiness: 35/100 — `vercel.json` хранит секрет, `tsconfig.json` содержит ошибочный include, мониторинг не подключён.【F:vercel.json†L1-L9】【F:tsconfig.json†L1-L30】【F:src/lib/monitoring.ts†L1-L36】

## ⚡ Critical Focus
1. **Оптимизировать витрину**: добавить пагинацию/фильтры на уровне Prisma и кэш (`unstable_cache` или ISR). Без этого рост каталога приведёт к таймаутам.
2. **Checkout 2.0**: внедрить оплату (Stripe/ЮKassa), email/Telegram уведомления и страницу истории заказов. Текущий поток завершается на создании заказа в БД.
3. **Безопасность**: вынести `cron_secret` в переменные окружения, исправить `tsconfig.json`, добавить централизованный логгер и мониторинг.

## 🧠 Архитектурные опоры
- **App Router**: публичные страницы в `src/app/(site)`, админка в `src/app/admin`, REST‑маршруты в `src/app/api`. Новые эндпоинты должны использовать Zod‑валидацию и Prisma `$transaction` при изменении нескольких таблиц.【F:src/app/api/orders/route.ts†L1-L189】
- **Состояние**: клиентские флоу (корзина, уведомления) реализованы на zustand в `src/store`. Не дублируйте бизнес-логику в компонентах — расширяйте сторы и покрывайте тестами.【F:src/store/useCartStore.ts†L1-L112】
- **Интеграции**: `src/lib/moysklad-api.ts`, `src/lib/mail.ts`, `src/lib/telegram.ts` требуют валидных env‑ключей. Любая новая интеграция обязана использовать `server-only` и хранить секреты вне репозитория.【F:src/lib/moysklad-api.ts†L1-L160】【F:src/lib/mail.ts†L1-L120】

## ✅ Недавние улучшения
- Реализован модуль корзины с сохранением в localStorage и проверкой остатков при добавлении товара.【F:src/components/ProductDetails.tsx†L304-L376】
- Добавлена страница `/checkout` с валидацией формы и созданием заказа через API, заказ очищает корзину после успешной транзакции.【F:src/app/(site)/checkout/page.tsx†L41-L190】【F:src/app/api/orders/route.ts†L64-L189】
- Tailwind‑дизайн‑система и конфиги Prettier/PostCSS синхронизированы и не требуют вмешательства.【F:tailwind.config.ts†L1-L220】【F:prettier.config.js†L1-L15】

## 🚨 Оставшиеся долги
- `src/app/(site)/page.tsx` и `catalog/page.tsx` нужно переработать: убрать `force-dynamic`, внедрить лимиты и сортировку на уровне SQL.【F:src/app/(site)/page.tsx†L7-L47】【F:src/app/(site)/catalog/page.tsx†L1-L51】
- `src/app/api/admin/products/update-stock/route.ts` выполняет вызов МойСклад и обновление Prisma без транзакции и retry — переписать на `$transaction` + централизованное логирование.【F:src/app/api/admin/products/update-stock/route.ts†L13-L54】
- `tsconfig.json` содержит неправильный include (`route.ts.дtkk`) — ломает `tsc --noEmit`. Исправить перед включением типизационных проверок в CI.【F:tsconfig.json†L1-L30】
- `vercel.json` хранит `cron_secret` в открытом виде. Секрет нужно вынести в env и проверять подпись в хэндлере.【F:vercel.json†L1-L9】

## 🧪 Тесты и проверки
- `npm run lint`, `npm run test`, `npm run build` — минимальный набор перед PR. Покрытие тестами <10 %, поэтому любые новые фичи сопровождайте тестами в `tests/` (используется node:test + @testing-library/react).【F:package.json†L5-L28】【F:tests/ui-components.test.tsx†L1-L128】
- Рекомендуется вручную проверять флоу корзина → checkout и сверять созданные заказы через Prisma Studio (`npm run prisma:studio`).

## 📌 Working Agreements
1. **Документация**: при изменении бизнес-логики обновляйте `README.md` и `README_KYANCHIR.md` в том же PR.
2. **Секреты**: никакие ключи не попадают в git. Используйте `.env.local` и Vercel secrets.
3. **Код-стайл**: Prettier + ESLint обязательны. Не отключайте правила без согласования с командой.
4. **Безопасность**: для админских роутов всегда проверяйте роль пользователя через `getServerSession` (пример в `update-stock`).【F:src/app/api/admin/products/update-stock/route.ts†L13-L26】

Файл поддерживается командой AGENTS. Обновляйте его при любых изменениях архитектуры, безопасности и ключевых пользовательских сценариев.
