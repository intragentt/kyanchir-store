import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getYookassaSettings } from '@/lib/settings/yookassa';
import YookassaSettingsForm from '@/components/admin/yookassa/YookassaSettingsForm';
import { ToastViewport } from '@/components/shared/ui';

const ADMIN_ROLES = new Set(['ADMIN', 'MANAGEMENT']);

export const metadata = {
  title: 'ЮKassa | Kyanchir Admin',
};

export default async function YookassaSettingsPage() {
  const session = await auth();

  if (!session?.user?.role?.name || !ADMIN_ROLES.has(session.user.role.name)) {
    redirect('/admin/login');
  }

  const snapshot = await getYookassaSettings();

  return (
    <div className="space-y-6">
      <ToastViewport />

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">💳 YooKassa</h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-600">
              Управляйте реквизитами продавца, режимом работы (тест/боевой) и API-ключами прямо из админ-панели. Сохранённые
              данные моментально используются при формировании платежей и чеков.
            </p>
            <p className="mt-3 text-xs text-gray-500">
              Последнее обновление:{' '}
              {snapshot.updatedAt
                ? new Intl.DateTimeFormat('ru-RU', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(snapshot.updatedAt)
                : 'ещё не сохранялось'}
            </p>
          </div>

          <Link
            href="/admin/yookassa/preview"
            className="inline-flex items-center justify-center rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
          >
            Посмотреть текущие реквизиты
          </Link>
        </div>
      </div>

      <YookassaSettingsForm
        initialSettings={snapshot.settings}
        initialUpdatedAt={snapshot.updatedAt?.toISOString() ?? null}
      />
    </div>
  );
}
