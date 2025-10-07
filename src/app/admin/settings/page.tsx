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

        <div className="flex h-full flex-col justify-between rounded-lg border border-dashed border-gray-300 bg-white p-6 text-gray-500 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold text-gray-700">🔌 Интеграции (скоро)</h2>
            <p className="mt-2 text-sm">
              Управление API-ключами и сервисами. Здесь появятся настройки SendGrid, Telegram-ботов и других интеграций.
            </p>
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
            <p className="text-xs">В разработке</p>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">Coming soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}
