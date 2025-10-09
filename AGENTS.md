🤖 KYANCHIR AGENTS: PROJECT INTELLIGENCE
Актуальная документация проекта (обновлено: 2025‑05‑11)

## 📊 Project Health Snapshot
- Общий статус: **60 %** — витрина и checkout стабильны для демо, добавлен свежий аудит и dev-утилиты, но остаются долги по производительности и наблюдаемости.【F:docs/analysis/2025-05-11-platform-audit.md†L5-L70】
- Architecture Quality: 55/100 — структура App Router стабильна, но страницы витрины всё ещё `force-dynamic` и перегружают БД; оптимизация остаётся приоритетом.【F:src/app/(site)/page.tsx†L8-L90】【F:src/app/(site)/catalog/page.tsx†L7-L70】
- Feature Completeness: 48/100 — корзина и checkout работают, есть тестовый платёж на карточке товара, но нет боевых ключей, уведомлений и кабинета заказов.【F:src/store/useCartStore.ts†L1-L141】【F:src/app/api/orders/route.ts†L9-L243】【F:src/components/ProductDetails.tsx†L329-L376】
- Production Readiness: 46/100 — cron вынесен в инфраструктуру и оформлен runbook, добавлены инструменты анализа, но отсутствуют `BOT_API_SECRET`, ключи YooKassa и централизованный мониторинг.【F:docs/operations/cron.md†L1-L12】【F:docs/SECURITY_AUDIT.md†L23-L51】【F:src/lib/monitoring.ts†L1-L38】

## ⚡ Critical Focus
1. **Оптимизировать витрину**: ввести пагинацию, фильтры и кеш на уровне Prisma/Next (`unstable_cache`/ISR), иначе рост каталога приведёт к таймаутам.【F:docs/analysis/2025-05-11-platform-audit.md†L13-L28】
2. **Checkout 2.0**: подключить боевые ключи ЮKassa, добавить уведомления и историю заказов. Текущий поток завершается созданием заказа в БД и возвратом ссылки на тестовый платёж.【F:docs/analysis/2025-05-11-platform-audit.md†L29-L66】
3. **Наблюдаемость и безопасность**: расширить `monitoring.ts`, завести `BOT_API_SECRET`/`YOOKASSA_*`, внедрить централизованный логгер и сервисный токен для cron.【F:docs/SECURITY_AUDIT.md†L23-L51】【F:docs/analysis/2025-05-11-platform-audit.md†L67-L108】

## 🧠 Архитектурные опоры
- **App Router**: публичные страницы — `src/app/(site)`, админка — `src/app/admin`, REST‑маршруты — `src/app/api`. Новые эндпоинты обязаны использовать Zod-валидацию и `prisma.$transaction` при изменении нескольких таблиц.【F:src/app/api/orders/route.ts†L9-L166】【F:src/app/admin/settings/design-system/page.tsx†L1-L74】
- **Состояние**: клиентские флоу (корзина, уведомления) реализованы на zustand. Не дублируйте бизнес-логику в компонентах — расширяйте сторы и покрывайте тестами.【F:src/store/useCartStore.ts†L1-L141】
- **Интеграции**: `src/lib/moysklad-api.ts`, `src/lib/payments/yookassa.ts`, `src/lib/telegram.ts` требуют валидных env-ключей и префикса `server-only`. Новые интеграции повторяют этот паттерн.【F:src/lib/moysklad-api.ts†L1-L200】【F:src/lib/payments/yookassa.ts†L1-L198】

