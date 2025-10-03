// Местоположение: src/app/api/admin/products/update-category/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { updateMoySkladProductFolder } from '@/lib/moysklad-api';
import { UpdateCategorySchema } from '@/lib/schemas/api';
import { ZodError } from 'zod';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role.name !== 'ADMIN') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const body = await req.json();

    // Zod валидация входных данных
    const validatedData = UpdateCategorySchema.parse(body);
    const { productId, newCategoryId } = validatedData;

    // Получаем данные из БД
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
        { error: `Товар с ID ${productId} не найден или не синхронизирован` },
        { status: 404 },
      );
    }

    if (!newCategory || !newCategory.moyskladId) {
      return NextResponse.json(
        {
          error: `Категория с ID ${newCategoryId} не найдена или не синхронизирована`,
        },
        { status: 404 },
      );
    }

    // Обновляем в МойСклад
    await updateMoySkladProductFolder(
      product.moyskladId,
      newCategory.moyskladId,
    );

    // Обновляем в нашей БД
    await prisma.product.update({
      where: { id: productId },
      data: {
        categories: {
          set: [{ id: newCategoryId }],
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Товар успешно перемещен в новую категорию',
    });
  } catch (error) {
    console.error('Ошибка при перемещении товара:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Ошибка валидации данных',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 },
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : 'Неизвестная ошибка сервера';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
