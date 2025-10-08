// Местоположение: src/app/admin/settings/page.tsx

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getDesignSystemSettings } from '@/lib/settings/design-system';
import {
  buildFontStack,
  ensureFontLibraryIntegrity,
  getFontById,
} from '@/lib/settings/design-system.shared';

const ADMIN_ROLES = new Set(['ADMIN', 'MANAGEMENT']);

export const metadata = {
  title: 'Настройки проекта | Kyanchir Admin',
};

export default async function AdminSettingsIndexPage() {
  const session = await auth();

  if (!session?.user?.role?.name || !ADMIN_ROLES.has(session.user.role.name)) {
    redirect('/admin/login');
  }

  const { settings, updatedAt } = await getDesignSystemSettings();

  const formattedUpdatedAt = updatedAt
    ? new Intl.DateTimeFormat('ru-RU', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(updatedAt)
    : 'ещё не сохранялось';

  const fontLibrary = ensureFontLibraryIntegrity(settings.fontLibrary);
  const bodyFont = getFontById(fontLibrary, settings.fonts.body);
  const headingFont = getFontById(fontLibrary, settings.fonts.heading);
  const accentFont = getFontById(fontLibrary, settings.fonts.accent);
  const bodyStack = bodyFont ? buildFontStack(bodyFont) : '—';
  const headingName = headingFont?.name ?? 'Manrope';
  const accentName = accentFont?.name ?? 'PT Mono';

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">⚙️ Настройки проекта</h1>
        <p className="mt-2 text-sm text-gray-600">
          Управляйте ключевыми параметрами бренда, дизайн-системы и интеграций из одного места
        </p>
        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-md border border-gray-100 bg-gray-50 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Название сайта
            </dt>
            <dd className="mt-1 text-lg font-semibold text-gray-900">{settings.siteName}</dd>
          </div>
          <div className="rounded-md border border-gray-100 bg-gray-50 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Основной шрифт
            </dt>
            <dd className="mt-1 text-sm text-gray-900">{bodyStack}</dd>
          </div>
          <div className="rounded-md border border-gray-100 bg-gray-50 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Последнее обновление
            </dt>
            <dd className="mt-1 text-sm text-gray-900">{formattedUpdatedAt}</dd>
          </div>
        </dl>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex h-full flex-col justify-between rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">🎨 Дизайн-система</h2>
            <p className="mt-2 text-sm text-gray-600">
              Централизованное управление типографикой, шрифтами и отступами. Настройки мгновенно превращаются в
              CSS-переменные и tailwind-токены, доступные во всём проекте.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li>• Название сайта: {settings.siteName}</li>
              <li>• Заголовки: {headingName}</li>
              <li>• Основной текст: {bodyFont?.name ?? 'Manrope'}</li>
              <li>• Акценты и моно: {accentName}</li>
              <li>• Типографика h1 → h3 и базовый текст</li>
              <li>• Шкала отступов (xs → 3xl)</li>
            </ul>
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-500">
              Все изменения автоматически прокидываются в публичную часть сайта
            </p>
            <Link
              href="/admin/settings/design-system"
              className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Открыть конструктор
            </Link>
          </div>
        </div>

        <div className="flex h-full flex-col justify-between rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">💳 YooKassa</h2>
            <p className="mt-2 text-sm text-gray-600">
              Настраивайте режим работы (test/live), реквизиты индивидуального предпринимателя и секретные ключи без редактирования
              переменных окружения. Данные используются при создании платежей и чека.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li>• Режим оплаты: тестовый и боевой</li>
              <li>• ИНН, ОГРНИП и юридический адрес продавца</li>
              <li>• Банковские реквизиты и контакты поддержки</li>
              <li>• Управление передачей чеков и ставкой НДС</li>
            </ul>
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-500">Настройки доступны только администраторам</p>
            <Link
              href="/admin/yookassa"
              className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Открыть страницу
            </Link>
          </div>
        </div>

        <div className="flex h-full flex-col justify-between rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">🏬 МойСклад</h2>
            <p className="mt-2 text-sm text-gray-600">
              Управляйте API-ключом без перезапуска сервисов. Ключ хранится в базе и используется синхронизацией товаров и запасов.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li>• Проверка ключа перед сохранением</li>
              <li>• Автоматическая очистка кэша в мосте МойСклад</li>
              <li>• История последнего обновления</li>
            </ul>
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-500">Настройки доступны администраторам и менеджерам</p>
            <Link
              href="/admin/moysklad"
              className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Открыть страницу
            </Link>
          </div>
        </div>

        <div className="flex h-full flex-col justify-between rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">🚚 СДЭК</h2>
            <p className="mt-2 text-sm text-gray-600">
              Подготовьте учетные данные и параметры отправителя для будущей интеграции доставки и расчёта тарифов СДЭК.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li>• Раздельные аккаунты для тестовой и боевой сред</li>
              <li>• Тариф, город и адрес отправителя по умолчанию</li>
              <li>• Webhook secret для подписания уведомлений</li>
            </ul>
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-500">Настройки доступны администраторам и менеджерам</p>
            <Link
              href="/admin/sdek"
              className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Открыть страницу
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
