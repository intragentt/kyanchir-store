# Kyanchir — оперативный статус (апрель 2025)

## 1. Техническое здоровье
- **Frontend / Checkout** — работает в тестовом режиме YooKassa. Новая кнопка "Оплатить (тест)" на карточке товара перенаправляет на внешний платёж, если задан `NEXT_PUBLIC_TEST_PAYMENT_URL`.【F:src/components/ProductDetails.tsx†L329-L376】【F:src/config/payments.ts†L1-L14】
- **Каталог** — публичные страницы по-прежнему `force-dynamic`, перегружают БД, требуется пагинация и кеширование.【F:src/app/(site)/page.tsx†L7-L47】
- **Синхронизация остатков** — cron-конфигурация вынесена в инфраструктуру; настройки описаны в `docs/operations/cron.md`. Маршрут требует админской сессии, что затрудняет автоматизацию.【F:docs/operations/cron.md†L1-L12】【F:src/app/api/admin/products/update-stock/route.ts†L13-L54】
- **Типизация** — `tsconfig.json` исправлен, `tsc --noEmit` снова работает.【F:tsconfig.json†L1-L26】
- **QA-пайплайн** — линт теперь проходит без ошибок: исправлены кавычки в JSX и порядок хуков в слайдере баннеров, добавлены зависящие коллбеки и безопасный `ResizeObserver`, что исключает падения React при пустых данных и утечки памяти в админке.【F:src/components/MiniBannerSlider.tsx†L1-L199】【F:src/components/admin/settings/DesignSystemForm.tsx†L153-L212】【F:src/components/hooks/useFilterRect.ts†L1-L25】

## 2. Безопасность и секреты
- Свежий аудит: `docs/SECURITY_AUDIT.md` фиксирует исправленные проблемы и список отсутствующих ключей (в т.ч. `BOT_API_SECRET`, `YOOKASSA_*`).【F:docs/SECURITY_AUDIT.md†L4-L33】
- Секреты не проверялись в боевой среде — после деплоя провести smoke-тесты БД, почты, Telegram, YooKassa.

## 3. Критические долги (приоритеты)
1. Переписать `update-stock` на Server Action с транзакцией и retry.
2. Получить боевые ключи YooKassa и включить оплату в production.
3. Подключить мониторинг (Sentry/Logtail) и централизовать логирование.
4. Завести `BOT_API_SECRET` и покрыть Telegram login тестами.

## 4. Документация и процессы
- README, README_KYANCHIR и AGENTS.md актуализированы; добавлены `docs/SECURITY_AUDIT.md` и `docs/operations/cron.md`.
- Roadmap: см. `roadmap_tx_td` (Q2 2025).

> Обновляйте STATUS.md после каждого релиза: отражайте состояние checkout, каталогов, синхронизации и список критических задач.
