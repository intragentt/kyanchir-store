// Местоположение: src/app/api/admin/users/[userId]/role/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { updateUserRoleByAdmin } from '@/lib/admin/users';

const ADMIN_ROLES = new Set(['ADMIN', 'MANAGEMENT']);

const bodySchema = z.object({
  role: z.string().min(1).max(50),
});

interface RouteContext {
  params: {
    userId: string;
  };
}

export async function PATCH(request: Request, { params }: RouteContext) {
  console.log('🔄 API /admin/users/[id]/role: входящий запрос', params);
  const session = await getServerSession(authOptions);

  if (!session?.user?.role?.name || !ADMIN_ROLES.has(session.user.role.name)) {
    console.log('❌ API /admin/users/[id]/role: доступ запрещён');
    return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
  }

  const userId = params.userId;
  if (!userId) {
    return NextResponse.json({ error: 'Некорректный идентификатор пользователя' }, { status: 400 });
  }

  let payload: z.infer<typeof bodySchema>;
  try {
    const data = await request.json();
    payload = bodySchema.parse(data);
  } catch (error) {
    console.error('❌ API /admin/users/[id]/role: ошибка валидации', error);
    return NextResponse.json({ error: 'Некорректные данные запроса' }, { status: 400 });
  }

  try {
    await updateUserRoleByAdmin({ userId, roleName: payload.role });

    console.log('✅ API /admin/users/[id]/role: роль обновлена', { userId, role: payload.role });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      console.warn('⚠️ API /admin/users/[id]/role: пользователь не найден', { userId });
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    if (error instanceof Error && error.message === 'Роль не найдена') {
      console.warn('⚠️ API /admin/users/[id]/role: роль не найдена', { role: payload.role });
      return NextResponse.json({ error: 'Указанная роль не найдена' }, { status: 400 });
    }

    console.error('❌ API /admin/users/[id]/role: внутренняя ошибка', error);
    return NextResponse.json({ error: 'Не удалось обновить роль пользователя' }, { status: 500 });
  }
}
