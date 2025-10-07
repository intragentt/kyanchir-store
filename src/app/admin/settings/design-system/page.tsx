// Местоположение: src/app/admin/settings/design-system/page.tsx

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import {
  DEFAULT_DESIGN_SYSTEM_SETTINGS,
  getDesignSystemSettings,
} from '@/lib/settings/design-system';
import DesignSystemForm from '@/components/admin/settings/DesignSystemForm';
import { ToastViewport } from '@/components/shared/ui';
import { buildIconCatalog } from '@/lib/icons/catalog';

const ADMIN_ROLES = new Set(['ADMIN', 'MANAGEMENT']);

export const metadata = {
  title: 'Дизайн-система | Kyanchir Admin',
};

export default async function DesignSystemSettingsPage() {
  const session = await auth();

  if (!session?.user?.role?.name || !ADMIN_ROLES.has(session.user.role.name)) {
    redirect('/admin/login');
  }

  const { settings, updatedAt } = await getDesignSystemSettings();

  const initialSettings = structuredClone(settings);
  const defaultSettings = structuredClone(DEFAULT_DESIGN_SYSTEM_SETTINGS);
  const iconCatalog = buildIconCatalog();

  return (
    <div className="space-y-6">
      <ToastViewport />

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">🎨 Конструктор дизайн-системы</h1>
        <p className="mt-2 text-sm text-gray-600">
          Настраивайте шрифты, типографику и отступы в одном месте — изменения сразу же подхватываются публичным фронтом
          через CSS-переменные и tailwind-токены.
        </p>
        <p className="mt-4 text-xs text-gray-500">
          Последнее обновление:{' '}
          {updatedAt
            ? new Intl.DateTimeFormat('ru-RU', {
                dateStyle: 'medium',
                timeStyle: 'short',
              }).format(updatedAt)
            : 'ещё не сохранялось'}
        </p>
      </div>

      <DesignSystemForm
        initialSettings={initialSettings}
        defaultSettings={defaultSettings}
        icons={iconCatalog}
      />
    </div>
  );
}
