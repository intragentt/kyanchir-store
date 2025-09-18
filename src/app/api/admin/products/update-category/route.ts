// Местоположение: /src/app/api/admin/products/update-category/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { updateMoySkladProductFolder } from '@/lib/moysklad-api';

export async function POST(req: Request) {
  // 1. Проверка сессии и роли администратора
  const session = await getServerSession(authOptions);
  // ИСПРАВЛЕНО: Обращаемся к session.user.role.name для корректного сравнения
  if (!session || session.user.role.name !== 'ADMIN') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { productId, newCategoryId } = body;

    // 2. Валидация входных данных
    if (!productId || !newCategoryId) {
      return NextResponse.json(
        { error: 'Необходимы ID товара и ID новой категории' },
        { status: 400 },
      );
    }

    // 3. Получаем данные из нашей БД для работы
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { moyskladId: true },
    });

    const newCategory = await prisma.category.findUnique({
      where: { id: newCategoryId },
      select: { moyskladId: true },
    });

    if (!product || !product.moyskladId) {
      return NextResponse.json(
        { error: `Товар с ID ${productId} не найден в нашей БД` },
        { status: 404 },
      );
    }

    if (!newCategory || !newCategory.moyskladId) {
      return NextResponse.json(
        {
          error: `Категория с ID ${newCategoryId} не найдена в нашей БД или не синхронизирована`,
        },
        { status: 404 },
      );
    }

    // 4. Вызов API-моста для перемещения товара в "МойСклад"
    await updateMoySkladProductFolder(
      product.moyskladId,
      newCategory.moyskladId,
    );

    // 5. Обновление категории в нашей базе данных
    await prisma.product.update({
      where: { id: productId },
      data: {
        categories: {
          set: [{ id: newCategoryId }], // Устанавливаем новую категорию
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Товар успешно перемещен',
    });
  } catch (error) {
    console.error('Ошибка при перемещении товара:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Неизвестная ошибка сервера';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
