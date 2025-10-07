# 🛍️ Платформа «Kyanchir»

Next.js 14‑приложение для электронной коммерции, которое объединяет витрину, личный кабинет покупателя, административную панель и интеграции с внешними сервисами. Репозиторий содержит и фронтенд, и серверную часть, поэтому единые стандарты разработки и аккуратная работа с данными критичны.

> 📚 **Перед началом работы прочитайте [README_KYANCHIR.md](./README_KYANCHIR.md).** Там описаны архитектурные договорённости и правила, которые нельзя нарушать.

## 📌 Ключевые особенности

- **Next.js App Router** с серверными компонентами, Server Actions и кастомными API‑маршрутами.【F:src/app/(site)/page.tsx†L1-L60】【F:src/app/api/orders/route.ts†L1-L189】
- **Prisma + PostgreSQL (Neon)** как основной источник данных и слой доступа к БД.【F:prisma/schema.prisma†L1-L336】
- **Auth.js (NextAuth)** с авторизацией по email/паролю и Telegram Login, ролью администратора и адаптером Prisma.【F:src/lib/auth.ts†L1-L103】
- **Модуль корзины и чек‑аута** на zustand с локальным хранением, страницами `/cart` и `/checkout` и API создания заказа.【F:src/store/useCartStore.ts†L1-L112】【F:src/app/(site)/checkout/page.tsx†L1-L190】
- **Интеграции**: МойСклад, Telegram Bot API, SendGrid, CDEK и фоновые задачи Vercel Cron.【F:src/lib/moysklad-api.ts†L1-L160】【F:vercel.json†L1-L9】

## 📊 Текущее состояние (обновлено 2025‑10‑07)

| Направление | Статус | Комментарий |
| --- | --- | --- |
| Корзина и checkout | ⚠️ MVP без платежей | Корзина и оформление заказа работают, запрос `/api/orders` создаёт заказ и очищает корзину. Нет оплаты и уведомлений, ручная проверка статуса заказа обязательна.【F:src/store/useCartStore.ts†L1-L112】【F:src/app/api/orders/route.ts†L64-L189】 |
| Каталог и главная | ⚠️ Требуют оптимизации | Страницы `/(site)` помечены как `force-dynamic` и загружают весь ассортимент без пагинации и кеширования.【F:src/app/(site)/page.tsx†L7-L47】【F:src/app/(site)/catalog/page.tsx†L1-L51】 |
| Конфигурации и секреты | ⚠️ Требуют внимания | В `tsconfig.json` осталась битая запись `route.ts.дtkk`, а `vercel.json` содержит публичный `cron_secret` — вынесите его в переменные окружения.【F:tsconfig.json†L1-L25】【F:tsconfig.json†L26-L30】【F:vercel.json†L1-L9】 |
| Админские API | ⚠️ Нужны транзакции и валидация | Эндпоинт обновления остатков обращается к МойСклад и Prisma вне транзакции, ошибки логируются только в консоль.【F:src/app/api/admin/products/update-stock/route.ts†L1-L56】 |
| Качество кода | ⚠️ Частичное покрытие | Тестов мало (2 node:test сценария), bundle‑анализ и мониторинг не настроены.【F:tests/lib-utils.test.ts†L1-L32】【F:tests/ui-components.test.tsx†L1-L128】 |
| Завершённые задачи | ✅ Подтверждено | Конфиги Prettier/PostCSS, `tsconfig.seed.json`, система шрифтов и "глупые" UI‑компоненты соответствуют требованиям и не требуют изменений сейчас.【F:postcss.config.mjs†L1-L20】【F:prettier.config.js†L1-L15】【F:src/app/fonts.ts†L1-L120】 |

> Полную историю аудитов и незакрытых задач смотрите в файлах `roadmap_tx_td` и `status old` в корне репозитория.

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
| `npm run build` | Сборка продакшена (перед билдом автоматически выполняется `prisma generate`).【F:package.json†L5-L28】 |
| `npm run start` | Локальный запуск собранного приложения. |
| `npm run lint` | ESLint + проверка форматирования. |
| `npm run test` | node:test (минимальный набор unit/компонентных тестов). |
| `npm run db:seed` | Наполнение базы тестовыми данными (`tsx prisma/seed.ts`). |
| `npm run db:reset` | Сброс схемы и повторный сид (⚠️ без подтверждения). |
| `npm run prisma:studio` | Prisma Studio для просмотра базы. |