## ✅ Недавние улучшения
- Проведён комплексный аудит (11 мая 2025) с планом оптимизации витрины, checkout и мониторинга.【F:docs/analysis/2025-05-11-platform-audit.md†L1-L140】
- Реализован модуль корзины с сохранением в localStorage и проверкой остатков при добавлении товара.【F:src/components/ProductDetails.tsx†L329-L376】
- Страница `/checkout` валидирует форму, создаёт заказ через API и очищает корзину после успешной транзакции.【F:src/app/(site)/checkout/page.tsx†L78-L200】【F:src/app/api/orders/route.ts†L9-L243】
- Tailwind-дизайн-система и конфиги Prettier/PostCSS синхронизированы и не требуют вмешательства.【F:tailwind.config.ts†L1-L220】【F:prettier.config.js†L1-L15】
- Добавлен режим тестовой оплаты на карточке товара (`NEXT_PUBLIC_TEST_PAYMENT_URL`).【F:src/components/ProductDetails.tsx†L329-L376】【F:src/config/payments.ts†L1-L14】
- Удалён cron-секрет из репозитория, добавлены инструкции и аудит безопасности.【F:docs/operations/cron.md†L1-L12】【F:docs/SECURITY_AUDIT.md†L1-L56】

## 🚨 Оставшиеся долги
- Переделать `src/app/(site)/page.tsx` и `catalog/page.tsx`: убрать `force-dynamic`, внедрить лимиты/сортировки и кеш на уровне Prisma/Next.【F:src/app/(site)/page.tsx†L8-L90】【F:src/app/(site)/catalog/page.tsx†L7-L70】
- Переписать `src/app/api/admin/products/update-stock/route.ts` на `$transaction` + централизованное логирование и выделенный сервисный токен для cron.【F:src/app/api/admin/products/update-stock/route.ts†L15-L53】【F:docs/operations/cron.md†L1-L12】
- Получить `BOT_API_SECRET`, ключи `YOOKASSA_*` и подключить мониторинг (Sentry/Logtail).【F:docs/SECURITY_AUDIT.md†L23-L51】【F:src/lib/monitoring.ts†L1-L38】
- Расширить тестовое покрытие: добавить unit-тесты для checkout, витрины и мониторинга, а также визуальные снимки через Playwright перед релизами.【F:tests/ui-components.test.tsx†L1-L29】【F:scripts/capture-screenshot.ts†L1-L117】

## 🧪 Тесты и проверки
- `npm run lint`, `npm run test`, `npm run typecheck`, `npm run analyze:deps`, `npm run analyze:graph`, `npm run build` — минимальный набор перед PR. Покрытие тестами <10 %, поэтому любые новые фичи сопровождайте сценариями в `tests/` (используется `node:test`).【F:package.json†L7-L32】【F:package.json†L36-L86】【F:tests/ui-components.test.tsx†L1-L29】
- Рекомендуется вручную проходить флоу корзина → checkout и сверять созданные заказы через Prisma Studio (`npm run prisma:studio`).

## 🛠️ Новые инструменты и агенты
- Папка `docs/` теперь управляется собственным агентом с требованиями к структуре и ссылкам; аналитические отчёты складываются по датам в `docs/analysis/`.【F:docs/AGENTS.md†L1-L24】【F:docs/analysis/2025-05-11-platform-audit.md†L1-L140】
- Для исходников и тестов добавлены отдельные `AGENTS.md`, описывающие работу со сторами, API и `node:test`-контуром. Следуйте им при изменении кода или написании тестов.【F:src/AGENTS.md†L1-L47】【F:tests/AGENTS.md†L1-L11】

## 📸 Скриншоты и визуальные регрессы
- CLI-инструмент `npm run screenshot -- --url <страница> --out artifacts/admin.png` делает скриншоты через Playwright. Дополнительные параметры: `--width`, `--height`, `--fullPage`, `--wait=<ms>`. Используйте перед релизами дизайн-изменений.【F:package.json†L7-L32】【F:scripts/capture-screenshot.ts†L1-L117】

## 📌 Working Agreements
1. **Документация**: при изменении бизнес-логики обновляйте `README.md` и `README_KYANCHIR.md` в том же PR.
2. **Секреты**: никакие ключи не попадают в git. Используйте `.env.local` и Vercel secrets.
3. **Код-стайл**: Prettier + ESLint обязательны. Не отключайте правила без согласования с командой.
4. **Безопасность**: для админских роутов всегда проверяйте роль пользователя через `getServerSession` (пример — `update-stock`).【F:src/app/api/admin/products/update-stock/route.ts†L15-L26】

Файл поддерживается командой AGENTS. Обновляйте его при любых изменениях архитектуры, безопасности и ключевых пользовательских сценариев.
