// Местоположение: src/app/api/admin/users/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchAdminUsers } from '@/lib/admin/users';

const ADMIN_ROLES = new Set(['ADMIN', 'MANAGEMENT']);

/**
 * 📊 API ДЛЯ ПОЛУЧЕНИЯ ДАННЫХ ПОЛЬЗОВАТЕЛЕЙ
 *
 * GET: получение списка пользователей с фильтрами, пагинацией и сортировкой
 */
export async function GET(request: Request) {
  console.log('🔄 API /admin/users: входящий запрос');
  const session = await getServerSession(authOptions);

  if (!session?.user?.role?.name || !ADMIN_ROLES.has(session.user.role.name)) {
    console.log('❌ API /admin/users: доступ запрещён');
    return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
  }

  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams.entries());

  try {
    const allowedSortKeys = new Set(['createdAt', 'role', 'ordersCount', 'totalSpent', 'lastLoginAt']);
    const sortBy = allowedSortKeys.has(params.sortBy ?? '')
      ? (params.sortBy as any)
      : undefined;

    const result = await fetchAdminUsers({
      page: params.page ? Number.parseInt(params.page, 10) : undefined,
      perPage: params.perPage ? Number.parseInt(params.perPage, 10) : undefined,
      search: params.search,
      role: params.role,
      status: params.status,
      sortBy,
      sortOrder: params.sortOrder === 'asc' ? 'asc' : 'desc',
    });

    console.log('✅ API /admin/users: отправка ответа', {
      total: result.total,
      page: result.page,
    });

    return NextResponse.json({
      data: result.users,
      meta: {
        page: result.page,
        perPage: result.perPage,
        total: result.total,
        totalPages: result.totalPages,
      },
      summary: result.summary,
    });
  } catch (error) {
    console.error('❌ API /admin/users: критическая ошибка', error);
    return NextResponse.json({ error: 'Не удалось получить пользователей' }, { status: 500 });
  }
}