## 🗂 Структура проекта

- `src/app` — маршруты Next.js (страницы, API, layout'ы).【F:src/app/(site)/page.tsx†L1-L60】
- `src/components` — UI-компоненты витрины, админки и общие блоки.【F:src/components/ProductDetails.tsx†L1-L420】
- `src/store` — zustand‑сторы приложения (корзина, UI уведомления).【F:src/store/useCartStore.ts†L1-L112】
- `src/lib` — хелперы, интеграции и доменные сервисы (Prisma, Auth, API клиентов).【F:src/lib/prisma.ts†L1-L60】【F:src/lib/moysklad-api.ts†L1-L160】
- `prisma` — схема и миграции базы данных.【F:prisma/schema.prisma†L1-L336】
- `tests` — авто-тесты и вспомогательные фикстуры.【F:tests/ui-components.test.tsx†L1-L128】
- `Old/`, `roadmap_tx_td`, `status old` — архивные материалы и исторические аудиты (не подключены к приложению).

## 🔁 Критические пользовательские потоки

- **Добавление в корзину** — `ProductDetails` вызывает `useCartStore.addItem`, контролирует остатки по выбранному размеру и показывает уведомления.【F:src/components/ProductDetails.tsx†L304-L376】
- **Страница корзины** — `/cart` позволяет менять количество и удалять позиции, пересчитывая итоговую сумму на клиенте.【F:src/app/(site)/cart/page.tsx†L18-L120】
- **Чек-аут** — `/checkout` собирает контактные данные, отправляет POST `/api/orders`, очищает корзину и показывает итог заказа.【F:src/app/(site)/checkout/page.tsx†L41-L190】
- **Создание заказа** — API валидирует входные данные, проверяет остатки, создаёт заказ и уменьшает сток в транзакции Prisma.【F:src/app/api/orders/route.ts†L64-L189】

## ⚠️ Известные ограничения

- Нет платёжной интеграции и уведомлений о заказах — требуется подключение (Stripe/ЮKassa, email/SMS).【F:src/app/api/orders/route.ts†L64-L189】
- Каталог и главная страница не кешируются и не ограничивают выборку, что создаёт нагрузку на БД при росте ассортимента.【F:src/app/(site)/page.tsx†L7-L47】【F:src/app/(site)/catalog/page.tsx†L1-L51】
- `vercel.json` хранит секреты в URL — используйте переменные окружения и middleware для проверки подписи cron.【F:vercel.json†L1-L9】
- `tsconfig.json` содержит опечатку (`route.ts.дtkk`), что ломает типизацию при запуске `tsc --noEmit`. Исправьте путь перед проверкой типов.【F:tsconfig.json†L1-L30】
- Админские API должны работать в транзакциях и логировать ошибки централизованно (сейчас — `console.error`).【F:src/app/api/admin/products/update-stock/route.ts†L33-L52】

## 🔒 Работа с данными и безопасностью

- Личные данные пользователей шифруются и обрабатываются только на сервере (`server-only`). Следите, чтобы серверные модули не импортировались в клиентские компоненты.【F:src/lib/encryption.ts†L1-L80】
- Секреты, токены и cron‑ключи нельзя коммитить в репозиторий. Перед публикацией проверяйте `.env*`, `vercel.json` и middleware.
- Авторизация администратора строится на NextAuth ролях — защищайте административные роуты через `getServerSession` и проверку роли.【F:src/app/api/admin/products/update-stock/route.ts†L13-L20】

## 🧪 Тестирование и контроль качества

- Перед коммитами запускайте `npm run lint` и `npm run test` — это быстрые проверки, которые ловят большинство регрессий.【F:package.json†L5-L28】
- Для ручной проверки корзины/чек-аута используйте dev-режим и Prisma Studio для просмотра заказов.
- CI на Vercel выполняет `npm run build`; проверку типов (`tsc --noEmit`) нужно запускать вручную до фикса опечаток в `tsconfig.json`.

## 🔗 Полезные ссылки

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma](https://www.prisma.io/docs)
- [Auth.js](https://authjs.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

Если найдёте расхождения между документацией и кодом — создайте issue или предложите pull request. Обновляйте README при изменениях бизнес-логики, API или запуска окружения.
