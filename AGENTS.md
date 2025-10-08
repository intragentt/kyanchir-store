🤖 KYANCHIR AGENTS: PROJECT INTELLIGENCE
Актуальная документация проекта (обновлено: 2025‑04‑06)

## 📊 Project Health Snapshot
- Общий статус: **58 %** — витрина и checkout работают, добавлен тестовый плательщик, но остаются долги по производительности и безопасности.
- Architecture Quality: 55/100 — структура App Router стабильна, но страницы витрины всё ещё `force-dynamic` и перегружают БД.【F:src/app/(site)/page.tsx†L7-L47】【F:src/app/(site)/catalog/page.tsx†L1-L51】
- Feature Completeness: 48/100 — корзина и checkout работают, добавлен тестовый платёж по кнопке товара, но нет боевых ключей, уведомлений и личного кабинета заказов.【F:src/store/useCartStore.ts†L1-L112】【F:src/app/api/orders/route.ts†L64-L189】【F:src/components/ProductDetails.tsx†L329-L376】
- Production Readiness: 45/100 — cron вынесен в инфраструктуру, `tsconfig.json` исправлен, но отсутствуют ключи YooKassa/BOT_API_SECRET и не подключён мониторинг.【F:docs/operations/cron.md†L1-L12】【F:tsconfig.json†L1-L26】【F:docs/SECURITY_AUDIT.md†L17-L31】【F:src/lib/monitoring.ts†L1-L36】

## ⚡ Critical Focus
1. **Оптимизировать витрину**: добавить пагинацию/фильтры на уровне Prisma и кэш (`unstable_cache` или ISR). Без этого рост каталога приведёт к таймаутам.
2. **Checkout 2.0**: внедрить оплату (Stripe/ЮKassa), email/Telegram уведомления и страницу истории заказов. Текущий поток завершается на создании заказа в БД.
3. **Безопасность**: закрепить секреты в инфраструктуре, получить `BOT_API_SECRET` и ключи YooKassa, подключить централизованный логгер/мониторинг.【F:docs/SECURITY_AUDIT.md†L17-L33】【F:src/lib/monitoring.ts†L1-L36】

## 🧠 Архитектурные опоры
- **App Router**: публичные страницы в `src/app/(site)`, админка в `src/app/admin`, REST‑маршруты в `src/app/api`. Новые эндпоинты должны использовать Zod‑валидацию и Prisma `$transaction` при изменении нескольких таблиц.【F:src/app/api/orders/route.ts†L1-L189】
- **Состояние**: клиентские флоу (корзина, уведомления) реализованы на zustand в `src/store`. Не дублируйте бизнес-логику в компонентах — расширяйте сторы и покрывайте тестами.【F:src/store/useCartStore.ts†L1-L112】
- **Интеграции**: `src/lib/moysklad-api.ts`, `src/lib/mail.ts`, `src/lib/telegram.ts` требуют валидных env‑ключей. Любая новая интеграция обязана использовать `server-only` и хранить секреты вне репозитория.【F:src/lib/moysklad-api.ts†L1-L160】【F:src/lib/mail.ts†L1-L120】

## ✅ Недавние улучшения
- Реализован модуль корзины с сохранением в localStorage и проверкой остатков при добавлении товара.【F:src/components/ProductDetails.tsx†L329-L376】
- Добавлена страница `/checkout` с валидацией формы и созданием заказа через API, заказ очищает корзину после успешной транзакции.【F:src/app/(site)/checkout/page.tsx†L41-L190】【F:src/app/api/orders/route.ts†L64-L189】
- Tailwind‑дизайн‑система и конфиги Prettier/PostCSS синхронизированы и не требуют вмешательства.【F:tailwind.config.ts†L1-L220】【F:prettier.config.js†L1-L15】
- Конструктор дизайн‑системы в админке поддерживает библиотеку шрифтов, палитры бренда и каталог SVG‑иконок с просмотром исходного кода, изменения мгновенно синхронизируются с публичным фронтом через CSS‑переменные.【F:src/app/admin/settings/design-system/page.tsx†L1-L74】【F:src/components/admin/settings/DesignSystemForm.tsx†L1-L120】
- Добавлен режим тестовой оплаты на карточке товара через `NEXT_PUBLIC_TEST_PAYMENT_URL`, что позволяет мгновенно переходить к тестовому платежу без создания заказа.【F:src/components/ProductDetails.tsx†L329-L376】【F:src/config/payments.ts†L1-L14】
- Удалён cron-секрет из репозитория, добавлены инструкции и аудит безопасности (`docs/operations/cron.md`, `docs/SECURITY_AUDIT.md`).【F:docs/operations/cron.md†L1-L12】【F:docs/SECURITY_AUDIT.md†L4-L33】

## 🚨 Оставшиеся долги
- `src/app/(site)/page.tsx` и `catalog/page.tsx` нужно переработать: убрать `force-dynamic`, внедрить лимиты и сортировку на уровне SQL.【F:src/app/(site)/page.tsx†L7-L47】【F:src/app/(site)/catalog/page.tsx†L1-L51】
- `src/app/api/admin/products/update-stock/route.ts` выполняет вызов МойСклад и обновление Prisma без транзакции и retry — переписать на `$transaction` + централизованное логирование.【F:src/app/api/admin/products/update-stock/route.ts†L13-L54】
- Получить `BOT_API_SECRET` и ключи `YOOKASSA_*`, иначе Telegram login и платежи остаются в тестовом режиме.【F:docs/SECURITY_AUDIT.md†L17-L31】
- Разделить cron-флоу и админскую сессию: добавить сервисный токен/эндпоинт, чтобы планировщик мог запускать синк без UI-авторизации.【F:docs/operations/cron.md†L1-L12】【F:src/app/api/admin/products/update-stock/route.ts†L13-L54】

## 🧪 Тесты и проверки
- `npm run lint`, `npm run test`, `npm run build` — минимальный набор перед PR. Покрытие тестами <10 %, поэтому любые новые фичи сопровождайте тестами в `tests/` (используется node:test + @testing-library/react).【F:package.json†L5-L28】【F:tests/ui-components.test.tsx†L1-L128】
- Рекомендуется вручную проверять флоу корзина → checkout и сверять созданные заказы через Prisma Studio (`npm run prisma:studio`).

## 📸 Скриншоты и визуальные регрессы
- Быстрый CLI-инструмент `npm run screenshot -- --url <страница> --out artifacts/admin.png` создаёт скриншоты через Playwright, подходит для регресс-тестов и документации. Дополнительные параметры: `--width`, `--height`, `--fullPage`, `--wait=<ms>`.【F:package.json†L6-L35】【F:scripts/capture-screenshot.ts†L1-L117】

## 📌 Working Agreements
1. **Документация**: при изменении бизнес-логики обновляйте `README.md` и `README_KYANCHIR.md` в том же PR.
2. **Секреты**: никакие ключи не попадают в git. Используйте `.env.local` и Vercel secrets.
3. **Код-стайл**: Prettier + ESLint обязательны. Не отключайте правила без согласования с командой.
4. **Безопасность**: для админских роутов всегда проверяйте роль пользователя через `getServerSession` (пример в `update-stock`).【F:src/app/api/admin/products/update-stock/route.ts†L13-L26】

Файл поддерживается командой AGENTS. Обновляйте его при любых изменениях архитектуры, безопасности и ключевых пользовательских сценариев.
