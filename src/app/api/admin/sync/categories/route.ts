// /src/app/api/admin/sync/categories/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
// --- ИЗМЕНЕНИЕ ЗДЕСЬ ---
import prisma from '@/lib/prisma'; // Правильный импорт по умолчанию
// --- КОНЕЦ ИЗМЕНЕНИЯ ---
import { getMoySkladCategories } from '@/lib/moysklad-api';

// Типизируем ответ от МойСклад для большей надежности
interface MoySkladCategory {
  id: string;
  name: string;
  // ... другие поля, которые могут пригодиться в будущем
}

export async function POST() {
  // 1. Проверка сессии и прав доступа
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return new NextResponse(JSON.stringify({ error: 'Доступ запрещен' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 2. Получение данных из МойСклад
    const moySkladResponse = await getMoySkladCategories();
    // API МойСклад возвращает данные в поле `rows`
    const moySkladCategories: MoySkladCategory[] = moySkladResponse.rows || [];

    if (moySkladCategories.length === 0) {
      return NextResponse.json({
        message:
          'Категории в МойСклад не найдены или произошла ошибка при их получении.',
      });
    }

    // 3. Используем Prisma для синхронизации в одной транзакции
    const transaction = moySkladCategories.map((category) =>
      prisma.category.upsert({
        where: { moyskladId: category.id },
        update: {
          name: category.name,
        },
        create: {
          name: category.name,
          moyskladId: category.id,
        },
      }),
    );

    await prisma.$transaction(transaction);

    return NextResponse.json({
      message: 'Синхронизация категорий успешно завершена.',
      synchronizedCount: moySkladCategories.length,
    });
  } catch (error) {
    console.error('[API SYNC CATEGORIES ERROR]:', error);
    return new NextResponse(
      JSON.stringify({
        error: 'Внутренняя ошибка сервера при синхронизации категорий.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
