// Местоположение: src/app/api/admin/users/[userId]/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { deleteUserByAdmin } from '@/lib/admin/users';

const ADMIN_ROLES = new Set(['ADMIN', 'MANAGEMENT']);

interface RouteContext {
  params: {
    userId: string;
  };
}

export async function DELETE(request: Request, { params }: RouteContext) {
  console.log('🔄 API /admin/users/[id]: запрос на удаление', params);
  const session = await getServerSession(authOptions);

  if (!session?.user?.role?.name || !ADMIN_ROLES.has(session.user.role.name)) {
    console.log('❌ API /admin/users/[id]: удаление запрещено');
    return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
  }

  const userId = params.userId;
  if (!userId) {
    return NextResponse.json({ error: 'Некорректный идентификатор пользователя' }, { status: 400 });
  }

  if (session.user.id === userId) {
    return NextResponse.json({ error: 'Нельзя удалить собственный аккаунт' }, { status: 400 });
  }

  try {
    await deleteUserByAdmin(userId);
    console.log('✅ API /admin/users/[id]: пользователь удалён', { userId });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      console.warn('⚠️ API /admin/users/[id]: пользователь не найден', { userId });
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    console.error('❌ API /admin/users/[id]: внутренняя ошибка', error);
    return NextResponse.json({ error: 'Не удалось удалить пользователя' }, { status: 500 });
  }
}
