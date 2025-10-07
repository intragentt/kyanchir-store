// Местоположение: src/app/admin/users/page.tsx

import { redirect } from 'next/navigation';
import UsersTable from '@/components/admin/users/UsersTable';
import { auth } from '@/lib/auth';
import { fetchAdminUsers } from '@/lib/admin/users';

export const metadata = {
  title: 'Управление пользователями | Kyanchir Admin',
  description: 'Просмотр и управление аккаунтами пользователей',
};

const ADMIN_ROLES = new Set(['ADMIN', 'MANAGEMENT']);

async function getInitialUsers() {
  console.log('👥 Админ: Получение списка пользователей');
  const result = await fetchAdminUsers({
    page: 1,
    perPage: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  console.log('✅ Админ: Загружено пользователей:', result.users.length);
  return result;
}

export default async function UsersPage() {
  const session = await auth();

  if (!session?.user?.role?.name || !ADMIN_ROLES.has(session.user.role.name)) {
    redirect('/admin/login');
  }

  const initialData = await getInitialUsers();

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">👥 Управление пользователями</h1>
        <p className="mt-2 text-sm text-gray-600">
          Просмотр и управление всеми аккаунтами в системе
        </p>
      </div>

      <UsersTable
        initialUsers={initialData.users}
        initialMeta={{
          page: initialData.page,
          perPage: initialData.perPage,
          total: initialData.total,
          totalPages: initialData.totalPages,
        }}
        initialSummary={initialData.summary}
        currentUserId={session.user.id}
      />
    </div>
  );
}
