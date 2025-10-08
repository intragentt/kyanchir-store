import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getMoyskladSettings } from '@/lib/settings/moysklad';
import MoyskladSettingsForm from '@/components/admin/moysklad/MoyskladSettingsForm';
import { ToastViewport } from '@/components/shared/ui';

const ADMIN_ROLES = new Set(['ADMIN', 'MANAGEMENT']);

export const metadata = {
  title: 'МойСклад | Kyanchir Admin',
};

export default async function MoyskladSettingsPage() {
  const session = await auth();

  if (!session?.user?.role?.name || !ADMIN_ROLES.has(session.user.role.name)) {
    redirect('/admin/login');
  }

  const snapshot = await getMoyskladSettings();

  return (
    <div className="space-y-6">
      <ToastViewport />

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-gray-900">🏬 МойСклад</h1>
            <p className="max-w-3xl text-sm text-gray-600">
              Управляйте авторизацией и статусом интеграции с МойСклад. Новый API-ключ можно проверить и сохранить без
              простоя синхронизаций и ручного редеплоя.
            </p>
            <p className="text-xs text-gray-500">
              Настройки доступны администраторам и менеджерам. После обновления ключа все фоновые процессы будут
              автоматически использовать новое значение.
            </p>
          </div>
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center justify-center rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
          >
            Вернуться к панели синхронизаций
          </Link>
        </div>
      </div>

      <MoyskladSettingsForm
        hasStoredKey={snapshot.hasApiKey}
        lastFour={snapshot.lastFour}
        lastUpdatedAt={snapshot.updatedAt?.toISOString() ?? null}
      />
    </div>
  );
}
